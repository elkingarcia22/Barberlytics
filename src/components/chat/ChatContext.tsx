import * as React from "react";
import { ChatContext, type ChatContextValue } from "./useChat";

/**
 * Lo que comparten el panel, la pantalla completa, el historial y el modo
 * voz: el almacén de conversaciones, quién responde y quién pregunta. Se
 * monta una vez en la app; las piezas de dentro solo lo leen.
 */
export function ChatProvider({ value, children }: { value: ChatContextValue; children: React.ReactNode }) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
