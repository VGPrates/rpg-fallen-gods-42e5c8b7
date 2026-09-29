import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/app-chrome";
import { PlayerPanel } from "@/components/player-panel";
import { useRpgState, useSession } from "@/lib/rpg/hooks";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel do jogador — RPG Fallen Gods" },
      { name: "description", content: "Sua ficha, atributos, equipamentos e o D20 da mesa." },
      { property: "og:title", content: "Painel do jogador — RPG Fallen Gods" },
      { property: "og:description", content: "Sua ficha, atributos, equipamentos e o D20 da mesa." },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const { user, isPending: authPending } = useSession();
  const { data, isPending } = useRpgState(!!user);
  if (authPending || (user && isPending)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!data?.profile) return <Navigate to="/onboarding" />;
  if (data.profile.role === "gm") return <Navigate to="/mestre" />;
  if (!data.character) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <p className="text-muted">Sua ficha ainda não foi encontrada.</p>
      </main>
    );
  }
  return <PlayerPanel profile={data.profile} character={data.character} />;
}
