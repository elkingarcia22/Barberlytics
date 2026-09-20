import * as React from "react";
import { buildFontTokens, buildRadiusTokens, buildThemeTokens, type RadiusScale, type ResolvedMode, type ThemeMode, type ThemeTokens } from "./buildTokens";
import { DEFAULT_THEME_ID, findPreset, THEME_PRESETS } from "./presets";
import { DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT, ensureFontLoaded, findFont, FONT_OPTIONS, isFontId, resolveHeadingFont, type FontId, type HeadingFontId } from "./fonts";
import { ThemeContext, THEME_STORAGE_KEY, type ThemeContextValue } from "./themeContext";

interface StoredTheme {
  preset: string;
  mode: ThemeMode;
  radius: RadiusScale;
  /** Ausente = usar la sugerencia del preset (o Inter). */
  font?: FontId;
  headingFont?: HeadingFontId;
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
      font: isFontId(parsed.font) ? parsed.font : undefined,
      headingFont: parsed.headingFont === "same" || isFontId(parsed.headingFont) ? parsed.headingFont : undefined,
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

  // La tipografía guardada gana; si no hay, la sugerencia del preset; si no, Inter.
  const font: FontId = stored.font ?? preset.fonts?.body ?? DEFAULT_BODY_FONT;
  const headingFont: HeadingFontId = stored.headingFont ?? preset.fonts?.heading ?? DEFAULT_HEADING_FONT;

  const tokens = React.useMemo<ThemeTokens>(
    () => ({
      ...buildThemeTokens(preset, resolvedMode),
      ...buildRadiusTokens(stored.radius),
      ...buildFontTokens({ body: font, heading: headingFont }),
    }),
    [preset, resolvedMode, stored.radius, font, headingFont]
  );

  React.useEffect(() => {
    ensureFontLoaded(findFont(font));
    ensureFontLoaded(resolveHeadingFont(headingFont, font));
  }, [font, headingFont]);

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
      font,
      setFont: (next) => setStored((prev) => ({ ...prev, font: next })),
      headingFont,
      setHeadingFont: (next) => setStored((prev) => ({ ...prev, headingFont: next })),
      fonts: FONT_OPTIONS,
      tokens,
    }),
    [preset, stored.mode, stored.radius, resolvedMode, tokens, font, headingFont]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
