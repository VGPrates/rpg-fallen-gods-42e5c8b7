import { Link } from "@tanstack/react-router";
import { APP_NAME, APP_TAGLINE } from "@/lib/rpg/constants";
import { Button } from "@/components/ui/button";
import { AppearanceSettings } from "@/components/appearance-settings";
import campfire from "@/assets/knight-campfire.jpg";

const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <CampfireScene />
      <div className="absolute top-3 right-3 z-20">
        <AppearanceSettings />
      </div>
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
        <div className="stagger-in grid max-w-xl gap-6">
          <p className="text-xs tracking-[0.28em] text-muted uppercase">Fantasia medieval</p>
          <h1 className="font-display text-5xl leading-[1.05] font-medium sm:text-6xl">{APP_NAME}</h1>
          <p className="max-w-md text-lg text-muted">{APP_TAGLINE}</p>
          <p className="max-w-md text-base text-muted">
            Fichas, inventário, o D20 e o olhar do Mestre — tudo na mesma mesa. Jogadores cuidam da
            própria lenda. O mestre conduz o resto.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/login">Entrar na mesa</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/login" search={{ mode: "signup" }}>
                Criar conta
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampfireScene() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
      <img
        src={campfire}
        alt=""
        width={1920}
        height={1088}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover object-center"
      />
      {/* Very slow breathing glow from the fire */}
      <div className="campfire-glow" />
      {/* A handful of embers drifting up from the fire */}
      <div className="campfire-sparks">
        {SPARKS.map((i) => (
          <i
            key={i}
            style={{
              left: `${62 + (i % 5) * 1.8}%`,
              animationDelay: `${i * 1.3}s`,
              animationDuration: `${6 + (i % 4) * 1.6}s`,
            }}
          />
        ))}
      </div>
      {/* Legibility scrim for the copy on the left */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.86)_0%,rgb(0_0_0/0.62)_45%,transparent_78%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,var(--color-bg),transparent)]" />
    </div>
  );
}
