import { readJsonBody } from "../../server/http/request.js";
import { guardPaid } from "../../server/auth/guard.js";
import { clipperFeedback } from "../../server/clipper/turnLog.js";

/** Con «compartir», la pregunta y la respuesta viajan: con tope. */
const MAX_BYTES = 20_000;

/** POST /api/clipper/feedback — el 👍/👎 de una respuesta de Clipper (ver server/clipper/turnLog). */
export async function POST(request: Request): Promise<Response> {
  const session = guardPaid(request, { name: "clipper-feedback", quota: { perMinute: 30, perDay: 300 }, ipPerMinute: 60 });
  if (session instanceof Response) return session;
  return clipperFeedback(await readJsonBody(request, MAX_BYTES));
}
