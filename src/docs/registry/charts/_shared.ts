/**
 * Datos y helpers que comparten las entradas de los presets de gráficos.
 * Etiquetas realistas en español para que los ejemplos parezcan un dashboard
 * de UBITS y no un placeholder.
 */

export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const;
export const AREAS = ["Tecnología", "Ventas", "Operaciones", "Talento", "Finanzas", "Marketing"] as const;
export const EQUIPOS = ["Producto", "Diseño", "Backend", "Datos", "Soporte"] as const;
export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export interface LabeledDatum {
  label: string;
  value: number;
}

/** Combina etiquetas y valores en el formato `{ label, value }` de los presets. */
export function toSeries(labels: readonly string[], values: readonly number[]): LabeledDatum[] {
  return labels.map((label, index) => ({ label, value: values[index] ?? 0 }));
}

/** Snippet `const nombre = [...]` para mostrar los datos en el código de un ejemplo. */
export function dataSnippet(name: string, data: readonly LabeledDatum[]): string {
  const rows = data.map((item) => `  { label: "${item.label}", value: ${item.value} },`).join("\n");
  return `const ${name} = [\n${rows}\n];`;
}

/** Los cuatro estados de un preset montado sobre ChartCard. */
export const PRESET_STATES = ["datos", "cargando", "vacío", "error"] as const;

/** Traduce el select de estado del playground a las props loading/empty/error. */
export function presetStateProps(state: string, errorMessage: string) {
  return {
    loading: state === "cargando",
    empty: state === "vacío",
    error: state === "error" ? errorMessage : null,
  };
}

/** Los atributos JSX equivalentes a `presetStateProps`, ya indentados para el snippet. */
export function presetStateAttrs(state: string, errorMessage: string): string {
  if (state === "cargando") return "\n  loading";
  if (state === "vacío") return "\n  empty";
  if (state === "error") return `\n  error="${errorMessage}"`;
  return "";
}
