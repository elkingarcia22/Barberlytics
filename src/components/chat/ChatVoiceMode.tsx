import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { useT } from "@/i18n";
import type { ChatReply } from "@/lib/chat";
import { useChatContext } from "./useChat";
import { ChatMark } from "./ChatMark";
import { ChatVoiceWaves } from "./ChatVoiceWaves";
import { ChatMarkdown } from "./ChatMarkdown";
import { ChatCardView } from "./ChatCardView";
import { useVoiceSession, type VoiceStatus } from "./useVoiceSession";
import "./chat.css";

export interface ChatVoiceModeProps {
  open: boolean;
  onClose: () => void;
  /** «Escribir»: vuelve al chat con lo dicho en la caja. */
  onWrite: (text: string) => void;
  /** Terminar: lo dicho (o la sugerencia elegida) se envía al chat. */
  onSend: (text: string) => void;
}

function pad(value: number): string {
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

/** La respuesta leída: el texto, sus dos botones (el detalle si trae tarjeta, la primera sugerencia) y el detalle desplegado. */
function VoiceReply({ reply, onFollowup }: { reply: ChatReply; onFollowup: (text: string) => void }) {
  const t = useT();
  const [detailOpen, setDetailOpen] = React.useState(false);
  const followup = reply.followups?.[0];
  return (
    <div className="chat-rise flex w-full max-w-2xl flex-col items-center gap-5">
      <div className="flex items-start gap-3 text-left">
        <ChatMark size="sm" className="mt-1" />
        <ChatMarkdown text={reply.text} className="text-base text-text-secondary" />
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {reply.card && (
          <Button type="button" variant="outline" className="rounded-full" aria-expanded={detailOpen} onClick={() => setDetailOpen((value) => !value)}>
            <ThemaIcon className="text-current" name="chart" size="xs" decorative />
            {detailOpen ? t("chat.detailHide") : t("chat.detailShow")}
          </Button>
        )}
        {followup && (
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onFollowup(followup)}>
            <ThemaIcon className="text-current" name="task" size="xs" decorative />
            {followup}
          </Button>
        )}
      </div>
      {detailOpen && reply.card && <ChatCardView card={reply.card} className="w-full max-w-lg text-left" />}
    </div>
  );
}

const STATUS_KEY: Record<VoiceStatus, { label: "chat.voiceListening" | "chat.voicePausedLabel"; hint: "chat.voiceListeningHint" | "chat.voicePausedHint" | "chat.voiceThinkingHint" }> = {
  listening: { label: "chat.voiceListening", hint: "chat.voiceListeningHint" },
  paused: { label: "chat.voicePausedLabel", hint: "chat.voicePausedHint" },
  thinking: { label: "chat.voicePausedLabel", hint: "chat.voiceThinkingHint" },
  answered: { label: "chat.voicePausedLabel", hint: "chat.voicePausedHint" },
  unsupported: { label: "chat.voicePausedLabel", hint: "chat.voicePausedHint" },
  denied: { label: "chat.voicePausedLabel", hint: "chat.voicePausedHint" },
};

/**
 * El modo voz, a pantalla completa y siempre en oscuro: las ondas escuchan,
 * lo dicho se lee grande y la respuesta llega debajo con sus dos botones.
 * Hace falta una pausa para que responda; el micrófono se pausa y se
 * retoma, «Escribir» vuelve al chat con lo dicho y el cuadrado lo envía.
 */
export function ChatVoiceMode({ open, onClose, onWrite, onSend }: ChatVoiceModeProps) {
  // La sesión se monta al abrir y se desmonta al cerrar: cada vez arranca limpia.
  if (!open || typeof document === "undefined") return null;
  return <VoiceSession onClose={onClose} onWrite={onWrite} onSend={onSend} />;
}

function VoiceSession({ onClose, onWrite, onSend }: Omit<ChatVoiceModeProps, "open">) {
  const t = useT();
  const { lang, backend } = useChatContext();
  const ask = React.useCallback((text: string) => backend.reply(text, [], new AbortController().signal), [backend]);
  const { status, transcript, interim, reply, seconds, toggleMic } = useVoiceSession({ open: true, lang, ask });
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const language = t(lang.startsWith("en") ? "chat.language.en" : "chat.language.es");

  React.useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const listening = status === "listening";
  const heard = [transcript, interim].filter(Boolean).join(" ");
  const canSend = transcript.trim().length > 0;
  const blocked = status === "unsupported" || status === "denied";

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.voiceMode")}
      data-testid="chat-voice"
      className="dark fixed inset-0 z-dialog flex flex-col overflow-y-auto bg-background text-text-primary outline-none ai-mesh-agent"
    >
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-6">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <ThemaIcon className="text-current" name="arrowLeft" size="xs" decorative />
          {t("chat.voiceBack")}
        </Button>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs text-text-secondary">
          <span className={cn("size-2 rounded-full", listening ? "bg-destructive animate-pulse motion-reduce:animate-none" : "bg-text-muted")} />
          {listening ? t("chat.voiceActive") : t("chat.voicePaused")}
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
        {/* Las ondas: tocarlas pausa o retoma, como el micrófono de la píldora. */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={blocked}
          aria-label={listening ? t("chat.voicePause") : t("chat.voiceResume")}
          className="w-full max-w-xl rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          data-testid="chat-voice-waves"
        >
          <ChatVoiceWaves state={status === "thinking" ? "thinking" : listening ? "listening" : "idle"} pulse={heard} className="h-40 w-full sm:h-48" />
        </button>

        <h1 className="max-w-3xl text-balance text-2xl font-semibold tracking-tight sm:text-4xl" aria-live="polite">
          {heard ? `«${heard}»` : blocked ? t(status === "denied" ? "chat.voiceDenied" : "chat.voiceUnsupported") : t("chat.voiceEmpty")}
        </h1>

        {reply && (
          <VoiceReply
            reply={reply}
            onFollowup={(text) => {
              onSend(text);
              onClose();
            }}
          />
        )}
      </div>

      <div className="flex shrink-0 justify-center px-4 pb-8">
        <div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-border/60 bg-surface/80 p-2 shadow-card backdrop-blur" data-testid="chat-voice-controls">
          {/* Un solo botón para el micrófono: escuchando se pausa, en pausa se retoma. */}
          <button
            type="button"
            onClick={toggleMic}
            disabled={blocked}
            aria-label={listening ? t("chat.voicePause") : t("chat.voiceResume")}
            aria-pressed={listening}
            title={listening ? t("chat.voicePause") : t("chat.voiceResume")}
            data-testid="chat-voice-mic"
            className={cn(
              "relative flex size-11 shrink-0 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              listening ? "bg-text-primary text-background hover:brightness-90" : "border border-border/70 bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            <ThemaIcon className="text-current" name={blocked ? "micOff" : listening ? "pause" : "mic"} size="sm" decorative />
          </button>
          <div className="min-w-0 flex-1 text-left">
            <Text size="sm" weight="medium" className="truncate">
              {t(STATUS_KEY[status].label, { language })}
            </Text>
            <Text size="xs" tone="muted" className="truncate tabular-nums">
              {pad(seconds)} · {t(STATUS_KEY[status].hint)}
            </Text>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => {
              onWrite(transcript);
              onClose();
            }}
          >
            <ThemaIcon className="text-current" name="edit" size="xs" decorative />
            {t("chat.voiceWrite")}
          </Button>
          {/* Enviar lo dicho: el mismo botón de la caja, con su gradiente; sin nada que enviar se queda en contorno. */}
          <button
            type="button"
            disabled={!canSend}
            onClick={() => {
              onSend(transcript.trim());
              onClose();
            }}
            aria-label={t("chat.voiceStop")}
            title={t("chat.voiceStop")}
            data-testid="chat-voice-send"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              canSend ? "bg-ai-gradient text-text-inverse hover:-translate-y-0.5 hover:brightness-110" : "cursor-not-allowed border border-border/70 bg-transparent text-text-muted"
            )}
          >
            <ThemaIcon className="text-current" name="send" size="sm" decorative />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
