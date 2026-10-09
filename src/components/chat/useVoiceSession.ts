import * as React from "react";
import { createRecognizer, isSpeechRecognitionSupported, speak, type ChatReply, type Recognizer } from "@/lib/chat";

export type VoiceStatus = "listening" | "paused" | "thinking" | "speaking" | "answered" | "unsupported" | "denied";

export interface VoiceSessionOptions {
  open: boolean;
  lang: string;
  ask: (text: string) => Promise<ChatReply>;
  /** Cuánto silencio, tras oír algo, cuenta como «ya terminé». */
  silenceMs?: number;
  /**
   * Conversación: la respuesta se dice en voz alta (voz de hombre, la de Clipper) y al terminar
   * vuelve a escuchar solo, como una llamada. Sin esto, la respuesta se queda escrita y en pausa.
   */
  conversation?: boolean;
}

const DEFAULT_SILENCE_MS = 1600;

/**
 * Una sesión de voz: escucha, entiende que la persona hizo una pausa, pide
 * la respuesta y la deja lista para leer. Si el navegador no puede escuchar
 * lo dice, y el modo voz enseña lo mismo con el teclado.
 */
export function useVoiceSession({ open, lang, ask, silenceMs = DEFAULT_SILENCE_MS, conversation = false }: VoiceSessionOptions) {
  // Nace escuchando: la sesión se monta al abrir el modo voz y se desmonta al cerrarlo.
  const [status, setStatusState] = React.useState<VoiceStatus>(() => (isSpeechRecognitionSupported() ? "listening" : "unsupported"));
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [reply, setReply] = React.useState<ChatReply | null>(null);
  const [seconds, setSeconds] = React.useState(0);
  /** Cuenta las palabras que va diciendo Clipper: cada una mueve las ondas. */
  const [spokenWords, setSpokenWords] = React.useState(0);
  const recognizer = React.useRef<Recognizer | null>(null);
  const stopSpeaking = React.useRef<(() => void) | null>(null);
  /** Tras hablar, vuelve a escuchar; lo llena el efecto de abajo (se declara después). */
  const resumeRef = React.useRef<() => void>(() => {});
  const silence = React.useRef<number | null>(null);
  const statusRef = React.useRef(status);
  const askRef = React.useRef(ask);
  React.useEffect(() => {
    askRef.current = ask;
  });
  // El estado se apunta en el acto: el reconocedor, al cortarse, mira si seguía escuchando para
  // retomarse, y si leyera el estado del render anterior se retomaría mientras Clipper piensa o habla.
  const setStatus = React.useCallback((next: VoiceStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

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
        if (!conversation || !result.text.trim()) {
          setStatus(conversation ? "listening" : "answered");
          if (conversation) resumeRef.current();
          return;
        }
        setStatus("speaking");
        stopSpeaking.current = speak(result.text, lang, () => {
          stopSpeaking.current = null;
          if (statusRef.current === "speaking") resumeRef.current();
        }, { gender: "male", onWord: () => setSpokenWords((count) => count + 1) });
      })
      .catch(() => setStatus("paused"));
  }, [conversation, lang, setStatus]);

  /** Arranca el reconocedor sin tocar el estado: lo usan el efecto de apertura y `listen`. */
  const startRecognizer = React.useCallback(() => {
    recognizer.current?.stop();
    recognizer.current = createRecognizer({
      lang,
      onTranscript: (finalText, interimText) => {
        setTranscript(finalText);
        setInterim(interimText);
        clearSilence();
        // La pausa cuenta desde lo último que se oyó, firme o no: Chrome a veces tarda en dar la
        // frase por terminada y, si se esperara a eso, habría que mandarla a mano.
        const heard = [finalText, interimText].filter(Boolean).join(" ").trim();
        if (heard) silence.current = window.setTimeout(() => finishAndAsk(heard), silenceMs);
      },
      onError: (kind) => setStatus(kind === "denied" ? "denied" : "paused"),
      onEnd: () => {
        // El navegador corta solo cada cierto tiempo: si seguíamos escuchando, se retoma.
        if (statusRef.current === "listening") recognizer.current?.start();
      },
    });
    recognizer.current?.start();
  }, [lang, silenceMs, finishAndAsk, setStatus]);

  const listen = React.useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("listening");
    startRecognizer();
  }, [startRecognizer, setStatus]);

  // En conversación, después de hablar: lo dicho antes se limpia y se escucha de nuevo (la respuesta queda a la vista).
  React.useEffect(() => {
    resumeRef.current = () => {
      setTranscript("");
      setInterim("");
      listen();
    };
  }, [listen]);

  /** Lo que se toca en vez de decirlo (una opción en pantalla): se responde igual que si se hubiera dicho. */
  const submit = React.useCallback(
    (text: string) => {
      stopSpeaking.current?.();
      stopSpeaking.current = null;
      setTranscript(text);
      setInterim("");
      finishAndAsk(text);
    },
    [finishAndAsk]
  );

  const pause = React.useCallback(() => {
    clearSilence();
    recognizer.current?.stop();
    setStatus("paused");
  }, [setStatus]);

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
      stopSpeaking.current?.();
    };
  }, [open, startRecognizer]);

  // El cronómetro corre mientras se escucha.
  React.useEffect(() => {
    if (status !== "listening") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const toggleMic = React.useCallback(() => {
    // Mientras habla, tocar el micrófono lo interrumpe y escucha.
    if (status === "speaking") {
      stopSpeaking.current?.();
      stopSpeaking.current = null;
      resumeRef.current();
      return;
    }
    if (status === "listening") {
      pause();
      return;
    }
    if (status === "answered") reset();
    listen();
  }, [status, pause, listen, reset]);

  return { status, transcript, interim, reply, seconds, spokenWords, toggleMic, pause, listen, reset, submit };
}
