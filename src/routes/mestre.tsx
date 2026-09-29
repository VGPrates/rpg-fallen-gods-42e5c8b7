import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/app-chrome";
import { GmPanel } from "@/components/gm-panel";
import { useRpgState, useSession } from "@/lib/rpg/hooks";

export const Route = createFileRoute("/mestre")({
  head: () => ({
    meta: [
      { title: "Painel do Mestre — RPG Fallen Gods" },
      { name: "description", content: "Conduza a mesa: fichas, arsenal, buffs, condições e o D20." },
      { property: "og:title", content: "Painel do Mestre — RPG Fallen Gods" },
      { property: "og:description", content: "Conduza a mesa: fichas, arsenal, buffs, condições e o D20." },
    ],
  }),
  component: MestrePage,
});

function MestrePage() {
  const { user, isPending: authPending } = useSession();
  const { data, isPending } = useRpgState(!!user);
  if (authPending || (user && isPending)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!data?.profile) return <Navigate to="/onboarding" />;
  if (data.profile.role !== "gm") return <Navigate to="/painel" />;
  return <GmPanel profile={data.profile} party={data.party} />;
}
