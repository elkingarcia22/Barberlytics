import type * as React from "react";
import type { Localized } from "@/i18n";

/**
 * Contrato del registro de documentación. Cada componente del sistema se
 * documenta con un `DocEntry`: qué es, cómo se importa, un playground con
 * controles para probar sus props, ejemplos con código y una tabla de props.
 *
 * Todo lo que es prosa —descripciones, títulos de ejemplo, guías— es
 * `Localized`: acepta la cadena de siempre (español) o un objeto por idioma.
 * Así una ficha se traduce cuando toca, sin migrar las 164 de golpe ni dejar
 * huecos mientras tanto.
 */

export type DocGroupId =
  | "ui"
  | "typography"
  | "forms"
  | "selection"
  | "navigation"
  | "overlays"
  | "feedback"
  | "feedback-loop"
  | "data-display"
  | "date"
  | "upload"
  | "charts"
  | "ai"
  | "action-rail"
  | "layout"
  | "media"
  | "utility"
  | "icons"
  | "atmosphere"
  | "blocks";

export interface DocGroup {
  id: DocGroupId;
  label: Localized;
  description: Localized;
}

export const DOC_GROUPS: readonly DocGroup[] = [
  {
    id: "ui",
    label: { es: "Primitivos", en: "Primitives" },
    description: { es: "Base shadcn/Radix afinada con los tokens Thema.", en: "shadcn/Radix base tuned with Thema tokens." },
  },
  {
    id: "typography",
    label: { es: "Tipografía", en: "Typography" },
    description: { es: "Heading y Text: la escala tipográfica como componentes, sin tamaños a mano.", en: "Heading and Text: the type scale as components, with no hand-set sizes." },
  },
  {
    id: "forms",
    label: { es: "Formularios", en: "Forms" },
    description: { es: "Campos, secciones y selects compuestos.", en: "Fields, sections and composed selects." },
  },
  {
    id: "selection",
    label: { es: "Selección", en: "Selection" },
    description: { es: "Tarjetas, tiles y controles segmentados para elegir.", en: "Cards, tiles and segmented controls for choosing." },
  },
  {
    id: "navigation",
    label: { es: "Navegación", en: "Navigation" },
    description: { es: "Tabs, sub-navegación, breadcrumbs y paginación.", en: "Tabs, sub-navigation, breadcrumbs and pagination." },
  },
  {
    id: "overlays",
    label: { es: "Overlays", en: "Overlays" },
    description: { es: "Drawers, modales y diálogos de confirmación.", en: "Drawers, modals and confirmation dialogs." },
  },
  {
    id: "feedback",
    label: { es: "Feedback", en: "Feedback" },
    description: { es: "Estados vacíos, avisos y toasts.", en: "Empty states, alerts and toasts." },
  },
  {
    id: "feedback-loop",
    label: { es: "Feedback de usuarios", en: "User feedback" },
    description: {
      es: "Pedir opinión masiva sobre algo recién lanzado: recorrido guiado, botón flotante y panel de comentarios.",
      en: "Collect feedback at scale on something just launched: guided tour, floating button and comment panel.",
    },
  },
  {
    id: "data-display",
    label: { es: "Datos", en: "Data" },
    description: { es: "Tablas configurables y badges de estado.", en: "Configurable tables and status badges." },
  },
  {
    id: "date",
    label: { es: "Fechas y rangos", en: "Dates and ranges" },
    description: { es: "Pickers de fecha, rango, mes, trimestre, periodo y slider de rango.", en: "Date, range, month, quarter and period pickers, plus a range slider." },
  },
  {
    id: "upload",
    label: { es: "Archivos", en: "Files" },
    description: { es: "Zonas de carga, previsualización y progreso.", en: "Upload zones, previews and progress." },
  },
  {
    id: "charts",
    label: { es: "Gráficos", en: "Charts" },
    description: { es: "ECharts con el tema Thema resuelto en tiempo real.", en: "ECharts with the Thema theme resolved in real time." },
  },
  {
    id: "ai",
    label: { es: "IA", en: "AI" },
    description: { es: "Botones, loaders, badges y paneles con la identidad de IA.", en: "Buttons, loaders, badges and panels with the AI identity." },
  },
  {
    id: "action-rail",
    label: { es: "Action rail", en: "Action rail" },
    description: { es: "La barra de acciones flotante y sus piezas.", en: "The floating action bar and its parts." },
  },
  {
    id: "layout",
    label: { es: "Layout y shell", en: "Layout and shell" },
    description: { es: "Sidebar, header, shell de administración y páginas.", en: "Sidebar, header, admin shell and pages." },
  },
  {
    id: "media",
    label: { es: "Media", en: "Media" },
    description: { es: "Carrusel, galerías y previsualizaciones.", en: "Carousel, galleries and previews." },
  },
  {
    id: "utility",
    label: { es: "Utilidades", en: "Utilities" },
    description: { es: "Encabezados de página y sección, tags.", en: "Page and section headers, tags." },
  },
  {
    id: "icons",
    label: { es: "Iconos", en: "Icons" },
    description: { es: "El registro semántico de iconos y su wrapper.", en: "The semantic icon registry and its wrapper." },
  },
  {
    id: "atmosphere",
    label: { es: "Atmósfera y marca", en: "Atmosphere and brand" },
    description: {
      es: "Fondos con material, la personalidad del oficio y la aparición al hacer scroll: cabello, poste, tijeras, grano, halo.",
      en: "Backdrops with material, the trade's personality and scroll reveals: hair, pole, scissors, grain, halo.",
    },
  },
  {
    id: "blocks",
    label: { es: "Bloques", en: "Blocks" },
    description: { es: "Composiciones completas listas para una pantalla: piezas del sistema ya cableadas entre sí.", en: "Complete compositions ready for a screen: system pieces already wired together." },
  },
];

export type ControlValue = string | number | boolean;

export type DocControl =
  | { type: "select"; label?: string; options: readonly string[]; default: string }
  | { type: "boolean"; label?: string; default: boolean }
  | { type: "text"; label?: string; default: string; placeholder?: string }
  | { type: "number"; label?: string; default: number; min?: number; max?: number; step?: number };

export type ControlValues<C extends Record<string, DocControl>> = {
  [K in keyof C]: C[K] extends { type: "boolean" }
    ? boolean
    : C[K] extends { type: "number" }
      ? number
      : string;
};

export interface DocPlayground<C extends Record<string, DocControl> = Record<string, DocControl>> {
  controls: C;
  render: (values: ControlValues<C>) => React.ReactNode;
  /** El snippet que corresponde a los valores actuales de los controles. */
  code: (values: ControlValues<C>) => string;
  /** Alineación del preview; `center` por defecto. */
  layout?: "center" | "stretch" | "start";
}

/** Fija la inferencia de tipos de los controles al definir un playground. */
export function definePlayground<C extends Record<string, DocControl>>(
  playground: DocPlayground<C>
): DocPlayground {
  return playground as unknown as DocPlayground;
}

export interface DocExample {
  id: string;
  title: string;
  description?: string;
  code: string;
  render: () => React.ReactNode;
  /** Alineación del preview; `center` por defecto. */
  layout?: "center" | "stretch" | "start";
  /** Clases extra para el marco del preview (p. ej. una altura mínima). */
  frameClassName?: string;
}

export interface DocProp {
  name: string;
  type: string;
  default?: string;
  description: Localized;
}

export interface DocEntry {
  /** Slug estable, usado en la URL: `#/components/<id>`. */
  id: string;
  name: string;
  group: DocGroupId;
  description: Localized;
  /** Sentencia de import completa, p. ej. `import { Button } from "@/components/ui/button"`. */
  importPath: string;
  /** Ruta del archivo fuente relativa al proyecto. */
  sourcePath?: string;
  status?: "stable" | "beta" | "legacy";
  tags?: string[];
  playground?: DocPlayground;
  examples: DocExample[];
  props?: DocProp[];
  guidelines?: { do?: string[]; dont?: string[] };
  /** Ids de otras entradas relacionadas. */
  related?: string[];
}

export function defineEntry(entry: DocEntry): DocEntry {
  return entry;
}
