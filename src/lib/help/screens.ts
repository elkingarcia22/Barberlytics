import type { HelpArticleMeta, HelpIndex } from "./types";

/**
 * El contenido se documenta desde producción y `screens` usa sus rutas. El
 * rediseño tiene las suyas; esta tabla las traduce para que la ayuda
 * contextual funcione en las dos. Se compara por prefijo de ruta.
 */
const ROUTE_ALIASES: readonly (readonly [string, string])[] = [
  ["/dashboard", "/"],
  ["/calendario", "/calendar"],
  ["/clientes", "/customers"],
  ["/servicios", "/services"],
  ["/productos", "/products"],
  ["/usuarios/miembros", "/team/barbers/view"],
  ["/usuarios/fila", "/team/barbers/lineup"],
  ["/usuarios/activar", "/team/activate"],
  ["/usuarios", "/team/barbers"],
  ["/gastos", "/expenses"],
  ["/nomina", "/payroll"],
  ["/transacciones", "/transactions"],
  ["/configuracion", "/settings"],
  ["/login", "/authenticate"],
];

/** La ruta del rediseño en su equivalente de producción; las demás pasan igual. */
export function toProductionRoute(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  for (const [from, to] of ROUTE_ALIASES) {
    if (path === from) return to;
    if (path.startsWith(`${from}/`)) return `${to}${path.slice(from.length)}`;
  }
  return path;
}

/**
 * Si un patrón de `screens` cubre una ruta de la app. `/login` cubre solo
 * `/login`; `/configuracion/*` cubre `/configuracion` y todo lo que cuelga;
 * `/*` cubre cualquier pantalla (para lo que aplica en toda la app).
 */
export function screenMatches(pattern: string, pathname: string): boolean {
  const path = toProductionRoute(pathname);
  if (pattern === "/*") return true;
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2) || "/";
    return path === base || path.startsWith(`${base}/`);
  }
  return path === pattern.replace(/\/+$/, "");
}

/**
 * Los artículos que hablan de la pantalla actual, los más específicos primero:
 * una coincidencia exacta gana a un comodín, y `/*` va al final.
 */
export function articlesForScreen(index: HelpIndex, pathname: string): HelpArticleMeta[] {
  const scored = new Map<string, number>();
  for (const [pattern, ids] of Object.entries(index.screens)) {
    if (!screenMatches(pattern, pathname)) continue;
    const specificity = pattern === "/*" ? 0 : pattern.endsWith("/*") ? 1 : 2;
    for (const id of ids) scored.set(id, Math.max(scored.get(id) ?? 0, specificity));
  }
  return [...scored.entries()]
    .map(([id, specificity]) => ({ meta: index.articles[id], specificity }))
    .filter((item): item is { meta: HelpArticleMeta; specificity: number } => Boolean(item.meta))
    .sort((a, b) => b.specificity - a.specificity || a.meta.section.localeCompare(b.meta.section) || a.meta.order - b.meta.order)
    .map((item) => item.meta);
}
