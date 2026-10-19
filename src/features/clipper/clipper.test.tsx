import { beforeEach, describe, expect, test } from "vitest";
import { renderWithProviders } from "@/test/render";
import { db } from "@/mocks/db";
import type { ChatBackend } from "@/lib/chat";
import { createClipperBackend, resetClipperAvailability, toModelMessages, type ClipperBackendContext } from "./clipperBackend";
import { runClipperTool, weekOf } from "./tools";

/** Un día pasado de la demo, con citas cobradas. */
const PAST_DAY = "2026-09-22";
const base: ClipperBackendContext = { branchId: "ma", role: "owner", memberId: null, today: PAST_DAY, locale: "es", branch: "Massachusetts", currency: "USD", userName: "Carlos", t: (key) => key };
const fallback: ChatBackend = { reply: async () => ({ text: "Respuesta del centro de ayuda", via: "help" }) };
const labels = { consulted: "Consulté", tool: (name: string) => name };

function signIn(accountId: string) {
  const token = `mock-${accountId}-clipper`;
  db.sessions.set(token, accountId);
  renderWithProviders(<div />, { token });
}

/** Un `/api/clipper` de mentira: primero pide `tool`, después contesta con lo que diga `answer` a partir del resultado. */
function fakeServer(tool: string, input: Record<string, unknown>, answer: (result: Record<string, unknown>) => string) {
  const bodies: { messages: { role: string; content: unknown }[] }[] = [];
  const fetcher = (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    bodies.push(body);
    const last = body.messages[body.messages.length - 1];
    if (typeof last.content === "string") return new Response(JSON.stringify({ kind: "tools", content: [{ type: "tool_use", id: "tu_1", name: tool, input }], calls: [{ id: "tu_1", name: tool, input }] }), { status: 200 });
    return new Response(JSON.stringify({ kind: "answer", text: answer(JSON.parse(last.content[0].content)), model: "m" }), { status: 200 });
  }) as typeof fetch;
  return { fetcher, bodies };
}

const ask = (backend: ChatBackend, question: string) => backend.reply(question, [{ id: "m1", role: "user", text: question, createdAt: 0, status: "done" }], new AbortController().signal);

describe("Clipper con modelo", () => {
  beforeEach(() => resetClipperAvailability());

  test("ejecuta la consulta con la sesión, se la devuelve al modelo y cita lo que miró", async () => {
    signIn("acc_admin");
    const server = fakeServer("cuentas_del_periodo", { desde: PAST_DAY, hasta: PAST_DAY }, (result) => `Cobraste ${result.cobrado} en ${result.cuentas} cuentas.`);
    const reply = await ask(createClipperBackend({ context: base, fallback, labels, fetcher: server.fetcher }), "¿Cuánto cobré?");
    const result = JSON.parse((server.bodies[1].messages[2].content as { content: string }[])[0].content);
    expect(result.cuentas).toBeGreaterThan(0);
    expect(reply).toMatchObject({ text: `Cobraste ${result.cobrado} en ${result.cuentas} cuentas.`, via: "model", sources: [{ label: "Consulté", detail: "cuentas_del_periodo" }] });
    expect(server.bodies[0]).toMatchObject({ context: { role: "owner", branch: "Massachusetts", today: PAST_DAY } });
  });

  test("sin clave en el servidor responde el centro de ayuda y no vuelve a preguntar", async () => {
    let calls = 0;
    const fetcher = (async () => (calls++, new Response(JSON.stringify({ code: "not_configured" }), { status: 501 }))) as typeof fetch;
    const backend = createClipperBackend({ context: base, fallback, labels, fetcher });
    expect((await ask(backend, "¿Cómo cobro?")).text).toBe("Respuesta del centro de ayuda");
    await ask(backend, "¿Y una devolución?");
    expect(calls).toBe(1);
  });

  test("el permiso lo pone el servidor: recepción no ve la nómina y el modelo recibe el error", async () => {
    signIn("acc_reception");
    const result = await runClipperTool("nomina", {}, { ...base, role: "recepcion" }, new AbortController().signal);
    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content)).toMatchObject({ status: 403 });
  });

  test("un barbero ve solo su agenda y su nómina", async () => {
    signIn("acc_admin");
    const all = JSON.parse((await runClipperTool("agenda_del_dia", { fecha: PAST_DAY }, base, new AbortController().signal)).content);
    const barberId = db.calendar.appointments.find((item) => item.branchId === "ma" && item.start.startsWith(PAST_DAY))!.barberId;
    const barber = { ...base, role: "barbero-comision" as const, memberId: barberId };
    const mine = JSON.parse((await runClipperTool("agenda_del_dia", { fecha: PAST_DAY }, barber, new AbortController().signal)).content);
    expect(mine.citas).toBeGreaterThan(0);
    expect(mine.citas).toBeLessThan(all.citas);
    const payroll = JSON.parse((await runClipperTool("nomina", { desde: weekOf(PAST_DAY).from, hasta: weekOf(PAST_DAY).to }, barber, new AbortController().signal)).content);
    expect(payroll.personas).toHaveLength(1);
  });

  test("la conversación llega como texto alterno y termina en la pregunta", () => {
    const history = [
      { id: "1", role: "user" as const, text: "Hola", createdAt: 0, status: "done" as const },
      { id: "2", role: "agent" as const, text: "", createdAt: 0, status: "error" as const },
      { id: "3", role: "user" as const, text: "¿Cuánto llevo?", createdAt: 0, status: "done" as const },
    ];
    expect(toModelMessages("¿Cuánto llevo?", history)).toEqual([{ role: "user", content: "Hola\n\n¿Cuánto llevo?" }]);
  });
});
