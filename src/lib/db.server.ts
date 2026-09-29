/**
 * Server-only SQL surface backed by Lovable Cloud (Postgres).
 *
 * The app's data layer is plain SQL. Cloud's Data API does not expose raw SQL,
 * so statements run through the `public.exec_sql` database function, which is
 * executable ONLY by the service role. The service key never leaves the server.
 *
 * Values are never concatenated raw: every parameter is rendered by
 * `literal()` below, which quotes/escapes exactly like Postgres expects.
 */

export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

function quote(value: string): string {
  if (value.includes("\u0000")) throw new Error("Valor inválido.");
  return `'${value.replace(/'/g, "''")}'`;
}

/** Render a JS value as a safe Postgres literal. */
function literal(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Número inválido.");
    return String(value);
  }
  if (typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return quote(value.toISOString());
  if (typeof value === "string") return quote(value);
  return quote(JSON.stringify(value));
}

/** Does this statement hand rows back to the caller? */
function returnsRows(text: string): boolean {
  const head = text.trim().replace(/^\(+/, "").slice(0, 8).toLowerCase();
  if (head.startsWith("select") || head.startsWith("with")) return true;
  return /\breturning\b/i.test(text);
}

function inlineParams(text: string, params: unknown[]): string {
  return text.replace(/\$(\d+)/g, (_match, index: string) => {
    const position = Number(index) - 1;
    if (position < 0 || position >= params.length) {
      throw new Error("Parâmetro ausente na consulta.");
    }
    return literal(params[position]);
  });
}

async function run<T>(text: string): Promise<T[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("exec_sql", {
    q: text,
    returns_rows: returnsRows(text),
  });
  if (error) {
    console.error("SQL error:", error.message, text);
    throw new Error("Não foi possível falar com o banco de dados.");
  }
  return (data ?? []) as T[];
}

function makeSql(): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) {
      text += literal(values[i]) + (strings[i + 1] ?? "");
    }
    return run<T>(text);
  }) as Sql;

  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(inlineParams(text, params));

  return sql;
}

const sqlInstance = makeSql();

export async function getSql(): Promise<Sql> {
  return sqlInstance;
}
