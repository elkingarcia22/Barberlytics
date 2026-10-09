import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useVoiceSession } from "./useVoiceSession";

/** Un reconocedor de voz falso: la prueba decide qué «oye» y cuándo, incluso después de pararlo. */
class FakeRecognition {
  static all: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() {
    FakeRecognition.all.push(this);
  }
  start() {}
  stop() {}
  abort() {}
  hear(text: string, isFinal = true) {
    this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal, length: 1 })] });
  }
  fail(error: string) {
    this.onerror?.({ error });
    this.onend?.();
  }
}

const SILENCE_MS = 30;

beforeEach(() => {
  FakeRecognition.all = [];
  vi.stubGlobal("SpeechRecognition", FakeRecognition);
});
afterEach(() => vi.unstubAllGlobals());

describe("useVoiceSession", () => {
  test("lo que el reconocedor entrega tarde, después de dejar de escuchar, no se vuelve a preguntar", async () => {
    const ask = vi.fn().mockResolvedValue({ text: "" });
    renderHook(() => useVoiceSession({ open: true, lang: "es-CO", ask, silenceMs: SILENCE_MS }));
    const first = FakeRecognition.all.at(-1)!;
    act(() => first.hear("corte mañana"));
    await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
    // Chrome entrega el final de lo que ya había oído aunque se haya parado.
    act(() => first.hear("corte mañana a las 3"));
    await new Promise((resolve) => setTimeout(resolve, SILENCE_MS * 4));
    expect(ask).toHaveBeenCalledTimes(1);
  });

  test("en conversación, lo que se oye mientras el asistente habla no dispara otra respuesta", async () => {
    let finishReply: (value: { text: string }) => void = () => {};
    const ask = vi.fn().mockImplementation(() => new Promise((resolve) => (finishReply = resolve)));
    const { result } = renderHook(() => useVoiceSession({ open: true, lang: "es-CO", ask, silenceMs: SILENCE_MS, conversation: true }));
    act(() => FakeRecognition.all.at(-1)!.hear("quiero un corte"));
    await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
    // Mientras piensa y habla, cualquier reconocedor anterior que siga entregando se ignora.
    act(() => FakeRecognition.all.forEach((recognition) => recognition.hear("quiero un corte")));
    await act(async () => finishReply({ text: "¿Con quién quieres ir?" }));
    act(() => FakeRecognition.all.slice(0, -1).forEach((recognition) => recognition.hear("quiero un corte")));
    await new Promise((resolve) => setTimeout(resolve, SILENCE_MS * 4));
    expect(ask).toHaveBeenCalledTimes(1);
    expect(result.current.status === "speaking" || result.current.status === "listening").toBe(true);
  });

  test("una pausa a mitad de frase («…con», «…a las») no la da por terminada; esperar un poco más sí", async () => {
    const ask = vi.fn().mockResolvedValue({ text: "" });
    renderHook(() => useVoiceSession({ open: true, lang: "es-CO", ask, silenceMs: SILENCE_MS }));
    act(() => FakeRecognition.all.at(-1)!.hear("quiero un corte con", false));
    await new Promise((resolve) => setTimeout(resolve, SILENCE_MS * 1.5));
    expect(ask).not.toHaveBeenCalled();
    await waitFor(() => expect(ask).toHaveBeenCalledWith("quiero un corte con"), { timeout: SILENCE_MS * 10 });
  });

  test("un corte pasajero del reconocedor (red) no apaga el micrófono: se retoma solo", async () => {
    const ask = vi.fn().mockResolvedValue({ text: "" });
    const { result } = renderHook(() => useVoiceSession({ open: true, lang: "es-CO", ask, silenceMs: SILENCE_MS }));
    const first = FakeRecognition.all.at(-1)!;
    const start = vi.spyOn(first, "start");
    act(() => first.fail("network"));
    expect(result.current.status).toBe("listening");
    await waitFor(() => expect(start).toHaveBeenCalled());
  });

  test("sin permiso del micrófono, sí se detiene y lo dice", async () => {
    const ask = vi.fn();
    const { result } = renderHook(() => useVoiceSession({ open: true, lang: "es-CO", ask, silenceMs: SILENCE_MS }));
    act(() => FakeRecognition.all.at(-1)!.fail("not-allowed"));
    expect(result.current.status).toBe("denied");
  });
});
