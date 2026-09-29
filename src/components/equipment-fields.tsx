import { useState } from "react";
import { STATS } from "@/lib/rpg/constants";
import type { Modifiers } from "@/lib/rpg/types";
import type { IconCategory } from "@/lib/rpg/icons";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/icon-picker";
import { ValueStepper } from "@/components/value-stepper";

/** Lê os modificadores de atributo de um formulário de equipamento/efeito. */
export function readMods(form: FormData): Modifiers {
  const m: Modifiers = {};
  for (const s of STATS) {
    const v = Number(form.get(`mod_${s.key}`) || 0);
    if (v) m[s.key] = Math.max(-50, Math.min(50, Math.trunc(v)));
  }
  return m;
}

export function ModifierFields({ initial }: { initial?: Modifiers | undefined }) {
  return (
    <div className="grid gap-1.5">
      <Label>Modificadores de atributo</Label>
      <div className="grid grid-cols-5 gap-2">
        {STATS.map((s) => (
          <label key={s.key} className="grid gap-1 text-center">
            <span className="text-[10px] tracking-[0.14em] text-subtle uppercase">{s.short}</span>
            <ValueStepper
              name={`mod_${s.key}`}
              defaultValue={initial?.[s.key] ?? 0}
              min={-50}
              max={50}
              compact
              ariaLabel={`modificador de ${s.label}`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function IconField({ initial, category }: { initial: string; category: IconCategory }) {
  const [v, setV] = useState(initial || "sword");
  return (
    <>
      <input type="hidden" name="icon" value={v} />
      <IconPicker value={v} onChange={setV} defaultCategory={category} />
    </>
  );
}
