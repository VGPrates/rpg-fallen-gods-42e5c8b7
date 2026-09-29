import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Landing } from "@/components/landing";
import { LoadingScreen } from "@/components/app-chrome";
import { useRpgState, useSession } from "@/lib/rpg/hooks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RPG Fallen Gods — O grimório da sua mesa de RPG" },
      { name: "description", content: "Fichas, inventário, efeitos e o D20 compartilhado para a sua mesa de RPG de fantasia." },
      { property: "og:title", content: "RPG Fallen Gods — O grimório da sua mesa de RPG" },
      { property: "og:description", content: "Fichas, inventário, efeitos e o D20 compartilhado para a sua mesa de RPG de fantasia." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, isPending } = useSession();
  if (isPending) return <LoadingScreen />;
  if (!user) return <Landing />;
  return <SignedInHome />;
}

function SignedInHome() {
  const { data, isPending, isError } = useRpgState();
  if (isPending) return <LoadingScreen />;
  if (isError) return <Navigate to="/login" />;
  if (!data?.profile) return <Navigate to="/onboarding" />;
  return <Navigate to={data.profile.role === "gm" ? "/mestre" : "/painel"} />;
}
