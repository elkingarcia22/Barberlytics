import { timingSafeEqual } from "node:crypto";
import type { FeedbackServerConfig } from "./config.js";
import type { Reply } from "./service.js";

// Mismo origen y cuerpo con tope: compartidos con la voz de Clipper (`api/tts`) en `server/http/request.ts`.
export { MAX_BODY_BYTES, isSameOrigin, readJsonBody } from "../http/request.js";

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
