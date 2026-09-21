/**
 * Catálogo de temas. Cada tema es, como en shadcn, un color primario por modo
 * y una decisión sobre cómo teñir los neutros. Todo lo demás —hover, pressed,
 * fondo de app, pista de pestañas, superficies del modo oscuro— se deriva en
 * `buildThemeTokens`, así que añadir un tema nuevo es añadir una entrada aquí.
 *
 * Los estados semánticos (positivo, negativo, warning, info, IA) no cambian
 * con el tema: son significado, no decoración.
 */

import type { FontId, HeadingFontId } from "./fonts";

export type NeutralTint = "tinted" | "gray";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: { light: string; dark: string };
  /**
   * `tinted` tiñe fondos y superficies con el matiz del primario (como el
   * azul Thema original, cuyo fondo de app es un blanco azulado). `gray`
   * mantiene los neutros neutros: útil para temas oscuros o monocromos.
   */
  neutral: NeutralTint;
  /** Matiz alternativo para los neutros; por defecto el del primario. */
  neutralHue?: number;
  /**
   * Saturación de los neutros en modo oscuro (0–100). El navy Thema original
   * es muy saturado (45%) y funciona porque es azul; para el resto de matices
   * el valor por defecto (24%) evita que toda la pantalla se vuelva verde o
   * morada.
   */
  darkNeutralSaturation?: number;
  /**
   * Gradiente de IA. Por defecto arranca en el primario y termina 120° más
   * allá en el círculo cromático; aquí se puede fijar otro par de colores.
   */
  ai?: { start: string; end: string };
  /** Tipografías sugeridas por el tema; el selector permite cambiarlas. */
  fonts?: { body?: FontId; heading?: HeadingFontId };
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "thema",
    name: "Azul",
    description: "Azul clásico sobre neutros fríos; el punto de partida.",
    primary: { light: "#0C5BEF", dark: "#3865F5" },
    neutral: "tinted",
    neutralHue: 222,
    darkNeutralSaturation: 45,
    ai: { start: "#2d5cf7", end: "#e11d48" },
  },
  {
    id: "indigo",
    name: "Índigo",
    description: "Más profundo y editorial, para paneles densos.",
    primary: { light: "#4F46E5", dark: "#818CF8" },
    neutral: "tinted",
  },
  {
    id: "violet",
    name: "Violeta",
    description: "Creativo, cercano a la familia de IA.",
    primary: { light: "#7C3AED", dark: "#A78BFA" },
    neutral: "tinted",
    fonts: { body: "satoshi", heading: "space-grotesk" },
  },
  {
    id: "emerald",
    name: "Esmeralda",
    description: "Crecimiento, bienestar, resultados positivos.",
    primary: { light: "#059669", dark: "#34D399" },
    neutral: "tinted",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Sereno y técnico, a medio camino entre azul y verde.",
    primary: { light: "#0D9488", dark: "#2DD4BF" },
    neutral: "tinted",
  },
  {
    id: "cyan",
    name: "Cian",
    description: "Luminoso, para tableros con mucha visualización.",
    primary: { light: "#0891B2", dark: "#22D3EE" },
    neutral: "tinted",
  },
  {
    id: "orange",
    name: "Naranja",
    description: "Energético; funciona bien en productos de aprendizaje.",
    primary: { light: "#EA580C", dark: "#FB923C" },
    neutral: "gray",
  },
  {
    id: "rose",
    name: "Rosa",
    description: "Cálido y humano, para experiencias de personas.",
    primary: { light: "#E11D48", dark: "#FB7185" },
    neutral: "gray",
    fonts: { body: "plus-jakarta" },
  },
  {
    id: "amber",
    name: "Ámbar",
    description: "Dorado sobrio, de lectura cómoda en oscuro.",
    primary: { light: "#D97706", dark: "#FBBF24" },
    neutral: "gray",
  },
  {
    id: "graphite",
    name: "Grafito",
    description: "Monocromo: primario casi negro y neutros puros.",
    primary: { light: "#1F2937", dark: "#E5E7EB" },
    neutral: "gray",
    neutralHue: 220,
    fonts: { body: "geist", heading: "fraunces" },
  },
];

export const DEFAULT_THEME_ID = "thema";

export function findPreset(id: string | null | undefined): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0];
}
