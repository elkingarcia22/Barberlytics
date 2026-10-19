import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { POST as tts } from "./api/tts/index"
import { POST as clipper } from "./api/clipper/index"
import { POST as clipperFeedback } from "./api/clipper/feedback"
import { POST as narrative } from "./api/narrative/index"
import { POST as session } from "./api/session/index"
import { POST as guestSession } from "./api/session/guest"
import * as whatsappQueue from "./api/whatsapp/queue"
import * as whatsappWebhook from "./api/whatsapp/webhook"
import { GET as whatsappInbox } from "./api/whatsapp/inbox"
import { POST as smsInbound } from "./api/sms/inbound"
import { serverFunctionsInDev } from "./server/http/devServer"
import { runDue } from "./server/whatsapp/queue"

/**
 * La voz de Clipper, Clipper, la narración, la sesión firmada y la cola de WhatsApp también en local,
 * con el mismo código que Vercel (ver server/http/devServer). El servidor de desarrollo hace además de
 * cron: cada 30 s envía lo que ya toca de la cola.
 */
const serverFunctions = serverFunctionsInDev(
  {
    "/api/tts": { POST: tts },
    "/api/clipper": { POST: clipper },
    "/api/clipper/feedback": { POST: clipperFeedback },
    "/api/narrative": { POST: narrative },
    "/api/session": { POST: session },
    "/api/session/guest": { POST: guestSession },
    "/api/whatsapp/queue": { POST: whatsappQueue.POST, GET: whatsappQueue.GET, DELETE: whatsappQueue.DELETE },
    "/api/whatsapp/webhook": { GET: whatsappWebhook.GET, POST: whatsappWebhook.POST },
    "/api/whatsapp/inbox": { GET: whatsappInbox },
    "/api/sms/inbound": { POST: smsInbound },
  },
  { tick: () => runDue() }
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serverFunctions],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
