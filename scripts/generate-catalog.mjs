#!/usr/bin/env node
/**
 * npm run catalog — el catálogo de componentes que lee la IA.
 *
 * Carga el registro de la documentación (`src/docs/registry`) con el servidor
 * de Vite en modo SSR, así se ejecuta el mismo TypeScript que ve la doc y no
 * hay una segunda fuente que mantener. Escribe tres niveles, del más barato
 * de leer al más caro:
 *   ai-tools/CATALOG.md           — el índice: una línea por componente (qué es
 *                                   y de dónde se importa), guías, fundamentos e
 *                                   iconos. Es lo único que se lee entero.
 *   ai-tools/components/<id>.md   — la ficha de un componente: props, guías,
 *                                   relacionados y todos sus ejemplos. Se abre
 *                                   solo la de la pieza que se va a usar.
 *   ai-tools/catalog.json         — todo junto, para consultarlo con un script;
 *                                   no para leerlo de corrido.
 * La salida no lleva fecha: depende solo de las fuentes, y `sourceHash` deja
 * que `npm run check` avise cuando el catálogo quedó viejo.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "vite";
import { catalogSourceHash } from "./catalog-source.mjs";

const ROOT = process.cwd();
const OUT = join(ROOT, "ai-tools");
const FICHAS = join(OUT, "components");
const SUMMARY_MAX = 140;

/** El catálogo se escribe en español, el idioma fuente de la doc. */
const text = (value) => (value && typeof value === "object" ? (value.es ?? value.en ?? "") : (value ?? ""));
const cell = (value) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** La primera frase de la descripción, recortada: lo justo para elegir la pieza. */
function summary(description) {
  const first = description.split(/(?<=\.)\s/)[0].trim();
  return first.length > SUMMARY_MAX ? `${first.slice(0, SUMMARY_MAX - 1).trimEnd()}…` : first;
}

/** `import { A, B } from "@/x"` → `@/x`: el nombre ya está en la línea del índice. */
const importSource = (statement) => statement.match(/from\s+["']([^"']+)["']/)?.[1] ?? statement;

function ficha(c, groupLabel) {
  const md = [`# ${c.name}${c.status !== "stable" ? ` (${c.status})` : ""}`, "", c.description, ""];
  md.push(`Familia: ${groupLabel} · Doc: \`${c.docs}\`${c.source ? ` · Fuente: \`${c.source}\`` : ""}`, "");
  md.push("```ts", c.import, "```", "");
  if (c.props.length) {
    md.push("## Props", "", "| Prop | Tipo | Default | Qué hace |", "|---|---|---|---|");
    for (const p of c.props) md.push(`| \`${p.name}\` | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ""} | ${cell(p.description)} |`);
    md.push("");
  }
  if (c.guidelines.do?.length || c.guidelines.dont?.length) {
    md.push("## Guías", "");
    for (const rule of c.guidelines.do ?? []) md.push(`- Sí: ${rule}`);
    for (const rule of c.guidelines.dont ?? []) md.push(`- No: ${rule}`);
    md.push("");
  }
  if (c.related.length) md.push(`Relacionados: ${c.related.join(", ")}`, "");
  if (c.examples.length) md.push("## Ejemplos", "");
  for (const ex of c.examples) {
    md.push(`### ${ex.title}`, "");
    if (ex.description) md.push(ex.description, "");
    md.push("```tsx", ex.code, "```", "");
  }
  return md.join("\n");
}

const server = await createServer({
  root: ROOT,
  configFile: join(ROOT, "vite.config.ts"),
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: "custom",
  logLevel: "error",
});

try {
  const registry = await server.ssrLoadModule("/src/docs/registry/index.ts");
  const guides = await server.ssrLoadModule("/src/docs/guidePages.ts");
  const foundations = await server.ssrLoadModule("/src/docs/foundationPages.ts");
  const icons = await server.ssrLoadModule("/src/icons/iconRegistry.ts");

  const groups = registry.DOC_GROUPS.map((g) => ({ id: g.id, label: text(g.label), description: text(g.description) }));
  const components = [...registry.ALL_ENTRIES]
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
    .map((e) => ({
      id: e.id,
      name: e.name,
      group: e.group,
      description: text(e.description),
      import: e.importPath,
      source: e.sourcePath ?? null,
      status: e.status ?? "stable",
      tags: e.tags ?? [],
      props: (e.props ?? []).map((p) => ({ name: p.name, type: p.type, default: p.default ?? null, description: text(p.description) })),
      guidelines: { do: (e.guidelines?.do ?? []).map(text), dont: (e.guidelines?.dont ?? []).map(text) },
      related: e.related ?? [],
      examples: e.examples.map((x) => ({ id: x.id, title: text(x.title), description: x.description ? text(x.description) : null, code: x.code })),
      docs: `/docs#/components/${e.id}`,
      ficha: `ai-tools/components/${e.id}.md`,
    }));

  const tokensCss = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf8");
  const tokens = [...tokensCss.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => ({ name: m[1], value: m[2].trim() }));
  const iconNames = Object.keys(icons.iconRegistry ?? icons.ICON_REGISTRY ?? {}).sort();

  const catalog = {
    sourceHash: catalogSourceHash(ROOT),
    source: "src/docs/registry (npm run catalog)",
    rules: "AGENTS.md",
    groups,
    components,
    guides: guides.GUIDE_PAGES.map((g) => ({ id: g.id, section: g.section, label: text(g.label), description: text(g.description), docs: `/docs#/guides/${g.id}` })),
    foundations: foundations.FOUNDATION_PAGES.map((f) => ({ id: f.id, label: text(f.label), docs: `/docs#/foundations/${f.id}` })),
    icons: iconNames,
    tokens,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

  // Las fichas se regeneran desde cero: un componente borrado no deja la suya huérfana.
  rmSync(FICHAS, { recursive: true, force: true });
  mkdirSync(FICHAS, { recursive: true });
  const groupLabel = new Map(groups.map((g) => [g.id, g.label]));
  for (const c of components) writeFileSync(join(FICHAS, `${c.id}.md`), ficha(c, groupLabel.get(c.group) ?? c.group));

  const md = [];
  md.push("# Catálogo de componentes Thema", "", "Generado con `npm run catalog` desde `src/docs/registry`. No se edita a mano. Las reglas están en `AGENTS.md`.", "");
  md.push(`**${components.length} componentes** en ${groups.length} familias · ${iconNames.length} iconos en el registro · ${tokens.length} tokens.`, "");
  md.push("Este archivo es el índice: sirve para elegir la pieza. Antes de usarla, abre su ficha en `ai-tools/components/<id>.md` (props, guías y ejemplos); el `<id>` va entre corchetes en cada línea. No leas `catalog.json` entero: es el mismo contenido para consultarlo con un script.", "");
  md.push("## Guías", "");
  for (const g of catalog.guides) md.push(`- **${g.label}** (${g.section}) — ${g.description} → \`${g.docs}\``);
  md.push("", "## Fundamentos", "");
  for (const f of catalog.foundations) md.push(`- ${f.label} → \`${f.docs}\``);
  for (const group of groups) {
    const list = components.filter((c) => c.group === group.id);
    if (!list.length) continue;
    md.push("", `## ${group.label} · ${list.length}`, "", group.description, "");
    for (const c of list) md.push(`- **${c.name}** [${c.id}]${c.status !== "stable" ? ` (${c.status})` : ""} — ${summary(c.description)} \`${importSource(c.import)}\``);
  }
  md.push("", "## Iconos del registro", "", "`<ThemaIcon name=\"…\" />` · " + iconNames.join(", "), "");
  writeFileSync(join(OUT, "CATALOG.md"), md.join("\n"));
  console.log(`catalog: ${components.length} componentes, ${groups.length} familias, ${iconNames.length} iconos, ${tokens.length} tokens → ai-tools/`);
} finally {
  await server.close();
}
