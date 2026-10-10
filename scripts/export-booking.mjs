#!/usr/bin/env node
/**
 * Exporta la reserva en línea sola —sin el resto de la app— a una carpeta lista para Vercel: lo que
 * se sube al repo `booking-flow`. Uso: `npm run export:booking -- <carpeta>` (vacía o un clon del repo).
 *
 * Qué copia y por qué así:
 * - El código: lo que el bundler alcanza desde `src/booking-app/main.tsx` (el grafo real de módulos,
 *   también los `import()` diferidos), más las `@import` de CSS, que resuelve PostCSS por dentro, y
 *   los `import type` (el bundler los borra, pero TypeScript los necesita para revisar los tipos).
 * - La voz de Clipper (`api/tts`, función de Vercel) y lo que importa de `server/`.
 * - La configuración (Vite, Tailwind, TypeScript), `public/` mínimo y un `package.json` con solo las
 *   dependencias que se usan.
 * En la carpeta destino borra todo menos `.git` y `node_modules` antes de escribir: el repo queda igual
 * a lo exportado. Al final genera el `package-lock.json` (hace falta red).
 */
import { execFileSync } from "node:child_process";
import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = "src/booking-app/main.tsx";
const SERVER_ENTRIES = ["api/tts/index.ts"];
const CONFIG_FILES = ["vite.config.ts", "tailwind.config.js", "postcss.config.js", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "src/vite-env.d.ts"];
const PUBLIC_FILES = ["public/mockServiceWorker.js", "public/favicon.svg", "public/apple-touch-icon.png"];
/** Lo mínimo para compilar y escribir el proyecto; el resto de devDependencies es de pruebas y del sistema. */
const DEV_KEEP = ["typescript", "vite", "@vitejs/plugin-react", "tailwindcss", "postcss", "autoprefixer", "tailwindcss-animate", "@types/react", "@types/react-dom", "@types/node"];

const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!out) {
  console.error("Uso: npm run export:booking -- <carpeta destino>");
  process.exit(1);
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const isOwn = (file) => file.startsWith(ROOT + path.sep) && !file.includes(`${path.sep}node_modules${path.sep}`);

/** El grafo de la reserva según el bundler: cada módulo propio que transforma y cada paquete que toca. */
async function collectModules() {
  const own = new Set();
  const packages = new Set();
  const collector = {
    name: "collect-booking-modules",
    transform(_code, id) {
      const file = id.split("?")[0];
      if (file.startsWith("\0")) return null;
      const nm = file.split(`${path.sep}node_modules${path.sep}`);
      if (nm.length > 1) {
        const parts = nm.at(-1).split(path.sep);
        packages.add(parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]);
      } else if (isOwn(file)) {
        own.add(file);
      }
      return null;
    },
  };
  await build({
    root: ROOT,
    logLevel: "warn",
    plugins: [collector],
    build: { write: false, rollupOptions: { input: path.join(ROOT, ENTRY) } },
  });
  return { own, packages };
}

/** Las `@import` relativas de un CSS, recursivas (PostCSS las resuelve sin pasar por el bundler). */
function cssImports(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/@import\s+["']([^"']+)["']/g)) {
    if (match[1].startsWith(".")) cssImports(path.resolve(path.dirname(file), match[1]), seen);
  }
  return seen;
}

const CODE_EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx", ".d.ts"];

/** Un import local (`@/…` o relativo) al archivo que lo cumple, o `null` si es un paquete o no existe. */
function resolveLocal(from, specifier) {
  const base = specifier.startsWith("@/") ? path.join(ROOT, "src", specifier.slice(2)) : specifier.startsWith(".") ? path.resolve(path.dirname(from), specifier) : null;
  if (!base) return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const extension of CODE_EXTENSIONS) if (fs.existsSync(base + extension)) return base + extension;
  return null;
}

/** Completa el conjunto con todo lo local que importan sus archivos de código, tipos incluidos. */
function addImportClosure(files) {
  const pending = [...files].filter((file) => /\.tsx?$/.test(file));
  while (pending.length > 0) {
    const file = pending.pop();
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const target = resolveLocal(file, match[1]);
      if (!target || files.has(target)) continue;
      files.add(target);
      if (/\.tsx?$/.test(target)) pending.push(target);
    }
  }
}

/** Los imports relativos de un archivo de servidor, recursivos (`.js` en el import, `.ts` en disco). */
function serverImports(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const target = path.resolve(path.dirname(file), match[1]).replace(/\.js$/, ".ts");
    if (fs.existsSync(target)) serverImports(target, seen);
  }
  return seen;
}

function copy(relative) {
  const from = path.join(ROOT, relative);
  const to = path.join(out, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function write(relative, content) {
  const to = path.join(out, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, content);
}

function cleanOut() {
  fs.mkdirSync(out, { recursive: true });
  for (const entry of fs.readdirSync(out)) {
    if (entry === ".git" || entry === "node_modules") continue;
    fs.rmSync(path.join(out, entry), { recursive: true, force: true });
  }
}

function packageJson(packages) {
  const source = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const all = { ...source.devDependencies, ...source.dependencies };
  const pick = (names) => Object.fromEntries([...names].filter((name) => all[name]).sort().map((name) => [name, all[name]]));
  const runtime = [...packages].filter((name) => all[name]);
  return {
    name: "booking-flow",
    private: true,
    version: "0.1.0",
    type: "module",
    description: "Reserva en línea de Barberlytics: la experiencia de agendamiento, sola, lista para Vercel.",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview", "type-check": "tsc -b" },
    dependencies: pick(runtime),
    devDependencies: pick(DEV_KEEP.filter((name) => !runtime.includes(name))),
    ...(source.overrides ? { overrides: source.overrides } : {}),
  };
}

const INDEX_HTML = (source) =>
  source
    .replace(/<title>[^<]*<\/title>/, "<title>Reserva tu cita · Barberlytics</title>")
    // El modo antes del primer pintado, desde un archivo: la CSP de Vercel no deja scripts en línea.
    .replace(/<script>[\s\S]*?<\/script>/, '<script src="/theme-boot.js"></script>')
    .replace('src="/src/main.tsx"', `src="/${ENTRY}"`);

const THEME_BOOT = `// Aplica el modo antes del primer pintado para evitar el flash claro→oscuro.
(function () {
  try {
    var raw = localStorage.getItem("thema-theme");
    var mode = raw ? JSON.parse(raw).mode : "dark";
    var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

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
  });
  return {
    $schema: "https://openapi.vercel.sh/vercel.json",
    framework: "vite",
    installCommand: "npm ci",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    rewrites: config.rewrites,
    headers,
    functions: { "api/tts/index.ts": { maxDuration: 30 } },
  };
};

const TSCONFIG_SERVER = {
  compilerOptions: {
    tsBuildInfoFile: "./node_modules/.tmp/tsconfig.server.tsbuildinfo",
    target: "es2023",
    lib: ["ES2023"],
    module: "esnext",
    types: ["node"],
    skipLibCheck: true,
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    moduleDetection: "force",
    noEmit: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    erasableSyntaxOnly: true,
    noFallthroughCasesInSwitch: true,
  },
  include: ["api", "server"],
};

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
- \`/reservar?embed=1\`: la página pública, a pantalla completa (\`&version=agenda-select\` o \`chat\`).

Es una demo sin servidor: los datos salen de un backend simulado (Mock Service Worker) que arranca
siempre. Para probar: celular \`320 217 2738\` (cliente que vuelve) y código \`246810\`; el botón
«Para probar» lista el resto.

## Desplegar en Vercel

1. Importa el repo en Vercel (detecta Vite; \`vercel.json\` ya fija instalación, build y rutas).
2. Opcional, la voz natural de Clipper: en *Settings → Environment Variables* agrega
   \`ELEVENLABS_API_KEY\` (o \`AZURE_SPEECH_KEY\` + \`AZURE_SPEECH_REGION\`, u \`OPENAI_API_KEY\`).
   Sin ninguna, Clipper usa la voz del navegador. Detalle en \`.env.example\`.
3. Despliega. Las rutas del cliente caen en \`index.html\`; \`/api/tts\` es la función de la voz.
`;

const ENV_EXAMPLE = (source) => {
  const start = source.indexOf("# Voz de Clipper");
  return `# Solo servidor (función de Vercel api/tts), sin prefijo VITE_.\n${start >= 0 ? source.slice(start) : ""}`;
};

const NPMRC = "# React 19 con el paquete único radix-ui: las dependencias declaran peers viejos.\nlegacy-peer-deps=true\n";

async function main() {
  console.log("Leyendo el grafo de la reserva…");
  const { own, packages } = await collectModules();
  const files = new Set([...own].filter((file) => fs.existsSync(file)));
  for (const file of [...files]) if (file.endsWith(".css")) cssImports(file).forEach((css) => files.add(css));
  addImportClosure(files);
  for (const entry of SERVER_ENTRIES) serverImports(path.join(ROOT, entry)).forEach((file) => files.add(file));

  cleanOut();
  const relatives = [...files].map(rel).filter((file) => file !== "index.html").sort();
  for (const file of [...relatives, ...CONFIG_FILES, ...PUBLIC_FILES]) copy(file);

  // Lo que importan los archivos de servidor (p. ej. tipos de Node) también va en el package.json.
  write("package.json", `${JSON.stringify(packageJson(packages), null, 2)}\n`);
  write("index.html", INDEX_HTML(fs.readFileSync(path.join(ROOT, "index.html"), "utf8")));
  write("public/theme-boot.js", THEME_BOOT);
  write("vercel.json", `${JSON.stringify(VERCEL_JSON(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")), null, 2)}\n`);
  write("tsconfig.server.json", `${JSON.stringify(TSCONFIG_SERVER, null, 2)}\n`);
  write("README.md", README);
  write(".env.example", ENV_EXAMPLE(fs.readFileSync(path.join(ROOT, ".env.example"), "utf8")));
  write(".npmrc", NPMRC);
  write(".gitignore", "node_modules\ndist\n*.local\n.env\n.env.local\n.vercel\n.DS_Store\n");

  // Vercel instala con `npm ci`: el lock tiene que existir y coincidir con el package.json de arriba.
  console.log("Generando package-lock.json…");
  execFileSync("npm", ["install", "--package-lock-only", "--no-audit", "--no-fund"], { cwd: out, stdio: "inherit" });

  console.log(`Listo: ${relatives.length} archivos de código, ${packages.size} paquetes en ${out}`);
}

await main();
