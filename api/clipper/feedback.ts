import { isFromApp, jsonError, rateLimited, readJsonBody } from "../../server/http/request.js";
import { clipperFeedback } from "../../server/clipper/turnLog.js";

/** Opiniones por minuto por IP. */
const PER_MINUTE = 30;
/** Con «compartir», la pregunta y la respuesta viajan: con tope. */
const MAX_BYTES = 20_000;

/** POST /api/clipper/feedback — el 👍/👎 de una respuesta de Clipper (ver server/clipper/turnLog). */
export async function POST(request: Request): Promise<Response> {
  if (!isFromApp(request)) return jsonError(403, "forbidden", "Origen no permitido.");
  if (rateLimited(request, "clipper-feedback", PER_MINUTE, 60_000)) return jsonError(429, "rate_limited", "Demasiadas peticiones. Espera un momento.");
  return clipperFeedback(await readJsonBody(request, MAX_BYTES));
}
