#!/usr/bin/env node
/**
 * npm run codemap — el mapa del código de producto que lee la IA.
 *
 * El catálogo (`npm run catalog`) cuenta qué piezas tiene el sistema; este mapa
 * cuenta qué se construyó con ellas. Lee `src/app`, `src/features`, `src/lib`,
 * `src/hooks`, `src/config`, `src/mocks`, `src/i18n` y `src/themes` con el
 * parser de TypeScript (sin comprobar tipos: es sintaxis y tarda décimas) y
 * escribe `ai-tools/CODEMAP.md`:
 *   - las rutas y qué pantalla monta cada una;
 *   - los endpoints que el mock implementa;
 *   - por archivo: qué exporta, qué endpoints llama, qué piezas del sistema usa
 *     y de qué otros módulos depende.
 * Sirve para ir directo al archivo en vez de buscarlo leyendo carpetas enteras.
 * La salida depende solo del código; `npm run check` la regenera en memoria y
 * falla si la del disco quedó vieja.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const CODEMAP_FILE = "ai-tools/CODEMAP.md";

const AREAS = [
  { dir: "src/app", label: "App", note: "Router, providers, layout, navegación y páginas de error." },
  { dir: "src/features", label: "Dominios", note: "Una carpeta por dominio: pantalla, tipos, api, queries." },
  { dir: "src/lib", label: "Lib", note: "Cliente de API, consultas y utilidades sin interfaz." },
  { dir: "src/hooks", label: "Hooks", note: "Hooks compartidos entre dominios." },
  { dir: "src/config", label: "Config", note: "Configuración de la aplicación." },
  { dir: "src/mocks", label: "Mocks", note: "MSW: implementa docs/API_CONTRACT.md." },
  { dir: "src/i18n", label: "i18n", note: "Idiomas y textos traducibles." },
  { dir: "src/themes", label: "Temas", note: "Presets, tokens derivados y selector." },
];
const SOURCE = /\.tsx?$/;
const SKIP = /(\.test\.tsx?|\.d\.ts)$/;
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const SUMMARY_MAX = 110;

const posix = (path) => path.split(sep).join("/");

function walk(dir, out = []) {
  let names;
  try {
    names = readdirSync(dir).sort();
  } catch {
    return out; // un área puede no existir todavía
  }
  for (const name of names) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE.test(name) && !SKIP.test(name)) out.push(full);
  }
  return out;
}

const parse = (file) =>
  ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

const isExported = (node) => ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

/** La primera frase del JSDoc de un nodo, en una línea. */
function docSummary(node) {
  const doc = ts.getJSDocCommentsAndTags(node).find(ts.isJSDoc);
  const raw = doc && ts.getTextOfJSDocComment(doc.comment);
  if (!raw) return "";
  const first = raw.replace(/\s+/g, " ").split(/(?<=\.)\s/)[0].trim();
  return first.length > SUMMARY_MAX ? `${first.slice(0, SUMMARY_MAX - 1).trimEnd()}…` : first;
}

/** Texto de un literal de cadena o plantilla, sin comillas; `null` si no lo es. */
function literalText(node) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.getText().slice(1, -1);
  return null;
}

/** `api.get("/users")` o `http.get(`${BASE}/users`)` → `GET /users`. */
function endpointCall(node, object) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return null;
  const { expression, name } = node.expression;
  if (!ts.isIdentifier(expression) || expression.text !== object || !HTTP_METHODS.has(name.text)) return null;
  const path = literalText(node.arguments[0]);
  return path ? `${name.text.toUpperCase()} ${path.replace(/^\$\{BASE\}/, "")}` : null;
}

/** El primer componente JSX dentro de un nodo: la pantalla que monta una ruta. */
function firstJsxTag(node) {
  let found = null;
  const visit = (child) => {
    if (found) return;
    if (ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) found = child.tagName.getText();
    else ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

function describeFile(root, full) {
  const source = parse(full);
  const exports = [];
  const pieces = new Set();
  const modules = new Set();
  const calls = new Set();
  const mocked = [];
  let summary = "";

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const from = statement.moduleSpecifier.text;
      if (from.startsWith("@/components/")) {
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings) && !statement.importClause.isTypeOnly) {
          for (const element of bindings.elements) if (!element.isTypeOnly) pieces.add((element.propertyName ?? element.name).text);
        }
      } else if (from.startsWith("@/")) {
        modules.add(from.split("/").slice(0, 3).join("/"));
      }
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause) && !statement.moduleSpecifier) {
        for (const element of statement.exportClause.elements) exports.push(element.name.text);
      }
      continue;
    }
    if (!isExported(statement)) continue;
    summary ||= docSummary(statement);
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) exports.push(declaration.name.text);
    } else if (statement.name) {
      exports.push(statement.name.text);
    }
  }

  const visit = (node) => {
    const call = endpointCall(node, "api");
    if (call) calls.add(call);
    const mock = endpointCall(node, "http");
    if (mock) mocked.push(mock);
    ts.forEachChild(node, visit);
  };
  visit(source);

  return { file: posix(relative(root, full)), summary, exports, pieces: [...pieces].sort(), modules: [...modules].sort(), calls: [...calls], mocked };
}

/** Las rutas de `src/app/router.tsx`: cada objeto con `path` y lo que monta. */
function describeRoutes(root) {
  let source;
  try {
    source = parse(join(root, "src/app/router.tsx"));
  } catch {
    return [];
  }
  const routes = [];
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const prop = (name) => node.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === name)?.initializer;
      const path = literalText(prop("path"));
      if (path) {
        const element = prop("element");
        const screen = element ? firstJsxTag(element) : null;
        routes.push({ path: path.startsWith("/") || path === "*" ? path : `/${path}`, screen: screen ?? "pendiente (SectionPlaceholderPage)" });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return routes;
}

function fileLine(entry, base) {
  const parts = [];
  if (entry.exports.length) parts.push(entry.exports.map((name) => `\`${name}\``).join(", "));
  if (entry.calls.length) parts.push(`llama: ${entry.calls.join(", ")}`);
  if (entry.pieces.length) parts.push(`piezas: ${entry.pieces.join(", ")}`);
  if (entry.modules.length) parts.push(`usa: ${entry.modules.join(", ")}`);
  const name = entry.file.slice(base.length + 1);
  return `- **${name}**${entry.summary ? ` — ${entry.summary}` : ""}${parts.length ? ` · ${parts.join(" · ")}` : ""}`;
}

/** Un barrel solo reexporta: no aporta nada que no digan sus vecinos. */
const isBarrel = (entry) => /\/index\.ts$/.test(entry.file) && !entry.exports.length && !entry.summary;

export function buildCodemap(root) {
  const md = ["# Mapa del código de producto", ""];
  md.push("Generado con `npm run codemap` desde `src/`. No se edita a mano. Las piezas del sistema de diseño están en `ai-tools/CATALOG.md`; aquí está lo que se construyó con ellas.", "");
  md.push("Cada línea: archivo — qué es · lo que exporta · `llama:` endpoints · `piezas:` componentes del sistema que usa · `usa:` otros módulos. Ve directo al archivo que necesitas; no leas carpetas enteras.", "");

  const routes = describeRoutes(root);
  if (routes.length) {
    md.push("## Rutas", "", "De `src/app/router.tsx`.", "");
    for (const route of routes) md.push(`- \`${route.path}\` → ${route.screen}`);
    md.push("");
  }

  const areas = AREAS.map((area) => ({ ...area, entries: walk(join(root, area.dir)).map((full) => describeFile(root, full)) }));
  const mocked = areas.flatMap((area) => area.entries.flatMap((entry) => entry.mocked.map((endpoint) => ({ endpoint, file: entry.file }))));
  if (mocked.length) {
    md.push("## Endpoints simulados", "", "Lo que responde MSW hoy.", "");
    for (const { endpoint, file } of mocked) md.push(`- \`${endpoint}\` · ${file}`);
    md.push("");
  }

  for (const area of areas) {
    const entries = area.entries.filter((entry) => !isBarrel(entry));
    if (!entries.length) continue;
    md.push(`## ${area.label} · \`${area.dir}\``, "", area.note, "");
    const folders = new Map();
    for (const entry of entries) {
      const folder = dirname(entry.file);
      folders.set(folder, [...(folders.get(folder) ?? []), entry]);
    }
    for (const [folder, list] of folders) {
      if (folder !== area.dir) md.push(`### ${folder.slice(area.dir.length + 1)}`, "");
      for (const entry of list) md.push(fileLine(entry, folder));
      md.push("");
    }
  }
  return md.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const out = join(root, CODEMAP_FILE);
  const md = buildCodemap(root);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, md);
  console.log(`codemap: ${md.split("\n").filter((line) => line.startsWith("- **")).length} archivos → ${CODEMAP_FILE}`);
}
