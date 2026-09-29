import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeId = "sombria" | "medieval" | "arcano" | "infernal" | "gelido" | "dourado";
export type AmbientId = "none" | "embers" | "mist";

export const THEMES: { id: ThemeId; label: string; hint: string; swatch: [string, string, string] }[] = [
  { id: "sombria", label: "Sombria", hint: "Carvão e sangue seco", swatch: ["#0c0a09", "#9a3b32", "#efe6d6"] },
  { id: "medieval", label: "Medieval", hint: "Pergaminho e madeira", swatch: ["#100d09", "#8a6a35", "#ecdfc4"] },
  { id: "arcano", label: "Arcano", hint: "Runas e éter violeta", swatch: ["#0a0912", "#7a5cc4", "#e4ddf7"] },
  { id: "infernal", label: "Infernal", hint: "Brasa e enxofre", swatch: ["#0f0806", "#c2440f", "#f6dcc6"] },
  { id: "gelido", label: "Gélido", hint: "Névoa e gelo antigo", swatch: ["#070b0f", "#3f7fa6", "#dceaf3"] },
  { id: "dourado", label: "Dourado", hint: "Salão real iluminado", swatch: ["#0d0b07", "#c9962f", "#f5ead0"] },
];

export const AMBIENTS: { id: AmbientId; label: string; hint: string }[] = [
  { id: "none", label: "Nenhum", hint: "Sem efeito de fundo" },
  { id: "embers", label: "Brasas", hint: "Fagulhas subindo devagar" },
  { id: "mist", label: "Névoa", hint: "Bruma lenta e baixa" },
];

const THEME_KEY = "ma.theme";
const AMBIENT_KEY = "ma.ambient";
const DEFAULT_THEME: ThemeId = "sombria";
const DEFAULT_AMBIENT: AmbientId = "none";

type AppearanceValue = {
  theme: ThemeId;
  ambient: AmbientId;
  setTheme: (id: ThemeId) => void;
  setAmbient: (id: AmbientId) => void;
};

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as { __maAppearanceCtx?: ReturnType<typeof createContext<AppearanceValue | null>> };
const AppearanceContext = (g.__maAppearanceCtx ??= createContext<AppearanceValue | null>(null));

function isTheme(v: string | null): v is ThemeId {
  return !!v && THEMES.some((t) => t.id === v);
}
function isAmbient(v: string | null): v is AmbientId {
  return !!v && AMBIENTS.some((a) => a.id === v);
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [ambient, setAmbientState] = useState<AmbientId>(DEFAULT_AMBIENT);

  // Read stored preferences after hydration so SSR markup stays stable.
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const storedAmbient = window.localStorage.getItem(AMBIENT_KEY);
    if (isTheme(storedTheme)) setThemeState(storedTheme);
    if (isAmbient(storedAmbient)) setAmbientState(storedAmbient);
  }, []);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    window.localStorage.setItem(THEME_KEY, id);
  }, []);

  const setAmbient = useCallback((id: AmbientId) => {
    setAmbientState(id);
    window.localStorage.setItem(AMBIENT_KEY, id);
  }, []);

  const value = useMemo(
    () => ({ theme, ambient, setTheme, setAmbient }),
    [theme, ambient, setTheme, setAmbient],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance precisa estar dentro de AppearanceProvider");
  return ctx;
}
