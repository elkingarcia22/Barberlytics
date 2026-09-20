import * as React from "react";
import { buildRadiusTokens, buildThemeTokens, type RadiusScale, type ResolvedMode, type ThemeMode, type ThemeTokens } from "./buildTokens";
import { DEFAULT_THEME_ID, findPreset, THEME_PRESETS } from "./presets";
import { ThemeContext, THEME_STORAGE_KEY, type ThemeContextValue } from "./themeContext";

interface StoredTheme {
  preset: string;
  mode: ThemeMode;
  radius: RadiusScale;
}

const DEFAULT_STORED: StoredTheme = { preset: DEFAULT_THEME_ID, mode: "light", radius: "md" };

function readStored(): StoredTheme {
  if (typeof window === "undefined") return DEFAULT_STORED;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_STORED;
    const parsed = JSON.parse(raw) as Partial<StoredTheme>;
    return {
      preset: findPreset(parsed.preset).id,
      mode: parsed.mode === "dark" || parsed.mode === "system" ? parsed.mode : "light",
      radius: parsed.radius === "none" || parsed.radius === "sm" || parsed.radius === "lg" ? parsed.radius : "md",
    };
  } catch {
    return DEFAULT_STORED;
  }
}

function writeStored(value: StoredTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* almacenamiento bloqueado (modo privado): el tema vive solo en memoria */
  }
}

function useSystemPrefersDark(): boolean {
  const query = "(prefers-color-scheme: dark)";
  const subscribe = React.useCallback((onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * Aplica el tema al `<html>`: la clase `.dark`, `data-theme` con el id del
 * preset y todas las variables derivadas como estilos inline, que ganan a
 * cualquier regla de tokens.css / globals.css.
 */
function applyToDocument(tokens: ThemeTokens, resolvedMode: ResolvedMode, presetId: string, previous: string[]) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedMode === "dark");
  root.dataset.theme = presetId;
  root.style.colorScheme = resolvedMode;
  for (const name of previous) {
    if (!(name in tokens)) root.style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(name, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = React.useState<StoredTheme>(readStored);
  const prefersDark = useSystemPrefersDark();

  const preset = findPreset(stored.preset);
  const resolvedMode: ResolvedMode =
    stored.mode === "system" ? (prefersDark ? "dark" : "light") : stored.mode;

  const tokens = React.useMemo<ThemeTokens>(
    () => ({ ...buildThemeTokens(preset, resolvedMode), ...buildRadiusTokens(stored.radius) }),
    [preset, resolvedMode, stored.radius]
  );

  const appliedRef = React.useRef<string[]>([]);
  React.useLayoutEffect(() => {
    applyToDocument(tokens, resolvedMode, preset.id, appliedRef.current);
    appliedRef.current = Object.keys(tokens);
  }, [tokens, resolvedMode, preset.id]);

  React.useEffect(() => {
    writeStored(stored);
  }, [stored]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      preset,
      presets: THEME_PRESETS,
      setPreset: (id) => setStored((prev) => ({ ...prev, preset: findPreset(id).id })),
      mode: stored.mode,
      setMode: (mode) => setStored((prev) => ({ ...prev, mode })),
      resolvedMode,
      radius: stored.radius,
      setRadius: (radius) => setStored((prev) => ({ ...prev, radius })),
      tokens,
    }),
    [preset, stored.mode, stored.radius, resolvedMode, tokens]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
