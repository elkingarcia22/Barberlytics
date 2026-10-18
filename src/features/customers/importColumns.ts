/**
 * Qué columna del archivo es cada dato: se adivina por el nombre de la cabecera (en español o
 * inglés, con o sin tildes) y quien importa lo puede corregir. Nombre y apellido en columnas
 * separadas se juntan.
 */

export const IMPORT_FIELDS = ["name", "firstName", "lastName", "phone", "email", "birthDate", "note"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type ColumnMap = Partial<Record<ImportField, number>>;

const SYNONYMS: Readonly<Record<ImportField, readonly string[]>> = {
  name: ["nombre completo", "nombre", "cliente", "full name", "name", "customer"],
  firstName: ["nombres", "primer nombre", "first name", "firstname"],
  lastName: ["apellido", "apellidos", "last name", "lastname", "surname"],
  phone: ["celular", "telefono", "teléfono", "movil", "móvil", "whatsapp", "phone", "mobile", "cell"],
  email: ["correo", "correo electronico", "email", "e-mail", "mail"],
  birthDate: ["cumpleaños", "cumpleanos", "fecha de nacimiento", "nacimiento", "birthday", "birth date", "birthdate", "dob"],
  note: ["notas", "nota", "observaciones", "comentarios", "notes", "note"],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_\-.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** La primera cabecera que coincide con cada dato; una columna no se asigna dos veces. */
export function guessColumns(header: readonly string[]): ColumnMap {
  const taken = new Set<number>();
  const map: ColumnMap = {};
  const cells = header.map(normalize);
  for (const field of ["firstName", "lastName", "phone", "email", "birthDate", "note", "name"] as const) {
    const index = cells.findIndex((cell, position) => !taken.has(position) && SYNONYMS[field].some((synonym) => cell === normalize(synonym)));
    if (index >= 0) {
      map[field] = index;
      taken.add(index);
    }
  }
  // Con nombre completo no hacen falta nombre y apellido sueltos.
  if (map.name !== undefined) {
    delete map.firstName;
    delete map.lastName;
  }
  return map;
}

/** «15/03/1990», «1990-03-15» o «03/15/1990» (si el mes no cabe como día) → AAAA-MM-DD; vacío si no se entiende. */
export function toIsoDate(value: string): string {
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!match) return "";
  let [, a, b] = match;
  const year = match[3];
  if (Number(b) > 12 && Number(a) <= 12) [a, b] = [b, a];
  const day = a.padStart(2, "0");
  const month = b.padStart(2, "0");
  return Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31 ? `${year}-${month}-${day}` : "";
}

export interface ImportRow {
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  note: string;
}

/** Las filas del archivo (sin la cabecera) con los datos que pide el backend. */
export function rowsFrom(body: readonly (readonly string[])[], map: ColumnMap): ImportRow[] {
  const at = (row: readonly string[], field: ImportField) => (map[field] === undefined ? "" : (row[map[field] as number] ?? "").trim());
  return body.map((row) => ({
    name: at(row, "name") || `${at(row, "firstName")} ${at(row, "lastName")}`.trim(),
    phone: at(row, "phone"),
    email: at(row, "email"),
    birthDate: toIsoDate(at(row, "birthDate")),
    note: at(row, "note"),
  }));
}
