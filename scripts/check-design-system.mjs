#!/usr/bin/env node
/**
 * npm run check — las reglas del sistema de diseño, aplicadas al código.
 *
 * Revisa `src/` (y solo los archivos cambiados con `--changed`) y falla si:
 *   1. se importa otra librería de interfaz o iconos (MUI, Chakra, Ant, @radix-ui/react-*…);
 *   2. aparece un color escrito a mano (hex/rgb/hsl) fuera de los tokens y temas;
 *   3. se usa la paleta cruda de Tailwind (`bg-blue-500`, `text-gray-600`…) fuera de la doc;
 *   4. se fija un tamaño de letra o un z-index a mano (`text-[13px]`, `z-[999]`) en producto;
 *   5. hay un `<svg` pegado fuera de `src/icons` y `src/components`;
 *   6. una pantalla fija su propio ancho máximo en vez de dejárselo al marco;
 *   6b. se pide un icono con un nombre que no está en el registro (hoy caería al fallback
 *       en silencio) o una pantalla de `src/features` no está enrutada;
 *   7. se tocaron archivos protegidos (tokens, temas, shell, configuración) respecto a `main`.
 *
 * Reporta todos los hallazgos de cada archivo, no solo el primero. Salida 1 si hay errores.
 *
 * Severidad: en código de producto (`src/features`, `src/app`, `src/lib`) todo es error.
 * Dentro del sistema (`src/components`, `src/icons`, `src/themes`) las mismas reglas son
 * aviso: es deuda heredada que se paga archivo a archivo, no de golpe. `--strict` sube todo
 * a error; `--warn-only` baja todo a aviso.
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const WARN_ONLY = args.has("--warn-only");
const STRICT = args.has("--strict");
const CHANGED_ONLY = args.has("--changed");
const QUIET = args.has("--quiet");

const FOREIGN_UI = [
  /from\s+["'](@mui\/|@chakra-ui\/|antd|@ant-design\/|@mantine\/|@headlessui\/|react-bootstrap|@nextui|@heroui|primereact|@fluentui|semantic-ui-react|@radix-ui\/react-)/,
  /from\s+["'](react-icons|@heroicons\/|@tabler\/icons|@fortawesome\/|phosphor-react|@phosphor-icons\/|iconoir-react|@iconify\/)/,
];

// `hsl(var(--x))` y `rgb(var(--x-rgb))` son referencias a tokens, no colores a mano.
const RAW_COLOR = /(#[0-9a-fA-F]{3,8}\b|\brgba?\((?!\s*var\()|\bhsla?\((?!\s*var\())/;
const RAW_PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;
const RAW_FONT_SIZE = /\btext-\[\d+(?:\.\d+)?px\]/;
const RAW_Z = /\bz-\[\d+\]/;
const RAW_SVG = /<svg[\s>]/;

/**
 * Dónde sí puede vivir cada excepción, y por qué. Una excepción se añade
 * aquí, con su motivo, y nunca apagando la regla en el archivo.
 *
 * - `styles`/`themes`: son la fuente de los tokens; ahí el color literal es el dato.
 * - `charts`: ECharts pinta en canvas y recibe colores resueltos, no clases.
 * - `docs`: los ejemplos muestran valores a propósito (un swatch, un snippet).
 * - `appShellData.ts`: el color corporativo de una empresa es un dato de dominio
 *   que en producción llega del backend, no una decisión de diseño.
 * - `CompanyMenu.tsx`: dibuja el logotipo de Google; una marca de terceros no
 *   puede repintarse con los tokens del tema.
 * - `GlassIcon.tsx`: los gradientes son el efecto de vidrio, no color de interfaz.
 * - `border-beam`/`moving-border-beam`: el haz es un degradado decorativo que el
 *   usuario ajustó a mano; cambiarlo cambiaría la identidad de IA.
 * - `HairCanvas.tsx`: pinta en canvas con los tokens del tema ya resueltos
 *   (`--primary`, `--foreground`), igual que charts; no hay clase que llegue ahí.
 * - `themes/`: el selector de tema es cromo del marco y usa su propia escala
 *   pequeña (10 y 11 px), como la barra lateral y el pie (ver Tipografía).
 */
const BRAND_AND_EFFECT = [
  /^src\/components\/app-shell\/appShellData\.ts$/,
  /^src\/components\/app-shell\/CompanyMenu\.tsx$/,
  /^src\/icons\/GlassIcon\.tsx$/,
  /^src\/components\/ui\/(moving-)?border-beam\.tsx$/,
  /^src\/components\/atmosphere\/HairCanvas\.tsx$/,
];

const ALLOW = {
  color: [/^src\/styles\//, /^src\/themes\//, /^src\/components\/charts\//, /^src\/docs\//, /^src\/lib\/tone\.ts$/, /\.css$/, /\.test\.tsx?$/, ...BRAND_AND_EFFECT],
  palette: [/^src\/docs\//, /^src\/components\/charts\/theme\.ts$/, /\.test\.tsx?$/, ...BRAND_AND_EFFECT],
  fontSize: [/^src\/docs\//, /^src\/components\//, /^src\/themes\//, /\.test\.tsx?$/],
  z: [/^src\/docs\//, /^src\/components\//],
  svg: [/^src\/icons\//, /^src\/components\//, /^src\/docs\//],
  /** Los snippets de la doc enseñan a propósito nombres que no existen (el fallback). */
  iconName: [/^src\/docs\//],
};

const PROTECTED = [
  /^src\/styles\//,
  /^src\/themes\//,
  /^src\/components\/app-shell\//,
  /^tailwind\.config\.js$/,
  /^vite(\.lib)?\.config\.ts$/,
  /^vitest\.config\.ts$/,
  /^playwright\.config\.ts$/,
  /^scripts\//,
  /^\.github\//,
  /^package\.json$/,
];

const PRODUCT = /^src\/(features|app|lib|mocks)\//;
const findings = [];
const add = (file, line, rule, message, level = "error") => {
  const inProduct = PRODUCT.test(file);
  const resolved = WARN_ONLY ? "warn" : level === "error" && !inProduct && !STRICT ? "warn" : level;
  findings.push({ file, line, rule, message, level: resolved });
};
const allowed = (file, list) => list.some((re) => re.test(file));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === "dist-lib") continue;
      walk(full, out);
    } else if (/\.(tsx?|css)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function changedFiles() {
  const base = git("git rev-parse --verify main") ? "main" : git("git rev-parse --verify origin/main") ? "origin/main" : "";
  const diff = base ? git(`git diff --name-only ${base}...HEAD`) : "";
  const working = git("git status --porcelain").split("\n").filter(Boolean).map((l) => l.slice(3).trim());
  return { base, files: [...new Set([...diff.split("\n"), ...working].filter(Boolean))] };
}

const rel = (f) => relative(ROOT, f).split(sep).join("/");
const changed = changedFiles();
const targets = CHANGED_ONLY
  ? changed.files.filter((f) => /^src\/.*\.(tsx?|css)$/.test(f)).map((f) => join(ROOT, f))
  : walk(join(ROOT, "src"));

for (const full of targets) {
  const file = rel(full);
  let text;
  try {
    text = readFileSync(full, "utf8");
  } catch {
    continue;
  }
  const lines = text.split("\n");
  const isCss = file.endsWith(".css");
  const isProduct = /^src\/(features|app)\//.test(file);

  lines.forEach((line, i) => {
    const n = i + 1;
    if (!isCss && FOREIGN_UI.some((re) => re.test(line))) add(file, n, "libreria-ajena", "Otra librería de interfaz o iconos. Todo sale de @/components y ThemaIcon.");
    if (!allowed(file, ALLOW.color) && RAW_COLOR.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) add(file, n, "color-a-mano", "Color escrito a mano. Usa una clase del tema (bg-primary, text-text-secondary…).");
    if (!isCss && !allowed(file, ALLOW.palette) && RAW_PALETTE.test(line)) add(file, n, "paleta-cruda", `Paleta cruda de Tailwind (${line.match(RAW_PALETTE)[0]}). Usa el token semántico.`);
    if (!isCss && !allowed(file, ALLOW.fontSize) && RAW_FONT_SIZE.test(line)) add(file, n, "letra-a-mano", "Tamaño de letra fijado. Usa <Heading level> o <Text size>.");
    if (!isCss && !allowed(file, ALLOW.z) && RAW_Z.test(line)) add(file, n, "z-a-mano", "z-index a mano. Usa una capa del tema (z-popover, z-dialog…).");
    if (!isCss && !allowed(file, ALLOW.svg) && RAW_SVG.test(line)) add(file, n, "svg-pegado", "SVG pegado. Pide el icono al registro (<ThemaIcon name=…/>).");
  });

  // El ancho lo pone el marco (`AdminShell config={{ contentWidth }}`) o
  // `PageShell`. Una pantalla que se inventa su propio tope rompe el ritmo
  // del producto en cuanto alguien cambia el del marco. Los anchos pequeños
  // (un campo, una card) no son topes de página y no cuentan.
  if (isProduct) {
    lines.forEach((line, i) => {
      const match = line.match(/\bmax-w-(?:\[(\d{3,4})px\]|(4xl|5xl|6xl|7xl|screen-[a-z]+))/);
      if (!match) return;
      if (match[1] && Number(match[1]) < 600) return;
      add(file, i + 1, "ancho-a-mano", `Ancho máximo fijado a mano (${match[0]}). El ancho lo pone el marco (contentWidth) o PageShell.`);
    });
  }
}

/* --- Iconos: un nombre que no está en el registro cae al fallback sin avisar. --- */
try {
  const registry = readFileSync(join(ROOT, "src/icons/iconRegistry.ts"), "utf8");
  const body = registry.slice(registry.indexOf("iconRegistry"));
  const known = new Set([...body.matchAll(/^\s*(?:"([a-z0-9-]+)"|([a-zA-Z][\w]*))\s*:/gm)].map((m) => m[1] ?? m[2]));
  if (known.size > 5) {
    for (const full of targets) {
      const file = rel(full);
      if (file.endsWith(".css") || file.startsWith("src/icons/") || allowed(file, ALLOW.iconName)) continue;
      const text = readFileSync(full, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        for (const match of line.matchAll(/<ThemaIcon[^>]*?\bname=["']([^"'{]+)["']/g)) {
          if (!known.has(match[1])) add(file, i + 1, "icono-desconocido", `«${match[1]}» no está en src/icons/iconRegistry.ts: se pintaría el icono de reserva sin avisar.`);
        }
      });
    }
  }
} catch {
  /* sin registro legible, nada que validar */
}

/* --- Pantallas muertas: una página de un dominio que nadie enruta. --- */
if (!CHANGED_ONLY) {
  let routing = "";
  for (const routeFile of ["src/app/lazyPages.ts", "src/app/router.tsx"]) {
    try {
      routing += readFileSync(join(ROOT, routeFile), "utf8");
    } catch {
      /* el proyecto puede enrutar de otra forma */
    }
  }
  if (routing) {
    for (const full of targets) {
      const file = rel(full);
      const match = file.match(/^src\/features\/[^/]+\/([A-Z]\w*Page)\.tsx$/);
      if (match && !routing.includes(match[1])) {
        add(file, 1, "pantalla-sin-ruta", `${match[1]} no aparece en lazyPages.ts ni en router.tsx: nadie puede llegar a ella.`, "warn");
      }
    }
  }
}

for (const file of changed.files) {
  if (PROTECTED.some((re) => re.test(file))) add(file, 0, "archivo-protegido", `Archivo protegido cambiado${changed.base ? ` respecto a ${changed.base}` : ""}. Lo aprueba ingeniería.`, "warn");
}

const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");
const byFile = new Map();
for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);

if (!QUIET || errors.length) {
  for (const [file, list] of [...byFile.entries()].sort()) {
    console.log(`\n${file}`);
    for (const f of list) console.log(`  ${f.level === "error" ? "✖" : "▲"} ${f.line ? `L${f.line} ` : ""}[${f.rule}] ${f.message}`);
  }
  console.log(`\ncheck: ${errors.length} error(es), ${warns.length} aviso(s) en ${targets.length} archivo(s)${CHANGED_ONLY ? " cambiados" : ""}.`);
}
process.exit(errors.length ? 1 : 0);
