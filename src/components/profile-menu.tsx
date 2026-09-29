import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings } from "lucide-react";
import { ProfileAvatar } from "@/components/avatar-editor";
import { signOut } from "@/lib/auth/client";
import type { Profile } from "@/lib/rpg/types";

/**
 * Menu do perfil no cabeçalho: abre ao clicar na foto, fecha ao clicar fora
 * ou com Esc. Duas opções apenas: Configurações e Sair da conta.
 */
export function ProfileMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do perfil"
        className="block rounded-full focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <ProfileAvatar profile={profile} size="sm" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 grid w-56 gap-1 rounded-lg bg-elevated p-1.5 shadow-border"
        >
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="truncate text-sm text-fg">{profile.displayName}</p>
            <p className="text-xs text-subtle">Conta</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void navigate({ to: "/configuracoes" });
            }}
            className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-fg hover:bg-surface"
          >
            <Settings className="size-4 text-muted" />
            Configurações
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-fg hover:bg-surface"
          >
            <LogOut className="size-4 text-muted" />
            Sair da conta
          </button>
        </div>
      ) : null}
    </div>
  );
}
