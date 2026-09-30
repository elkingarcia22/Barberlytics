import { createChatStore, createDemoBackend, type ChatBackend } from "@/lib/chat";
import { createHelpBackend } from "@/help/chat/helpBackend";

/**
 * El chat de la app: un solo almacén de conversaciones para el panel, la
 * pantalla completa y el modo voz, y quien responde.
 *
 * Mientras no hay un modelo detrás, responde el centro de ayuda cuando un
 * artículo cubre la pregunta y, si no, las respuestas de ejemplo que
 * enseñan lo que el chat sabe hacer (preguntas con opciones, tarjetas,
 * sugerencias). Cambiar esto por un modelo es cambiar `createAppChatBackend`.
 */
export const chatStore = createChatStore({ storageKey: "barberlytics-chat" });

export interface AppChatLabels {
  from: (title: string) => string;
  notFound: string;
  openArticle: string;
  seeMore: string;
}

export function createAppChatBackend(labels: AppChatLabels): ChatBackend {
  return createHelpBackend({ labels, fallback: createDemoBackend() });
}
