import * as React from "react";
import type { ChatBackend, ChatState, ChatStore, Conversation } from "@/lib/chat";

export interface ChatConnector {
  id: string;
  label: string;
  connected: boolean;
}

export interface ChatNews {
  /** «Ya ejecuta acciones en **Selección**.» El Markdown ligero vale. */
  text: string;
  onOpen?: () => void;
  onDismiss?: () => void;
}

export interface ChatContextValue {
  store: ChatStore;
  backend: ChatBackend;
  /** Quien pregunta; su nombre va en el saludo. */
  user: { name: string };
  /** BCP 47 para la voz: `es-CO`, `en-US`. */
  lang: string;
  /** Enlaces internos de una respuesta. */
  onNavigate?: (href: string) => void;
  /** Preguntas para arrancar una conversación nueva. */
  suggestions?: readonly string[];
  connectors?: readonly ChatConnector[];
  onToggleConnector?: (id: string, connected: boolean) => void;
  onAddConnectors?: () => void;
  news?: ChatNews;
  /** Abrir la conversación en pantalla completa; sin esto el panel no ofrece el botón. */
  onOpenFull?: (conversationId: string | null) => void;
  /** Abrir el modo voz; sin esto no hay botón Voz. */
  onOpenVoice?: () => void;
}

export const ChatContext = React.createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const value = React.useContext(ChatContext);
  if (!value) throw new Error("useChatContext: falta <ChatProvider> por encima.");
  return value;
}

/** El estado del almacén, suscrito. */
export function useChatState(): ChatState {
  const { store } = useChatContext();
  return React.useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** La conversación activa, o `null` si es nueva. */
export function useActiveConversation(): Conversation | null {
  const state = useChatState();
  return state.conversations.find((conversation) => conversation.id === state.activeId) ?? null;
}

/** Las acciones del chat, ya atadas al almacén y a quien responde. */
export function useChatActions() {
  const { store, backend } = useChatContext();
  return React.useMemo(
    () => ({
      send: (text: string) => store.send(text, backend),
      answer: (messageId: string, option: string) => store.answer(messageId, option, backend),
      regenerate: () => store.regenerate(backend),
      edit: (messageId: string, text: string) => store.edit(messageId, text, backend),
      stop: store.stop,
      finish: store.finish,
      feedback: store.feedback,
      setActive: store.setActive,
      remove: store.remove,
      newConversation: () => store.setActive(null),
    }),
    [store, backend]
  );
}
