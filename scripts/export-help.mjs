#!/usr/bin/env node
/**
 * Exporta el centro de ayuda solo —sin el resto de la app— a una carpeta lista para Vercel: lo que se
 * sube al repo `ClientPortal`. Uso: `npm run export:help -- <carpeta>` (vacía o un clon del repo).
 *
 * El cómo está en `lib/export-standalone.mjs`. La ayuda no tiene backend: el contenido lo publica el
 * repo `centro-de-ayuda` en GitHub Pages, así que la CSP deja leer de ese dominio y no hay funciones.
 */
import { exportStandalone, indexHtml, outFromArgs, readRoot } from "./lib/export-standalone.mjs";

const ENTRY = "src/help-app/main.tsx";
const PUBLIC_FILES = ["public/favicon.svg", "public/apple-touch-icon.png"];
/** De donde sale el contenido por defecto (`env.helpBaseUrl`); si se cambia `VITE_HELP_BASE_URL`, cambia aquí también. */
const CONTENT_ORIGIN = "https://barberlytics.github.io";

const out = outFromArgs("Uso: npm run export:help -- <carpeta destino>");

/** Las cabeceras de seguridad de la app, con el contenido de Pages en `connect-src` y sin funciones ni crons. */
const VERCEL_JSON = (source) => {
  const config = JSON.parse(source);
  const headers = config.headers.map((rule) => ({
    ...rule,
    headers: rule.headers.map((header) =>
      header.key === "Content-Security-Policy" ? { ...header, value: header.value.replace("connect-src 'self'", `connect-src 'self' ${CONTENT_ORIGIN}`) } : header
    ),
  }));
  return {
    $schema: "https://openapi.vercel.sh/vercel.json",
    framework: "vite",
    installCommand: "npm ci",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    rewrites: [{ source: "/(.*)", destination: "/index.html" }],
    headers,
  };
};

const VITE_CONFIG = `import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
`;

/** Sin funciones de servidor no hay `tsconfig.server.json` que revisar. */
const TSCONFIG = (source) => {
  const config = JSON.parse(source);
  return { ...config, references: config.references.filter((reference) => !reference.path.includes("server")) };
};

const README = `# ClientPortal

El centro de ayuda de Barberlytics, solo: secciones, artículos, búsqueda y la ayuda en español e
inglés, con el mismo shell que la app. Se exporta desde el sistema de diseño Thema con
\`npm run export:help\`; no se edita aquí a mano.

El contenido (los artículos) no vive aquí: lo publica el repo \`centro-de-ayuda\` en GitHub Pages y
esta app lo lee al vuelo. Un artículo nuevo se ve en cuanto Pages se actualiza, sin volver a desplegar.

## Correr en local

\`\`\`bash
npm ci
npm run dev
\`\`\`

Abre \`/ayuda\` (cualquier otra ruta lleva ahí). Para leer un contenido local en vez del publicado:
\`VITE_HELP_BASE_URL=http://localhost:8787 npm run dev\`.

## Desplegar en Vercel

1. Importa el repo en Vercel (detecta Vite; \`vercel.json\` ya fija instalación, build, rutas y cabeceras).
2. Despliega. No necesita variables de entorno. Si el contenido se publica en otro dominio, define
   \`VITE_HELP_BASE_URL\` y añade ese dominio a \`connect-src\` en \`vercel.json\`.
`;

await exportStandalone({
  out,
  entry: ENTRY,
  publicFiles: PUBLIC_FILES,
  pkg: { name: "client-portal", description: "Centro de ayuda de Barberlytics, solo, listo para Vercel." },
  files: {
    "index.html": indexHtml(readRoot("index.html"), { title: "Centro de ayuda · Barberlytics", entry: ENTRY }),
    "vercel.json": `${JSON.stringify(VERCEL_JSON(readRoot("vercel.json")), null, 2)}\n`,
    "tsconfig.json": `${JSON.stringify(TSCONFIG(readRoot("tsconfig.json")), null, 2)}\n`,
    "vite.config.ts": VITE_CONFIG,
    "README.md": README,
  },
});
