import { useState, type DragEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { BODY_SLOTS, CATEGORY, RARITY, slotAccepts } from "@/lib/rpg/constants";
import { formatModifiers } from "@/lib/rpg/stats";
import type { BodySlot, InventoryItem } from "@/lib/rpg/types";
import { GameIcon } from "@/components/game-icon";
import { cn } from "@/lib/utils";

/** Figure box inside the HUD (percent of container). */
const FIG = { left: 32, width: 36, top: 4, height: 92 };
const toX = (fx: number) => FIG.left + (fx / 120) * FIG.width;
const toY = (fy: number) => FIG.top + (fy / 220) * FIG.height;

type SlotLayout = {
  side: "left" | "right";
  top: number;
  anchor: [number, number];
  fork?: [[number, number], [number, number]];
};

const LAYOUT: Record<BodySlot, SlotLayout> = {
  cabeca: { side: "left", top: 11, anchor: [60, 18] },
  acessorio: { side: "right", top: 11, anchor: [60, 36] },
  torso: { side: "right", top: 32, anchor: [72, 78] },
  mao_direita: { side: "left", top: 48, anchor: [26, 128] },
  mao_esquerda: { side: "right", top: 48, anchor: [94, 128] },
  pernas: { side: "left", top: 68, anchor: [60, 148], fork: [[46, 168], [74, 168]] },
  pe_direito: { side: "left", top: 90, anchor: [46, 208] },
  pe_esquerdo: { side: "right", top: 90, anchor: [74, 208] },
};

export const DRAG_MIME = "application/x-mesa-item";
const SILHOUETTE_SRC = `${import.meta.env.BASE_URL}references/equipment-silhouette.png`;

function Humanoid({ equipped, hover }: { equipped: Set<BodySlot>; hover: BodySlot | null }) {
  const active = equipped.size > 0 || hover !== null;
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full bg-ring/10 blur-3xl" />
      <img
        src={SILHOUETTE_SRC}
        alt=""
        className={cn(
          "relative left-1/2 h-full w-auto max-w-none -translate-x-1/2 object-contain equipment-silhouette",
          active && "is-active",
        )}
        draggable={false}
      />
    </div>
  );
}

type Props = {
  items: InventoryItem[];
  canEquip: boolean;
  onEquip: (itemId: number, slot: BodySlot) => void;
  onUnequip: (itemId: number) => void;
};

export function BodyFigure({ items, canEquip, onEquip, onUnequip }: Props) {
  const [hover, setHover] = useState<BodySlot | null>(null);
  const [rejected, setRejected] = useState<BodySlot | null>(null);
  const equipped = new Map<BodySlot, InventoryItem>();
  for (const it of items) if (it.equippedSlot) equipped.set(it.equippedSlot, it);

  function handleDrop(slot: BodySlot, e: DragEvent) {
    e.preventDefault();
    setHover(null);
    const id = Number(e.dataTransfer.getData(DRAG_MIME));
    const item = items.find((i) => i.id === id);
    if (!item?.equipment) return;
    if (!slotAccepts(item.equipment.category, slot)) {
      setRejected(slot);
      window.setTimeout(() => setRejected(null), 320);
      const label = BODY_SLOTS.find((s) => s.key === slot)?.label ?? slot;
      toast.error(`${item.name} não pode ser usado em "${label}". Encaixe correto: ${CATEGORY[item.equipment.category].where}.`);
      return;
    }
    onEquip(item.id, slot);
  }

  const card = (slotKey: BodySlot) => {
    const slot = BODY_SLOTS.find((s) => s.key === slotKey)!;
    const item = equipped.get(slotKey);
    const rarity = item?.equipment ? RARITY[item.equipment.rarity] : null;
    const side = LAYOUT[slotKey].side;
    const occupied = Boolean(item);
    return (
      <div
        key={slotKey}
        onDragOver={
          canEquip
            ? (e) => {
                e.preventDefault();
                setHover(slotKey);
              }
            : undefined
        }
        onDragLeave={canEquip ? () => setHover((h) => (h === slotKey ? null : h)) : undefined}
        onDrop={canEquip ? (e) => handleDrop(slotKey, e) : undefined}
        title={
          item?.equipment
            ? [item.equipment.description, formatModifiers(item.equipment.modifiers)].filter(Boolean).join(" — ")
            : `Encaixe vazio: ${slot.label}`
        }
        className={cn(
          "equip-plaque group relative flex min-h-[4.25rem] items-center gap-2.5 px-2.5 py-2",
          side === "right" && "sm:flex-row-reverse sm:text-right",
          occupied ? cn("is-occupied", rarity?.ring, rarity?.glow) : "is-empty",
          hover === slotKey && "is-aim",
          rejected === slotKey && "animate-slot-reject",
        )}
      >
        <span className={cn("equip-sigil grid size-11 shrink-0 place-items-center", !occupied && "opacity-45")}>
          <GameIcon
            name={item?.equipment?.icon ?? slot.icon}
            className="size-9"
            rarity={item ? (rarity?.key ?? null) : null}
            muted={!item}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="equip-slot-name">{slot.label}</p>
          <p className={cn("truncate text-sm leading-tight", occupied ? cn("font-medium", rarity?.text) : "text-xs italic text-subtle")}>
            {item ? item.name : canEquip ? "solte aqui" : "vazio"}
          </p>
        </div>
        {item && canEquip ? (
          <button
            type="button"
            onClick={() => onUnequip(item.id)}
            aria-label={`Desequipar ${item.name}`}
            className="grid size-8 shrink-0 place-items-center rounded-sm text-muted opacity-70 hover:bg-surface hover:text-fg hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        {occupied ? <span className="equip-gem" aria-hidden /> : null}
      </div>
    );
  };

  return (
    <div className="grid gap-4">
      <div className="equip-hud relative mx-auto hidden aspect-[128/100] w-full max-w-[820px] sm:block">
        <div className="equip-hud__frame" aria-hidden />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {BODY_SLOTS.map((s) => {
            // Acessório pode ser usado em qualquer parte do corpo: sem linha.
            if (s.key === "acessorio") return null;
            const l = LAYOUT[s.key];
            const x1 = l.side === "left" ? 27.2 : 72.8;
            const x2 = toX(l.anchor[0]);
            const y2 = toY(l.anchor[1]);
            const on = equipped.has(s.key) || hover === s.key;
            const stroke = on ? "var(--color-ring)" : "color-mix(in srgb, var(--color-muted) 38%, transparent)";
            if (l.fork) {
              const [a, b] = l.fork;
              const mx = toX(l.anchor[0]);
              const my = toY(l.anchor[1]);
              const fx1 = toX(a[0]);
              const fy1 = toY(a[1]);
              const fx2 = toX(b[0]);
              const fy2 = toY(b[1]);
              return (
                <g key={s.key}>
                  <path
                    d={`M ${x1} ${l.top} H ${x1 + 2.4} L ${mx} ${my}`}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    stroke={stroke}
                    strokeWidth={on ? 1.5 : 1.1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={on ? undefined : "3 4"}
                  />
                  <path
                    d={`M ${mx} ${my} L ${fx1} ${fy1}`}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    stroke={stroke}
                    strokeWidth={on ? 1.4 : 1}
                    strokeLinecap="round"
                    strokeDasharray={on ? undefined : "3 4"}
                  />
                  <path
                    d={`M ${mx} ${my} L ${fx2} ${fy2}`}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    stroke={stroke}
                    strokeWidth={on ? 1.4 : 1}
                    strokeLinecap="round"
                    strokeDasharray={on ? undefined : "3 4"}
                  />
                  <circle cx={fx1} cy={fy1} r="0.7" fill={on ? "var(--color-ring)" : "var(--color-muted)"} />
                  <circle cx={fx2} cy={fy2} r="0.7" fill={on ? "var(--color-ring)" : "var(--color-muted)"} />
                </g>
              );
            }
            const elbow = l.side === "left" ? x1 + 2.4 : x1 - 2.4;
            return (
              <g key={s.key}>
                <path
                  d={`M ${x1} ${l.top} H ${elbow} L ${x2} ${y2}`}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  stroke={stroke}
                  strokeWidth={on ? 1.5 : 1.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={on ? undefined : "3 4"}
                />
                <circle cx={x2} cy={y2} r="0.72" fill={on ? "var(--color-ring)" : "var(--color-muted)"} />
              </g>
            );
          })}
        </svg>
        <div
          className="absolute"
          style={{ left: `${FIG.left}%`, width: `${FIG.width}%`, top: `${FIG.top}%`, height: `${FIG.height}%` }}
        >
          <Humanoid equipped={new Set(equipped.keys())} hover={hover} />
        </div>
        {BODY_SLOTS.map((s) => {
          const l = LAYOUT[s.key];
          return (
            <div
              key={s.key}
              className={cn("absolute w-[26.5%] -translate-y-1/2", l.side === "left" ? "left-[1%]" : "right-[1%]")}
              style={{ top: `${l.top}%` }}
            >
              {card(s.key)}
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:hidden">
        <div className="equip-hud mx-auto flex h-64 w-40 items-center justify-center">
          <Humanoid equipped={new Set(equipped.keys())} hover={hover} />
        </div>
        <div className="grid grid-cols-2 gap-2">{BODY_SLOTS.map((s) => card(s.key))}</div>
      </div>
    </div>
  );
}
