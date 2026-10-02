import { slugify } from "./text";
import type { HelpArticleMeta, HelpIndex, HelpSection } from "./types";

export interface HelpArticleGroup {
  /** `slugify(title)`: sirve de ancla en la página de la sección. */
  id: string;
  title: string;
  articles: readonly HelpArticleMeta[];
}

/**
 * Los artículos de una sección repartidos en sus subgrupos, en el orden que
 * declara el contenido. Una sección sin subgrupos devuelve un solo grupo sin
 * título: quien pinta decide no mostrar cabecera. Un artículo con un grupo que
 * la sección no declara va al final, en un grupo propio, para no perderlo.
 */
export function groupSectionArticles(section: HelpSection, index: Pick<HelpIndex, "articles">): HelpArticleGroup[] {
  const articles = section.articles.map((id) => index.articles[id]).filter((article): article is HelpArticleMeta => Boolean(article));
  const declared = section.groups ?? [];
  if (declared.length < 2) return [{ id: "", title: "", articles }];

  const byGroup = new Map<string, HelpArticleMeta[]>(declared.map((title) => [title, []]));
  for (const article of articles) {
    const title = article.group && byGroup.has(article.group) ? article.group : (article.group ?? "");
    const bucket = byGroup.get(title) ?? byGroup.set(title, []).get(title);
    bucket?.push(article);
  }
  return [...byGroup.entries()]
    .filter(([, list]) => list.length > 0)
    .map(([title, list]) => ({ id: slugify(title), title, articles: list }));
}
