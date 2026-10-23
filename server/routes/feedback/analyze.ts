import { ACTIVE_CAMPAIGN_DEFINITION } from "../../../src/features/feedback/campaignRegistry.js";
import { readConfig } from "../../feedback/config.js";
import { isAuthorized, toResponse } from "../../feedback/http.js";
import { createFeedbackService } from "../../feedback/service.js";

async function run(request: Request): Promise<Response> {
  const config = readConfig();
  if (!isAuthorized(request, config)) return toResponse({ status: 401, body: { code: "unauthorized", message: "No autorizado." } });
  return toResponse(await createFeedbackService({ config, campaign: ACTIVE_CAMPAIGN_DEFINITION }).analyze());
}

/** GET — lo invoca el cron de Vercel (vercel.json) con `Authorization: Bearer <CRON_SECRET>`. */
export const GET = run;
/** POST — para pedir un análisis a mano con `Authorization: Bearer <FEEDBACK_ADMIN_KEY>`. */
export const POST = run;
