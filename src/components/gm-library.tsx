import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CATEGORIES, CATEGORY, RARITIES, RARITY, STATS } from "@/lib/rpg/constants";
import * as api from "@/lib/rpg/api";
import { useLibrary } from "@/lib/rpg/hooks";
import { formatModifiers } from "@/lib/rpg/stats";
import { useAct } from "@/lib/rpg/use-act";
import type { Condition, Effect, Equipment, Modifiers } from "@/lib/rpg/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GameIcon } from "@/components/game-icon";
import { IconPicker } from "@/components/icon-picker";
import type { IconCategory } from "@/lib/rpg/icons";
import { ValueStepper } from "@/components/value-stepper";
import { cn } from "@/lib/utils";

function readMods(form: FormData): Modifiers {
  const m: Modifiers = {};
  for (const s of STATS) {
    const v = Number(form.get(`mod_${s.key}`) || 0);
    if (v) m[s.key] = Math.max(-50, Math.min(50, Math.trunc(v)));
  }
  return m;
}

function ModifierFields({ initial }: { initial?: Modifiers | undefined }) {
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

function IconField({ initial, category }: { initial: string; category: IconCategory }) {
  const [v, setV] = useState(initial || "sword");
  return (
    <>
      <input type="hidden" name="icon" value={v} />
      <IconPicker value={v} onChange={setV} defaultCategory={category} />
    </>
  );
}

function EntryRow({ icon, title, sub, color, className, onEdit, onDelete }: { icon: string; title: string; sub: string; color?: string; className?: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className={cn("flex items-center gap-3 rounded-lg bg-elevated px-3 py-2 shadow-border", className)}>
      <span className="grid size-12 place-items-center rounded-md bg-bg/50" style={color ? { color } : undefined}>
        <GameIcon name={icon} className="size-9" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" style={color ? { color } : undefined}>{title}</p>
        <p className="truncate text-xs text-subtle">{sub}</p>
      </div>
      <button type="button" onClick={onEdit} aria-label={`Editar ${title}`} className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg">
        <Pencil className="size-4" />
      </button>
      <button type="button" onClick={onDelete} aria-label={`Excluir ${title}`} className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface hover:text-hp-bright">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

export function EquipmentLibrary() {
  const { data } = useLibrary();
  const { run, pending } = useAct();
  const [editing, setEditing] = useState<Equipment | null>(null);
  const list = data?.equipment ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? `Editar ${editing.name}` : "Forjar equipamento"}</CardTitle>
          <CardDescription>A categoria define em que parte do corpo o item encaixa.</CardDescription>
        </CardHeader>
        <form
          key={editing?.id ?? "new"}
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const form = e.currentTarget;
            await run(
              () =>
                api.saveLibraryEntry("equipment", editing?.id ?? null, {
                  name: String(f.get("name")).slice(0, 80),
                  icon: String(f.get("icon")),
                  category: String(f.get("category")),
                  rarity: String(f.get("rarity")),
                  description: String(f.get("description") ?? "").slice(0, 400),
                  effects: String(f.get("effects") ?? "").slice(0, 400),
                  modifiers: readMods(f),
                  updated_at: new Date().toISOString(),
                }),
              editing ? "Equipamento atualizado." : "Equipamento criado.",
            );
            setEditing(null);
            form.reset();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="eq-name">Nome</Label>
            <Input id="eq-name" name="name" required maxLength={80} defaultValue={editing?.name} />
          </div>
          <IconField initial={editing?.icon ?? "sword"} category="equipment" />
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="eq-cat">Tipo / local</Label>
              <Select id="eq-cat" name="category" defaultValue={editing?.category ?? "arma"}>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} → {c.where}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eq-rar">Raridade</Label>
              <Select id="eq-rar" name="rarity" defaultValue={editing?.rarity ?? "comum"}>
                {RARITIES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="eq-desc">Descrição</Label>
            <Textarea id="eq-desc" name="description" rows={2} maxLength={400} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="eq-eff">Efeitos especiais</Label>
            <Input id="eq-eff" name="effects" maxLength={400} defaultValue={editing?.effects} placeholder="Ex.: Imune a fogo leve" />
          </div>
          <ModifierFields initial={editing?.modifiers} />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              {editing ? "Salvar alterações" : "Criar equipamento"}
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Arsenal</CardTitle>
          <CardDescription>Alterações valem para todas as cópias já entregues.</CardDescription>
        </CardHeader>
        {list.length === 0 ? <p className="text-sm text-subtle">Nenhum equipamento.</p> : null}
        <ul className="grid gap-2">
          {list.map((e) => (
            <EntryRow
              key={e.id}
              icon={e.icon}
              title={e.name}
              className={cn("ring-1", RARITY[e.rarity].ring, RARITY[e.rarity].glow)}
              sub={[RARITY[e.rarity].label, CATEGORY[e.category].where, formatModifiers(e.modifiers)].filter(Boolean).join(" · ")}
              onEdit={() => setEditing(e)}
              onDelete={() => {
                if (confirm(`Excluir ${e.name}? Ele some do inventário de todos.`)) void run(() => api.deleteLibraryEntry("equipment", e.id), "Equipamento excluído.");
              }}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function EffectForm<T extends Effect | Condition>({
  kind,
  editing,
  onDone,
}: {
  kind: "effect" | "condition";
  editing: T | null;
  onDone: () => void;
}) {
  const { run, pending } = useAct();
  const isEffect = kind === "effect";
  return (
    <form
      key={editing?.id ?? "new"}
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const base = {
          name: String(f.get("name")).slice(0, 80),
          icon: String(f.get("icon")),
          color: String(f.get("color")),
          description: String(f.get("description") ?? "").slice(0, 400),
          modifiers: readMods(f),
        };
        await run(
          () =>
            isEffect
              ? api.saveLibraryEntry("effects", editing?.id ?? null, { ...base, kind: String(f.get("kind")) })
              : api.saveLibraryEntry("conditions", editing?.id ?? null, { ...base, effect: String(f.get("effect") ?? "").slice(0, 400) }),
          "Salvo.",
        );
        form.reset();
        onDone();
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${kind}-name`}>Nome</Label>
          <Input id={`${kind}-name`} name="name" required maxLength={80} defaultValue={editing?.name} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${kind}-color`}>Cor</Label>
          <input id={`${kind}-color`} name="color" type="color" defaultValue={editing?.color ?? (isEffect ? "#7fa065" : "#d0564d")} className="h-11 w-full cursor-pointer rounded-md bg-elevated p-1 shadow-border" />
        </div>
      </div>
      <IconField
        initial={editing?.icon ?? (isEffect ? "sparkles" : "blood")}
        category={isEffect ? "effect" : "condition"}
      />
      {isEffect ? (
        <div className="grid gap-1.5">
          <Label htmlFor="effect-kind">Tipo</Label>
          <Select id="effect-kind" name="kind" defaultValue={(editing as Effect | null)?.kind ?? "buff"}>
            <option value="buff">Buff</option>
            <option value="debuff">Debuff</option>
          </Select>
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="cond-effect">Efeito</Label>
          <Input id="cond-effect" name="effect" maxLength={400} defaultValue={(editing as Condition | null)?.effect} placeholder="Ex.: Perde 1 de vida por turno" />
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor={`${kind}-desc`}>Descrição</Label>
        <Textarea id={`${kind}-desc`} name="description" rows={2} maxLength={400} defaultValue={editing?.description} />
      </div>
      <ModifierFields initial={editing?.modifiers} />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {editing ? "Salvar alterações" : "Criar"}
        </Button>
        {editing ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function EffectsLibrary() {
  const { data } = useLibrary();
  const { run } = useAct();
  const [editEffect, setEditEffect] = useState<Effect | null>(null);
  const [editCond, setEditCond] = useState<Condition | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Buffs e debuffs</CardTitle>
          <CardDescription>Bênçãos e maldições, com ou sem prazo.</CardDescription>
        </CardHeader>
        <EffectForm kind="effect" editing={editEffect} onDone={() => setEditEffect(null)} />
        <ul className="mt-5 grid gap-2">
          {(data?.effects ?? []).map((e) => (
            <EntryRow
              key={e.id}
              icon={e.icon}
              title={e.name}
              color={e.color}
              sub={[e.kind === "buff" ? "Buff" : "Debuff", formatModifiers(e.modifiers)].filter(Boolean).join(" · ")}
              onEdit={() => setEditEffect(e)}
              onDelete={() => {
                if (confirm(`Excluir ${e.name}?`)) void run(() => api.deleteLibraryEntry("effects", e.id), "Excluído.");
              }}
            />
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Condições</CardTitle>
          <CardDescription>Estados do corpo: sangramento, fratura, veneno…</CardDescription>
        </CardHeader>
        <EffectForm kind="condition" editing={editCond} onDone={() => setEditCond(null)} />
        <ul className="mt-5 grid gap-2">
          {(data?.conditions ?? []).map((c) => (
            <EntryRow
              key={c.id}
              icon={c.icon}
              title={c.name}
              color={c.color}
              sub={[c.effect, formatModifiers(c.modifiers)].filter(Boolean).join(" · ")}
              onEdit={() => setEditCond(c)}
              onDelete={() => {
                if (confirm(`Excluir ${c.name}?`)) void run(() => api.deleteLibraryEntry("conditions", c.id), "Excluída.");
              }}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}
