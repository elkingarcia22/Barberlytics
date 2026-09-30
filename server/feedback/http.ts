import { timingSafeEqual } from "node:crypto";
import type { FeedbackServerConfig } from "./config.js";
import type { Reply } from "./service.js";

/** Tope del cuerpo de un comentario: de sobra para 1000 caracteres y los metadatos. */
export const MAX_BODY_BYTES = 10_000;

export function toResponse(reply: Reply): Response {
  return Response.json(reply.body, { status: reply.status, headers: { "Cache-Control": "no-store" } });
}

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * ¿Trae la clave de administración o el secreto del cron? El cron de Vercel la
 * manda sola en `Authorization: Bearer <CRON_SECRET>`; una persona usa
 * `FEEDBACK_ADMIN_KEY`. Sin ninguna de las dos configuradas, nadie entra.
 */
export function isAuthorized(request: Request, config: Pick<FeedbackServerConfig, "adminKey" | "cronSecret">): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  return [config.adminKey, config.cronSecret].some((secret) => Boolean(secret) && safeEqual(token, secret as string));
}

/** Un navegador de otro sitio no puede mandar comentarios en nombre de esta app. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Lee el cuerpo como JSON con un tope de tamaño; `undefined` si es demasiado grande o no es JSON. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
