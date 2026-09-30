import { ACTIVE_CAMPAIGN_DEFINITION } from "../../src/features/feedback/campaignRegistry.js";
import { readConfig } from "../../server/feedback/config.js";
import { isAuthorized, toResponse } from "../../server/feedback/http.js";
import { createFeedbackService } from "../../server/feedback/service.js";

/**
 * POST /api/feedback/activate — crea la hoja de la campaña activa y la comparte,
 * sin esperar al primer comentario. Requiere `Authorization: Bearer <FEEDBACK_ADMIN_KEY>`.
 */
export async function POST(request: Request): Promise<Response> {
  const config = readConfig();
  if (!isAuthorized(request, config)) return toResponse({ status: 401, body: { code: "unauthorized", message: "No autorizado." } });
  return toResponse(await createFeedbackService({ config, campaign: ACTIVE_CAMPAIGN_DEFINITION }).activate());
}
