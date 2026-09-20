import type { MediaItem } from "@/components/media";

/**
 * Imágenes de mentira para el grupo "media": SVG inline como data URI, con un
 * degradado y una etiqueta. Sin assets ni URLs externas.
 */

const PALETTE: Record<string, [string, string]> = {
  azul: ["#2563eb", "#7c3aed"],
  verde: ["#059669", "#0ea5e9"],
  naranja: ["#ea580c", "#f59e0b"],
  rosa: ["#db2777", "#f97316"],
  gris: ["#475569", "#94a3b8"],
  violeta: ["#6d28d9", "#db2777"],
};

export type PlaceholderTone = keyof typeof PALETTE;

export function placeholder(label: string, tone: PlaceholderTone = "azul", width = 640, height = 360): string {
  const [from, to] = PALETTE[tone];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${width * 0.82}" cy="${height * 0.25}" r="${height * 0.28}" fill="#ffffff" fill-opacity="0.12"/>
  <text x="${width / 2}" y="${height / 2}" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(height * 0.11)}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDER_SNIPPET = `// Placeholder SVG inline; en producción \`src\` es la URL real
const placeholder = (label: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="#2563eb"/>
    <text x="320" y="180" fill="#fff" font-size="40" text-anchor="middle">\${label}</text>
  </svg>\`);`;

export const COURSE_ITEMS: MediaItem[] = [
  { id: "liderazgo", title: "Liderazgo situacional", description: "Adapta tu estilo a la madurez de cada colaborador.", src: placeholder("Liderazgo", "azul"), kind: "video", badge: "Nuevo", metadata: "12 lecciones" },
  { id: "datos", title: "Análisis de datos con Excel", description: "Tablas dinámicas, funciones y visualización.", src: placeholder("Excel", "verde"), kind: "video", metadata: "8 lecciones" },
  { id: "feedback", title: "Feedback efectivo", description: "Conversaciones difíciles con método.", src: placeholder("Feedback", "naranja"), kind: "document", metadata: "PDF · 2.1 MB" },
  { id: "ventas", title: "Ventas consultivas", description: "Descubre necesidades antes de proponer.", src: placeholder("Ventas", "rosa"), kind: "video", badge: "Popular", metadata: "15 lecciones" },
  { id: "seguridad", title: "Seguridad de la información", description: "Buenas prácticas para todo el equipo.", src: placeholder("Seguridad", "gris"), kind: "document", metadata: "PDF · 860 KB" },
  { id: "bienestar", title: "Bienestar y manejo del estrés", description: "Rutinas cortas para el día a día.", src: placeholder("Bienestar", "violeta"), kind: "image", metadata: "Infografía" },
];

/** Ítems para bento: dos destacados con span y el resto simples. */
export const BENTO_ITEMS: MediaItem[] = [
  { ...COURSE_ITEMS[0], src: placeholder("Liderazgo", "azul", 960, 720), colSpan: 2, rowSpan: 2 },
  COURSE_ITEMS[1],
  COURSE_ITEMS[2],
  { ...COURSE_ITEMS[3], src: placeholder("Ventas", "rosa", 960, 360), colSpan: 2 },
  COURSE_ITEMS[4],
  COURSE_ITEMS[5],
];

/** Ítems sin `src`: muestran el icono según `kind`. */
export const ICON_ITEMS: MediaItem[] = [
  { id: "img", title: "Imagen sin miniatura", kind: "image", metadata: "PNG" },
  { id: "vid", title: "Video sin miniatura", kind: "video", metadata: "MP4" },
  { id: "doc", title: "Documento", kind: "document", metadata: "PDF" },
  { id: "oth", title: "Otro recurso", kind: "other", metadata: "ZIP" },
];
