import { isSameOrigin, jsonError, readJsonBody } from "../../server/http/request.js";
import { issueStaffSession } from "../../server/auth/issue.js";

/**
 * POST /api/session — `{ phone, code }` → `{ token, expiresIn }`: la sesión firmada que piden las
 * funciones que cuestan dinero. Solo para las cuentas de la demo; el backend real la emitirá al entrar
 * (ver server/auth).
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Origen no permitido.");
  return issueStaffSession(request, await readJsonBody(request));
}
