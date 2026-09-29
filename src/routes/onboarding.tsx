import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/app-chrome";
import { CharacterForm } from "@/components/character-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRpgState, useSession } from "@/lib/rpg/hooks";
import { chooseRole } from "@/lib/rpg/api";
import type { CharacterDraft, Role } from "@/lib/rpg/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): { intent?: "gm" | "player" } =>
    search["intent"] === "gm" || search["intent"] === "player" ? { intent: search["intent"] } : {},
  head: () => ({
    meta: [
      { title: "Escolha seu papel — RPG Fallen Gods" },
      { name: "description", content: "Mestre ou jogador: escolha seu lugar na mesa e crie sua ficha." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { intent } = Route.useSearch();
  const { user, isPending: authPending } = useSession();
  const { data, isPending } = useRpgState(!!user);
  const [role, setRole] = useState<Role | null>(intent ?? null);
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: (payload: {
      role: Role;
      displayName?: string;
      character?: CharacterDraft;
    }) => chooseRole(payload.role, payload.displayName ?? "", payload.character),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rpg-state"] });
      window.location.href = "/";
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (authPending || (user && isPending)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (data?.profile) {
    return <Navigate to={data.profile.role === "gm" ? "/mestre" : "/painel"} />;
  }

  const displayName = user.user_metadata?.name || user.email || "Aventureiro";

  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl place-items-center px-4 py-10">
      <Card className="w-full p-6 sm:p-8">
        <CardHeader>
          <p className="text-xs tracking-[0.24em] text-muted uppercase">Primeiro passo</p>
          <CardTitle className="text-2xl">Quem é você nesta mesa?</CardTitle>
          <CardDescription>
            O cargo fica gravado no servidor. Um jogador não consegue se promover a Mestre depois — só o
            botão Assumir Manto, nesta tela, registra o manto.
          </CardDescription>
        </CardHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard
            title="Mestre da Mesa"
            body="Conduz a campanha, altera vida e mana, entrega itens e concede pontos."
            selected={role === "gm"}
            onSelect={() => setRole("gm")}
          />
          <RoleCard
            title="Jogador"
            body="Preenche a ficha, gira o D20, cuida do inventário e gasta os pontos recebidos."
            selected={role === "player"}
            onSelect={() => setRole("player")}
          />
        </div>

        {role === "gm" ? (
          <div className="mt-6 grid gap-3">
            <p className="text-sm text-muted">
              Ao assumir o manto, esta conta passa a ser Mestre desta mesa. O cargo não pode ser
              alterado depois pelo painel nem por requisição inventada.
            </p>
            <Button
              type="button"
              disabled={createMut.isPending}
              onClick={() => createMut.mutate({ role: "gm", displayName })}
            >
              {createMut.isPending ? "Abrindo a mesa..." : "Assumir Manto"}
            </Button>
          </div>
        ) : null}

        {role === "player" ? (
          <div className="mt-6 grid gap-4">
            <h2 className="font-display text-xl">Sua ficha</h2>
            <CharacterForm
              submitLabel="Entrar no painel"
              pending={createMut.isPending}
              onSubmit={(draft) =>
                createMut.mutate({
                  role: "player",
                  displayName,
                  character: draft,
                })
              }
            />
          </div>
        ) : null}
      </Card>
    </main>
  );
}

function RoleCard({
  title,
  body,
  selected,
  onSelect,
}: {
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl bg-elevated p-4 text-left shadow-border transition-[box-shadow,background-color] duration-150",
        selected ? "shadow-border-hover ring-1 ring-ring/40" : "hover:shadow-border-hover",
      )}
    >
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </button>
  );
}
