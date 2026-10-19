import { isFromApp, jsonError, rateLimited, readJsonBody } from "../../server/http/request.js";
import { narrate, readNarrativeConfig } from "../../server/narrative/narrative.js";

/** Redacciones por minuto por IP: un resumen al abrir Métricas y alguno de «Mi pago». */
const PER_MINUTE = 10;

/**
 * POST /api/narrative — `{ kind: "week" | "pay", locale, facts }` → `{ text, model }`. Claude redacta
 * con marcadores y el servidor pone las cifras (ver server/narrative). Sin clave responde 501 y la app
 * muestra su resumen automático.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isFromApp(request)) return jsonError(403, "forbidden", "Origen no permitido.");
  if (rateLimited(request, "narrative", PER_MINUTE, 60_000)) return jsonError(429, "rate_limited", "Demasiadas peticiones. Espera un momento.");
  return narrate(await readJsonBody(request), readNarrativeConfig());
}
