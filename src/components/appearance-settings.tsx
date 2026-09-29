import { Palette, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AMBIENTS, THEMES, useAppearance } from "@/lib/rpg/appearance";
import { cn } from "@/lib/utils";

export function AppearanceSettings({ className }: { className?: string }) {
  const { theme, ambient, setTheme, setAmbient } = useAppearance();

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Aparência"
        className={cn(
          "grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-fg",
          className,
        )}
      >
        <Palette className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto border-border bg-surface text-fg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Aparência</DialogTitle>
          <DialogDescription className="text-muted">
            Escolha a paleta da mesa e o clima do ambiente. Fica salvo neste navegador.
          </DialogDescription>
        </DialogHeader>

        <section className="grid gap-3">
          <h3 className="text-xs tracking-[0.2em] text-subtle uppercase">Tema de cores</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  theme === t.id
                    ? "border-ring/60 bg-elevated"
                    : "border-border hover:border-ring/40 hover:bg-elevated/60",
                )}
              >
                <span className="flex shrink-0 overflow-hidden rounded-md shadow-border">
                  {t.swatch.map((c) => (
                    <span key={c} className="size-5" style={{ backgroundColor: c }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{t.label}</span>
                  <span className="block truncate text-xs text-muted">{t.hint}</span>
                </span>
                {theme === t.id ? <Check className="size-4 shrink-0 text-ring" /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-xs tracking-[0.2em] text-subtle uppercase">Efeito de ambiente</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {AMBIENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAmbient(a.id)}
                aria-pressed={ambient === a.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  ambient === a.id
                    ? "border-ring/60 bg-elevated"
                    : "border-border hover:border-ring/40 hover:bg-elevated/60",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{a.label}</span>
                  <span className="block truncate text-xs text-muted">{a.hint}</span>
                </span>
                {ambient === a.id ? <Check className="size-4 shrink-0 text-ring" /> : null}
              </button>
            ))}
          </div>
          <p className="text-xs text-subtle">
            Os efeitos são leves e desligam sozinhos se o sistema pedir menos animações.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
