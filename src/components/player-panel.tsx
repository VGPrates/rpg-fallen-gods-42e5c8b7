import { useState } from "react";
import { Backpack, Dices, ScrollText } from "lucide-react";
import { AppChrome, TabBar } from "@/components/app-chrome";
import { AttributeRadar } from "@/components/attribute-radar";
import { LockedIdentity } from "@/components/character-form";
import { DiceRoller, useDiceToasts } from "@/components/dice-roller";
import { EffectsList } from "@/components/effects-list";
import { GameIcon } from "@/components/game-icon";
import { InventoryPanel } from "@/components/inventory-panel";
import { StatsPanel } from "@/components/stats-panel";
import { VitalsBars } from "@/components/vitals-bars";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "@/components/avatar-editor";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as api from "@/lib/rpg/api";
import { effectiveStats } from "@/lib/rpg/stats";
import { useAct } from "@/lib/rpg/use-act";
import type { Character, Profile } from "@/lib/rpg/types";

export function PlayerPanel({ profile, character }: { profile: Profile; character: Character }) {
  const [tab, setTab] = useState("ficha");
  const { run, pending } = useAct();
  const stats = effectiveStats(character);
  useDiceToasts(profile.userId, tab === "dado");

  return (
    <AppChrome roleLabel="Jogador" profile={profile}>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-4">
            <ProfileAvatar profile={profile} size="lg" />
            <div>
              <p className="text-xs tracking-[0.2em] text-muted uppercase">{profile.displayName ?? "Aventureiro"}</p>
              <h1 className="font-display text-3xl">{character.name}</h1>
              <p className="text-muted">
                {character.race} · {character.className} · {character.age} anos
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...character.effects.map((e) => e.effect), ...character.conditions.map((c) => c.condition)].map((x, i) => (
              <span key={i} title={x.name} className="grid size-11 place-items-center rounded-full shadow-border" style={{ backgroundColor: `${x.color}33`, color: x.color }}>
                <GameIcon name={x.icon} className="size-8" title={x.name} />
              </span>
            ))}
            {character.unspentPoints > 0 ? <Badge>{character.unspentPoints} pontos para distribuir</Badge> : null}
          </div>
        </div>

        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "ficha", label: "Ficha", icon: <ScrollText className="size-4" /> },
            { id: "dado", label: "D20", icon: <Dices className="size-4" /> },
            { id: "inventario", label: "Inventário", icon: <Backpack className="size-4" /> },
          ]}
        />

        {tab === "ficha" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid content-start gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Poder atual</CardTitle>
                  <CardDescription>Atributos com equipamentos, buffs e condições.</CardDescription>
                </CardHeader>
                <AttributeRadar stats={stats} />
              </Card>
              <Card>
                <StatsPanel
                  character={character}
                  stats={stats}
                  canSpend
                  pending={pending}
                  onConfirm={(alloc) => run(() => api.spendPoints(character.id, alloc), "Distribuição confirmada.")}
                />
              </Card>
            </div>
            <div className="grid content-start gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vitalidade</CardTitle>
                  <CardDescription>Somente o Mestre altera estas barras.</CardDescription>
                </CardHeader>
                <VitalsBars character={character} />
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Efeitos ativos</CardTitle>
                  <CardDescription>Aplicados pelo Mestre.</CardDescription>
                </CardHeader>
                <EffectsList effects={character.effects} conditions={character.conditions} />
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Sua lenda</CardTitle>
                  <CardDescription>Identidade permanente — apenas o Mestre pode corrigir.</CardDescription>
                </CardHeader>
                <LockedIdentity character={character} />
              </Card>
            </div>
          </div>
        ) : null}

        {tab === "dado" ? (
          <Card className="p-6 sm:p-8">
            <DiceRoller myUserId={profile.userId} />
          </Card>
        ) : null}

        {tab === "inventario" ? (
          <Card>
            <InventoryPanel
              character={character}
              canEquipItems
              canManageItems={false}
              canEditNotes
              canRemoveEquipment={false}
              pending={pending}
              onEquip={(id, slot) => run(() => api.equipItem(id, slot), "Equipado.")}
              onUnequip={(id) => run(() => api.unequipItem(id))}
              onSaveNotes={(notes) => run(() => api.updateNotes(character.id, notes), "Anotações guardadas.")}
            />
          </Card>
        ) : null}
      </div>
    </AppChrome>
  );
}
