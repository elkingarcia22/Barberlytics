import { isFromApp, jsonError, rateLimited, readJsonBody } from "../../server/http/request.js";
import { clipperStep, readClipperConfig } from "../../server/clipper/clipper.js";

/** Pasos por minuto por IP: una pregunta suele llevar de 2 a 4 (consultas y respuesta). */
const PER_MINUTE = 30;
/** La conversación viaja con los resultados de las consultas: más que un comentario, con tope. */
const MAX_BYTES = 200_000;

/**
 * POST /api/clipper — un paso de la conversación con Clipper (ver server/clipper). Sin clave responde
 * 501 y la app contesta con el centro de ayuda.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isFromApp(request)) return jsonError(403, "forbidden", "Origen no permitido.");
  if (rateLimited(request, "clipper", PER_MINUTE, 60_000)) return jsonError(429, "rate_limited", "Demasiadas peticiones. Espera un momento.");
  return clipperStep(await readJsonBody(request, MAX_BYTES), readClipperConfig());
}
