import { STATS } from "./constants";
import type { Character, Modifiers, StatKey } from "./types";

export type StatBreakdown = Record<StatKey, { base: number; bonus: number; total: number }>;

/** Base attributes + equipped items + buffs/debuffs + conditions. */
export function effectiveStats(c: Character): StatBreakdown {
  const mods: Modifiers[] = [
    ...c.inventory.filter((i) => i.equippedSlot && i.equipment).map((i) => i.equipment!.modifiers),
    ...c.effects.map((e) => e.effect.modifiers),
    ...c.conditions.map((x) => x.condition.modifiers),
  ];
  const out = {} as StatBreakdown;
  for (const s of STATS) {
    const base = c[s.key];
    const bonus = mods.reduce((acc, m) => acc + (Number(m?.[s.key]) || 0), 0);
    out[s.key] = { base, bonus, total: Math.max(0, base + bonus) };
  }
  return out;
}

export function formatModifiers(m: Modifiers) {
  return STATS.filter((s) => m?.[s.key])
    .map((s) => `${m[s.key]! > 0 ? "+" : ""}${m[s.key]} ${s.short}`)
    .join(" · ");
}
