import { readJsonBody } from "../../server/http/request.js";
import { guardPaid } from "../../server/auth/guard.js";
import { narrate, readNarrativeConfig } from "../../server/narrative/narrative.js";

/**
 * POST /api/narrative — `{ kind: "week" | "pay", locale, facts }` → `{ text, model }`. Claude redacta
 * con marcadores y el servidor pone las cifras (ver server/narrative). Con sesión del equipo y cupo
 * por sesión (un resumen al abrir Métricas y alguno de «Mi pago»). Sin clave responde 501 y la app
 * muestra su resumen automático.
 */
export async function POST(request: Request): Promise<Response> {
  const session = guardPaid(request, { name: "narrative", quota: { perMinute: 10, perDay: 100 }, ipPerMinute: 30 });
  if (session instanceof Response) return session;
  return narrate(await readJsonBody(request), readNarrativeConfig());
}
