import { Dna, Hourglass, Lock, ScrollText, Shield, Signature } from "lucide-react";
import { CLASSES, RACES } from "@/lib/rpg/constants";
import type { Character, CharacterDraft } from "@/lib/rpg/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ValueStepper } from "@/components/value-stepper";

type Props = {
  initial?: Partial<CharacterDraft>;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (draft: CharacterDraft) => void;
};

export function CharacterForm({ initial, submitLabel, pending, onSubmit }: Props) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          name: String(form.get("name") ?? ""),
          race: String(form.get("race") ?? ""),
          className: String(form.get("className") ?? ""),
          age: Number(form.get("age") ?? 0),
          backstory: String(form.get("backstory") ?? ""),
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={initial?.name ?? ""}
          placeholder="Nome do personagem"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="race">Raça</Label>
          <Select id="race" name="race" required defaultValue={initial?.race ?? "Humano"}>
            {RACES.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="className">Classe</Label>
          <Select
            id="className"
            name="className"
            required
            defaultValue={initial?.className ?? "Guerreiro"}
          >
            {CLASSES.map((klass) => (
              <option key={klass} value={klass}>
                {klass}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="age">Idade</Label>
          <ValueStepper
            name="age"
            defaultValue={initial?.age ?? 20}
            min={1}
            max={2000}
            required
            ariaLabel="idade"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="backstory">História</Label>
        <Textarea
          id="backstory"
          name="backstory"
          rows={6}
          maxLength={4000}
          defaultValue={initial?.backstory ?? ""}
          placeholder="De onde veio, o que busca, o que teme..."
        />
      </div>
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Gravando..." : submitLabel}
      </Button>
    </form>
  );
}

/**
 * Ficha travada: nome, raça, classe, idade e história ficam permanentes após a
 * criação. Só o Mestre pode corrigi-las (o banco também recusa qualquer outra
 * tentativa de alteração).
 */
export function LockedIdentity({ character }: { character: Character }) {
  const rows = [
    { label: "Nome", value: character.name, icon: Signature },
    { label: "Raça", value: character.race, icon: Dna },
    { label: "Classe", value: character.className, icon: Shield },
    { label: "Idade", value: `${character.age} anos`, icon: Hourglass },
  ];
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2 text-xs text-muted shadow-border">
        <Lock className="size-3.5 shrink-0" />
        <span>Identidade selada na criação da ficha. Peça ao Mestre para corrigir.</span>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="grid gap-1 rounded-lg bg-elevated/60 px-3 py-2 shadow-border">
            <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-subtle uppercase">
              <Icon className="size-3" />
              {label}
            </dt>
            <dd className="truncate font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-1">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-subtle uppercase">
          <ScrollText className="size-3" />
          História
        </p>
        <p className="whitespace-pre-wrap rounded-lg bg-elevated/60 px-3 py-2 text-sm text-muted shadow-border">
          {character.backstory || "Sem história registrada."}
        </p>
      </div>
    </div>
  );
}
