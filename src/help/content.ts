import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { env } from "@/lib/api/env";
import { useLocale, type LocaleId } from "@/i18n";
import type { HelpIndex, HelpSearchDoc } from "@/lib/help";

/**
 * El centro de ayuda no es parte de esta app: es el `dist/` que publica el
 * repo `centro-de-ayuda` (GitHub Pages). Aquí solo se lee. En local se
 * apunta a `npm run serve` de ese repo con `VITE_HELP_BASE_URL`.
 */
export const HELP_BASE_URL = env.helpBaseUrl;

/**
 * Los idiomas en que está escrito el contenido. El español es la fuente y se
 * publica en la raíz; cada traducción en su carpeta (`/en/index.json`…). Las
 * capturas son las mismas para todos y viven en la raíz.
 */
export const HELP_LOCALES = ["es", "en"] as const satisfies readonly LocaleId[];
export type HelpLocale = (typeof HELP_LOCALES)[number];
const SOURCE_HELP_LOCALE: HelpLocale = "es";

/** El idioma del contenido para el idioma de la app: el que no está escrito cae al inglés. */
export function toHelpLocale(locale: LocaleId): HelpLocale {
  return (HELP_LOCALES as readonly LocaleId[]).includes(locale) ? (locale as HelpLocale) : "en";
}

export function useHelpLocale(): HelpLocale {
  return toHelpLocale(useLocale().locale);
}

/** `/assets/es/...` del Markdown → URL absoluta en la base publicada. */
export function helpAssetUrl(src: string): string {
  return src.startsWith("/") ? `${HELP_BASE_URL}${src}` : src;
}

/** La ruta de un artículo o sección dentro de la app. Es la misma en todos los idiomas. */
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

const localeBase = (locale: HelpLocale) => (locale === SOURCE_HELP_LOCALE ? HELP_BASE_URL : `${HELP_BASE_URL}/${locale}`);

/**
 * Pide un archivo en el idioma dado. Si esa traducción todavía no está
 * publicada (404), se lee el español: mejor la ayuda en otro idioma que
 * ninguna.
 */
async function fetchHelp(locale: HelpLocale, path: string): Promise<Response> {
  const response = await fetch(`${localeBase(locale)}/${path}`, { cache: "no-cache" });
  if (response.ok) return response;
  if (response.status === 404 && locale !== SOURCE_HELP_LOCALE) return fetchHelp(SOURCE_HELP_LOCALE, path);
  throw new HelpContentError(response.status, path);
}

/** El contenido cambia con cada publicación, no cada segundo: cinco minutos de caché. */
const STALE_TIME = 5 * 60_000;

const indexQuery = (locale: HelpLocale) => ({
  queryKey: ["help", locale, "index"],
  queryFn: () => fetchHelp(locale, "index.json").then((response) => response.json() as Promise<HelpIndex>),
  staleTime: STALE_TIME,
});

const searchQuery = (locale: HelpLocale) => ({
  queryKey: ["help", locale, "search"],
  queryFn: () => fetchHelp(locale, "search.json").then((response) => response.json() as Promise<HelpSearchDoc[]>),
  staleTime: STALE_TIME,
});

const articleQuery = (locale: HelpLocale, id: string | undefined) => ({
  queryKey: ["help", locale, "article", id],
  queryFn: () => fetchHelp(locale, `articles/${id}.md`).then((response) => response.text()),
  staleTime: STALE_TIME,
});

export function useHelpIndex() {
  return useQuery<HelpIndex>(indexQuery(useHelpLocale()));
}

/** El índice de búsqueda es más pesado: se pide solo cuando alguien busca. */
export function useHelpSearchDocs(enabled: boolean) {
  return useQuery<HelpSearchDoc[]>({ ...searchQuery(useHelpLocale()), enabled });
}

export function useHelpArticle(id: string | undefined) {
  return useQuery<string>({ ...articleQuery(useHelpLocale(), id), enabled: Boolean(id) });
}

/**
 * Los mismos datos, fuera de React: para quien responde en el chat. Pasan
 * por la caché de react-query, así una búsqueda desde el chat no vuelve a
 * pedir lo que la página ya trajo.
 */
export function loadHelpIndex(locale: HelpLocale): Promise<HelpIndex> {
  return queryClient.fetchQuery(indexQuery(locale));
}

export function loadHelpSearchDocs(locale: HelpLocale): Promise<HelpSearchDoc[]> {
  return queryClient.fetchQuery(searchQuery(locale));
}

export function loadHelpArticle(locale: HelpLocale, id: string): Promise<string> {
  return queryClient.fetchQuery(articleQuery(locale, id));
}
