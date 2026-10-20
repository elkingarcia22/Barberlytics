/**
 * Lo común de exportar una parte de la app sola —sin el resto— a una carpeta lista para Vercel. Lo usan
 * `export-booking.mjs` (repo `booking-flow`) y `export-help.mjs` (repo `ClientPortal`); cada uno dice su
 * entrada, sus funciones de servidor y los archivos que escribe aparte.
 *
 * Qué copia y por qué así:
 * - El código: lo que el bundler alcanza desde la entrada (el grafo real de módulos, también los
 *   `import()` diferidos), más las `@import` de CSS, que resuelve PostCSS por dentro, y los
 *   `import type` (el bundler los borra, pero TypeScript los necesita para revisar los tipos).
 * - Las funciones de servidor que se pidan y lo que importan de `server/`.
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

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONFIG_FILES = ["tailwind.config.js", "postcss.config.js", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "src/vite-env.d.ts"];
/** Lo mínimo para compilar y escribir el proyecto; el resto de devDependencies es de pruebas y del sistema. */
const DEV_KEEP = ["typescript", "vite", "@vitejs/plugin-react", "tailwindcss", "postcss", "autoprefixer", "tailwindcss-animate", "@types/react", "@types/react-dom", "@types/node"];

const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const isOwn = (file) => file.startsWith(ROOT + path.sep) && !file.includes(`${path.sep}node_modules${path.sep}`);

/** El grafo de la entrada según el bundler: cada módulo propio que transforma y cada paquete que toca. */
async function collectModules(entry) {
  const own = new Set();
  const packages = new Set();
  const collector = {
    name: "collect-standalone-modules",
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
    build: { write: false, rollupOptions: { input: path.join(ROOT, entry) } },
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

/** El paquete de un import (`zod`, `@scope/pkg`), o `null` si es local. */
const packageOf = (specifier) => {
  if (specifier.startsWith(".") || specifier.startsWith("@/")) return null;
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
};

/**
 * Completa el conjunto con todo lo local que importan sus archivos de código, tipos incluidos, y anota
 * en `packages` los paquetes que nombran: un archivo que solo llega por `import type` no pasa por el
 * bundler, pero `tsc` necesita sus paquetes.
 */
function addImportClosure(files, packages) {
  const pending = [...files].filter((file) => /\.tsx?$/.test(file));
  while (pending.length > 0) {
    const file = pending.pop();
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const pkg = packageOf(match[1]);
      if (pkg) packages.add(pkg);
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

function cleanOut(out) {
  fs.mkdirSync(out, { recursive: true });
  for (const entry of fs.readdirSync(out)) {
    if (entry === ".git" || entry === "node_modules") continue;
    fs.rmSync(path.join(out, entry), { recursive: true, force: true });
  }
}

function packageJson(packages, { name, description }) {
  const source = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const all = { ...source.devDependencies, ...source.dependencies };
  const pick = (names) => Object.fromEntries([...names].filter((name) => all[name]).sort().map((name) => [name, all[name]]));
  const runtime = [...packages].filter((name) => all[name]);
  return {
    name,
    private: true,
    version: "0.1.0",
    type: "module",
    description,
    scripts: { dev: "vite", build: "vite build", preview: "vite preview", "type-check": "tsc -b" },
    dependencies: pick(runtime),
    devDependencies: pick(DEV_KEEP.filter((name) => !runtime.includes(name))),
    ...(source.overrides ? { overrides: source.overrides } : {}),
  };
}

/** El `index.html` de la app con su título y entrada; el modo va en un archivo: la CSP de Vercel no deja scripts en línea. */
export const indexHtml = (source, { title, entry }) =>
  source
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<script>[\s\S]*?<\/script>/, '<script src="/theme-boot.js"></script>')
    .replace('src="/src/main.tsx"', `src="/${entry}"`);

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

/** Los tipos de las funciones de `api/` y `server/`, para la app que las lleva. */
export const TSCONFIG_SERVER = {
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

const NPMRC = "# React 19 con el paquete único radix-ui: las dependencias declaran peers viejos.\nlegacy-peer-deps=true\n";
const GITIGNORE = "node_modules\ndist\n*.local\n.env\n.env.local\n.vercel\n.DS_Store\n";

/** Vercel instala con `npm ci`: el lock tiene que existir y coincidir con el package.json escrito. */
function writeLockfile(out) {
  console.log("Generando package-lock.json…");
  // Con un node_modules ya instalado (de Mac), npm arma el lock desde lo instalado y borra los binarios de las
  // otras plataformas (rolldown, lightningcss para Linux): Vercel, que compila en Linux, fallaba. Se aparta un momento.
  const installed = path.join(out, "node_modules");
  const parked = path.join(out, ".node_modules-export");
  const hasInstalled = fs.existsSync(installed);
  if (hasInstalled) fs.renameSync(installed, parked);
  try {
    execFileSync("npm", ["install", "--package-lock-only", "--no-audit", "--no-fund"], { cwd: out, stdio: "inherit" });
  } finally {
    if (hasInstalled) fs.renameSync(parked, installed);
  }
}

/**
 * Exporta una app sola.
 * - `entry`: la entrada (`src/<app>/main.tsx`); `serverEntries`: funciones de `api/` y `server/` que van con ella.
 * - `publicFiles`: lo de `public/` que se copia; `pkg`: `name` y `description` del package.json.
 * - `files`: los archivos que se escriben aparte, `{ ruta: contenido }` (index.html, vercel.json, README…).
 */
export async function exportStandalone({ out, entry, serverEntries = [], publicFiles, pkg, files }) {
  console.log("Leyendo el grafo de la app…");
  const { own, packages } = await collectModules(entry);
  const collected = new Set([...own].filter((file) => fs.existsSync(file)));
  for (const file of [...collected]) if (file.endsWith(".css")) cssImports(file).forEach((css) => collected.add(css));
  addImportClosure(collected, packages);
  for (const server of serverEntries) serverImports(path.join(ROOT, server)).forEach((file) => collected.add(file));

  const copy = (relative) => {
    const to = path.join(out, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relative), to);
  };
  const write = (relative, content) => {
    const to = path.join(out, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, content);
  };

  cleanOut(out);
  const relatives = [...collected].map(rel).filter((file) => file !== "index.html").sort();
  for (const file of [...relatives, ...CONFIG_FILES, ...publicFiles]) copy(file);

  write("package.json", `${JSON.stringify(packageJson(packages, pkg), null, 2)}\n`);
  write("public/theme-boot.js", THEME_BOOT);
  write(".npmrc", NPMRC);
  write(".gitignore", GITIGNORE);
  for (const [relative, content] of Object.entries(files)) write(relative, content);

  writeLockfile(out);
  console.log(`Listo: ${relatives.length} archivos de código, ${packages.size} paquetes en ${out}`);
}

/** El destino de la línea de comandos, o sale con el uso. */
export function outFromArgs(usage) {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  console.error(usage);
  process.exit(1);
}

export const readRoot = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
