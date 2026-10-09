import * as React from "react";

/**
 * Pasar a la Conversación desde otra experiencia (Paso a paso, Agenda con selector): quien prefiere
 * escribir lo que quiere lo hace sin buscar otra página. `null` donde no se ofrece.
 */
const SwitchToChatContext = React.createContext<(() => void) | null>(null);

export const SwitchToChatProvider = SwitchToChatContext.Provider;

export const useSwitchToChat = (): (() => void) | null => React.useContext(SwitchToChatContext);

/**
 * «Agenda con Clipper» desde otra experiencia: Clipper abre con la voz ya escuchando. La experiencia
 * se monta de nuevo al cambiar, así que el aviso se deja aquí y lo lee la Conversación al abrir.
 */
let voiceOnArrival = false;

export const requestVoiceOnArrival = () => {
  voiceOnArrival = true;
};

export const peekVoiceOnArrival = () => voiceOnArrival;

export const clearVoiceOnArrival = () => {
  voiceOnArrival = false;
};
