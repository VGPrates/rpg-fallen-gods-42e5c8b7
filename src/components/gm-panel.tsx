import { useMemo, useState } from "react";
import { Dices, Sparkles, Swords, Users } from "lucide-react";
import { AppChrome, TabBar } from "@/components/app-chrome";
import { AttributeRadar } from "@/components/attribute-radar";
import { CharacterForm } from "@/components/character-form";
import { DiceRoller, useDiceToasts } from "@/components/dice-roller";
import { EffectsList } from "@/components/effects-list";
import { EffectsLibrary, EquipmentLibrary } from "@/components/gm-library";
import { InventoryPanel } from "@/components/inventory-panel";
import { AddEquipmentButton } from "@/components/quick-equipment";

import { GmStatsEditor } from "@/components/stats-panel";
import { VitalsBars } from "@/components/vitals-bars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import * as api from "@/lib/rpg/api";
import { RARITY } from "@/lib/rpg/constants";
import { useLibrary } from "@/lib/rpg/hooks";
import { effectiveStats } from "@/lib/rpg/stats";
import { useAct } from "@/lib/rpg/use-act";
import type { Character, Profile } from "@/lib/rpg/types";
import { cn } from "@/lib/utils";
import { ValueStepper } from "@/components/value-stepper";

export function GmPanel({ profile, party }: { profile: Profile; party: Character[] }) {
  const [tab, setTab] = useState("fichas");
  const [selectedId, setSelectedId] = useState<number | "new">(party[0]?.id ?? "new");
  const selected = useMemo(
    () => party.find((c) => c.id === selectedId) ?? null,
    [party, selectedId],
  );
  useDiceToasts(profile.userId, tab === "dado");

  return (
    <AppChrome roleLabel="Mestre da Mesa" profile={profile}>
      <div className="grid gap-6">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">
            {profile.displayName ?? "Mestre"}
          </p>
          <h1 className="font-display text-3xl">A mesa</h1>
          <p className="text-muted">Fichas, arsenal, efeitos e o D20 — tudo passa por aqui.</p>
        </div>

        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "fichas", label: "Fichas", icon: <Users className="size-4" /> },
            { id: "arsenal", label: "Arsenal", icon: <Swords className="size-4" /> },
            { id: "efeitos", label: "Efeitos", icon: <Sparkles className="size-4" /> },
            { id: "dado", label: "D20", icon: <Dices className="size-4" /> },
          ]}
        />

        {tab === "fichas" ? (
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="grid h-fit gap-2 rounded-xl bg-surface p-2 shadow-border">
              <button
                type="button"
                onClick={() => setSelectedId("new")}
                className={cn(
                  "min-h-11 rounded-lg px-3 text-left text-sm",
                  selectedId === "new" ? "bg-elevated" : "text-muted hover:text-fg",
                )}
              >
                Nova ficha
              </button>
              {party.length === 0 ? (
                <p className="px-3 py-2 text-sm text-subtle">Nenhuma ficha ainda.</p>
              ) : (
                party.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "min-h-11 rounded-lg px-3 py-2 text-left",
                      selected?.id === c.id ? "bg-elevated" : "hover:bg-elevated/50",
                    )}
                  >
                    <span className="flex items-center gap-1 truncate font-medium">
                      {c.name}
                      <span className="text-xs">
                        {[
                          ...c.effects.map((e) => e.effect.icon),
                          ...c.conditions.map((x) => x.condition.icon),
                        ]
                          .slice(0, 4)
                          .join("")}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-subtle">
                      {c.userId ? "Jogador" : "Mesa"} · {c.className}
                    </span>
                  </button>
                ))
              )}
            </aside>
            {selectedId === "new" || !selected ? (
              <CreateSheet onCreated={(id) => setSelectedId(id)} />
            ) : (
              <GmEditor key={selected.id} character={selected} />
            )}
          </div>
        ) : null}

        {tab === "arsenal" ? <EquipmentLibrary party={party} /> : null}
        {tab === "efeitos" ? <EffectsLibrary /> : null}
        {tab === "dado" ? (
          <Card className="p-6 sm:p-8">
            <DiceRoller myUserId={profile.userId} />
          </Card>
        ) : null}
      </div>
    </AppChrome>
  );
}

function CreateSheet({ onCreated }: { onCreated: (id: number) => void }) {
  const { run, pending } = useAct();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar ficha</CardTitle>
        <CardDescription>
          Personagens da mesa ficam com você. Jogadores criam a própria ficha ao entrar.
        </CardDescription>
      </CardHeader>
      <CharacterForm
        submitLabel="Criar ficha"
        pending={pending}
        onSubmit={(draft) =>
          run(async () => {
            const c = await api.gmCreateCharacter(draft);
            onCreated(c.id);
          }, `${draft.name} entrou na mesa.`)
        }
      />
    </Card>
  );
}

function GmEditor({ character }: { character: Character }) {
  const { run, pending } = useAct();
  const { data: lib } = useLibrary();
  const stats = effectiveStats(character);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl">{character.name}</h2>
        <Badge>{character.userId ? "Jogador" : "Mesa"}</Badge>
        <Badge>
          {character.race} · {character.className}
        </Badge>
        {character.unspentPoints > 0 ? (
          <Badge>{character.unspentPoints} pontos livres</Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Poder atual</CardTitle>
          </CardHeader>
          <AttributeRadar stats={stats} />
        </Card>
        <Card>
          <GmStatsEditor
            character={character}
            pending={pending}
            onSave={(v) => run(() => api.gmSetStats(character.id, v), "Distribuição corrigida.")}
          />
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = Number(new FormData(e.currentTarget).get("amount"));
              void run(() => api.gmGrantPoints(character.id, amount), "Pontos concedidos.");
            }}
          >
            <ValueStepper
              name="amount"
              defaultValue={1}
              min={1}
              max={50}
              ariaLabel="pontos a conceder"
            />
            <Button type="submit" disabled={pending}>
              Conceder pontos
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Efeitos e condições</CardTitle>
            <CardDescription>O jogador vê, mas só você aplica ou remove.</CardDescription>
          </CardHeader>
          <EffectsList
            effects={character.effects}
            conditions={character.conditions}
            onRemoveEffect={(id) => run(() => api.removeAppliedEffect(id), "Efeito removido.")}
            onRemoveCondition={(id) =>
              run(() => api.removeAppliedCondition(id), "Condição removida.")
            }
          />
          <div className="mt-5 grid gap-3">
            <ApplyForm
              label="Aplicar buff/debuff"
              options={(lib?.effects ?? []).map((e) => ({
                id: e.id,
                label: `${e.name} (${e.kind === "buff" ? "buff" : "debuff"})`,
              }))}
              defaultDuration="Permanente"
              pending={pending}
              onApply={(id, d) =>
                run(() => api.applyEffect(character.id, id, d), "Efeito aplicado.")
              }
            />
            <ApplyForm
              label="Aplicar condição"
              options={(lib?.conditions ?? []).map((c) => ({ id: c.id, label: c.name }))}
              defaultDuration="Até ser curado"
              pending={pending}
              onApply={(id, d) =>
                run(() => api.applyCondition(character.id, id, d), "Condição aplicada.")
              }
            />
          </div>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vida, mana e estamina</CardTitle>
              <CardDescription>Só o mestre move estas barras.</CardDescription>
            </CardHeader>
            <VitalsBars character={character} />
            <form
              key={character.updatedAt}
              className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const n = (k: string) => Number(f.get(k));
                void run(
                  () =>
                    api.gmUpdateVitals(character.id, {
                      hp: n("hp"),
                      hpMax: n("hpMax"),
                      mana: n("mana"),
                      manaMax: n("manaMax"),
                      stamina: n("stamina"),
                      staminaMax: n("staminaMax"),
                    }),
                  "Vitais ajustados.",
                );
              }}
            >
              <VitalField name="hp" label="Vida" defaultValue={character.hp} />
              <VitalField name="hpMax" label="Vida máx." defaultValue={character.hpMax} />
              <VitalField name="mana" label="Mana" defaultValue={character.mana} />
              <VitalField name="manaMax" label="Mana máx." defaultValue={character.manaMax} />
              <VitalField name="stamina" label="Estamina" defaultValue={character.stamina} />
              <VitalField
                name="staminaMax"
                label="Estamina máx."
                defaultValue={character.staminaMax}
              />
              <div className="col-span-2 sm:col-span-3">
                <Button type="submit" disabled={pending} variant="secondary">
                  Atualizar vitais
                </Button>
              </div>
            </form>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Entregar equipamento</CardTitle>
            </CardHeader>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const id = Number(new FormData(e.currentTarget).get("equipment"));
                if (id)
                  void run(() => api.gmGiveEquipment(character.id, id), "Equipamento entregue.");
              }}
            >
              <Select name="equipment" aria-label="Equipamento" defaultValue="">
                <option value="" disabled>
                  Escolha do arsenal…
                </option>
                {(lib?.equipment ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {RARITY[e.rarity].label}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={pending}>
                Entregar
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ficha</CardTitle>
          <CardDescription>
            Identidade travada para o jogador — só você pode corrigir.
          </CardDescription>
        </CardHeader>
        <CharacterForm
          key={character.updatedAt}
          initial={character}
          submitLabel="Salvar ficha"
          pending={pending}
          onSubmit={(draft) =>
            run(() => api.gmUpdateIdentity(character.id, draft), "Ficha atualizada.")
          }
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventário</CardTitle>
        </CardHeader>
        <InventoryPanel
          character={character}
          canEquipItems
          canManageItems
          canEditNotes={false}
          canRemoveEquipment
          pending={pending}
          equipmentAction={<AddEquipmentButton character={character} />}

          onAddItem={(item) => run(() => api.addItem(character.id, item), "Item adicionado.")}
          onRemoveItem={(id) => run(() => api.removeItem(id))}
          onEquip={(id, slot) => run(() => api.equipItem(id, slot), "Equipado.")}
          onUnequip={(id) => run(() => api.unequipItem(id))}
        />
      </Card>

      {!character.userId ? (
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (confirm(`Remover ${character.name} da mesa?`))
              void run(() => api.gmDeleteCharacter(character.id), "Ficha da mesa removida.");
          }}
        >
          Remover ficha da mesa
        </Button>
      ) : null}
    </div>
  );
}

function ApplyForm({
  label,
  options,
  defaultDuration,
  pending,
  onApply,
}: {
  label: string;
  options: { id: number; label: string }[];
  defaultDuration: string;
  pending?: boolean;
  onApply: (id: number, duration: string) => void;
}) {
  return (
    <form
      className="grid gap-2 rounded-lg bg-elevated p-3 shadow-border"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const id = Number(f.get("id"));
        if (id) onApply(id, String(f.get("duration") || defaultDuration).slice(0, 60));
      }}
    >
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
        <Select name="id" defaultValue="" aria-label={label}>
          <option value="" disabled>
            Escolha…
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input name="duration" placeholder={defaultDuration} aria-label="Duração" maxLength={60} />
        <Button type="submit" variant="secondary" disabled={pending}>
          Aplicar
        </Button>
      </div>
    </form>
  );
}

function VitalField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <ValueStepper name={name} defaultValue={defaultValue} min={0} max={9999} ariaLabel={label} />
    </div>
  );
}
