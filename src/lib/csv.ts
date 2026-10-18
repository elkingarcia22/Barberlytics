/**
 * Exportar a CSV: lo que el dueño baja para su contador o su hoja de cálculo. Los números van sin
 * formato para que la hoja los sume; la marca de orden de bytes hace que Excel abra bien las tildes.
 */

/**
 * Un texto que empieza por `=`, `+`, `-`, `@`, tabulador o retorno lo abre Excel como fórmula: un nombre
 * escrito en la reserva pública podría ejecutar algo en el computador del contador. Se le antepone un
 * apóstrofo para que quede como texto. Los números van tal cual (un -12 es un número, no una fórmula).
 */
const FORMULA_START = /^[=+\-@\t\r]/;
const neutralize = (value: string | number): string => (typeof value === "number" ? String(value) : FORMULA_START.test(value) ? `'${value}` : value);

/** Una celda CSV: sin fórmulas, y entre comillas si lleva separador, comillas o salto de línea. */
const csvCell = (value: string | number): string => {
  const text = neutralize(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Filas a CSV, con la cabecera primero. */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

/* Marca de orden de bytes: sin ella Excel abre el CSV con las tildes rotas. */
const BOM = String.fromCharCode(0xfeff);

/** Descarga el CSV con ese nombre de archivo. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([`${BOM}${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
