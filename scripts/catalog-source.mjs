/**
 * De qué se genera el catálogo y cómo saber si quedó viejo.
 *
 * `npm run catalog` guarda en `ai-tools/catalog.json` la huella de sus fuentes;
 * `npm run check` la recalcula (solo lee archivos, no arranca Vite) y falla si
 * no coincide. Así un cambio en el registro no puede entrar sin su catálogo.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const CATALOG_SOURCES = [
  "src/docs/registry",
  "src/docs/guidePages.ts",
  "src/docs/foundationPages.ts",
  "src/icons/iconRegistry.ts",
  "src/styles/tokens.css",
];

function walk(path, out) {
  if (!statSync(path).isDirectory()) return out.push(path), out;
  for (const name of readdirSync(path)) walk(join(path, name), out);
  return out;
}

/** Huella de las fuentes del catálogo: ruta y contenido de cada archivo, en orden. */
export function catalogSourceHash(root) {
  const hash = createHash("sha256");
  const files = CATALOG_SOURCES.flatMap((source) => walk(join(root, source), [])).sort();
  for (const file of files) {
    hash.update(relative(root, file).split(sep).join("/"));
    hash.update(readFileSync(file, "utf8").replace(/\r\n/g, "\n"));
  }
  return hash.digest("hex").slice(0, 16);
}
