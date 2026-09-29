import type { ComponentType } from "react";
import { Droplet, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Character } from "@/lib/rpg/types";

type Tone = "hp" | "mana" | "stamina";

const TONES: Record<Tone, { fill: string; icon: string; ring: string }> = {
  hp: {
    fill: "from-hp/70 to-hp-bright",
    icon: "text-hp-bright bg-hp/20",
    ring: "shadow-[0_0_12px_-2px_var(--color-hp)]",
  },
  mana: {
    fill: "from-mana/70 to-mana-bright",
    icon: "text-mana-bright bg-mana/20",
    ring: "shadow-[0_0_12px_-2px_var(--color-mana)]",
  },
  stamina: {
    fill: "from-stamina/70 to-stamina-bright",
    icon: "text-stamina-bright bg-stamina/20",
    ring: "shadow-[0_0_12px_-2px_var(--color-stamina)]",
  },
};

function Bar({
  label,
  value,
  max,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  max: number;
  tone: Tone;
  Icon: ComponentType<{ className?: string }>;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const t = TONES[tone];
  const low = pct <= 25;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-bg/40 p-2.5 shadow-border">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", t.icon)}>
        <Icon className="size-4.5" />
      </span>
      <div className="grid min-w-0 flex-1 gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {label}
          </span>
          <span className="font-display text-sm tabular-nums text-fg">
            <span className={cn(low && "text-hp-bright")}>{value}</span>
            <span className="text-subtle"> / {max}</span>
            <span className="ml-2 text-xs text-subtle">{Math.round(pct)}%</span>
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-elevated shadow-border">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ease-out",
              t.fill,
              pct > 0 && t.ring,
            )}
            style={{ width: `${pct}%` }}
          />
          {/* marcas de 25% para facilitar a leitura */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
            <span className="border-r border-bg/50" />
            <span className="border-r border-bg/50" />
            <span className="border-r border-bg/50" />
            <span />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-fg/10" />
        </div>
      </div>
    </div>
  );
}

export function VitalsBars({
  character,
  footnote,
}: {
  character: Character;
  footnote?: string;
}) {
  return (
    <div className="grid gap-2.5">
      <Bar label="Vida" value={character.hp} max={character.hpMax} tone="hp" Icon={Heart} />
      <Bar label="Mana" value={character.mana} max={character.manaMax} tone="mana" Icon={Droplet} />
      <Bar
        label="Estamina"
        value={character.stamina}
        max={character.staminaMax}
        tone="stamina"
        Icon={Zap}
      />
      {footnote ? <p className="text-xs text-subtle">{footnote}</p> : null}
    </div>
  );
}
