import path from "path"
import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { readTtsConfig, synthesize } from "./server/tts/tts"
import { readWhatsAppConfig, sendTemplate } from "./server/whatsapp/whatsapp"
import { narrate, readNarrativeConfig } from "./server/narrative/narrative"

/**
 * La voz de Clipper (y el envío por WhatsApp) también en local: con `npm run dev` las funciones de `api/` no corren, así que el
 * servidor de desarrollo atiende `POST /api/tts` con el mismo código que la función de Vercel. La
 * clave se lee de `.env.local` (no se sube a git) y nunca llega al navegador.
 */
function clipperVoiceInDev(): Plugin {
  return {
    name: "clipper-voice-dev",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "")
      server.middlewares.use("/api/tts", async (req, res, next) => {
        if (req.method !== "POST") return next()
        let body = ""
        for await (const chunk of req) body += chunk
        let payload: unknown
        try {
          payload = JSON.parse(body)
        } catch {
          payload = undefined
        }
        const response = await synthesize(payload, readTtsConfig({ ...process.env, ...env }))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
      // WhatsApp, igual: el mismo código que la función de Vercel, con las claves de `.env.local`.
      server.middlewares.use("/api/whatsapp/send", async (req, res, next) => {
        if (req.method !== "POST") return next()
        let body = ""
        for await (const chunk of req) body += chunk
        let payload: unknown
        try {
          payload = JSON.parse(body)
        } catch {
          payload = undefined
        }
        const response = await sendTemplate(payload, readWhatsAppConfig({ ...process.env, ...env }))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
      // Hechos → narración con Claude (ANTHROPIC_API_KEY de `.env.local`); sin clave, 501 y la app usa su resumen.
      server.middlewares.use("/api/narrative", async (req, res, next) => {
        if (req.method !== "POST") return next()
        let body = ""
        for await (const chunk of req) body += chunk
        let payload: unknown
        try {
          payload = JSON.parse(body)
        } catch {
          payload = undefined
        }
        const response = await narrate(payload, readNarrativeConfig({ ...process.env, ...env }))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), clipperVoiceInDev()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
