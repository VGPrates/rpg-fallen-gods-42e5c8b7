export type Role = "gm" | "player";

export type ItemKind = "item" | "belonging" | "body";

export type BodySlot =
  | "cabeca"
  | "torso"
  | "pernas"
  | "mao_direita"
  | "mao_esquerda"
  | "pe_direito"
  | "pe_esquerdo"
  | "acessorio";

export type EquipmentCategory =
  | "elmo"
  | "armadura"
  | "calca"
  | "arma"
  | "escudo"
  | "bota"
  | "acessorio";

export type Rarity = "comum" | "incomum" | "raro" | "epico" | "lendario";

export type StatKey = "strength" | "agility" | "resistance" | "intelligence" | "presence";

export type Modifiers = Partial<Record<StatKey, number>>;

export type Profile = {
  userId: string;
  role: Role;
  displayName: string | null;
  avatarUrl: string | null;
  tableId: number | null;
};

export type Equipment = {
  id: number;
  name: string;
  icon: string;
  category: EquipmentCategory;
  rarity: Rarity;
  description: string;
  effects: string;
  modifiers: Modifiers;
};

export type InventoryItem = {
  id: number;
  name: string;
  description: string;
  quantity: number;
  kind: ItemKind;
  equipment: Equipment | null;
  equippedSlot: BodySlot | null;
};

export type EffectKind = "buff" | "debuff";

export type Effect = {
  id: number;
  kind: EffectKind;
  name: string;
  icon: string;
  color: string;
  description: string;
  modifiers: Modifiers;
};

export type Condition = {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  effect: string;
  modifiers: Modifiers;
};

export type AppliedEffect = { id: number; duration: string; effect: Effect };
export type AppliedCondition = { id: number; duration: string; condition: Condition };

export type Character = {
  id: number;
  userId: string | null;
  createdBy: string;
  name: string;
  race: string;
  className: string;
  age: number;
  backstory: string;
  hp: number;
  hpMax: number;
  mana: number;
  manaMax: number;
  stamina: number;
  staminaMax: number;
  strength: number;
  agility: number;
  resistance: number;
  intelligence: number;
  presence: number;
  unspentPoints: number;
  notes: string;
  inventory: InventoryItem[];
  effects: AppliedEffect[];
  conditions: AppliedCondition[];
  updatedAt: string;
};

export type CharacterDraft = {
  name: string;
  race: string;
  className: string;
  age: number;
  backstory: string;
};

export type DiceRoll = {
  id: number;
  userId: string;
  rollerName: string;
  value: number;
  createdAt: string;
};
