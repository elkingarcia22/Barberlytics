#!/usr/bin/env node
/**
 * Exporta la reserva en línea sola —sin el resto de la app— a una carpeta lista para Vercel: lo que
 * se sube al repo `booking-flow`. Uso: `npm run export:booking -- <carpeta>` (vacía o un clon del repo).
 *
 * El cómo (grafo del bundler, CSS, tipos, lock) está en `lib/export-standalone.mjs`. Aquí va lo propio
 * de la reserva: la voz de Clipper (`api/tts`, con la sesión de invitado de `api/session/guest`), los
 * comentarios y lo que importan de `server/`; el `vite.config.ts` que solo atiende esas funciones; el
 * service worker de la demo (MSW) y su excepción en la CSP.
 */
import { exportStandalone, indexHtml, outFromArgs, readRoot, TSCONFIG_SERVER } from "./lib/export-standalone.mjs";

const ENTRY = "src/booking-app/main.tsx";
const SERVER_ENTRIES = ["api/tts/index.ts", "api/session/guest.ts", "api/comments/index.ts", "server/http/devServer.ts"];
const PUBLIC_FILES = ["public/mockServiceWorker.js", "public/favicon.svg", "public/apple-touch-icon.png", "public/theme-init.js"];

const out = outFromArgs("Uso: npm run export:booking -- <carpeta destino>");

/**
 * La CSP va a todo menos al service worker de la demo (MSW): el worker reenvía también las peticiones
 * a otros dominios (fotos de Unsplash, fuentes) y con `connect-src 'self'` las bloqueaba.
 */
const SERVICE_WORKER = "mockServiceWorker\\.js";

const VERCEL_JSON = (source) => {
  const config = JSON.parse(source);
  const headers = config.headers.flatMap((rule) => {
    const csp = rule.headers.filter((header) => header.key === "Content-Security-Policy");
    const rest = rule.headers.filter((header) => header.key !== "Content-Security-Policy");
    return [{ ...rule, headers: rest }, ...(csp.length > 0 ? [{ source: `/((?!${SERVICE_WORKER}).*)`, headers: csp }] : [])];
    // El vercel.json de la app ya trae la CSP aparte: sin esto quedaba una regla sin cabeceras.
  }).filter((rule) => rule.headers.length > 0);
  return {
    $schema: "https://openapi.vercel.sh/vercel.json",
    framework: "vite",
    installCommand: "npm ci",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    rewrites: config.rewrites,
    headers,
    functions: { "api/tts/index.ts": { maxDuration: 30 }, "api/session/guest.ts": { maxDuration: 10 }, "api/comments/index.ts": { maxDuration: 15 } },
  };
};

/** El `vite.config.ts` de la reserva sola: las funciones que se exportan, con el mismo código que Vercel. */
const VITE_CONFIG = `import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { POST as tts } from "./api/tts/index"
import { POST as guestSession } from "./api/session/guest"
import { serverFunctionsInDev } from "./server/http/devServer"

// La voz de Clipper en local (con la sesión de invitado que pide): el mismo código que en Vercel.
export default defineConfig({
  plugins: [react(), serverFunctionsInDev({ "/api/tts": { POST: tts }, "/api/session/guest": { POST: guestSession } })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
`;

const README = `# booking-flow

La reserva en línea de Barberlytics, sola: la experiencia de agendamiento (Paso a paso, Agenda con
selector y Clipper) con su vista previa en celular, tablet, monitor y widget. Se exporta desde el
sistema de diseño Thema con \`npm run export:booking\`; no se edita aquí a mano.

## Correr en local

\`\`\`bash
npm ci
npm run dev
\`\`\`

- \`/\`: la vista previa con los cuatro marcos y las tres experiencias.
- \`/reservar?embed=1\`: la página pública, a pantalla completa (\`&version=agenda-list\` o \`chat\`).

Es una demo sin servidor: los datos salen de un backend simulado (Mock Service Worker) que arranca
siempre. Para probar: celular \`320 217 2738\` (cliente que vuelve) y código \`246810\`; el botón
«Para probar» lista el resto.

## Desplegar en Vercel

1. Importa el repo en Vercel (detecta Vite; \`vercel.json\` ya fija instalación, build y rutas).
2. La sesión de la voz: \`SESSION_SECRET\` (\`openssl rand -base64 48\`). Sin él, \`/api/tts\` responde 503 y Clipper usa la voz del navegador.
3. Opcional, la voz natural de Clipper: en *Settings → Environment Variables* agrega
   \`GEMINI_API_KEY\` (gratis en aistudio.google.com; o \`ELEVENLABS_API_KEY\`, \`AZURE_SPEECH_KEY\` + \`AZURE_SPEECH_REGION\`, u \`OPENAI_API_KEY\`).
   Sin ninguna, Clipper usa la voz del navegador. Detalle en \`.env.example\`.
4. Opcional, los comentarios de revisión compartidos: \`GOOGLE_SERVICE_ACCOUNT_JSON\` y \`FEEDBACK_SHARE_WITH\` (ver \`.env.example\`). Sin ellos los comentarios solo viven en el navegador.
5. Despliega. Las rutas del cliente caen en \`index.html\`; \`/api/tts\` es la función de la voz y \`/api/comments\`, la de los comentarios.
`;

const ENV_EXAMPLE = (source) => {
  const start = source.indexOf("# Voz de Clipper");
  return `# Solo servidor (funciones de Vercel api/tts, api/session/guest y api/comments), sin prefijo VITE_.\n${start >= 0 ? source.slice(start) : ""}`;
};

await exportStandalone({
  out,
  entry: ENTRY,
  serverEntries: SERVER_ENTRIES,
  publicFiles: PUBLIC_FILES,
  pkg: { name: "booking-flow", description: "Reserva en línea de Barberlytics: la experiencia de agendamiento, sola, lista para Vercel." },
  files: {
    "index.html": indexHtml(readRoot("index.html"), { title: "Reserva tu cita · Barberlytics", entry: ENTRY }),
    "vercel.json": `${JSON.stringify(VERCEL_JSON(readRoot("vercel.json")), null, 2)}\n`,
    "tsconfig.server.json": `${JSON.stringify(TSCONFIG_SERVER, null, 2)}\n`,
    "vite.config.ts": VITE_CONFIG,
    "README.md": README,
    ".env.example": ENV_EXAMPLE(readRoot(".env.example")),
  },
});
