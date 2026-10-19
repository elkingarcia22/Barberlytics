import { parseCsv } from "@/lib/csvParse";
import type { MemberImportRow } from "./api";

/**
 * «Cargar miembros»: una lista pegada o un CSV con nombre, apellido, celular, correo y rol (con o sin
 * encabezado, separada por comas, punto y coma o tabulaciones). Se lee aquí para enseñar la vista previa;
 * el servidor vuelve a validar cada fila.
 */

export const MAX_IMPORT_ROWS = 100;

const plain = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

type Column = "firstName" | "lastName" | "phone" | "email" | "role";
const HEADERS: Readonly<Record<Column, readonly string[]>> = {
  firstName: ["nombre", "nombres", "first name", "firstname", "name"],
  lastName: ["apellido", "apellidos", "last name", "lastname", "surname"],
  phone: ["celular", "telefono", "movil", "phone", "mobile", "cell"],
  email: ["correo", "email", "e-mail", "mail", "correo electronico"],
  role: ["rol", "role", "cargo", "puesto"],
};
const ORDER: readonly Column[] = ["firstName", "lastName", "phone", "email", "role"];

/** El rol escrito a mano → el del sistema; `null` si no se entiende. */
export function roleFrom(value: string): MemberImportRow["role"] | null {
  const text = plain(value);
  if (!text) return null;
  if (/\b(recep\w*|front desk)\b/.test(text)) return "recepcion";
  if (/\b(renta|alquil\w*|rent|renter|booth|chair)\b/.test(text)) return "barbero-renta";
  if (/\b(barber\w*|comision|commission)\b/.test(text)) return "barbero-comision";
  return null;
}

export interface ParsedImport {
  rows: MemberImportRow[];
  /** Filas que no se pueden mandar (en la numeración de la lista, sin contar el encabezado). */
  problems: { row: number; reason: "role" | "missing" }[];
  /** Pasó del tope: se toman las primeras. */
  truncated: boolean;
}

/** Lee la lista. La primera fila es encabezado si nombra alguna columna conocida. */
export function parseMemberList(text: string): ParsedImport {
  const table = parseCsv(text).filter((cells) => cells.some((cell) => cell.trim() !== ""));
  if (table.length === 0) return { rows: [], problems: [], truncated: false };
  const header = table[0].map(plain);
  const mapped = ORDER.map((column) => header.findIndex((cell) => HEADERS[column].includes(cell)));
  const hasHeader = mapped.some((index) => index >= 0);
  const indexOf = (column: Column, position: number) => (hasHeader ? mapped[ORDER.indexOf(column)] : position);
  const body = (hasHeader ? table.slice(1) : table).slice(0, MAX_IMPORT_ROWS);
  const rows: MemberImportRow[] = [];
  const problems: ParsedImport["problems"] = [];
  body.forEach((cells, index) => {
    const cell = (column: Column) => {
      const at = indexOf(column, ORDER.indexOf(column));
      return at >= 0 ? (cells[at] ?? "").trim() : "";
    };
    const role = roleFrom(cell("role"));
    if (!cell("firstName") || !cell("phone") || !cell("email")) problems.push({ row: index + 1, reason: "missing" });
    else if (!role) problems.push({ row: index + 1, reason: "role" });
    else rows.push({ firstName: cell("firstName"), lastName: cell("lastName"), phone: cell("phone"), email: cell("email"), role });
  });
  return { rows, problems, truncated: (hasHeader ? table.length - 1 : table.length) > MAX_IMPORT_ROWS };
}
