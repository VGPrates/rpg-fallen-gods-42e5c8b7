import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { recentRolls, rollD20 } from "@/lib/rpg/api";
import { playDiceSound } from "@/lib/rpg/audio";
import { verdictFor, type DiceVerdict } from "@/lib/rpg/dice";
import type { DiceRoll } from "@/lib/rpg/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIER_CLASS: Record<DiceVerdict["tier"], string> = {
  "crit-fail": "bg-dice-crit-fail text-fg",
  fail: "bg-dice-fail text-fg",
  feijoada: "bg-dice-feijoada text-fg",
  close: "bg-dice-close text-fg",
  good: "bg-dice-good text-fg",
  great: "bg-dice-great text-fg",
  crit: "bg-dice-crit text-bg",
};

const SUSPENSE_MS = 2200;

/**
 * Shared D20. The number is drawn by the server (roll_d20) and broadcast to
 * every open panel; the animation here only dramatizes a result that is
 * already fixed.
 */
export function DiceRoller({ myUserId }: { myUserId: string }) {
  const [current, setCurrent] = useState<DiceRoll | null>(null);
  const [rolling, setRolling] = useState(false);
  const [flicker, setFlicker] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [requesting, setRequesting] = useState(false);
  const seen = useRef(new Set<number>());
  const queue = useRef<DiceRoll[]>([]);
  const busy = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const playNext = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      busy.current = false;
      return;
    }
    busy.current = true;
    setCurrent(next);
    setRolling(true);
    const flick = window.setInterval(() => setFlicker(1 + Math.floor(Math.random() * 20)), 80);
    window.setTimeout(() => playDiceSound(next.value, mutedRef.current), SUSPENSE_MS - 380);
    window.setTimeout(() => {
      window.clearInterval(flick);
      setFlicker(null);
      setRolling(false);
      setHistory((h) => [next, ...h.filter((x) => x.id !== next.id)].slice(0, 8));
      window.setTimeout(playNext, 900);
    }, SUSPENSE_MS);
  }, []);

  const enqueue = useCallback(
    (roll: DiceRoll) => {
      if (seen.current.has(roll.id)) return;
      seen.current.add(roll.id);
      queue.current.push(roll);
      if (!busy.current) playNext();
    },
    [playNext],
  );

  useEffect(() => {
    void recentRolls().then((rows) => {
      rows.forEach((r) => seen.current.add(r.id));
      setHistory(rows);
    });
    const poll = window.setInterval(() => {
      void recentRolls().then((rows) => {
        for (const row of [...rows].reverse()) enqueue(row);
        setHistory((h) => {
          const merged = [...rows, ...h.filter((x) => !rows.some((r) => r.id === x.id))];
          return merged.slice(0, 8);
        });
      });
    }, 2500);
    return () => window.clearInterval(poll);
  }, [enqueue]);

  async function roll() {
    setRequesting(true);
    try {
      enqueue(await rollD20());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao rolar.");
    } finally {
      setRequesting(false);
    }
  }

  const verdict = current && !rolling ? verdictFor(current.value) : null;
  const mine = current?.userId === myUserId;

  return (
    <div className="mx-auto grid max-w-lg gap-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Dado de vinte faces</h2>
          <p className="text-sm text-muted">Toda a mesa vê cada lançamento, ao mesmo tempo.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={muted ? "Ativar som" : "Silenciar"}
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-elevated px-6 py-10 text-center shadow-border",
          verdict?.tier === "crit-fail" && "animate-shake-x",
        )}
      >
        <RuneRing spinning={rolling} />
        <p className="relative mb-4 text-xs tracking-[0.2em] text-muted uppercase">
          {current ? (rolling ? `${mine ? "Você" : current.rollerName} está rolando…` : mine ? "Seu lançamento" : current.rollerName) : "A mesa aguarda"}
        </p>
        <div className="relative mx-auto grid size-36 place-items-center sm:size-40">
          <D20Shape
            key={current?.id ?? "idle"}
            className={cn(
              "absolute inset-0",
              rolling ? "animate-d20-tumble text-primary" : verdict ? "text-ring" : "text-muted/40",
            )}
          />
          <span
            key={`${current?.id}-${rolling}`}
            className={cn(
              "relative grid size-16 place-items-center rounded-full font-display text-4xl tabular-nums sm:size-20 sm:text-5xl",
              rolling ? "text-fg/70 blur-[1px]" : verdict ? cn(TIER_CLASS[verdict.tier], "animate-number-pop") : "text-muted",
            )}
          >
            {rolling ? flicker ?? "?" : current ? current.value : "—"}
          </span>
        </div>
        {verdict ? (
          <div className="relative mt-6 grid gap-1">
            <p className="font-display text-xl">{verdict.title}</p>
            <p className="mx-auto max-w-sm text-sm text-muted">{verdict.flavor}</p>
          </div>
        ) : (
          <p className="relative mt-6 text-sm text-subtle">
            {rolling ? "O osso ainda gira…" : "Nenhum julgamento ainda."}
          </p>
        )}
      </div>

      <Button type="button" size="lg" onClick={roll} disabled={requesting || rolling}>
        {requesting || rolling ? "Girando…" : "Girar o D20"}
      </Button>

      {history.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Últimos lançamentos da mesa</p>
          <ol className="grid gap-2">
            {history.map((entry) => {
              const v = verdictFor(entry.value);
              return (
                <li key={entry.id} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 shadow-border">
                  <span className={cn("grid size-9 place-items-center rounded-md font-display tabular-nums", TIER_CLASS[v.tier])}>
                    {entry.value}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">{entry.userId === myUserId ? "Você" : entry.rollerName}</span>
                    <span className="text-muted"> · {v.title}</span>
                  </span>
                  <time className="text-xs text-subtle tabular-nums">
                    {new Date(entry.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

/** Toasts rolls from other players when the dice tab isn't open. */
export function useDiceToasts(myUserId: string | undefined, active: boolean) {
  const activeRef = useRef(active);
  activeRef.current = active;
  const seen = useRef(new Set<number>());
  useEffect(() => {
    if (!myUserId) return;
    void recentRolls().then((rows) => rows.forEach((r) => seen.current.add(r.id)));
    const poll = window.setInterval(() => {
      void recentRolls().then((rows) => {
        for (const r of [...rows].reverse()) {
          if (seen.current.has(r.id)) continue;
          seen.current.add(r.id);
          if (r.userId === myUserId || activeRef.current) continue;
          window.setTimeout(() => toast(`${r.rollerName} tirou ${r.value} — ${verdictFor(r.value).title}`), SUSPENSE_MS);
        }
      });
    }, 3000);
    return () => window.clearInterval(poll);
  }, [myUserId]);
}

function D20Shape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="currentColor" fillOpacity="0.08" />
        <polygon points="50,22 76,66 24,66" />
        <path d="M50 4 L50 22 M90 27 L76 66 M10 27 L24 66 M50 96 L24 66 M50 96 L76 66 M10 27 L50 22 L90 27 M10 73 L24 66 M90 73 L76 66" strokeOpacity="0.6" />
      </g>
    </svg>
  );
}

function RuneRing({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute inset-3 m-auto text-muted/25", spinning && "animate-rune-spin")}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 10" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}
