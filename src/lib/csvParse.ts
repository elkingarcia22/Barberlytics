/**
 * Leer un CSV tal como lo exporta otro software o Excel: separador por coma, punto y coma o
 * tabulador (el que más aparezca en la primera línea), comillas dobles con comillas escapadas y
 * saltos de línea dentro de una celda. Quita la marca de orden de bytes y las filas vacías.
 */

const SEPARATORS = [",", ";", "\t"] as const;

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return [...SEPARATORS].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const separator = detectSeparator(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"' && cell === "") quoted = true;
    else if (char === separator) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((item) => item.map((value) => value.trim())).filter((item) => item.some((value) => value !== ""));
}
