import * as React from "react";
import type { RadiusScale, ResolvedMode, ThemeMode, ThemeTokens } from "./buildTokens";
import type { ThemePreset } from "./presets";

export const THEME_STORAGE_KEY = "ubits-theme";

export interface ThemeContextValue {
  preset: ThemePreset;
  presets: readonly ThemePreset[];
  setPreset: (id: string) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** El modo realmente aplicado, con `system` ya resuelto. */
  resolvedMode: ResolvedMode;
  radius: RadiusScale;
  setRadius: (radius: RadiusScale) => void;
  /** Los tokens de color activos en este momento. */
  tokens: ThemeTokens;
}

export const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  }
  return context;
}
