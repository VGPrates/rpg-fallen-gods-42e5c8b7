import { X } from "lucide-react";
import type { AppliedCondition, AppliedEffect } from "@/lib/rpg/types";
import { formatModifiers } from "@/lib/rpg/stats";
import { GameIcon } from "@/components/game-icon";
import { cn } from "@/lib/utils";

type Chip = {
  id: number;
  icon: string;
  name: string;
  color: string;
  description: string;
  detail: string;
  duration: string;
  tag: string;
};

function EffectChip({ chip, onRemove }: { chip: Chip; onRemove?: (() => void) | undefined }) {
  return (
    <li
      className="group relative flex items-start gap-3 rounded-lg bg-elevated px-3 py-2.5 shadow-border"
      style={{ boxShadow: `inset 3px 0 0 ${chip.color}, 0 0 0 1px rgb(239 230 214 / 0.08)` }}
    >
      <span
        className="grid size-12 shrink-0 place-items-center rounded-md"
        style={{ backgroundColor: `${chip.color}26`, color: chip.color }}
      >
        <GameIcon name={chip.icon} className="size-9" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 font-medium leading-tight">
          <span style={{ color: chip.color }}>{chip.name}</span>
          <span className="text-[10px] tracking-[0.14em] text-subtle uppercase">{chip.tag}</span>
        </p>
        {chip.description ? <p className="text-xs text-muted">{chip.description}</p> : null}
        <p className="mt-0.5 text-xs text-subtle">
          {[chip.detail, chip.duration].filter(Boolean).join(" · ")}
        </p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${chip.name}`}
          className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </li>
  );
}

export function EffectsList({
  effects,
  conditions,
  onRemoveEffect,
  onRemoveCondition,
  className,
}: {
  effects: AppliedEffect[];
  conditions: AppliedCondition[];
  onRemoveEffect?: (id: number) => void;
  onRemoveCondition?: (id: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-5", className)}>
      <section className="grid gap-2">
        <h4 className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Buffs e debuffs</h4>
        {effects.length === 0 ? (
          <p className="text-sm text-subtle">Nenhum efeito ativo.</p>
        ) : (
          <ul className="grid gap-2">
            {effects.map((a) => (
              <EffectChip
                key={a.id}
                chip={{
                  id: a.id,
                  icon: a.effect.icon,
                  name: a.effect.name,
                  color: a.effect.color,
                  description: a.effect.description,
                  detail: formatModifiers(a.effect.modifiers),
                  duration: a.duration,
                  tag: a.effect.kind === "buff" ? "Buff" : "Debuff",
                }}
                onRemove={onRemoveEffect ? () => onRemoveEffect(a.id) : undefined}
              />
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-2">
        <h4 className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Condições</h4>
        {conditions.length === 0 ? (
          <p className="text-sm text-subtle">Nenhuma condição.</p>
        ) : (
          <ul className="grid gap-2">
            {conditions.map((a) => (
              <EffectChip
                key={a.id}
                chip={{
                  id: a.id,
                  icon: a.condition.icon,
                  name: a.condition.name,
                  color: a.condition.color,
                  description: a.condition.effect || a.condition.description,
                  detail: formatModifiers(a.condition.modifiers),
                  duration: a.duration,
                  tag: "Condição",
                }}
                onRemove={onRemoveCondition ? () => onRemoveCondition(a.id) : undefined}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
