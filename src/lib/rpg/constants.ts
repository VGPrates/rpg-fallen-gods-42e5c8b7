import type { BodySlot, EquipmentCategory, Rarity, StatKey } from "./types";

export const APP_NAME = "RPG Fallen Gods";
export const APP_TAGLINE = "O grimório da sua mesa de RPG";

/** New characters start with no free points — the GM grants them. */
export const INITIAL_UNSPENT_POINTS = 0;

export const RACES = [
  "Humano",
  "Elfo",
  "Anão",
  "Orc",
  "Halfling",
  "Tiefling",
  "Draconato",
  "Meio-Elfo",
  "Meio-Orc",
  "Gnomo",
] as const;

export const CLASSES = [
  "Guerreiro",
  "Mago",
  "Ladino",
  "Clérigo",
  "Ranger",
  "Bárbaro",
  "Paladino",
  "Bardo",
  "Druida",
  "Feiticeiro",
  "Bruxo",
  "Monge",
] as const;

export const STATS: { key: StatKey; label: string; short: string; hint: string }[] = [
  { key: "strength", label: "Força", short: "FOR", hint: "Golpes, carga e poder bruto" },
  { key: "agility", label: "Agilidade", short: "AGI", hint: "Reflexo, furtividade e pontaria" },
  { key: "resistance", label: "Resistência", short: "RES", hint: "Fôlego, veneno e dor" },
  { key: "intelligence", label: "Inteligência", short: "INT", hint: "Magia, estudo e engenho" },
  { key: "presence", label: "Presença", short: "PRE", hint: "Carisma, intimidação e fé" },
];

export const BODY_SLOTS: { key: BodySlot; label: string; icon: string }[] = [
  { key: "cabeca", label: "Cabeça", icon: "helmet" },
  { key: "acessorio", label: "Acessório", icon: "ring" },
  { key: "torso", label: "Corpo", icon: "armor" },
  { key: "mao_direita", label: "Mão direita", icon: "sword" },
  { key: "mao_esquerda", label: "Mão esquerda", icon: "shield" },
  { key: "pernas", label: "Pernas", icon: "pants" },
  { key: "pe_direito", label: "Pé direito", icon: "boot" },
  { key: "pe_esquerdo", label: "Pé esquerdo", icon: "boot" },
];

export const SLOT_LABEL = Object.fromEntries(BODY_SLOTS.map((s) => [s.key, s.label])) as Record<
  BodySlot,
  string
>;

export const CATEGORIES: {
  key: EquipmentCategory;
  label: string;
  slots: BodySlot[];
  where: string;
}[] = [
  { key: "elmo", label: "Elmo / Capacete", slots: ["cabeca"], where: "Cabeça" },
  { key: "armadura", label: "Armadura", slots: ["torso"], where: "Corpo" },
  { key: "calca", label: "Calça / Grevas", slots: ["pernas"], where: "Pernas" },
  { key: "arma", label: "Arma", slots: ["mao_direita", "mao_esquerda"], where: "Mãos" },
  { key: "escudo", label: "Escudo", slots: ["mao_direita", "mao_esquerda"], where: "Mãos" },
  { key: "bota", label: "Botas", slots: ["pe_direito", "pe_esquerdo"], where: "Pés" },
  { key: "acessorio", label: "Acessório", slots: ["acessorio"], where: "Acessório" },
];

export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  EquipmentCategory,
  (typeof CATEGORIES)[number]
>;

export function slotAccepts(category: EquipmentCategory, slot: BodySlot) {
  return CATEGORY[category]?.slots.includes(slot) ?? false;
}

export const RARITIES: { key: Rarity; label: string; text: string; ring: string; glow: string }[] =
  [
    {
      key: "comum",
      label: "Comum",
      text: "text-rarity-comum",
      ring: "ring-rarity-comum/40",
      glow: "",
    },
    {
      key: "incomum",
      label: "Incomum",
      text: "text-rarity-incomum",
      ring: "ring-rarity-incomum/60",
      glow: "",
    },
    {
      key: "raro",
      label: "Raro",
      text: "text-rarity-raro",
      ring: "ring-rarity-raro/70",
      glow: "shadow-[0_0_14px_-4px_var(--color-rarity-raro)]",
    },
    {
      key: "epico",
      label: "Épico",
      text: "text-rarity-epico",
      ring: "ring-rarity-epico/80",
      glow: "shadow-[0_0_16px_-3px_var(--color-rarity-epico)]",
    },
    {
      key: "lendario",
      label: "Lendário",
      text: "text-rarity-lendario",
      ring: "ring-rarity-lendario",
      glow: "rarity-legendary",
    },
  ];

export const RARITY = Object.fromEntries(RARITIES.map((r) => [r.key, r])) as Record<
  Rarity,
  (typeof RARITIES)[number]
>;

export const ITEM_KINDS: { key: "item" | "belonging"; label: string }[] = [
  { key: "item", label: "Itens" },
  { key: "belonging", label: "Pertences" },
];
