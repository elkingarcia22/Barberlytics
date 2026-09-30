/**
 * El micrófono y la voz del navegador, sin depender de que existan.
 *
 * Web Speech está en Chrome, Edge y Safari, y en cada uno con su prefijo.
 * Aquí se envuelve en dos funciones pequeñas para que el modo voz pregunte
 * «¿puedo escuchar?» y, si no, muestre lo mismo con una transcripción escrita.
 */

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return recognitionCtor() !== null;
}

export interface Recognizer {
  start: () => void;
  stop: () => void;
}

export interface RecognizerOptions {
  lang: string;
  /** Lo dicho hasta ahora: lo firme y lo que aún se está entendiendo. */
  onTranscript: (finalText: string, interimText: string) => void;
  /** `denied` si no hay permiso; el resto son fallos del servicio. */
  onError?: (kind: "denied" | "unavailable" | "other") => void;
  onEnd?: () => void;
}

/** Un reconocedor continuo con resultados parciales; `null` si el navegador no puede. */
export function createRecognizer(options: RecognizerOptions): Recognizer | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = options.lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  let finalText = "";
  recognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal) finalText += `${result[0].transcript} `;
      else interim += result[0].transcript;
    }
    options.onTranscript(finalText.trim(), interim.trim());
  };
  recognition.onerror = (event) => {
    const kind = event.error === "not-allowed" || event.error === "service-not-allowed" ? "denied" : event.error === "network" || event.error === "audio-capture" ? "unavailable" : "other";
    if (event.error !== "no-speech" && event.error !== "aborted") options.onError?.(kind);
  };
  recognition.onend = () => options.onEnd?.();
  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // Ya estaba escuchando: se ignora.
      }
    },
    stop: () => recognition.stop(),
  };
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Lee un texto en voz alta; devuelve cómo pararlo. Sin voz en el navegador no hace nada. */
export function speak(text: string, lang: string, onEnd?: () => void): () => void {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return () => {};
  }
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*_`#>]/g, ""));
  utterance.lang = lang;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}
