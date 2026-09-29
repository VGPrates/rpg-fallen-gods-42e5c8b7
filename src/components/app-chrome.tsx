import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/rpg/constants";
import { useCustomIcons, useTableSync } from "@/lib/rpg/hooks";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/profile-menu";
import { AppearanceSettings } from "@/components/appearance-settings";
import type { Profile } from "@/lib/rpg/types";

export function AppChrome({
  children,
  roleLabel,
  profile,
}: {
  children: ReactNode;
  roleLabel: string;
  profile?: Profile;
}) {
  useTableSync();
  useCustomIcons();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex min-h-11 items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-primary font-display text-xs text-primary-fg">MA</span>
            <span className="font-display text-base tracking-tight">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs tracking-wide text-muted uppercase sm:block">{roleLabel}</span>
            {profile ? <ProfileMenu profile={profile} /> : null}
            <AppearanceSettings />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:py-8">{children}</main>
    </div>
  );
}

export function TabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; icon: ReactNode }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <div className="hidden gap-1 rounded-xl bg-surface p-1 shadow-border sm:flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150",
              value === tab.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md text-xs",
                value === tab.id ? "text-fg" : "text-muted",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

export function LoadingScreen({ label = "Abrindo o grimório..." }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="grid gap-3 text-center">
        <div className="mx-auto size-10 animate-pulse rounded-md bg-elevated" />
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}
