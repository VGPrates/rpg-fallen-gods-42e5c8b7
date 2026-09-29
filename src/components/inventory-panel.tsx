import { useState, type ReactNode } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { CATEGORY, ITEM_KINDS, RARITY, SLOT_LABEL } from "@/lib/rpg/constants";
import { formatModifiers } from "@/lib/rpg/stats";
import type { BodySlot, Character, InventoryItem } from "@/lib/rpg/types";
import { BodyFigure, DRAG_MIME } from "@/components/body-figure";
import { GameIcon } from "@/components/game-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ValueStepper } from "@/components/value-stepper";
import { cn } from "@/lib/utils";

type Props = {
  character: Character;
  /** Jogador e Mestre podem equipar/desequipar. */
  canEquipItems: boolean;
  /** Somente o Mestre cria ou remove itens, equipamentos e pertences. */
  canManageItems: boolean;
  canEditNotes: boolean;
  canRemoveEquipment: boolean;
  pending?: boolean;
  /** Ação extra ao lado do título dos equipamentos (ex.: adicionar equipamento). */
  equipmentAction?: ReactNode;
  onAddItem?: (item: {
    name: string;
    description: string;
    quantity: number;
    kind: "item" | "belonging";
  }) => void;
  onRemoveItem?: (itemId: number) => void;
  onEquip: (itemId: number, slot: BodySlot) => void;
  onUnequip: (itemId: number) => void;
  onSaveNotes?: (notes: string) => void;
};

export function InventoryPanel({
  character,
  canEquipItems,
  canManageItems,
  canEditNotes,
  canRemoveEquipment,
  pending,
  equipmentAction,

  onAddItem,
  onRemoveItem,
  onEquip,
  onUnequip,
  onSaveNotes,
}: Props) {
  const [kind, setKind] = useState<"item" | "belonging">("item");
  const [notes, setNotes] = useState(character.notes);
  const gear = character.inventory.filter((i) => i.equipment);

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-display text-lg">Corpo e equipamentos</h3>
          <p className="text-xs text-subtle">Arraste até o encaixe do corpo — ou use Equipar.</p>
        </div>
        <BodyFigure
          items={character.inventory}
          canEquip={canEquipItems}
          onEquip={onEquip}
          onUnequip={onUnequip}
        />
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg">Equipamentos na sacola</h3>
          {equipmentAction}
        </div>

        {gear.length === 0 ? (
          <p className="text-sm text-subtle">
            Nenhum equipamento. O Mestre entrega os equipamentos.
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {gear.map((item) => (
              <GearRow
                key={item.id}
                item={item}
                canEquip={canEquipItems}
                canRemove={canRemoveEquipment}
                pending={pending}
                onEquip={(slot) => onEquip(item.id, slot)}
                onUnequip={() => onUnequip(item.id)}
                onRemove={() => onRemoveItem?.(item.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {ITEM_KINDS.map((section) => {
          const items = character.inventory.filter((i) => !i.equipment && i.kind === section.key);
          return (
            <section key={section.key} className="grid content-start gap-3">
              <h3 className="font-display text-lg">{section.label}</h3>
              {items.length === 0 ? (
                <p className="text-sm text-subtle">
                  {canManageItems
                    ? "Nada registrado."
                    : "Nada registrado. O Mestre entrega itens e pertences."}
                </p>
              ) : (
                <ul className="grid gap-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg bg-elevated px-3 py-2.5 shadow-border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {item.name}
                          {item.quantity > 1 ? (
                            <span className="ml-2 tabular-nums text-subtle">×{item.quantity}</span>
                          ) : null}
                        </p>
                        {item.description ? (
                          <p className="text-sm text-muted">{item.description}</p>
                        ) : null}
                      </div>
                      {canManageItems ? (
                        <button
                          type="button"
                          className="grid size-11 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
                          disabled={pending}
                          onClick={() => onRemoveItem?.(item.id)}
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {canManageItems && onAddItem ? (
          <form
            className="grid content-start gap-3 rounded-xl bg-elevated p-4 shadow-border"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              onAddItem({
                name: String(data.get("name") ?? ""),
                description: String(data.get("description") ?? ""),
                quantity: Number(data.get("quantity") ?? 1),
                kind,
              });
              form.reset();
              setKind("item");
            }}
          >
            <p className="font-display text-base">Adicionar ao inventário</p>
            <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="item-name">Nome</Label>
                <Input id="item-name" name="name" required maxLength={80} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="item-qty">Qtd.</Label>
                <ValueStepper
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  max={999}
                  ariaLabel="quantidade"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-kind">Tipo</Label>
              <Select
                id="item-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as "item" | "belonging")}
              >
                {ITEM_KINDS.map((k) => (
                  <option key={k.key} value={k.key}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-desc">Descrição</Label>
              <Input id="item-desc" name="description" maxLength={400} />
            </div>
            <Button type="submit" disabled={pending} variant="secondary">
              Guardar item
            </Button>
          </form>
        ) : null}

        {onSaveNotes || !canEditNotes ? (
          <section className="grid content-start gap-3">
            <h3 className="font-display text-lg">Anotações</h3>
            {canEditNotes && onSaveNotes ? (
              <div className="grid gap-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={7}
                  maxLength={8000}
                  placeholder="Segredos, pistas, dívidas, juramentos..."
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || notes === character.notes}
                  onClick={() => onSaveNotes(notes)}
                >
                  Salvar anotações
                </Button>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-muted">
                {character.notes || "Nenhuma anotação."}
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function GearRow({
  item,
  canEquip,
  canRemove,
  pending,
  onEquip,
  onUnequip,
  onRemove,
}: {
  item: InventoryItem;
  canEquip: boolean;
  canRemove: boolean;
  pending?: boolean | undefined;
  onEquip: (slot: BodySlot) => void;
  onUnequip: () => void;
  onRemove: () => void;
}) {
  const eq = item.equipment!;
  const rarity = RARITY[eq.rarity];
  const cat = CATEGORY[eq.category];
  const mods = formatModifiers(eq.modifiers);
  return (
    <li
      draggable={canEquip}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, String(item.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "flex items-start gap-3 rounded-lg bg-elevated px-3 py-2.5 shadow-border ring-1",
        rarity.ring,
        rarity.glow,
        canEquip && "cursor-grab active:cursor-grabbing",
      )}
    >
      {canEquip ? <GripVertical className="mt-3 size-4 shrink-0 text-subtle" /> : null}
      <span
        className={cn("grid size-14 shrink-0 place-items-center rounded-md bg-bg/50", rarity.text)}
      >
        <GameIcon name={eq.icon} className="size-12" rarity={rarity.key} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium leading-tight", rarity.text)}>{item.name}</p>
        <p className="text-[11px] tracking-wide text-subtle uppercase">
          {rarity.label} · {cat.label} · {cat.where}
        </p>
        {eq.description ? <p className="mt-1 text-sm text-muted">{eq.description}</p> : null}
        {eq.effects ? <p className="text-xs text-muted italic">{eq.effects}</p> : null}
        {mods ? <p className="mt-0.5 text-xs text-stamina-bright">{mods}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {item.equippedSlot ? (
            <>
              <span className="rounded-full bg-primary/25 px-2 py-0.5 text-xs text-fg">
                Equipado · {SLOT_LABEL[item.equippedSlot]}
              </span>
              {canEquip ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={onUnequip}
                >
                  Desequipar
                </Button>
              ) : null}
            </>
          ) : canEquip ? (
            cat.slots.length === 1 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => onEquip(cat.slots[0]!)}
              >
                Equipar
              </Button>
            ) : (
              <Select
                aria-label={`Equipar ${item.name}`}
                className="h-9 w-auto text-sm"
                value=""
                disabled={pending}
                onChange={(e) => e.target.value && onEquip(e.target.value as BodySlot)}
              >
                <option value="">Equipar em…</option>
                {cat.slots.map((s) => (
                  <option key={s} value={s}>
                    {SLOT_LABEL[s]}
                  </option>
                ))}
              </Select>
            )
          ) : null}
        </div>
      </div>
      {canRemove ? (
        <button
          type="button"
          className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
          disabled={pending}
          onClick={onRemove}
          aria-label={`Remover ${item.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </li>
  );
}
