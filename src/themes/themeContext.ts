import * as React from "react";
import type { RadiusScale, ResolvedMode, ThemeMode, ThemeTokens } from "./buildTokens";
import type { FontId, FontOption, HeadingFontId } from "./fonts";
import type { ThemePreset } from "./presets";

export const THEME_STORAGE_KEY = "thema-theme";

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
  /** Fuente del cuerpo y de los títulos ("same" = la misma del cuerpo). */
  font: FontId;
  setFont: (font: FontId) => void;
  headingFont: HeadingFontId;
  setHeadingFont: (font: HeadingFontId) => void;
  fonts: readonly FontOption[];
  /** Los tokens activos en este momento (color, radio y tipografía). */
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
