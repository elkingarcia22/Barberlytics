import type { HelpIndex } from "@/lib/help";
import { helpPath } from "../content";

/**
 * Deja el cuerpo listo para renderizar: quita el `# Título` (lo pinta la
 * página con los metadatos) y resuelve `[[seccion/articulo]]` a enlaces con
 * el título del artículo.
 */
export function prepareBody(body: string, index: HelpIndex | undefined): string {
  const withoutTitle = body.replace(/^\s*#\s+.+\n+/, "");
  return withoutTitle.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, rawId: string, label?: string) => {
    const id = rawId.trim();
    const title = label ?? index?.articles[id]?.title ?? id;
    return `[${title}](${helpPath(id)})`;
  });
}
