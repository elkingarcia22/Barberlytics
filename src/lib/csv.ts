/**
 * Exportar a CSV: lo que el dueño baja para su contador o su hoja de cálculo. Los números van sin
 * formato para que la hoja los sume; la marca de orden de bytes hace que Excel abra bien las tildes.
 */

/** Una celda CSV: entre comillas si lleva separador, comillas o salto de línea. */
const csvCell = (value: string | number): string => {
  const text = String(value);
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
