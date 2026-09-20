import type * as React from "react";

/**
 * Contrato del registro de documentación. Cada componente del sistema se
 * documenta con un `DocEntry`: qué es, cómo se importa, un playground con
 * controles para probar sus props, ejemplos con código y una tabla de props.
 */

export type DocGroupId =
  | "ui"
  | "forms"
  | "selection"
  | "navigation"
  | "overlays"
  | "feedback"
  | "data-display"
  | "date"
  | "upload"
  | "charts"
  | "ai"
  | "action-rail"
  | "layout"
  | "media"
  | "utility"
  | "icons";

export interface DocGroup {
  id: DocGroupId;
  label: string;
  description: string;
}

export const DOC_GROUPS: readonly DocGroup[] = [
  { id: "ui", label: "Primitivos", description: "Base shadcn/Radix afinada con los tokens UBITS." },
  { id: "forms", label: "Formularios", description: "Campos, secciones y selects compuestos." },
  { id: "selection", label: "Selección", description: "Tarjetas, tiles y controles segmentados para elegir." },
  { id: "navigation", label: "Navegación", description: "Tabs, sub-navegación, breadcrumbs y paginación." },
  { id: "overlays", label: "Overlays", description: "Drawers, modales y diálogos de confirmación." },
  { id: "feedback", label: "Feedback", description: "Estados vacíos, avisos y toasts." },
  { id: "data-display", label: "Datos", description: "Tablas configurables y badges de estado." },
  { id: "date", label: "Fechas y rangos", description: "Pickers de fecha, rango, mes, trimestre, periodo y slider de rango." },
  { id: "upload", label: "Archivos", description: "Zonas de carga, previsualización y progreso." },
  { id: "charts", label: "Gráficos", description: "ECharts con el tema UBITS resuelto en tiempo real." },
  { id: "ai", label: "IA", description: "Botones, loaders, badges y paneles con la identidad de IA." },
  { id: "action-rail", label: "Action rail", description: "La barra de acciones flotante y sus piezas." },
  { id: "layout", label: "Layout y shell", description: "Sidebar, header, shell de administración y páginas." },
  { id: "media", label: "Media", description: "Carrusel, galerías y previsualizaciones." },
  { id: "utility", label: "Utilidades", description: "Encabezados de página y sección, tags." },
  { id: "icons", label: "Iconos", description: "El registro semántico de iconos y su wrapper." },
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
  description: string;
}

export interface DocEntry {
  /** Slug estable, usado en la URL: `#/components/<id>`. */
  id: string;
  name: string;
  group: DocGroupId;
  description: string;
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
