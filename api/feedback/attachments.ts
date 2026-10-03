import { ACTIVE_CAMPAIGN_DEFINITION } from "../../src/features/feedback/campaignRegistry.js";
import { readConfig } from "../../server/feedback/config.js";
import { isSameOrigin, readJsonBody, toResponse } from "../../server/feedback/http.js";
import { createFeedbackService } from "../../server/feedback/service.js";

/**
 * POST /api/feedback/attachments — abre en Drive la sesión de subida de un
 * adjunto y devuelve su URL. Los bytes no pasan por aquí: el navegador se los
 * manda a Drive.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return toResponse({ status: 403, body: { code: "forbidden", message: "Origen no permitido." } });
  const payload = await readJsonBody(request);
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const service = createFeedbackService({ config: readConfig(), campaign: ACTIVE_CAMPAIGN_DEFINITION });
  return toResponse(await service.createUpload(payload, origin));
}
