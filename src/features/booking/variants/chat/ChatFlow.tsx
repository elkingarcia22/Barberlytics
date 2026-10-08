import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { ChatComposer, ChatMark, ChatMarkdown, ChatThinking, ChatUserMessage } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "../../flow/BookingContext";
import { BookingSummaryAside } from "../../flow/BookingSummaryAside";
import { GiftStep } from "../../steps/GiftStep";
import { PackagesStep } from "../../steps/PackagesStep";
import { ChatTitle, ChatWidgetView } from "./ChatWidgets";
import { ChatEngineProvider, useChatBooking, type ChatEngine, type ChatTurn } from "./useChatBooking";

interface ChatFlowProps {
  headerTrailing?: React.ReactNode;
  onFinish?: () => void;
}

/** Un mensaje del asistente: su marca, el texto y, si es el último con tarjeta, la tarjeta para responder. */
function AgentTurn({ turn, isActive, isLast, engine }: { turn: ChatTurn; isActive: boolean; isLast: boolean; engine: ChatEngine }) {
  return (
    // El texto va junto a la marca; la tarjeta y las respuestas, debajo y a todo el ancho (en celular no caben con sangría).
    <div className="flex flex-col gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300" data-testid="booking-chat-agent">
      <div className="flex items-start gap-3">
        <ChatMark size="sm" className="mt-1" />
        <div className="min-w-0 rounded-2xl rounded-tl-md bg-surface-subtle px-4 py-2.5">
          <ChatMarkdown text={turn.text} />
        </div>
      </div>
      {turn.widget && isActive && <ChatWidgetView widget={turn.widget} />}
      {isLast && turn.replies && turn.replies.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={turn.text}>
          {turn.replies.map((reply) => (
            <Chip key={reply.id} label={reply.label} icon={reply.icon} onClick={() => engine.actions.reply(reply.id, reply.label)} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Conversación: se reserva hablando con el asistente de la barbería, como por
 * WhatsApp. Pregunta una cosa a la vez y cada pregunta trae su tarjeta para
 * responder tocando (servicios, barberos, horas, el pago); también entiende lo
 * que se escribe —«corte y barba mañana a las 5 con Andrés»— y aparta la hora
 * de una vez si está libre. Todo lo demás (varias personas, productos, nota,
 * cupones, «Mis citas») se pide en la misma conversación.
 */
export function ChatFlow({ headerTrailing, onFinish }: ChatFlowProps) {
  const t = useAppT();
  const { state, dispatch, layout } = useBookingFlow();
  const engine = useChatBooking({ onFinish });
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isWide = layout === "wide";
  const lastAgentWithWidget = [...engine.turns].reverse().find((turn) => turn.from === "agent" && turn.widget)?.id;
  const lastTurnId = engine.turns.at(-1)?.id;
  const onSideScreen = state.step === "gift" || state.step === "packages";

  // Lo último siempre a la vista: cada mensaje nuevo baja el hilo.
  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo?.({ top: node.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [engine.turns.length, engine.typing]);

  const placeholder = engine.stage === "phone" && !state.customer ? t("booking.chat.placeholderPhone") : engine.stage === "code" ? t("booking.chat.placeholderCode") : t("booking.chat.placeholder");

  return (
    <ChatEngineProvider value={engine}>
      <header className="relative z-sticky shrink-0 border-b border-border bg-surface/90 backdrop-blur">
        <div className={cn("flex h-14 items-center gap-3 px-3", isWide && "h-16 px-6")}>
          {onSideScreen ? (
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => dispatch({ type: "goTo", step: "welcome" })} aria-label={t("booking.header.back")}>
              <ThemaIcon name="chevronLeft" />
            </Button>
          ) : (
            <ChatMark size="md" motion={engine.typing ? "thinking" : "breathing"} />
          )}
          <div className="min-w-0 flex-1">
            <ChatTitle />
          </div>
          <Button type="button" variant="ghost" size={isWide ? "sm" : "icon-sm"} onClick={() => engine.actions.reply("manage", t("booking.header.myAppointments"))} aria-label={t("booking.header.myAppointments")}>
            <ThemaIcon name="calendar" />
            {isWide && t("booking.header.myAppointments")}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => engine.actions.reply("restart", t("booking.chat.reply.restart"))} aria-label={t("booking.chat.reply.restart")}>
            <ThemaIcon name="refresh" />
          </Button>
          {headerTrailing}
        </div>
      </header>

      {onSideScreen ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{state.step === "gift" ? <GiftStep /> : <PackagesStep />}</div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div role="log" aria-live="polite" aria-label={t("booking.chat.threadLabel")} className={cn("mx-auto flex w-full flex-col gap-5 px-4 py-6", isWide ? "max-w-2xl" : "max-w-xl")}>
                {engine.turns.map((turn) =>
                  turn.from === "agent" ? (
                    <AgentTurn key={turn.id} turn={turn} isActive={turn.id === lastAgentWithWidget} isLast={turn.id === lastTurnId} engine={engine} />
                  ) : (
                    <ChatUserMessage key={turn.id} message={{ id: turn.id, role: "user", text: turn.text, createdAt: 0, status: "done" }} />
                  )
                )}
                {engine.typing && <ChatThinking label={t("booking.chat.typing")} />}
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-surface/80 px-4 py-3 backdrop-blur">
              <div className={cn("mx-auto w-full", isWide ? "max-w-2xl" : "max-w-xl")}>
                <ChatComposer value={draft} onChange={setDraft} onSend={(text) => engine.send(text)} placeholder={placeholder} compact attach={false} disclaimer={false} />
              </div>
            </div>
          </div>
          {isWide && state.items.length + (state.draft ? 1 : 0) > 0 && (
            <div className="w-96 shrink-0 overflow-y-auto border-l border-border bg-surface/60">
              <BookingSummaryAside />
            </div>
          )}
        </div>
      )}
    </ChatEngineProvider>
  );
}
