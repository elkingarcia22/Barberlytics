import { ACTIVE_CAMPAIGN_DEFINITION } from "../../src/features/feedback/campaignRegistry.js";
import { readConfig } from "../../server/feedback/config.js";
import { isSameOrigin, readJsonBody, toResponse } from "../../server/feedback/http.js";
import { createFeedbackService } from "../../server/feedback/service.js";

/** POST /api/feedback — guarda un comentario de la campaña activa en su hoja de Google. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return toResponse({ status: 403, body: { code: "forbidden", message: "Origen no permitido." } });
  const payload = await readJsonBody(request);
  const service = createFeedbackService({ config: readConfig(), campaign: ACTIVE_CAMPAIGN_DEFINITION });
  return toResponse(await service.submit(payload));
}
