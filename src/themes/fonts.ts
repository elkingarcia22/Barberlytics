/**
 * Catálogo de tipografías que un tema puede usar.
 *
 * Es una lista corta a propósito: cada familia ocupa un papel distinto y no
 * hay dos que resuelvan lo mismo. Todas están entre las mejor valoradas para
 * interfaz hoy —alto x-height, aperturas abiertas, formas desambiguadas y
 * ejes variables— y todas son gratuitas y de licencia abierta.
 *
 * La carga es perezosa: solo se inyecta la hoja de estilos de la fuente que
 * se elige, nunca todo el catálogo.
 */

export type FontId =
  | "inter"
  | "geist"
  | "plus-jakarta"
  | "satoshi"
  | "dm-sans"
  | "plex-sans"
  | "space-grotesk"
  | "fraunces"
  | "system";

/** Fuente de títulos: una del catálogo o la misma del cuerpo. */
export type HeadingFontId = FontId | "same";

/** De dónde sale la fuente; determina qué orígenes debe permitir la CSP. */
export type FontSource = "google" | "fontshare" | "local" | "system";

export interface FontOption {
  id: FontId;
  name: string;
  description: string;
  /** Pila CSS completa. */
  family: string;
  category: "sans" | "serif" | "system";
  source: FontSource;
  /** Hoja de estilos a inyectar; ausente si es local o del sistema. */
  stylesheet?: string;
}

const SANS_FALLBACK = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif";

const google = (family: string) => `https://fonts.googleapis.com/css2?family=${family}&display=swap`;

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    description: "El referente de interfaz: neutra, densa y legible a 12px. La opción segura.",
    family: `'Inter', ${SANS_FALLBACK}`,
    category: "sans",
    source: "google",
    stylesheet: google("Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900"),
  },
  {
    id: "geist",
    name: "Geist",
    description: "Mecánica y compacta. Hecha para paneles densos y herramientas técnicas.",
    family: `'Geist Variable', ${SANS_FALLBACK}`,
    category: "sans",
    source: "local",
  },
  {
    id: "plus-jakarta",
    name: "Plus Jakarta Sans",
    description: "Profesional pero cálida. Cansa menos en pantallas que se miran horas.",
    family: `'Plus Jakarta Sans', ${SANS_FALLBACK}`,
    category: "sans",
    source: "google",
    stylesheet: google("Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800"),
  },
  {
    id: "satoshi",
    name: "Satoshi",
    description: "Grotesca con esqueleto geométrico: carácter propio sin perder neutralidad.",
    family: `'Satoshi', ${SANS_FALLBACK}`,
    category: "sans",
    source: "fontshare",
    stylesheet: "https://api.fontshare.com/v2/css?f%5B%5D=satoshi@300,400,500,700,900&display=swap",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    description: "Geométrica de bajo contraste, pensada para tamaños pequeños y tablas.",
    family: `'DM Sans', ${SANS_FALLBACK}`,
    category: "sans",
    source: "google",
    stylesheet: google("DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000"),
  },
  {
    id: "plex-sans",
    name: "IBM Plex Sans",
    description: "Humanista con aire corporativo y cobertura multilingüe amplia.",
    family: `'IBM Plex Sans', ${SANS_FALLBACK}`,
    category: "sans",
    source: "google",
    stylesheet: google("IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400"),
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    description: "La más marcada del catálogo. Para titulares y producto con tono técnico.",
    family: `'Space Grotesk', ${SANS_FALLBACK}`,
    category: "sans",
    source: "google",
    stylesheet: google("Space+Grotesk:wght@300..700"),
  },
  {
    id: "fraunces",
    name: "Fraunces",
    description: "La serif variable de referencia, con ejes ópticos. Solo para títulos.",
    family: `'Fraunces', ${SERIF_FALLBACK}`,
    category: "serif",
    source: "google",
    stylesheet: google("Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900"),
  },
  {
    id: "system",
    name: "Sistema",
    description: "La fuente nativa de cada plataforma; cero descarga y cero desplazamiento.",
    family: SANS_FALLBACK,
    category: "system",
    source: "system",
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
  return font.stylesheet;
}

/**
 * Inyecta la hoja de estilos de una fuente una sola vez. Geist viene en el
 * paquete (`@fontsource-variable/geist`) y Sistema no descarga nada, así que
 * ninguna de las dos pasa por aquí.
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
