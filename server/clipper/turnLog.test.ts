import { afterAll, afterEach, describe, expect, test } from "vitest";
import { clipperStep } from "./clipper";
import { clipperFeedback, setClipperLogSink } from "./turnLog";

const lines: Record<string, unknown>[] = [];
const restore = setClipperLogSink((line) => lines.push(JSON.parse(line)));
afterEach(() => {
  lines.length = 0;
});
// Al terminar el archivo, el registro vuelve a su destino anterior.
afterAll(() => restore());

const context = { locale: "es", role: "owner", today: "2026-10-18", branch: "MA", currency: "USD", userName: "Carlos", turnId: "turn-1234abcd" };
const question = { role: "user", content: "¿Cuánto llevo hoy? Juan Pérez tiene alergia al látex" } as const;
const claude = (body: unknown) => async () => new Response(JSON.stringify(body), { status: 200 });

describe("registro de Clipper", () => {
  test("cada paso deja una línea con el turno, las herramientas, los tokens y el tiempo, sin la pregunta", async () => {
    await clipperStep({ context, messages: [question] }, { apiKey: "k", model: "m" }, claude({ model: "m", stop_reason: "tool_use", content: [{ type: "tool_use", id: "tu_1", name: "cuentas_del_periodo", input: {} }], usage: { input_tokens: 1200, output_tokens: 40 } }));
    expect(lines[0]).toMatchObject({ type: "clipper_step", turnId: "turn-1234abcd", role: "owner", outcome: "tools", tools: ["cuentas_del_periodo"], inputTokens: 1200, outputTokens: 40 });
    expect(typeof lines[0].ms).toBe("number");
    expect(JSON.stringify(lines)).not.toContain("látex");
  });

  test("sin clave también queda registrado", async () => {
    await clipperStep({ context, messages: [question] }, { apiKey: null, model: "m" });
    expect(lines[0]).toMatchObject({ outcome: "not_configured", turnId: "turn-1234abcd" });
  });

  test("el 👍/👎 lleva motivos; la conversación solo si se compartió", () => {
    expect(clipperFeedback({ turnId: "turn-1234abcd", value: "down", reasons: ["wrong"], comment: "La cifra no cuadra", question: "¿Cuánto llevo?", answer: "US$ 10" }).status).toBe(204);
    expect(lines[0]).toMatchObject({ type: "clipper_feedback", value: "down", reasons: ["wrong"], comment: "La cifra no cuadra" });
    expect(lines[0]).not.toHaveProperty("question");
    clipperFeedback({ turnId: "turn-1234abcd", value: "down", share: true, question: "¿Cuánto llevo?", answer: "US$ 10" });
    expect(lines[1]).toMatchObject({ question: "¿Cuánto llevo?", answer: "US$ 10" });
    expect(clipperFeedback({ value: "up" }).status).toBe(400);
  });
});
