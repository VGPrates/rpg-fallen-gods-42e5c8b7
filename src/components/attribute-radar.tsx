import { STATS } from "@/lib/rpg/constants";
import type { StatBreakdown } from "@/lib/rpg/stats";

/** Pentagon radar of the five attributes: base (outline) vs current effective (filled). */
export function AttributeRadar({ stats }: { stats: StatBreakdown }) {
  const values = STATS.map((s) => stats[s.key]) as { base: number; bonus: number; total: number }[] & Record<number, { base: number; bonus: number; total: number }>;
  const top = Math.max(20, ...values.map((v) => Math.max(v.total, v.base)));
  const max = Math.ceil(top / 5) * 5;
  const cx = 110;
  const cy = 108;
  const R = 78;
  const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / STATS.length;
    const r = (Math.max(0, v) / max) * R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const poly = (fn: (i: number) => number) =>
    STATS.map((_, i) => point(i, fn(i)).join(",")).join(" ");

  return (
    <figure className="grid gap-3">
      <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[320px]" role="img" aria-label="Radar de atributos">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={poly(() => max * f)} fill="none" className="stroke-border" strokeWidth="1" />
        ))}
        {STATS.map((_, i) => {
          const [x, y] = point(i, max);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-border" strokeWidth="1" />;
        })}
        <polygon points={poly((i) => values[i]!.base)} fill="none" className="stroke-muted/60" strokeWidth="1.2" strokeDasharray="3 3" />
        <polygon
          points={poly((i) => values[i]!.total)}
          className="fill-primary/30 stroke-hp-bright"
          strokeWidth="1.8"
          strokeLinejoin="round"
          style={{ transition: "all 400ms cubic-bezier(0.22,1,0.36,1)" }}
        />
        {STATS.map((s, i) => {
          const [x, y] = point(i, values[i]!.total);
          const [lx, ly] = point(i, max * 1.2);
          const b = values[i]!.bonus;
          return (
            <g key={s.key}>
              <circle cx={x} cy={y} r="3" className="fill-hp-bright" />
              <text x={lx} y={ly - 4} textAnchor="middle" className="fill-muted font-display" fontSize="9" letterSpacing="1">
                {s.short}
              </text>
              <text x={lx} y={ly + 8} textAnchor="middle" className="fill-fg font-display" fontSize="11">
                {values[i]!.total}
                {b !== 0 ? (
                  <tspan className={b > 0 ? "fill-stamina-bright" : "fill-hp-bright"} fontSize="8">
                    {" "}
                    {b > 0 ? `+${b}` : b}
                  </tspan>
                ) : null}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="flex justify-center gap-4 text-xs text-subtle">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/60" /> Atual (com bônus)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-3 border-t border-dashed border-muted" /> Base
        </span>
      </figcaption>
    </figure>
  );
}
