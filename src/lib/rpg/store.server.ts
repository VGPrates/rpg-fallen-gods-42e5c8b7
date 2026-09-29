import { getSql, type Sql } from "@/lib/db.server";
import { INITIAL_UNSPENT_POINTS, slotAccepts } from "./constants";
import type { RpgState } from "./api-types";
import type {
  AppliedCondition,
  AppliedEffect,
  BodySlot,
  Character,
  CharacterDraft,
  Condition,
  DiceRoll,
  Effect,
  Equipment,
  EquipmentCategory,
  InventoryItem,
  ItemKind,
  Modifiers,
  Profile,
  Rarity,
  Role,
  StatKey,
} from "./types";

const STAT_KEYS: StatKey[] = ["strength", "agility", "resistance", "intelligence", "presence"];

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function asInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function asModifiers(value: unknown): Modifiers {
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!raw || typeof raw !== "object") return {};
  const out: Modifiers = {};
  for (const key of STAT_KEYS) {
    const n = Number((raw as Record<string, unknown>)[key]);
    if (n) out[key] = n;
  }
  return out;
}

type RoleRow = { role: Role };
type TableRow = { id: number; gm_user_id: string; name: string };
type ProfileRow = { user_id: string; display_name: string | null; avatar_url: string | null };
type CharRow = {
  id: number;
  user_id: string | null;
  created_by: string;
  table_id: number | null;
  name: string;
  race: string;
  class_name: string;
  age: number;
  backstory: string;
  hp: number;
  hp_max: number;
  mana: number;
  mana_max: number;
  stamina: number;
  stamina_max: number;
  strength: number;
  agility: number;
  resistance: number;
  intelligence: number;
  presence: number;
  unspent_points: number;
  notes: string;
  updated_at: unknown;
};

type EqRow = {
  id: number;
  name: string;
  icon: string;
  category: string;
  rarity: string;
  description: string;
  effects: string;
  modifiers: unknown;
};
type EffectRow = {
  id: number;
  kind: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  modifiers: unknown;
};
type ConditionRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  effect: string;
  modifiers: unknown;
};

async function roleOf(sql: Sql, userId: string): Promise<Role | null> {
  const rows = await sql<RoleRow>`select role from user_roles where user_id = ${userId}`;
  return rows[0]?.role ?? null;
}

async function tableOfGm(sql: Sql, userId: string): Promise<TableRow | null> {
  const rows = await sql<TableRow>`
    select id, gm_user_id, name from game_tables where gm_user_id = ${userId}
  `;
  return rows[0] ?? null;
}

async function tableOfPlayer(sql: Sql, userId: string): Promise<TableRow | null> {
  const rows = await sql<TableRow>`
    select t.id, t.gm_user_id, t.name
    from game_tables t
    join characters c on c.table_id = t.id
    where c.user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

async function requireGm(sql: Sql, userId: string): Promise<TableRow> {
  const role = await roleOf(sql, userId);
  if (role !== "gm") throw new Error("Apenas o Mestre da Mesa pode fazer isso.");
  const table = await tableOfGm(sql, userId);
  if (!table) throw new Error("Mesa não encontrada.");
  return table;
}

async function characterRow(sql: Sql, id: number): Promise<CharRow | null> {
  const rows = await sql<CharRow>`select * from characters where id = ${id}`;
  return rows[0] ?? null;
}

async function requireGmCharacter(sql: Sql, userId: string, characterId: number): Promise<CharRow> {
  const table = await requireGm(sql, userId);
  const row = await characterRow(sql, characterId);
  if (!row || row.table_id !== table.id) throw new Error("Personagem não encontrado.");
  return row;
}

async function requireOwnCharacter(
  sql: Sql,
  userId: string,
  characterId: number,
): Promise<CharRow> {
  const row = await characterRow(sql, characterId);
  if (!row || row.user_id !== userId) throw new Error("Ficha não encontrada.");
  return row;
}

async function requireViewCharacter(
  sql: Sql,
  userId: string,
  characterId: number,
): Promise<CharRow> {
  const role = await roleOf(sql, userId);
  if (!role) throw new Error("Não autenticado.");
  const row = await characterRow(sql, characterId);
  if (!row) throw new Error("Personagem não encontrado.");
  if (role === "gm") {
    const table = await tableOfGm(sql, userId);
    if (!table || row.table_id !== table.id) throw new Error("Personagem não encontrado.");
    return row;
  }
  if (row.user_id !== userId) throw new Error("Personagem não encontrado.");
  return row;
}

async function defaultJoinTable(sql: Sql): Promise<number | null> {
  // O jogador entra na mesa mais antiga existente.
  const tables = await sql<TableRow>`select * from game_tables order by id asc`;
  if (tables[0]) return asInt(tables[0].id);
  return null;
}

function mapEquipment(row: EqRow): Equipment {
  return {
    id: asInt(row.id),
    name: row.name,
    icon: row.icon,
    category: row.category as EquipmentCategory,
    rarity: row.rarity as Rarity,
    description: row.description,
    effects: row.effects,
    modifiers: asModifiers(row.modifiers),
  };
}

function mapEffect(row: EffectRow): Effect {
  return {
    id: asInt(row.id),
    kind: row.kind === "debuff" ? "debuff" : "buff",
    name: row.name,
    icon: row.icon,
    color: row.color,
    description: row.description,
    modifiers: asModifiers(row.modifiers),
  };
}

function mapCondition(row: ConditionRow): Condition {
  return {
    id: asInt(row.id),
    name: row.name,
    icon: row.icon,
    color: row.color,
    description: row.description,
    effect: row.effect,
    modifiers: asModifiers(row.modifiers),
  };
}

async function hydrateCharacters(sql: Sql, rows: CharRow[]): Promise<Character[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => asInt(r.id));
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");

  const inventoryRows = await sql.query<{
    id: number;
    character_id: number;
    name: string;
    description: string;
    quantity: number;
    kind: string;
    equipped_slot: string | null;
    eq_id: number | null;
    eq_name: string | null;
    eq_icon: string | null;
    eq_category: string | null;
    eq_rarity: string | null;
    eq_description: string | null;
    eq_effects: string | null;
    eq_modifiers: unknown;
  }>(
    `select i.id, i.character_id, i.name, i.description, i.quantity, i.kind, i.equipped_slot,
            e.id as eq_id, e.name as eq_name, e.icon as eq_icon, e.category as eq_category,
            e.rarity as eq_rarity, e.description as eq_description, e.effects as eq_effects,
            e.modifiers as eq_modifiers
     from inventory_items i
     left join equipment e on e.id = i.equipment_id
     where i.character_id in (${placeholders})
     order by i.id`,
    ids,
  );

  const effectRows = await sql.query<
    EffectRow & { character_id: number; duration: string; applied_id: number }
  >(
    `select ce.id as applied_id, ce.character_id, ce.duration, e.id, e.kind, e.name, e.icon, e.color, e.description, e.modifiers
     from character_effects ce
     join effects e on e.id = ce.effect_id
     where ce.character_id in (${placeholders})
     order by ce.id`,
    ids,
  );

  const conditionRows = await sql.query<
    ConditionRow & { character_id: number; duration: string; applied_id: number }
  >(
    `select cc.id as applied_id, cc.character_id, cc.duration, c.id, c.name, c.icon, c.color, c.description, c.effect, c.modifiers
     from character_conditions cc
     join conditions c on c.id = cc.condition_id
     where cc.character_id in (${placeholders})
     order by cc.id`,
    ids,
  );

  const inventoryByChar = new Map<number, InventoryItem[]>();
  for (const item of inventoryRows) {
    const cid = asInt(item.character_id);
    const list = inventoryByChar.get(cid) ?? [];
    const equipment =
      item.eq_id != null
        ? mapEquipment({
            id: item.eq_id,
            name: item.eq_name ?? item.name,
            icon: item.eq_icon ?? "sword",
            category: item.eq_category ?? "arma",
            rarity: item.eq_rarity ?? "comum",
            description: item.eq_description ?? "",
            effects: item.eq_effects ?? "",
            modifiers: item.eq_modifiers,
          })
        : null;
    list.push({
      id: asInt(item.id),
      name: item.name,
      description: item.description,
      quantity: asInt(item.quantity, 1),
      kind: (item.kind as ItemKind) ?? "item",
      equipment,
      equippedSlot: (item.equipped_slot as BodySlot | null) ?? null,
    });
    inventoryByChar.set(cid, list);
  }

  const effectsByChar = new Map<number, AppliedEffect[]>();
  for (const row of effectRows) {
    const cid = asInt(row.character_id);
    const list = effectsByChar.get(cid) ?? [];
    list.push({ id: asInt(row.applied_id), duration: row.duration, effect: mapEffect(row) });
    effectsByChar.set(cid, list);
  }

  const conditionsByChar = new Map<number, AppliedCondition[]>();
  for (const row of conditionRows) {
    const cid = asInt(row.character_id);
    const list = conditionsByChar.get(cid) ?? [];
    list.push({ id: asInt(row.applied_id), duration: row.duration, condition: mapCondition(row) });
    conditionsByChar.set(cid, list);
  }

  return rows.map((row) => {
    const id = asInt(row.id);
    return {
      id,
      userId: row.user_id,
      createdBy: row.created_by,
      name: row.name,
      race: row.race,
      className: row.class_name,
      age: asInt(row.age),
      backstory: row.backstory ?? "",
      hp: asInt(row.hp),
      hpMax: asInt(row.hp_max),
      mana: asInt(row.mana),
      manaMax: asInt(row.mana_max),
      stamina: asInt(row.stamina),
      staminaMax: asInt(row.stamina_max),
      strength: asInt(row.strength),
      agility: asInt(row.agility),
      resistance: asInt(row.resistance),
      intelligence: asInt(row.intelligence),
      presence: asInt(row.presence),
      unspentPoints: Math.max(0, asInt(row.unspent_points)),
      notes: row.notes ?? "",
      inventory: inventoryByChar.get(id) ?? [],
      effects: effectsByChar.get(id) ?? [],
      conditions: conditionsByChar.get(id) ?? [],
      updatedAt: asIso(row.updated_at),
    };
  });
}

async function loadProfile(sql: Sql, userId: string, role: Role): Promise<Profile> {
  const rows =
    await sql<ProfileRow>`select user_id, display_name, avatar_url from profiles where user_id = ${userId}`;
  const p = rows[0];
  const table = role === "gm" ? await tableOfGm(sql, userId) : await tableOfPlayer(sql, userId);
  return {
    userId,
    role,
    displayName: p?.display_name ?? null,
    avatarUrl: p?.avatar_url ?? null,
    tableId: table ? asInt(table.id) : null,
  };
}

function draftOf(character: CharacterDraft): CharacterDraft {
  const name = character.name.trim();
  if (!name) throw new Error("Nome da ficha é obrigatório.");
  return {
    name: name.slice(0, 80),
    race: character.race.trim() || "Humano",
    className: character.className.trim() || "Guerreiro",
    age: Math.max(1, Math.min(2000, Math.floor(Number(character.age) || 20))),
    backstory: (character.backstory ?? "").slice(0, 4000),
  };
}

async function upsertProfile(sql: Sql, userId: string, displayName: string) {
  await sql`
    insert into profiles (user_id, display_name)
    values (${userId}, ${displayName || null})
    on conflict (user_id) do update set display_name = excluded.display_name
  `;
}

export async function getMyState(userId: string): Promise<RpgState> {
  const sql = await getSql();
  const role = await roleOf(sql, userId);
  if (!role) return { profile: null, character: null, party: [] };
  const profile = await loadProfile(sql, userId, role);
  if (role === "gm") {
    if (!profile.tableId) return { profile, character: null, party: [] };
    const rows =
      await sql<CharRow>`select * from characters where table_id = ${profile.tableId} order by id`;
    return { profile, character: null, party: await hydrateCharacters(sql, rows) };
  }
  const rows = await sql<CharRow>`select * from characters where user_id = ${userId} limit 1`;
  const chars = await hydrateCharacters(sql, rows);
  return { profile, character: chars[0] ?? null, party: [] };
}

/**
 * Garante a coluna que marca equipamentos temporários (entregues a um jogador
 * sem entrar no Arsenal). Idempotente e executada uma vez por processo.
 */
let equipmentSchemaReady: Promise<void> | null = null;
async function ensureEquipmentSchema(sql: Sql) {
  equipmentSchemaReady ??= (async () => {
    await sql`alter table equipment add column if not exists is_temporary boolean not null default false`;
  })();
  await equipmentSchemaReady;
}

export async function getLibrary() {
  const sql = await getSql();
  await ensureEquipmentSchema(sql);
  const [equipment, effects, conditions] = await Promise.all([
    sql<EqRow>`select * from equipment where coalesce(is_temporary, false) = false order by id`,
    sql<EffectRow>`select * from effects order by id`,
    sql<ConditionRow>`select * from conditions order by id`,
  ]);
  return {
    equipment: equipment.map(mapEquipment),
    effects: effects.map(mapEffect),
    conditions: conditions.map(mapCondition),
  };
}

export async function chooseRoleForUser(
  userId: string,
  input: { role: Role; displayName: string; character?: CharacterDraft },
) {
  const sql = await getSql();
  const existing = await roleOf(sql, userId);
  if (existing) throw new Error("Papel já escolhido.");

  if (input.role === "gm") {
    await sql`insert into user_roles (user_id, role) values (${userId}, 'gm')`;
    await upsertProfile(sql, userId, input.displayName);
    const created = await sql<{ id: number }>`
      insert into game_tables (gm_user_id, name)
      values (${userId}, 'A Mesa')
      returning id
    `;
    const tableId = created[0]?.id;
    if (tableId) {
      const others = await sql<{ n: number }>`select count(*)::int as n from game_tables`;
      if (asInt(others[0]?.n) === 1) {
        await sql`update characters set table_id = ${tableId} where table_id is null`;
      }
    }
    return;
  }

  if (!input.character) throw new Error("Ficha obrigatória.");
  const d = draftOf(input.character);
  const tableId = await defaultJoinTable(sql);
  await sql`insert into user_roles (user_id, role) values (${userId}, 'player')`;
  await upsertProfile(sql, userId, input.displayName || d.name);
  await sql`
    insert into characters (
      user_id, created_by, table_id, name, race, class_name, age, backstory, unspent_points
    ) values (
      ${userId}, ${userId}, ${tableId}, ${d.name}, ${d.race}, ${d.className}, ${d.age}, ${d.backstory}, ${INITIAL_UNSPENT_POINTS}
    )
  `;
}

export async function gmUpdateIdentity(userId: string, characterId: number, d: CharacterDraft) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  const draft = draftOf(d);
  await sql`
    update characters
    set name = ${draft.name}, race = ${draft.race}, class_name = ${draft.className},
        age = ${draft.age}, backstory = ${draft.backstory}, updated_at = now()
    where id = ${characterId}
  `;
}

export async function updateNotes(userId: string, characterId: number, notes: string) {
  const sql = await getSql();
  const role = await roleOf(sql, userId);
  if (role === "gm") await requireGmCharacter(sql, userId, characterId);
  else await requireOwnCharacter(sql, userId, characterId);
  await sql`update characters set notes = ${notes.slice(0, 8000)}, updated_at = now() where id = ${characterId}`;
}

export async function updateMyAvatar(userId: string, avatar: string | null) {
  const sql = await getSql();
  const role = await roleOf(sql, userId);
  if (!role) throw new Error("Papel ainda não escolhido.");
  await sql`
    insert into profiles (user_id, avatar_url)
    values (${userId}, ${avatar})
    on conflict (user_id) do update set avatar_url = excluded.avatar_url
  `;
}

export async function spendPoints(
  userId: string,
  characterId: number,
  alloc: Partial<Record<StatKey, number>>,
) {
  const sql = await getSql();
  const row = await requireOwnCharacter(sql, userId, characterId);
  const spent = STAT_KEYS.reduce(
    (sum, k) => sum + Math.max(0, Math.floor(Number(alloc[k] ?? 0))),
    0,
  );
  if (spent <= 0) return;
  if (spent > asInt(row.unspent_points)) throw new Error("Pontos insuficientes.");
  const next = {
    strength: asInt(row.strength) + Math.max(0, Math.floor(Number(alloc.strength ?? 0))),
    agility: asInt(row.agility) + Math.max(0, Math.floor(Number(alloc.agility ?? 0))),
    resistance: asInt(row.resistance) + Math.max(0, Math.floor(Number(alloc.resistance ?? 0))),
    intelligence:
      asInt(row.intelligence) + Math.max(0, Math.floor(Number(alloc.intelligence ?? 0))),
    presence: asInt(row.presence) + Math.max(0, Math.floor(Number(alloc.presence ?? 0))),
    unspent: Math.max(0, asInt(row.unspent_points) - spent),
  };
  await sql`
    update characters
    set strength = ${next.strength}, agility = ${next.agility}, resistance = ${next.resistance},
        intelligence = ${next.intelligence}, presence = ${next.presence},
        unspent_points = ${next.unspent}, updated_at = now()
    where id = ${characterId}
  `;
}

export async function gmSetStats(
  userId: string,
  characterId: number,
  s: Record<StatKey, number> & { unspent: number },
) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  await sql`
    update characters
    set strength = ${asInt(s.strength)}, agility = ${asInt(s.agility)}, resistance = ${asInt(s.resistance)},
        intelligence = ${asInt(s.intelligence)}, presence = ${asInt(s.presence)},
        unspent_points = ${Math.max(0, asInt(s.unspent))}, updated_at = now()
    where id = ${characterId}
  `;
}

export async function gmGrantPoints(userId: string, characterId: number, amount: number) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  const add = Math.max(0, asInt(amount));
  await sql`
    update characters
    set unspent_points = unspent_points + ${add}, updated_at = now()
    where id = ${characterId}
  `;
}

export async function gmUpdateVitals(
  userId: string,
  characterId: number,
  v: {
    hp: number;
    hpMax: number;
    mana: number;
    manaMax: number;
    stamina: number;
    staminaMax: number;
  },
) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  await sql`
    update characters
    set hp = ${asInt(v.hp)}, hp_max = ${asInt(v.hpMax)}, mana = ${asInt(v.mana)},
        mana_max = ${asInt(v.manaMax)}, stamina = ${asInt(v.stamina)}, stamina_max = ${asInt(v.staminaMax)},
        updated_at = now()
    where id = ${characterId}
  `;
}

export async function gmCreateCharacter(userId: string, d: CharacterDraft) {
  const sql = await getSql();
  const table = await requireGm(sql, userId);
  const draft = draftOf(d);
  const rows = await sql<{ id: number; name: string }>`
    insert into characters (
      user_id, created_by, table_id, name, race, class_name, age, backstory, unspent_points
    ) values (
      null, ${userId}, ${table.id}, ${draft.name}, ${draft.race}, ${draft.className}, ${draft.age}, ${draft.backstory}, ${INITIAL_UNSPENT_POINTS}
    )
    returning id, name
  `;
  const created = rows[0];
  if (!created) throw new Error("Não foi possível criar a ficha.");
  return { id: asInt(created.id), name: created.name };
}

export async function gmDeleteCharacter(userId: string, characterId: number) {
  const sql = await getSql();
  const row = await requireGmCharacter(sql, userId, characterId);
  if (row.user_id) throw new Error("Fichas de jogadores não podem ser apagadas por aqui.");
  await sql`delete from characters where id = ${characterId}`;
}

export async function addItem(
  userId: string,
  characterId: number,
  item: { name: string; description: string; quantity: number; kind: "item" | "belonging" },
) {
  const sql = await getSql();
  const role = await roleOf(sql, userId);
  if (role === "gm") await requireGmCharacter(sql, userId, characterId);
  else await requireOwnCharacter(sql, userId, characterId);
  const name = item.name.trim().slice(0, 80);
  if (!name) throw new Error("Nome do item é obrigatório.");
  await sql`
    insert into inventory_items (character_id, name, description, quantity, kind)
    values (
      ${characterId},
      ${name},
      ${item.description.slice(0, 400)},
      ${Math.max(1, asInt(item.quantity, 1))},
      ${item.kind}
    )
  `;
}

async function itemOwner(sql: Sql, itemId: number) {
  const rows = await sql<{
    id: number;
    character_id: number;
    equipment_id: number | null;
    equipped_slot: string | null;
  }>`
    select id, character_id, equipment_id, equipped_slot from inventory_items where id = ${itemId}
  `;
  if (!rows[0]) throw new Error("Item não encontrado.");
  return rows[0];
}

export async function removeItem(userId: string, itemId: number) {
  const sql = await getSql();
  const item = await itemOwner(sql, itemId);
  await requireViewCharacter(sql, userId, asInt(item.character_id));
  await sql`delete from inventory_items where id = ${itemId}`;
}

export async function equipItem(userId: string, itemId: number, slot: BodySlot) {
  const sql = await getSql();
  const item = await itemOwner(sql, itemId);
  await requireViewCharacter(sql, userId, asInt(item.character_id));
  const eq = await sql<EqRow>`
    select e.* from inventory_items i
    join equipment e on e.id = i.equipment_id
    where i.id = ${itemId}
  `;
  if (!eq[0]) throw new Error("Este item não pode ser equipado.");
  if (!slotAccepts(eq[0].category as EquipmentCategory, slot)) {
    throw new Error("Este equipamento não cabe neste encaixe.");
  }
  await sql`
    update inventory_items set equipped_slot = null
    where character_id = ${item.character_id} and equipped_slot = ${slot}
  `;
  await sql`update inventory_items set equipped_slot = ${slot} where id = ${itemId}`;
}

export async function unequipItem(userId: string, itemId: number) {
  const sql = await getSql();
  const item = await itemOwner(sql, itemId);
  await requireViewCharacter(sql, userId, asInt(item.character_id));
  await sql`update inventory_items set equipped_slot = null where id = ${itemId}`;
}

export async function gmGiveEquipment(userId: string, characterId: number, equipmentId: number) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  const eq = await sql<EqRow>`select * from equipment where id = ${equipmentId}`;
  if (!eq[0]) throw new Error("Equipamento não encontrado.");
  await sql`
    insert into inventory_items (character_id, equipment_id, name, description, quantity, kind)
    values (${characterId}, ${equipmentId}, ${eq[0].name}, ${eq[0].description}, 1, 'body')
  `;
}

/**
 * Criação rápida de equipamento a partir da ficha do jogador.
 * `temporary` cria o item só para aquele jogador, sem listá-lo no Arsenal.
 */
export async function gmQuickCreateEquipment(
  userId: string,
  values: Record<string, unknown>,
  options: { characterId: number | null; temporary: boolean; deliver: boolean },
) {
  const sql = await getSql();
  await requireGm(sql, userId);
  await ensureEquipmentSchema(sql);
  if (options.characterId !== null) {
    await requireGmCharacter(sql, userId, options.characterId);
  }
  if (options.temporary && (!options.deliver || options.characterId === null)) {
    throw new Error("Equipamento temporário precisa de um jogador.");
  }

  const name = String(values["name"] ?? "Novo").slice(0, 80) || "Novo";
  const icon = String(values["icon"] ?? "sword").slice(0, 80);
  const category = String(values["category"] ?? "arma");
  const rarity = String(values["rarity"] ?? "comum");
  const description = String(values["description"] ?? "").slice(0, 400);
  const effects = String(values["effects"] ?? "").slice(0, 400);
  const modifiers = JSON.stringify(asModifiers(values["modifiers"]));

  const created = await sql.query<{ id: number }>(
    `insert into equipment (name, icon, category, rarity, description, effects, modifiers, is_temporary)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) returning id`,
    [name, icon, category, rarity, description, effects, modifiers, options.temporary],
  );
  const equipmentId = asInt(created[0]?.id);
  if (!equipmentId) throw new Error("Não foi possível criar o equipamento.");

  if (options.deliver && options.characterId !== null) {
    await sql`
      insert into inventory_items (character_id, equipment_id, name, description, quantity, kind)
      values (${options.characterId}, ${equipmentId}, ${name}, ${description}, 1, 'body')
    `;
  }

  return { id: equipmentId, name, icon, rarity, temporary: options.temporary };
}

export type LibTable = "equipment" | "effects" | "conditions";

export async function saveLibraryEntry(
  userId: string,
  table: LibTable,
  id: number | null,
  values: Record<string, unknown>,
) {
  const sql = await getSql();
  await requireGm(sql, userId);
  const name = String(values["name"] ?? "Novo").slice(0, 80);
  const icon = String(values["icon"] ?? "sword").slice(0, 80);
  const description = String(values["description"] ?? "").slice(0, 400);
  const modifiers = JSON.stringify(asModifiers(values["modifiers"]));
  if (table === "equipment") {
    const category = String(values["category"] ?? "arma");
    const rarity = String(values["rarity"] ?? "comum");
    const effects = String(values["effects"] ?? "").slice(0, 400);
    if (id) {
      await sql.query(
        `update equipment set name=$1, icon=$2, category=$3, rarity=$4, description=$5, effects=$6, modifiers=$7::jsonb, updated_at=now() where id=$8`,
        [name, icon, category, rarity, description, effects, modifiers, id],
      );
    } else {
      await sql.query(
        `insert into equipment (name, icon, category, rarity, description, effects, modifiers) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [name, icon, category, rarity, description, effects, modifiers],
      );
    }
    return;
  }
  if (table === "effects") {
    const kind = String(values["kind"] ?? "buff");
    const color = String(values["color"] ?? "#7fa065");
    if (id) {
      await sql.query(
        `update effects set kind=$1, name=$2, icon=$3, color=$4, description=$5, modifiers=$6::jsonb where id=$7`,
        [kind, name, icon, color, description, modifiers, id],
      );
    } else {
      await sql.query(
        `insert into effects (kind, name, icon, color, description, modifiers) values ($1,$2,$3,$4,$5,$6::jsonb)`,
        [kind, name, icon, color, description, modifiers],
      );
    }
    return;
  }
  const color = String(values["color"] ?? "#d0564d");
  const effect = String(values["effect"] ?? "").slice(0, 400);
  if (id) {
    await sql.query(
      `update conditions set name=$1, icon=$2, color=$3, description=$4, effect=$5, modifiers=$6::jsonb where id=$7`,
      [name, icon, color, description, effect, modifiers, id],
    );
  } else {
    await sql.query(
      `insert into conditions (name, icon, color, description, effect, modifiers) values ($1,$2,$3,$4,$5,$6::jsonb)`,
      [name, icon, color, description, effect, modifiers],
    );
  }
}

export async function deleteLibraryEntry(userId: string, table: LibTable, id: number) {
  const sql = await getSql();
  await requireGm(sql, userId);
  if (table === "equipment") await sql`delete from equipment where id = ${id}`;
  else if (table === "effects") await sql`delete from effects where id = ${id}`;
  else await sql`delete from conditions where id = ${id}`;
}

export async function applyEffect(
  userId: string,
  characterId: number,
  effectId: number,
  duration: string,
) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  const found = await sql<{ id: number }>`select id from effects where id = ${effectId}`;
  if (!found[0]) throw new Error("Efeito não encontrado.");
  await sql`
    insert into character_effects (character_id, effect_id, duration)
    values (${characterId}, ${effectId}, ${duration.slice(0, 80)})
  `;
}

export async function removeAppliedEffect(userId: string, id: number) {
  const sql = await getSql();
  const rows = await sql<{
    character_id: number;
  }>`select character_id from character_effects where id = ${id}`;
  if (!rows[0]) return;
  await requireGmCharacter(sql, userId, asInt(rows[0].character_id));
  await sql`delete from character_effects where id = ${id}`;
}

export async function applyCondition(
  userId: string,
  characterId: number,
  conditionId: number,
  duration: string,
) {
  const sql = await getSql();
  await requireGmCharacter(sql, userId, characterId);
  const found = await sql<{ id: number }>`select id from conditions where id = ${conditionId}`;
  if (!found[0]) throw new Error("Condição não encontrada.");
  await sql`
    insert into character_conditions (character_id, condition_id, duration)
    values (${characterId}, ${conditionId}, ${duration.slice(0, 80)})
  `;
}

export async function removeAppliedCondition(userId: string, id: number) {
  const sql = await getSql();
  const rows = await sql<{
    character_id: number;
  }>`select character_id from character_conditions where id = ${id}`;
  if (!rows[0]) return;
  await requireGmCharacter(sql, userId, asInt(rows[0].character_id));
  await sql`delete from character_conditions where id = ${id}`;
}

export async function rollD20(userId: string): Promise<DiceRoll> {
  const sql = await getSql();
  const role = await roleOf(sql, userId);
  if (!role) throw new Error("Não autenticado.");
  const profile = await loadProfile(sql, userId, role);
  let rollerName = profile.displayName || (role === "gm" ? "Mestre" : "Aventureiro");
  let characterId: number | null = null;
  if (role === "player") {
    const chars = await sql<{
      id: number;
      name: string;
    }>`select id, name from characters where user_id = ${userId} limit 1`;
    if (chars[0]) {
      characterId = asInt(chars[0].id);
      rollerName = chars[0].name;
    }
  }
  const value = 1 + Math.floor(Math.random() * 20);
  const rows = await sql<{ id: number; created_at: unknown }>`
    insert into dice_rolls (user_id, table_id, character_id, roller_name, value)
    values (${userId}, ${profile.tableId}, ${characterId}, ${rollerName}, ${value})
    returning id, created_at
  `;
  return {
    id: asInt(rows[0]?.id),
    userId,
    rollerName,
    value,
    createdAt: asIso(rows[0]?.created_at),
  };
}

export async function recentRolls(userId: string): Promise<DiceRoll[]> {
  const sql = await getSql();
  const role = await roleOf(sql, userId);
  if (!role) return [];
  const profile = await loadProfile(sql, userId, role);
  const rows = profile.tableId
    ? await sql<{
        id: number;
        user_id: string;
        roller_name: string;
        value: number;
        created_at: unknown;
      }>`
        select id, user_id, roller_name, value, created_at
        from dice_rolls where table_id = ${profile.tableId}
        order by id desc limit 8
      `
    : await sql<{
        id: number;
        user_id: string;
        roller_name: string;
        value: number;
        created_at: unknown;
      }>`
        select id, user_id, roller_name, value, created_at
        from dice_rolls where user_id = ${userId}
        order by id desc limit 8
      `;
  return rows.map((r) => ({
    id: asInt(r.id),
    userId: r.user_id,
    rollerName: r.roller_name,
    value: asInt(r.value),
    createdAt: asIso(r.created_at),
  }));
}
