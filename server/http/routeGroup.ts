import { jsonError } from "./request.js";

/**
 * Varias rutas en una sola función de Vercel. El plan Hobby admite como mucho 12 funciones por
 * despliegue, así que las rutas de un mismo grupo (`/api/whatsapp/queue`, `/inbox`, `/webhook`) viven
 * en `server/routes/<grupo>/` y una función `api/<grupo>/[route].ts` reparte por el último tramo de la
 * ruta. Cada ruta sigue exportando sus métodos (GET, POST…) como si fuera su propia función.
 */
type Handler = (request: Request) => Response | Promise<Response>;
export type RouteModule = Partial<Record<"GET" | "POST" | "DELETE", Handler>>;

export function routeGroup(routes: Readonly<Record<string, RouteModule>>) {
  const handle = (method: "GET" | "POST" | "DELETE") => (request: Request): Response | Promise<Response> => {
    const name = new URL(request.url).pathname.split("/").filter(Boolean).at(-1) ?? "";
    const route = Object.hasOwn(routes, name) ? routes[name] : undefined;
    if (!route) return jsonError(404, "not_found", "Esa ruta no existe.");
    const handler = route[method];
    return handler ? handler(request) : jsonError(405, "method_not_allowed", "Método no permitido en esta ruta.");
  };
  return { GET: handle("GET"), POST: handle("POST"), DELETE: handle("DELETE") };
}
