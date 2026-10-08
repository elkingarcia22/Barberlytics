import { tokenize } from "./text";

/**
 * La respuesta que el chat de ayuda saca de un artículo.
 *
 * Todavía no hay un modelo que redacte: el chat responde con el artículo que
 * mejor encaja. Pero no con el artículo entero —eso es la página—, sino con lo
 * que contesta la pregunta: el «En resumen» y los pasos (o, si no hay pasos,
 * cómo llegar o dónde está). Sin capturas ni preguntas frecuentes; para eso
 * está el botón al artículo completo.
 */
export interface HelpAnswer {
  /** El «En resumen:» del artículo, en Markdown, o el primer párrafo si no lo tiene. */
  summary: string | null;
  /** El título de la sección que se muestra («Pasos», «Dónde está»…). */
  heading: string | null;
  /** Esa sección en Markdown, sin capturas. */
  body: string | null;
  /** Si la sección tenía más de lo que cabe en el chat. */
  truncated: boolean;
}

/**
 * Las secciones que dicen cómo hacer algo, en orden de preferencia. Van en
 * los dos idiomas del contenido: los títulos fijos de cada traducción están
 * en `TRANSLATING.md` del repo de contenido.
 */
const HOW_TO_HEADINGS = [
  ["Pasos", "Steps"],
  ["Cómo llegar", "How to get there"],
  ["Dónde está", "Where it is"],
  ["Qué muestra", "What it shows"],
  ["Para qué te sirve", "What it's for"],
] as const;

/** Lo que cabe en una burbuja sin volverse la página entera. */
const MAX_LINES = 8;

const SUMMARY = /^\*\*(?:En resumen|In short):\*\*\s*(.+)$/m;

function stripFrontmatterAndTitle(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\s*#\s+.+\n+/, "");
}

/** Las secciones `## Título` del cuerpo, con su contenido. */
function sections(body: string): Map<string, string> {
  const found = new Map<string, string>();
  const parts = body.split(/^##\s+/m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf("\n");
    const title = (newline === -1 ? part : part.slice(0, newline)).trim();
    found.set(title, newline === -1 ? "" : part.slice(newline + 1));
  }
  return found;
}

/** Quita capturas y avisos, y corta a `MAX_LINES` líneas con contenido. */
function tidy(section: string): { text: string; truncated: boolean } {
  const lines = section
    .split("\n")
    .filter((line) => !/^\s*!\[/.test(line) && !/^\s*>/.test(line))
    .map((line) => line.trimEnd());
  const meaningful = lines.filter((line) => line.trim().length > 0);
  const kept = meaningful.slice(0, MAX_LINES);
  return { text: kept.join("\n").trim(), truncated: meaningful.length > MAX_LINES };
}

/** La primera letra en mayúscula, aunque vaya dentro de `**negrita**`. */
function capitalize(text: string): string {
  return text.replace(/^(\**)(\p{Ll})/u, (_, marks: string, letter: string) => `${marks}${letter.toUpperCase()}`);
}

export function answerFromArticle(markdown: string): HelpAnswer {
  const body = stripFrontmatterAndTitle(markdown);
  const summaryMatch = SUMMARY.exec(body);
  const bySection = sections(body);
  const heading = HOW_TO_HEADINGS.flat().find((title) => bySection.has(title)) ?? null;
  const section = heading ? tidy(bySection.get(heading) ?? "") : null;

  // Tras «En resumen:» el artículo sigue en minúscula; suelto en el chat abre la frase.
  let summary = summaryMatch ? capitalize(summaryMatch[1].trim()) : null;
  if (!summary && !section?.text) {
    const firstParagraph = body.split(/\n{2,}/).find((block) => block.trim() && !block.startsWith("#"));
    summary = firstParagraph?.trim() ?? null;
  }

  return {
    summary,
    heading: section?.text ? heading : null,
    body: section?.text ? section.text : null,
    truncated: section?.truncated ?? false,
  };
}

/** El artículo tiene que cubrir más de esta parte de la pregunta para contestarla. */
const MIN_COVERAGE = 0.5;

/**
 * Si el mejor resultado sirve de respuesta. Una búsqueda siempre devuelve
 * algo —basta una palabra corregida—, pero un chat que contesta cualquier
 * cosa engaña: si el artículo no junta más de la mitad de las palabras con
 * sentido de la pregunta, es mejor decir que no se encontró. De dos palabras,
 * las dos: «plataforma marciana» no se contesta con un artículo de «plataforma».
 */
export function isConfidentAnswer(hit: { matched: readonly string[] } | undefined, question: string): boolean {
  if (!hit) return false;
  const terms = tokenize(question).length;
  if (terms === 0) return false;
  return Math.min(1, new Set(hit.matched).size / terms) > MIN_COVERAGE;
}
