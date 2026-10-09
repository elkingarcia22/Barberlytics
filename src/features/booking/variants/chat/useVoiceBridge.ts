import * as React from "react";
import type { ChatReply } from "@/lib/chat";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import type { ChatEngine } from "./useChatBooking";
import { fromVoice, matchSpokenOption, voiceReplyFromTurns } from "./voiceReply";

/** Cuánto tiene que quedarse quieta la conversación (sin «escribiendo» ni mensajes nuevos) para dar la respuesta por dicha. */
const SETTLE_MS = 700;
/** Si el motor no contesta, la voz no se queda esperando para siempre. */
const MAX_WAIT_MS = 12000;

interface Waiter {
  from: number;
  resolve: (reply: ChatReply) => void;
  settle?: number;
  deadline: number;
}

/**
 * La conversación por voz con Clipper sobre el mismo motor del chat escrito: lo dicho entra como si
 * se hubiera escrito (`begin` desde la portada, `send` en el chat), así entiende los mismos casos
 * —servicio, barbero, día y hora en una frase, el celular, el código, elegir de una lista, cambiar
 * algo, pagar, el recibo—, y cuando Clipper termina de contestar devuelve lo que hay que decirle.
 */
export function useVoiceBridge(engine: ChatEngine, { started, start }: { started: boolean; start: (text: string) => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const latest = React.useRef({ engine, started, start });
  const waiter = React.useRef<Waiter | null>(null);
  /** Las opciones que Clipper acaba de leer: lo dicho se busca entre ellas («la segunda», «no gracias»). */
  const lastOptions = React.useRef<readonly string[]>([]);

  React.useLayoutEffect(() => {
    latest.current = { engine, started, start };
  });

  const finish = React.useCallback(
    (current: Waiter) => {
      if (waiter.current !== current) return;
      waiter.current = null;
      window.clearTimeout(current.settle);
      window.clearTimeout(current.deadline);
      const fresh = latest.current.engine.turns.slice(current.from);
      const reply = voiceReplyFromTurns(fresh, locale, { oneOf: (list) => t("booking.chat.voiceOneOf", { list }), someOf: (list) => t("booking.chat.voiceSomeOf", { list }) });
      // Solo valen las opciones que acaba de leer: si pidió un dato (el celular, el correo), no hay lista.
      lastOptions.current = reply.followups ?? [];
      current.resolve(reply);
    },
    [locale, t]
  );

  // Cada mensaje nuevo (o el fin de «escribiendo») reinicia la espera; quieta un momento, se responde.
  React.useEffect(() => {
    const current = waiter.current;
    if (!current) return;
    window.clearTimeout(current.settle);
    if (engine.typing) return;
    if (!engine.turns.slice(current.from).some((turn) => turn.from === "agent")) return;
    current.settle = window.setTimeout(() => finish(current), SETTLE_MS);
  }, [engine.turns, engine.typing, finish]);

  React.useEffect(() => () => {
    if (waiter.current) {
      window.clearTimeout(waiter.current.settle);
      window.clearTimeout(waiter.current.deadline);
    }
  }, []);

  const ask = React.useCallback(
    (text: string) =>
      new Promise<ChatReply>((resolve) => {
        const { engine: current, started: isStarted, start: begin } = latest.current;
        const said = matchSpokenOption(text, lastOptions.current, locale) ?? fromVoice(text, locale);
        const next: Waiter = { from: current.turns.length, resolve, deadline: 0 };
        next.deadline = window.setTimeout(() => finish(next), MAX_WAIT_MS);
        waiter.current = next;
        if (isStarted) current.send(said);
        else begin(said);
      }),
    [finish, locale]
  );

  return ask;
}
