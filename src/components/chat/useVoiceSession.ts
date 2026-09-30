import * as React from "react";
import { createRecognizer, isSpeechRecognitionSupported, type ChatReply, type Recognizer } from "@/lib/chat";

export type VoiceStatus = "listening" | "paused" | "thinking" | "answered" | "unsupported" | "denied";

export interface VoiceSessionOptions {
  open: boolean;
  lang: string;
  ask: (text: string) => Promise<ChatReply>;
  /** Cuánto silencio, tras oír algo, cuenta como «ya terminé». */
  silenceMs?: number;
}

const DEFAULT_SILENCE_MS = 2200;

/**
 * Una sesión de voz: escucha, entiende que la persona hizo una pausa, pide
 * la respuesta y la deja lista para leer. Si el navegador no puede escuchar
 * lo dice, y el modo voz enseña lo mismo con el teclado.
 */
export function useVoiceSession({ open, lang, ask, silenceMs = DEFAULT_SILENCE_MS }: VoiceSessionOptions) {
  // Nace escuchando: la sesión se monta al abrir el modo voz y se desmonta al cerrarlo.
  const [status, setStatus] = React.useState<VoiceStatus>(() => (isSpeechRecognitionSupported() ? "listening" : "unsupported"));
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [reply, setReply] = React.useState<ChatReply | null>(null);
  const [seconds, setSeconds] = React.useState(0);
  const recognizer = React.useRef<Recognizer | null>(null);
  const silence = React.useRef<number | null>(null);
  const statusRef = React.useRef(status);
  const askRef = React.useRef(ask);
  React.useEffect(() => {
    statusRef.current = status;
    askRef.current = ask;
  });

  const clearSilence = () => {
    if (silence.current) window.clearTimeout(silence.current);
    silence.current = null;
  };

  const finishAndAsk = React.useCallback((text: string) => {
    clearSilence();
    recognizer.current?.stop();
    setStatus("thinking");
    askRef
      .current(text)
      .then((result) => {
        setReply(result);
        setStatus("answered");
      })
      .catch(() => setStatus("paused"));
  }, []);

  /** Arranca el reconocedor sin tocar el estado: lo usan el efecto de apertura y `listen`. */
  const startRecognizer = React.useCallback(() => {
    recognizer.current?.stop();
    recognizer.current = createRecognizer({
      lang,
      onTranscript: (finalText, interimText) => {
        setTranscript(finalText);
        setInterim(interimText);
        clearSilence();
        if (finalText) silence.current = window.setTimeout(() => finishAndAsk(finalText), silenceMs);
      },
      onError: (kind) => setStatus(kind === "denied" ? "denied" : "paused"),
      onEnd: () => {
        // El navegador corta solo cada cierto tiempo: si seguíamos escuchando, se retoma.
        if (statusRef.current === "listening") recognizer.current?.start();
      },
    });
    recognizer.current?.start();
  }, [lang, silenceMs, finishAndAsk]);

  const listen = React.useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("listening");
    startRecognizer();
  }, [startRecognizer]);

  const pause = React.useCallback(() => {
    clearSilence();
    recognizer.current?.stop();
    setStatus("paused");
  }, []);

  const reset = React.useCallback(() => {
    setTranscript("");
    setInterim("");
    setReply(null);
    setSeconds(0);
  }, []);

  // Abrir empieza a escuchar; cerrar suelta el micrófono. La sesión se monta
  // limpia cada vez (ChatVoiceMode la desmonta al cerrar), así que no hay
  // nada que reiniciar aquí.
  React.useEffect(() => {
    if (!open || !isSpeechRecognitionSupported()) return;
    startRecognizer();
    return () => {
      clearSilence();
      recognizer.current?.stop();
      recognizer.current = null;
    };
  }, [open, startRecognizer]);

  // El cronómetro corre mientras se escucha.
  React.useEffect(() => {
    if (status !== "listening") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const toggleMic = React.useCallback(() => {
    if (status === "listening") {
      pause();
      return;
    }
    if (status === "answered") reset();
    listen();
  }, [status, pause, listen, reset]);

  return { status, transcript, interim, reply, seconds, toggleMic, pause, listen, reset };
}
