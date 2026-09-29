import type {
  BodySlot,
  CharacterDraft,
  Condition,
  DiceRoll,
  Effect,
  Equipment,
  Role,
  StatKey,
} from "./types";
import type { RpgState } from "./api-types";
import * as fns from "./server-fns";

async function hasSession() {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

export async function getMyState(): Promise<RpgState> {
  // Polled every few seconds: with no session, don't hit the protected endpoint.
  if (!(await hasSession())) return new Promise<RpgState>(() => {});
  return fns.getMyStateFn();
}

export async function getLibrary() {
  if (!(await hasSession())) return { equipment: [], effects: [], conditions: [] } as unknown as Awaited<ReturnType<typeof fns.getLibraryFn>>;
  return fns.getLibraryFn();
}

export async function chooseRole(role: Role, displayName: string, character?: CharacterDraft) {
  return fns.chooseRoleFn({
    data: {
      role,
      displayName,
      ...(character ? { character } : {}),
    },
  });
}

export async function gmUpdateIdentity(characterId: number, d: CharacterDraft) {
  return fns.gmUpdateIdentityFn({ data: { characterId, draft: d } });
}

export async function updateNotes(characterId: number, notes: string) {
  return fns.updateNotesFn({ data: { characterId, notes } });
}

export async function updateMyAvatar(avatar: string | null) {
  return fns.updateMyAvatarFn({ data: { avatar } });
}

export async function spendPoints(characterId: number, alloc: Partial<Record<StatKey, number>>) {
  return fns.spendPointsFn({ data: { characterId, alloc } });
}

export async function gmSetStats(
  characterId: number,
  s: Record<StatKey, number> & { unspent: number },
) {
  return fns.gmSetStatsFn({ data: { characterId, stats: s } });
}

export async function gmGrantPoints(characterId: number, amount: number) {
  return fns.gmGrantPointsFn({ data: { characterId, amount } });
}

export async function gmUpdateVitals(
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
  return fns.gmUpdateVitalsFn({ data: { characterId, vitals: v } });
}

export async function gmCreateCharacter(d: CharacterDraft) {
  return fns.gmCreateCharacterFn({ data: d });
}

export async function gmDeleteCharacter(characterId: number) {
  return fns.gmDeleteCharacterFn({ data: { characterId } });
}

export async function addItem(
  characterId: number,
  item: { name: string; description: string; quantity: number; kind: "item" | "belonging" },
) {
  return fns.addItemFn({ data: { characterId, item } });
}

export async function removeItem(itemId: number) {
  return fns.removeItemFn({ data: { itemId } });
}

export async function equipItem(itemId: number, slot: BodySlot) {
  return fns.equipItemFn({ data: { itemId, slot } });
}

export async function unequipItem(itemId: number) {
  return fns.unequipItemFn({ data: { itemId } });
}

export async function gmGiveEquipment(characterId: number, equipmentId: number) {
  return fns.gmGiveEquipmentFn({ data: { characterId, equipmentId } });
}

export async function gmQuickCreateEquipment(
  values: Record<string, unknown>,
  options: { characterId: number | null; temporary: boolean; deliver: boolean },
) {
  return fns.gmQuickCreateEquipmentFn({
    data: {
      values,
      characterId: options.characterId,
      temporary: options.temporary,
      deliver: options.deliver,
    },
  });
}

type LibTable = "equipment" | "effects" | "conditions";

export async function saveLibraryEntry(
  table: LibTable,
  id: number | null,
  values: Record<string, unknown>,
) {
  return fns.saveLibraryEntryFn({ data: { table, id, values } });
}

export async function deleteLibraryEntry(table: LibTable, id: number) {
  return fns.deleteLibraryEntryFn({ data: { table, id } });
}

export async function applyEffect(characterId: number, effectId: number, duration: string) {
  return fns.applyEffectFn({ data: { characterId, effectId, duration } });
}

export async function removeAppliedEffect(id: number) {
  return fns.removeAppliedEffectFn({ data: { id } });
}

export async function applyCondition(characterId: number, conditionId: number, duration: string) {
  return fns.applyConditionFn({ data: { characterId, conditionId, duration } });
}

export async function removeAppliedCondition(id: number) {
  return fns.removeAppliedConditionFn({ data: { id } });
}

export async function rollD20(): Promise<DiceRoll> {
  return fns.rollD20Fn();
}

export async function recentRolls(): Promise<DiceRoll[]> {
  // Polled in the background: never throw (expired session would blank the screen).
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (!data.session) return [];
    return await fns.recentRollsFn();
  } catch {
    return [];
  }
}

export function mapEquipment(e: Equipment) {
  return e;
}
export function mapEffect(e: Effect) {
  return e;
}
export function mapCondition(c: Condition) {
  return c;
}
export function mapRoll(r: DiceRoll) {
  return r;
}
