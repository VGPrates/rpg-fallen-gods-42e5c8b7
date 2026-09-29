import type { Rarity } from "./types";

export type RecentEquipment = {
  id: number;
  name: string;
  icon: string;
  rarity: Rarity;
  temporary?: boolean;
};

const KEY = "rpg:recent-equipment";
const MAX = 8;

export function readRecentEquipment(): RecentEquipment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEquipment => !!e && typeof (e as RecentEquipment).id === "number",
    );
  } catch {
    return [];
  }
}

export function pushRecentEquipment(entry: RecentEquipment): RecentEquipment[] {
  if (typeof window === "undefined") return [];
  const next = [entry, ...readRecentEquipment().filter((e) => e.id !== entry.id)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível: seguimos sem histórico */
  }
  return next;
}
