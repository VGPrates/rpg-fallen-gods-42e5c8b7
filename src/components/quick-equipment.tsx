import { useEffect, useMemo, useState } from "react";
import { History, Plus, Search, Sparkles } from "lucide-react";
import * as api from "@/lib/rpg/api";
import { CATEGORIES, CATEGORY, RARITIES, RARITY } from "@/lib/rpg/constants";
import { useLibrary } from "@/lib/rpg/hooks";
import { formatModifiers } from "@/lib/rpg/stats";
import { useAct } from "@/lib/rpg/use-act";
import {
  pushRecentEquipment,
  readRecentEquipment,
  type RecentEquipment,
} from "@/lib/rpg/recent-equipment";
import type { Character, Equipment } from "@/lib/rpg/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GameIcon } from "@/components/game-icon";
import { IconField, ModifierFields, readMods } from "@/components/equipment-fields";
import { cn } from "@/lib/utils";

type Mode = "arsenal" | "rapida" | "recentes";

const TABS: { id: Mode; label: string; icon: typeof Search }[] = [
  { id: "arsenal", label: "Buscar no Arsenal", icon: Search },
  { id: "rapida", label: "Criação rápida", icon: Sparkles },
  { id: "recentes", label: "Itens recentes", icon: History },
];

/**
 * Criação e entrega de equipamentos sem sair da ficha do jogador.
 * Só aparece para o Mestre da Mesa (quem renderiza controla isso).
 */
export function AddEquipmentButton({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Adicionar equipamento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar equipamento</DialogTitle>
            <DialogDescription>
              Vai direto para a ficha de <span className="text-fg">{character.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <QuickEquipmentPanel character={character} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuickEquipmentPanel({ character, onDone }: { character: Character; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("rapida");
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface p-1 shadow-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={cn(
                "flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs sm:text-sm",
                mode === t.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      {mode === "arsenal" ? <ArsenalSearch character={character} onDone={onDone} /> : null}
      {mode === "rapida" ? <QuickCreateForm character={character} onDone={onDone} /> : null}
      {mode === "recentes" ? <RecentList character={character} onDone={onDone} /> : null}
    </div>
  );
}

function useDeliver(character: Character) {
  const { run, pending } = useAct();
  const deliver = async (equipment: Pick<Equipment, "id" | "name" | "icon" | "rarity">) => {
    const ok = await run(
      () => api.gmGiveEquipment(character.id, equipment.id),
      `${equipment.name} entregue a ${character.name}.`,
    );
    if (ok) {
      pushRecentEquipment({
        id: equipment.id,
        name: equipment.name,
        icon: equipment.icon,
        rarity: equipment.rarity,
      });
    }
    return ok;
  };
  return { deliver, pending, run };
}

function ArsenalSearch({ character, onDone }: { character: Character; onDone: () => void }) {
  const { data } = useLibrary();
  const [q, setQ] = useState("");
  const { deliver, pending } = useDeliver(character);
  const list = useMemo(() => {
    const all = data?.equipment ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (e) => e.name.toLowerCase().includes(term) || e.description.toLowerCase().includes(term),
    );
  }, [data, q]);

  return (
    <div className="grid gap-3">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome ou descrição…"
        aria-label="Buscar no Arsenal"
      />
      {list.length === 0 ? (
        <p className="text-sm text-subtle">Nenhum equipamento encontrado.</p>
      ) : (
        <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
          {list.map((e) => {
            const rarity = RARITY[e.rarity];
            return (
              <li
                key={e.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg bg-elevated px-3 py-2 shadow-border ring-1",
                  rarity.ring,
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-md bg-bg/50",
                    rarity.text,
                  )}
                >
                  <GameIcon name={e.icon} className="size-8" rarity={rarity.key} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-medium", rarity.text)}>{e.name}</p>
                  <p className="truncate text-xs text-subtle">
                    {[rarity.label, CATEGORY[e.category].where, formatModifiers(e.modifiers)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={async () => {
                    if (await deliver(e)) onDone();
                  }}
                >
                  Entregar
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RecentList({ character, onDone }: { character: Character; onDone: () => void }) {
  const [items, setItems] = useState<RecentEquipment[]>([]);
  const { deliver, pending } = useDeliver(character);
  useEffect(() => setItems(readRecentEquipment()), []);

  if (items.length === 0) {
    return (
      <p className="text-sm text-subtle">
        Nada ainda. Os últimos equipamentos criados ou entregues aparecem aqui.
      </p>
    );
  }
  return (
    <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
      {items.map((e) => {
        const rarity = RARITY[e.rarity] ?? RARITY.comum;
        return (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-lg bg-elevated px-3 py-2 shadow-border"
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-md bg-bg/50",
                rarity.text,
              )}
            >
              <GameIcon name={e.icon} className="size-8" rarity={rarity.key} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-medium", rarity.text)}>{e.name}</p>
              <p className="truncate text-xs text-subtle">
                {rarity.label}
                {e.temporary ? " · temporário" : ""}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={async () => {
                if (await deliver(e)) onDone();
              }}
            >
              Entregar
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function QuickCreateForm({ character, onDone }: { character: Character; onDone: () => void }) {
  const { run, pending } = useAct();
  const [temporary, setTemporary] = useState(false);

  const submit = async (form: HTMLFormElement, deliver: boolean) => {
    const f = new FormData(form);
    const values = {
      name: String(f.get("name") ?? "").slice(0, 80),
      icon: String(f.get("icon") ?? "sword"),
      category: String(f.get("category") ?? "arma"),
      rarity: String(f.get("rarity") ?? "comum"),
      description: String(f.get("description") ?? "").slice(0, 400),
      effects: String(f.get("effects") ?? "").slice(0, 400),
      modifiers: readMods(f),
    };
    if (!values.name.trim()) return;
    let created: { id: number; name: string; icon: string; rarity: string } | null = null;
    const ok = await run(
      async () => {
        created = await api.gmQuickCreateEquipment(values, {
          characterId: character.id,
          temporary: temporary && deliver,
          deliver,
        });
      },
      deliver
        ? `${values.name} entregue a ${character.name}.`
        : `${values.name} criado no Arsenal.`,
    );
    if (ok && created) {
      const c = created as { id: number; name: string; icon: string; rarity: string };
      pushRecentEquipment({
        id: c.id,
        name: c.name,
        icon: c.icon,
        rarity: values.rarity as RecentEquipment["rarity"],
        temporary: temporary && deliver,
      });
      form.reset();
      onDone();
    }
  };

  return (
    <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-1.5">
        <Label htmlFor="quick-name">Nome</Label>
        <Input
          id="quick-name"
          name="name"
          required
          maxLength={80}
          placeholder="Ex.: Espada Longa Flamejante"
        />
      </div>
      <IconField initial="sword" category="equipment" />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="quick-cat">Tipo / local</Label>
          <Select id="quick-cat" name="category" defaultValue="arma">
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} → {c.where}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="quick-rar">Raridade</Label>
          <Select id="quick-rar" name="rarity" defaultValue="comum">
            {RARITIES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="quick-desc">Descrição</Label>
        <Textarea id="quick-desc" name="description" rows={2} maxLength={400} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="quick-eff">Dano / efeito</Label>
        <Input id="quick-eff" name="effects" maxLength={400} placeholder="Ex.: 1d8 de fogo" />
      </div>
      <ModifierFields />
      <label className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2 text-sm shadow-border">
        <input
          type="checkbox"
          checked={temporary}
          onChange={(e) => setTemporary(e.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
        <span>
          Criar como equipamento temporário
          <span className="block text-xs text-subtle">
            Só para {character.name}; não entra no Arsenal.
          </span>
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || temporary}
          onClick={(e) => void submit(e.currentTarget.form!, false)}
        >
          Criar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={pending}
          onClick={(e) => void submit(e.currentTarget.form!, true)}
        >
          Criar e entregar
        </Button>
      </div>
    </form>
  );
}
