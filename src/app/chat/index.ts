import { createChatStore, type ChatBackend, type ChatPersistence } from "@/lib/chat";
import { createHelpBackend } from "@/help/chat/helpBackend";
import type { HelpLocale } from "@/help/content";

/**
 * El chat de la app: un solo almacén de conversaciones para el panel, la
 * pantalla completa y el modo voz, y quien responde.
 *
 * Mientras no hay un modelo detrás, responde el centro de ayuda cuando un
 * artículo cubre la pregunta y, si no, lo dice y ofrece el artículo más
 * cercano: nunca respuestas de ejemplo con cifras inventadas. Cambiar esto por
 * un modelo es cambiar `createAppChatBackend`.
 *
 * Las conversaciones hablan de clientes (a veces de alergias o teléfonos):
 * viven en la pestaña (`sessionStorage`), no en el navegador para siempre, y se
 * borran al cerrar sesión (`clearChatOnLogout`).
 */
function tabPersistence(): ChatPersistence | null {
  if (typeof window === "undefined") return null;
  return {
    get: (key) => {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        // Sin almacenamiento: la conversación vive mientras dure la página.
      }
    },
  };
}

const LEGACY_KEY = "barberlytics-chat";
try {
  // Lo que quedó guardado para siempre en versiones anteriores se borra.
  if (typeof window !== "undefined") window.localStorage.removeItem(LEGACY_KEY);
} catch {
  // Almacenamiento bloqueado: no había nada que borrar.
}

export const chatStore = createChatStore({ storageKey: LEGACY_KEY, persistence: tabPersistence() });

/** Al cerrar sesión, las conversaciones se van con ella. */
export const clearChatOnLogout = (): void => chatStore.clear();

export interface AppChatLabels {
  from: (title: string) => string;
  notFound: string;
  openArticle: string;
  seeMore: string;
}

export function createAppChatBackend(labels: AppChatLabels, locale: HelpLocale): ChatBackend {
  return createHelpBackend({ labels, locale });
}
