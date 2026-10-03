/** Lo último que se abrió desde la búsqueda: el tipo de resultado y su id. */
export interface SearchRecent {
  kind: "object" | "navigate";
  id: string;
}

const MAX_RECENTS = 5;

const isRecent = (value: unknown): value is SearchRecent => {
  const record = value as Partial<SearchRecent> | null;
  return Boolean(record) && (record?.kind === "object" || record?.kind === "navigate") && typeof record?.id === "string";
};

/** Lee los recientes; sin almacenamiento (modo privado) o con datos rotos, no hay ninguno. */
export function readRecents(key: string): readonly SearchRecent[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

/** Pone uno al frente, sin repetirlo, y deja solo los últimos. */
export function pushRecent(key: string, recent: SearchRecent): void {
  const rest = readRecents(key).filter((item) => !(item.kind === recent.kind && item.id === recent.id));
  try {
    window.localStorage.setItem(key, JSON.stringify([recent, ...rest].slice(0, MAX_RECENTS)));
  } catch {
    // Sin almacenamiento la búsqueda funciona igual; solo no recuerda.
  }
}
