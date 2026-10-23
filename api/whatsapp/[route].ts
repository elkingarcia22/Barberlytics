import { routeGroup } from "../../server/http/routeGroup.js";
import * as inbox from "../../server/routes/whatsapp/inbox.js";
import * as queue from "../../server/routes/whatsapp/queue.js";
import * as webhook from "../../server/routes/whatsapp/webhook.js";

/** /api/whatsapp/queue, /inbox y /webhook en una sola función (ver server/http/routeGroup). */
export const { GET, POST, DELETE } = routeGroup({ queue, inbox, webhook });
