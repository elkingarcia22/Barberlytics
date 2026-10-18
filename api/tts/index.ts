import { isFromApp, jsonError, rateLimited, readJsonBody } from "../../server/http/request.js";
import { readTtsConfig, synthesize } from "../../server/tts/tts.js";

/** Cuántas frases de voz por minuto acepta una IP: de sobra para una conversación, poco para gastar la cuota. */
const TTS_PER_MINUTE = 30;

/**
 * POST /api/tts — la voz de Clipper: `{ text, lang: "es" | "en" }` → audio mp3. Solo desde la propia
 * app (con `Origin` o `Referer` de este sitio) y con tope por IP; sin servicio de voz configurado
 * responde 501 y la app usa la voz del navegador.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isFromApp(request)) return jsonError(403, "forbidden", "Origen no permitido.");
  if (rateLimited(request, "tts", TTS_PER_MINUTE, 60_000)) return jsonError(429, "rate_limited", "Demasiadas peticiones de voz. Espera un momento.");
  return synthesize(await readJsonBody(request), readTtsConfig());
}
