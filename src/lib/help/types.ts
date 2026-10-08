/**
 * Lo que publica el repo del centro de ayuda (`centro-de-ayuda`, `dist/`).
 * Estos tipos son el contrato entre el contenido y la app: si cambia
 * `scripts/build.mjs` allá, cambia esto aquí.
 */

export type HelpStatus = "draft" | "review" | "published";

export type HelpRole = "owner" | "admin" | "recepcion" | "barbero" | "todos";

export interface HelpHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface HelpArticleMeta {
  /** `seccion/articulo`; también es la ruta bajo `/ayuda/`. */
  id: string;
  title: string;
  description: string;
  section: string;
  order: number;
  /** Subgrupo del menú dentro de la sección («Agendar», «Cobrar y vender»…); null si la sección no tiene. */
  group?: string | null;
  roles: readonly HelpRole[];
  /** Rutas de la app donde aplica: `/login`, `/configuracion/*`. */
  screens: readonly string[];
  keywords: readonly string[];
  related: readonly string[];
  status: HelpStatus;
  updated: string;
  headings: readonly HelpHeading[];
  readingMinutes: number;
  /** Ruta del cuerpo relativa a la base publicada: `articles/<id>.md`. */
  path: string;
  /**
   * El idioma en que está escrito de verdad. En el índice de una traducción,
   * un artículo que aún no se traduce sale en español con `locale: "es"`.
   */
  locale?: string;
}

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  /** Subgrupos del menú en orden; solo las secciones grandes los tienen. */
  groups?: readonly string[];
  articles: readonly string[];
}

export interface HelpIndex {
  locale: string;
  /** Los idiomas que publica el repo de contenido. */
  locales?: readonly string[];
  generatedAt: string;
  siteUrl: string;
  sections: readonly HelpSection[];
  articles: Readonly<Record<string, HelpArticleMeta>>;
  /** Ruta de la app → ids de artículo. */
  screens: Readonly<Record<string, readonly string[]>>;
}

/** Un artículo en el índice de búsqueda: sus textos en plano. */
export interface HelpSearchDoc {
  id: string;
  title: string;
  description: string;
  section: string;
  /** El título de la sección, para que «roles» encuentre los artículos de «Roles y permisos». */
  sectionTitle?: string;
  keywords: readonly string[];
  headings: readonly string[];
  /** Las preguntas frecuentes del artículo, tal cual las haría alguien. */
  questions?: readonly string[];
  roles: readonly HelpRole[];
  status: HelpStatus;
  text: string;
}
