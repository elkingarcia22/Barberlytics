import { answerFromArticle, isConfidentAnswer, searchHelp, type HelpArticleMeta, type HelpIndex } from "@/lib/help";
import type { ChatBackend, ChatReply } from "@/lib/chat";
import { helpPath, loadHelpArticle, loadHelpIndex, loadHelpSearchDocs } from "../content";
import { prepareBody } from "../markdown/prepareBody";

/** La respuesta y dos artículos más que también podrían servir. */
const HITS = 3;

export interface HelpBackendOptions {
  /** Cuando ningún artículo cubre la pregunta. Sin esto, se responde que no se encontró. */
  fallback?: ChatBackend;
  /** Textos de la respuesta, ya traducidos. */
  labels: {
    from: (title: string) => string;
    notFound: string;
    openArticle: string;
    seeMore: string;
  };
}

/** Un artículo del índice como fuente de la respuesta. */
function sourceOf(article: HelpArticleMeta | undefined, index: HelpIndex): { label: string; detail?: string } | null {
  if (!article) return null;
  const section = index.sections.find((item) => item.id === article.section)?.title;
  return { label: article.title, detail: section };
}

/**
 * Quien responde con el centro de ayuda: busca el artículo que mejor
 * encaja y contesta con su resumen y sus pasos, con el artículo entero a
 * un toque y los relacionados como sugerencias. Si nada cubre la pregunta
 * se la pasa a `fallback` (las respuestas de ejemplo), o dice que no.
 */
export function createHelpBackend({ fallback, labels }: HelpBackendOptions): ChatBackend {
  return {
    async reply(question, history, signal): Promise<ChatReply> {
      // A media conversación con quien responde de respaldo —contestando su
      // pregunta con opciones o tocando una de sus sugerencias— se sigue con él:
      // «3» o «Preparar un aviso» no son preguntas para el centro de ayuda.
      const last = [...history].reverse().find((message) => message.role === "agent");
      if (fallback && last?.via && last.via !== "help" && (last.question || last.followups?.includes(question))) {
        return fallback.reply(question, history, signal);
      }
      const docs = await loadHelpSearchDocs();
      const hits = searchHelp(docs, question, { limit: HITS });
      const top = hits[0];
      if (!top || !isConfidentAnswer(top, question)) {
        if (fallback) return fallback.reply(question, history, signal);
        return { text: labels.notFound };
      }
      const [index, markdown] = await Promise.all([loadHelpIndex(), loadHelpArticle(top.id)]);
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const article = index.articles[top.id];
      const answer = answerFromArticle(prepareBody(markdown, index));
      const parts = [labels.from(article?.title ?? top.id)];
      if (answer.summary) parts.push(answer.summary);
      if (answer.body) parts.push(answer.heading ? `**${answer.heading}**\n\n${answer.body}` : answer.body);
      if (answer.truncated) parts.push(`_${labels.seeMore}_`);
      const related = hits
        .slice(1)
        .map((hit) => index.articles[hit.id]?.title)
        .filter((title): title is string => Boolean(title));
      return {
        text: parts.join("\n\n"),
        sources: [sourceOf(article, index)].filter((source): source is { label: string; detail?: string } => source !== null),
        link: { label: labels.openArticle, href: helpPath(top.id) },
        followups: related,
        via: "help",
      };
    },
  };
}
