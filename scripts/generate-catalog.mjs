#!/usr/bin/env node
/**
 * npm run catalog — el catálogo de componentes que lee la IA.
 *
 * Carga el registro de la documentación (`src/docs/registry`) con el servidor
 * de Vite en modo SSR, así se ejecuta el mismo TypeScript que ve la doc y no
 * hay una segunda fuente que mantener. Escribe:
 *   ai-tools/catalog.json — cada componente con id, nombre, grupo, descripción,
 *                           import, ruta, estado, tags, props, guías, relacionados
 *                           y el código de sus ejemplos;
 *   ai-tools/CATALOG.md   — lo mismo, legible, agrupado por familia.
 * También lista los tokens (tokens.css), los iconos del registro y las guías.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "vite";

const ROOT = process.cwd();
const OUT = join(ROOT, "ai-tools");

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

  const groups = registry.DOC_GROUPS.map((g) => ({ id: g.id, label: g.label, description: g.description }));
  const components = [...registry.ALL_ENTRIES]
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
    .map((e) => ({
      id: e.id,
      name: e.name,
      group: e.group,
      description: e.description,
      import: e.importPath,
      source: e.sourcePath ?? null,
      status: e.status ?? "stable",
      tags: e.tags ?? [],
      props: (e.props ?? []).map((p) => ({ name: p.name, type: p.type, default: p.default ?? null, description: p.description })),
      guidelines: e.guidelines ?? {},
      related: e.related ?? [],
      examples: e.examples.map((x) => ({ id: x.id, title: x.title, description: x.description ?? null, code: x.code })),
      docs: `/docs#/components/${e.id}`,
    }));

  const tokensCss = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf8");
  const tokens = [...tokensCss.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => ({ name: m[1], value: m[2].trim() }));
  const iconNames = Object.keys(icons.iconRegistry ?? icons.ICON_REGISTRY ?? {}).sort();

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: "src/docs/registry (npm run catalog)",
    rules: "AGENTS.md",
    groups,
    components,
    guides: guides.GUIDE_PAGES.map((g) => ({ id: g.id, section: g.section, label: g.label, description: g.description, docs: `/docs#/guides/${g.id}` })),
    foundations: foundations.FOUNDATION_PAGES.map((f) => ({ id: f.id, label: f.label, docs: `/docs#/foundations/${f.id}` })),
    icons: iconNames,
    tokens,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

  const md = [];
  md.push("# Catálogo de componentes Thema", "", `Generado el ${catalog.generatedAt.slice(0, 10)} con \`npm run catalog\` desde \`src/docs/registry\`. No se edita a mano. Las reglas están en \`AGENTS.md\`; cada ficha completa en \`/docs#/components/<id>\`.`, "");
  md.push(`**${components.length} componentes** en ${groups.length} familias · ${iconNames.length} iconos en el registro · ${tokens.length} tokens.`, "");
  md.push("## Guías", "");
  for (const g of catalog.guides) md.push(`- **${g.label}** (${g.section}) — ${g.description} → \`${g.docs}\``);
  md.push("", "## Fundamentos", "");
  for (const f of catalog.foundations) md.push(`- ${f.label} → \`${f.docs}\``);
  for (const group of groups) {
    const list = components.filter((c) => c.group === group.id);
    if (!list.length) continue;
    md.push("", `## ${group.label} · ${list.length}`, "", group.description, "");
    for (const c of list) {
      md.push(`### ${c.name}${c.status !== "stable" ? ` (${c.status})` : ""}`, "");
      md.push(c.description, "");
      md.push("```ts", c.import, "```", "");
      if (c.props.length) {
        md.push("| Prop | Tipo | Default | Qué hace |", "|---|---|---|---|");
        for (const p of c.props) md.push(`| \`${p.name}\` | \`${p.type.replace(/\|/g, "\\|")}\` | ${p.default ? `\`${p.default.replace(/\|/g, "\\|")}\`` : ""} | ${p.description.replace(/\|/g, "\\|")} |`);
        md.push("");
      }
      const ex = c.examples[0];
      if (ex) md.push(`Ejemplo · ${ex.title}:`, "", "```tsx", ex.code, "```", "");
      if (c.guidelines.do?.length) md.push(`Sí: ${c.guidelines.do.join(" · ")}`);
      if (c.guidelines.dont?.length) md.push(`No: ${c.guidelines.dont.join(" · ")}`);
      if (c.related.length) md.push(`Relacionados: ${c.related.join(", ")}`);
      md.push("");
    }
  }
  md.push("## Iconos del registro", "", "`<ThemaIcon name=\"…\" />` · " + iconNames.join(", "), "");
  writeFileSync(join(OUT, "CATALOG.md"), md.join("\n"));
  console.log(`catalog: ${components.length} componentes, ${groups.length} familias, ${iconNames.length} iconos, ${tokens.length} tokens → ai-tools/`);
} finally {
  await server.close();
}
