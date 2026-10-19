import { describe, expect, test } from "vitest";
import { fillNarrative, narrate, parseNarrativeInput } from "./narrative";

const facts = { ventas: { label: "Ventas de la semana", value: "US$ 12.340" }, cambio: { label: "Frente a la anterior", value: "+8 %" } };
const body = { kind: "week", locale: "es", facts };
const claude = (text: string) => async () => new Response(JSON.stringify({ model: "claude-haiku-5-5", content: [{ type: "text", text }] }), { status: 200 });

describe("hechos → narración", () => {
  test("pone las cifras en los marcadores y rechaza dígitos o marcadores inventados", () => {
    expect(fillNarrative("Vendiste {ventas}, {cambio} que la semana pasada.", facts)).toBe("Vendiste US$ 12.340, +8 % que la semana pasada.");
    expect(fillNarrative("Vendiste 12.000 dólares.", facts)).toBeNull();
    expect(fillNarrative("Vendiste {propinas}.", facts)).toBeNull();
  });

  test("valida la entrada: claves cortas y valores con tope", () => {
    expect(parseNarrativeInput(body)).not.toBeNull();
    expect(parseNarrativeInput({ ...body, kind: "otro" })).toBeNull();
    expect(parseNarrativeInput({ ...body, facts: { "mal clave": { label: "x", value: "y" } } })).toBeNull();
  });

  test("sin clave responde 501; con una redacción con números, 502 (la app usa su resumen)", async () => {
    expect((await narrate(body, { apiKey: null, model: "m" })).status).toBe(501);
    expect((await narrate(body, { apiKey: "k", model: "m" }, claude("Vendiste 12 mil."))).status).toBe(502);
    const ok = await narrate(body, { apiKey: "k", model: "m" }, claude("Vendiste {ventas}, {cambio} frente a la semana pasada."));
    expect(await ok.json()).toEqual({ text: "Vendiste US$ 12.340, +8 % frente a la semana pasada.", model: "claude-haiku-5-5" });
  });
});
