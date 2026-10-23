import { routeGroup } from "../../server/http/routeGroup.js";
import * as activate from "../../server/routes/feedback/activate.js";
import * as analyze from "../../server/routes/feedback/analyze.js";
import * as attachments from "../../server/routes/feedback/attachments.js";

/** /api/feedback/activate, /analyze (también el cron semanal) y /attachments en una sola función (ver server/http/routeGroup). */
export const { GET, POST, DELETE } = routeGroup({ activate, analyze, attachments });
