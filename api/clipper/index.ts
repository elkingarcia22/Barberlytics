import { readJsonBody } from "../../server/http/request.js";
import { guardPaid } from "../../server/auth/guard.js";
import { clipperStep, readClipperConfig, withSessionRole } from "../../server/clipper/clipper.js";

/** La conversación viaja con los resultados de las consultas: más que un comentario, con tope. */
const MAX_BYTES = 200_000;

/**
 * POST /api/clipper — un paso de la conversación con Clipper (ver server/clipper). Con sesión del
 * equipo y cupo por sesión (una pregunta suele llevar de 2 a 4 pasos); el rol sale de la sesión, no
 * de lo que diga el navegador. Sin clave responde 501 y la app contesta con el centro de ayuda.
 */
export async function POST(request: Request): Promise<Response> {
  const session = guardPaid(request, { name: "clipper", quota: { perMinute: 30, perDay: 400 }, ipPerMinute: 60 });
  if (session instanceof Response) return session;
  return clipperStep(withSessionRole(await readJsonBody(request, MAX_BYTES), session.role), readClipperConfig());
}
