/**
 * Catálogo de tipografías que un tema puede usar. Cada opción es una familia
 * con su pila CSS y, si viene de Google Fonts, la consulta para cargarla bajo
 * demanda. La carga es perezosa: solo se inyecta el `<link>` de la fuente que
 * se elige, nunca todo el catálogo.
 */

export type FontId =
  | "inter"
  | "geist"
  | "manrope"
  | "dm-sans"
  | "plex-sans"
  | "space-grotesk"
  | "nunito-sans"
  | "fraunces"
  | "playfair"
  | "system";

/** Fuente de títulos: una del catálogo o la misma del cuerpo. */
export type HeadingFontId = FontId | "same";

export interface FontOption {
  id: FontId;
  name: string;
  description: string;
  /** Pila CSS completa. */
  family: string;
  category: "sans" | "serif" | "system";
  /** Parámetro `family=` de Google Fonts; ausente si es local o del sistema. */
  google?: string;
}

const SANS_FALLBACK = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif";

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    description: "Neutra y densa; la fuente base del sistema.",
    family: `'Inter', ${SANS_FALLBACK}`,
    category: "sans",
    google: "Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900",
  },
  {
    id: "geist",
    name: "Geist",
    description: "Geométrica y técnica, empaquetada localmente.",
    family: `'Geist Variable', ${SANS_FALLBACK}`,
    category: "sans",
  },
  {
    id: "manrope",
    name: "Manrope",
    description: "Redondeada y amable, buena para producto.",
    family: `'Manrope', ${SANS_FALLBACK}`,
    category: "sans",
    google: "Manrope:wght@300..800",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    description: "Geométrica de trazo bajo, muy legible en tablas.",
    family: `'DM Sans', ${SANS_FALLBACK}`,
    category: "sans",
    google: "DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000",
  },
  {
    id: "plex-sans",
    name: "IBM Plex Sans",
    description: "Carácter corporativo con un punto humanista.",
    family: `'IBM Plex Sans', ${SANS_FALLBACK}`,
    category: "sans",
    google: "IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    description: "Con personalidad; ideal para títulos.",
    family: `'Space Grotesk', ${SANS_FALLBACK}`,
    category: "sans",
    google: "Space+Grotesk:wght@300..700",
  },
  {
    id: "nunito-sans",
    name: "Nunito Sans",
    description: "Suave y cercana, para experiencias de personas.",
    family: `'Nunito Sans', ${SANS_FALLBACK}`,
    category: "sans",
    google: "Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000",
  },
  {
    id: "fraunces",
    name: "Fraunces",
    description: "Serif editorial con ópticos variables; solo para títulos.",
    family: `'Fraunces', ${SERIF_FALLBACK}`,
    category: "serif",
    google: "Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    description: "Serif de alto contraste, elegante en grandes tamaños.",
    family: `'Playfair Display', ${SERIF_FALLBACK}`,
    category: "serif",
    google: "Playfair+Display:ital,wght@0,400..900;1,400..900",
  },
  {
    id: "system",
    name: "Sistema",
    description: "La fuente nativa de cada plataforma; cero descarga.",
    family: SANS_FALLBACK,
    category: "system",
  },
];

export const DEFAULT_BODY_FONT: FontId = "inter";
export const DEFAULT_HEADING_FONT: HeadingFontId = "same";

export function findFont(id: string | null | undefined): FontOption {
  return FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];
}

export function isFontId(value: unknown): value is FontId {
  return typeof value === "string" && FONT_OPTIONS.some((font) => font.id === value);
}

export function resolveHeadingFont(heading: HeadingFontId, body: FontId): FontOption {
  return findFont(heading === "same" ? body : heading);
}

export function fontStylesheetUrl(font: FontOption): string | undefined {
  if (!font.google) return undefined;
  return `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
}

/**
 * Inyecta la hoja de estilos de una fuente de Google una sola vez. Inter ya
 * viene en index.html; Geist y Sistema no necesitan descarga.
 */
export function ensureFontLoaded(font: FontOption): void {
  if (typeof document === "undefined") return;
  const url = fontStylesheetUrl(font);
  if (!url) return;
  const id = `thema-font-${font.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}
