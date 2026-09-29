import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CharacterDraft, Role, StatKey, BodySlot } from "./types";

export const getMyStateFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const store = await import("./store.server");
    return store.getMyState(context.userId);
  });

export const getLibraryFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const store = await import("./store.server");
    return store.getLibrary();
  });

export const chooseRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { role: Role; displayName: string; character?: CharacterDraft }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.chooseRoleForUser(context.userId, data);
  });

export const gmUpdateIdentityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; draft: CharacterDraft }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmUpdateIdentity(context.userId, data.characterId, data.draft);
  });

export const updateNotesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; notes: string }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.updateNotes(context.userId, data.characterId, data.notes);
  });

export const updateMyAvatarFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { avatar: string | null }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.updateMyAvatar(context.userId, data.avatar);
  });

export const spendPointsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; alloc: Partial<Record<StatKey, number>> }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.spendPoints(context.userId, data.characterId, data.alloc);
  });

export const gmSetStatsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { characterId: number; stats: Record<StatKey, number> & { unspent: number } }) => data,
  )
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmSetStats(context.userId, data.characterId, data.stats);
  });

export const gmGrantPointsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; amount: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmGrantPoints(context.userId, data.characterId, data.amount);
  });

export const gmUpdateVitalsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      characterId: number;
      vitals: {
        hp: number;
        hpMax: number;
        mana: number;
        manaMax: number;
        stamina: number;
        staminaMax: number;
      };
    }) => data,
  )
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmUpdateVitals(context.userId, data.characterId, data.vitals);
  });

export const gmCreateCharacterFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CharacterDraft) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmCreateCharacter(context.userId, data);
  });

export const gmDeleteCharacterFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmDeleteCharacter(context.userId, data.characterId);
  });

export const addItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      characterId: number;
      item: { name: string; description: string; quantity: number; kind: "item" | "belonging" };
    }) => data,
  )
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.addItem(context.userId, data.characterId, data.item);
  });

export const removeItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { itemId: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.removeItem(context.userId, data.itemId);
  });

export const equipItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { itemId: number; slot: BodySlot }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.equipItem(context.userId, data.itemId, data.slot);
  });

export const unequipItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { itemId: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.unequipItem(context.userId, data.itemId);
  });

export const gmGiveEquipmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; equipmentId: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmGiveEquipment(context.userId, data.characterId, data.equipmentId);
  });

export const gmQuickCreateEquipmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      values: Record<string, unknown>;
      characterId: number | null;
      temporary: boolean;
      deliver: boolean;
    }) => data,
  )
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.gmQuickCreateEquipment(context.userId, data.values, {
      characterId: data.characterId,
      temporary: data.temporary,
      deliver: data.deliver,
    });
  });

export const saveLibraryEntryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      table: "equipment" | "effects" | "conditions";
      id: number | null;
      values: Record<string, unknown>;
    }) => data,
  )
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.saveLibraryEntry(context.userId, data.table, data.id, data.values);
  });

export const deleteLibraryEntryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { table: "equipment" | "effects" | "conditions"; id: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.deleteLibraryEntry(context.userId, data.table, data.id);
  });

export const applyEffectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; effectId: number; duration: string }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.applyEffect(context.userId, data.characterId, data.effectId, data.duration);
  });

export const removeAppliedEffectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.removeAppliedEffect(context.userId, data.id);
  });

export const applyConditionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: number; conditionId: number; duration: string }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.applyCondition(context.userId, data.characterId, data.conditionId, data.duration);
  });

export const removeAppliedConditionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ context, data }) => {
    const store = await import("./store.server");
    return store.removeAppliedCondition(context.userId, data.id);
  });

export const rollD20Fn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const store = await import("./store.server");
    return store.rollD20(context.userId);
  });

export const recentRollsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const store = await import("./store.server");
    return store.recentRolls(context.userId);
  });
