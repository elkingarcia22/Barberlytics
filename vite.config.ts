import path from "path"
import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import type { IncomingMessage, ServerResponse } from "http"
import { POST as tts } from "./api/tts/index"
import { POST as clipper } from "./api/clipper/index"
import { POST as clipperFeedback } from "./api/clipper/feedback"
import { POST as narrative } from "./api/narrative/index"
import { POST as session } from "./api/session/index"
import { POST as guestSession } from "./api/session/guest"
import * as whatsappQueue from "./api/whatsapp/queue"
import { enableDevSessionSecret } from "./server/auth/session"
import { runDue } from "./server/whatsapp/queue"

type Handler = (request: Request) => Promise<Response> | Response

/** Las funciones de `api/` por ruta y método: en local las atiende el servidor de desarrollo con el mismo código. */
const ROUTES: Record<string, Partial<Record<string, Handler>>> = {
  "/api/tts": { POST: tts },
  "/api/clipper": { POST: clipper },
  "/api/clipper/feedback": { POST: clipperFeedback },
  "/api/narrative": { POST: narrative },
  "/api/session": { POST: session },
  "/api/session/guest": { POST: guestSession },
  "/api/whatsapp/queue": { POST: whatsappQueue.POST, GET: whatsappQueue.GET, DELETE: whatsappQueue.DELETE },
}

/** Cada cuánto el servidor de desarrollo hace lo que en Vercel hace el cron: enviar lo que ya toca. */
const DEV_QUEUE_TICK_MS = 30_000

async function toRequest(req: IncomingMessage): Promise<Request> {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) if (typeof value === "string") headers.set(key, value)
  let body = ""
  if (req.method !== "GET" && req.method !== "HEAD") for await (const chunk of req) body += chunk
  return new Request(`http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`, { method: req.method, headers, body: body || undefined })
}

async function send(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

/**
 * La voz de Clipper, Clipper, la narración, la sesión firmada y la cola de WhatsApp también en local:
 * con `npm run dev` las funciones de `api/` no corren, así que el servidor de desarrollo las atiende
 * con el mismo código que Vercel. Las claves se leen de `.env.local` (no se sube a git) y nunca llegan
 * al navegador; sin `SESSION_SECRET` se firma con uno al azar de este proceso.
 */
function serverFunctionsInDev(): Plugin {
  return {
    name: "server-functions-dev",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "")
      for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value
      enableDevSessionSecret()
      const tick = setInterval(() => void runDue().catch(() => undefined), DEV_QUEUE_TICK_MS)
      server.httpServer?.once("close", () => clearInterval(tick))
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0]
        const handler = ROUTES[pathname]?.[req.method ?? "GET"]
        if (!handler) return next()
        try {
          await send(res, await handler(await toRequest(req)))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serverFunctionsInDev()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
