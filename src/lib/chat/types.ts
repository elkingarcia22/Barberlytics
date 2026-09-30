/**
 * El modelo de una conversación con el agente.
 *
 * Es independiente de quién responde: hoy contestan los artículos de ayuda y
 * unas respuestas de ejemplo; mañana un modelo. Lo que cambia es el
 * `ChatBackend`; las conversaciones, los mensajes y lo que un mensaje puede
 * traer (fuentes, sugerencias, una pregunta con opciones, una tarjeta) son
 * siempre los mismos, y de eso viven el panel, la pantalla completa y el
 * modo voz.
 */

export type ChatRole = "user" | "agent";

/** De dónde sacó el agente lo que dice. */
export interface ChatSource {
  label: string;
  detail?: string;
}

/**
 * Una pregunta del agente con opciones numeradas. La persona elige una (con
 * el ratón o con la tecla del número) o escribe la suya en «Otro».
 */
export interface ChatQuestion {
  options: readonly string[];
  /** Placeholder de «Otro»; sin él no hay campo libre. */
  otherPlaceholder?: string;
  /** La respuesta que se dio, si ya se respondió. */
  answer?: string;
}

/** Una tarjeta con datos dentro de la respuesta. */
export type ChatCard =
  | { kind: "bars"; title: string; rows: readonly { label: string; value: number; display?: string }[] }
  | { kind: "metrics"; title?: string; items: readonly { label: string; value: string; delta?: string; tone?: "positive" | "negative" | "neutral" }[] };

/** Un enlace que la respuesta ofrece («Ver el artículo completo»). */
export interface ChatLink {
  label: string;
  href: string;
}

export type ChatMessageStatus =
  /** El agente aún no ha contestado. */
  | "pending"
  /** La respuesta llegó y se está escribiendo en pantalla. */
  | "streaming"
  | "done"
  /** La persona la detuvo a medias. */
  | "stopped"
  | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Markdown ligero: negritas, listas, enlaces. */
  text: string;
  createdAt: number;
  status: ChatMessageStatus;
  sources?: readonly ChatSource[];
  /** Preguntas para seguir; se muestran solo en la última respuesta. */
  followups?: readonly string[];
  question?: ChatQuestion;
  card?: ChatCard;
  link?: ChatLink;
  /** Qué le pareció a la persona. */
  feedback?: "up" | "down";
  /** Quién respondió (`help`, `demo`, `model`…), para que el siguiente turno siga con el mismo. */
  via?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: readonly ChatMessage[];
  /** Llegó una respuesta mientras no se estaba mirando. */
  unread: boolean;
}

/** Lo que devuelve quien responde. */
export interface ChatReply {
  text: string;
  sources?: readonly ChatSource[];
  followups?: readonly string[];
  question?: ChatQuestion;
  card?: ChatCard;
  link?: ChatLink;
  via?: string;
}

/**
 * Quien contesta. Recibe la pregunta y lo dicho hasta ahora; `signal` avisa
 * si la persona detuvo la respuesta o cerró la conversación.
 */
export interface ChatBackend {
  reply: (question: string, history: readonly ChatMessage[], signal: AbortSignal) => Promise<ChatReply>;
}

export interface ChatState {
  conversations: readonly Conversation[];
  /** `null` es una conversación nueva, todavía sin mensajes. */
  activeId: string | null;
}
