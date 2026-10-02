import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { env } from "@/lib/api/env";
import type { HelpIndex, HelpSearchDoc } from "@/lib/help";

/**
 * El centro de ayuda no es parte de esta app: es el `dist/` que publica el
 * repo `centro-de-ayuda` (GitHub Pages). Aquí solo se lee. En local se
 * apunta a `npm run serve` de ese repo con `VITE_HELP_BASE_URL`.
 */
export const HELP_BASE_URL = env.helpBaseUrl;

/** `/assets/es/...` del Markdown → URL absoluta en la base publicada. */
export function helpAssetUrl(src: string): string {
  return src.startsWith("/") ? `${HELP_BASE_URL}${src}` : src;
}

/** La ruta de un artículo o sección dentro de la app. */
export function helpPath(id?: string): string {
  return id ? `/ayuda/${id}` : "/ayuda";
}

class HelpContentError extends Error {
  readonly status: number;
  readonly path: string;
  constructor(status: number, path: string) {
    super(`Centro de ayuda: ${status} al pedir ${path}`);
    this.name = "HelpContentError";
    this.status = status;
    this.path = path;
  }
}

async function fetchHelp(path: string): Promise<Response> {
  const response = await fetch(`${HELP_BASE_URL}/${path}`, { cache: "no-cache" });
  if (!response.ok) throw new HelpContentError(response.status, path);
  return response;
}

/** El contenido cambia con cada publicación, no cada segundo: cinco minutos de caché. */
const STALE_TIME = 5 * 60_000;

export function useHelpIndex() {
  return useQuery<HelpIndex>({
    queryKey: ["help", "index"],
    queryFn: () => fetchHelp("index.json").then((response) => response.json() as Promise<HelpIndex>),
    staleTime: STALE_TIME,
  });
}

/** El índice de búsqueda es más pesado: se pide solo cuando alguien busca. */
export function useHelpSearchDocs(enabled: boolean) {
  return useQuery<HelpSearchDoc[]>({
    queryKey: ["help", "search"],
    queryFn: () => fetchHelp("search.json").then((response) => response.json() as Promise<HelpSearchDoc[]>),
    staleTime: STALE_TIME,
    enabled,
  });
}

export function useHelpArticle(id: string | undefined) {
  return useQuery<string>({
    queryKey: ["help", "article", id],
    queryFn: () => fetchHelp(`articles/${id}.md`).then((response) => response.text()),
    staleTime: STALE_TIME,
    enabled: Boolean(id),
  });
}

/**
 * Los mismos datos, fuera de React: para quien responde en el chat. Pasan
 * por la caché de react-query, así una búsqueda desde el chat no vuelve a
 * pedir lo que la página ya trajo.
 */
export function loadHelpIndex(): Promise<HelpIndex> {
  return queryClient.fetchQuery({ queryKey: ["help", "index"], queryFn: () => fetchHelp("index.json").then((response) => response.json() as Promise<HelpIndex>), staleTime: STALE_TIME });
}

export function loadHelpSearchDocs(): Promise<HelpSearchDoc[]> {
  return queryClient.fetchQuery({ queryKey: ["help", "search"], queryFn: () => fetchHelp("search.json").then((response) => response.json() as Promise<HelpSearchDoc[]>), staleTime: STALE_TIME });
}

export function loadHelpArticle(id: string): Promise<string> {
  return queryClient.fetchQuery({ queryKey: ["help", "article", id], queryFn: () => fetchHelp(`articles/${id}.md`).then((response) => response.text()), staleTime: STALE_TIME });
}
