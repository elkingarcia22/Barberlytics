import { describe, expect, test, vi } from "vitest";
import { MAX_ATTEMPTS, cancel, createMemoryStore, createUpstashStore, enqueue, runDue, statusOf } from "./queue.js";
import { readWhatsAppConfig } from "./whatsapp.js";

const NOW = Date.UTC(2026, 9, 19, 15);
const configured = readWhatsAppConfig({ WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "123" });
const message = (id: string, minutes = 0, extra: Record<string, unknown> = {}) => ({ id, to: "+573001234567", kind: "confirmation", params: ["Marcela", "Corte", "mañana", "Centro"], sendAt: new Date(NOW + minutes * 60_000).toISOString(), ...extra });
const CONSENT = { version: "co-2026-10", at: new Date(NOW).toISOString() };
const BOGOTA = { country: "CO", timeZone: "America/Bogota" };
const okFetch = () => vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), { status: 200 }));

describe("cola de WhatsApp", () => {
  test("encola, envía lo que ya toca y deja lo demás para su hora", async () => {
    const store = createMemoryStore();
    const queued = await enqueue(store, "demo", "usr_0001", [message("m1"), message("m2", 60)], NOW);
    expect(queued.items.map((item) => item.status)).toEqual(["scheduled", "scheduled"]);
    const fetcher = okFetch();
    expect(await runDue(store, configured, fetcher, NOW)).toMatchObject({ sent: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(await statusOf(store, "demo", ["m1", "m2"])).toMatchObject([{ id: "m1", status: "sent", providerId: "wamid.1" }, { id: "m2", status: "scheduled" }]);
  });

  test("encolar dos veces el mismo mensaje no lo envía dos veces", async () => {
    const store = createMemoryStore();
    await enqueue(store, "demo", "usr_0001", [message("m1")], NOW);
    await runDue(store, configured, okFetch(), NOW);
    const again = await enqueue(store, "demo", "usr_0001", [message("m1")], NOW);
    expect(again.items[0].status).toBe("sent");
    const fetcher = okFetch();
    await runDue(store, configured, fetcher, NOW);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("lo anulado no sale y otra barbería no ve ni anula lo ajeno", async () => {
    const store = createMemoryStore();
    await enqueue(store, "demo", "usr_0001", [message("m1"), message("m2")], NOW);
    expect(await cancel(store, "otra", ["m1"])).toEqual([]);
    expect(await statusOf(store, "otra", ["m1"])).toEqual([]);
    await cancel(store, "demo", ["m1"]);
    expect(await runDue(store, configured, okFetch(), NOW)).toMatchObject({ sent: 1 });
    expect((await statusOf(store, "demo", ["m1"]))[0].status).toBe("cancelled");
  });

  test("una promoción sin el permiso del cliente no entra a la cola", async () => {
    const store = createMemoryStore();
    const result = await enqueue(store, "demo", "usr_0001", [message("m1", 0, { kind: "reactivation" }), message("m2", 0, { kind: "reactivation", consent: CONSENT, place: BOGOTA }), message("m3", 0, { kind: "reactivation", consent: CONSENT })], NOW);
    expect(result.rejected).toEqual([
      { id: "m1", message: expect.stringContaining("permiso") },
      { id: "m3", message: expect.stringContaining("franja") },
    ]);
    expect(result.items.map((item) => item.id)).toEqual(["m2"]);
  });

  test("una promoción fuera de la franja legal espera a la próxima apertura de la sede", async () => {
    const store = createMemoryStore();
    // Sábado 24 de octubre, 4 p. m. en Bogotá: ya cerró la franja del sábado; domingo no; sale el lunes 26 a las 7.
    const saturday = Date.parse("2026-10-24T16:00:00-05:00");
    await enqueue(store, "demo", "usr_0001", [{ ...message("p1", 0, { kind: "reactivation", consent: CONSENT, place: BOGOTA }), sendAt: new Date(saturday).toISOString() }], saturday);
    const fetcher = okFetch();
    expect(await runDue(store, configured, fetcher, saturday)).toMatchObject({ sent: 0 });
    expect(await runDue(store, configured, fetcher, Date.parse("2026-10-25T11:00:00-05:00"))).toMatchObject({ sent: 0 });
    expect(await runDue(store, configured, fetcher, Date.parse("2026-10-26T07:00:00-05:00"))).toMatchObject({ sent: 1 });
    // Los mensajes de una cita no esperan: un recordatorio de noche sale igual.
    await enqueue(store, "demo", "usr_0001", [{ ...message("c1"), sendAt: new Date(saturday + 5 * 3_600_000).toISOString() }], saturday);
    expect(await runDue(store, configured, okFetch(), saturday + 5 * 3_600_000)).toMatchObject({ sent: 1 });
  });

  test("el cron no manda una promoción fuera de la franja ni a quien escribió BAJA después de encolarla", async () => {
    const store = createMemoryStore();
    await enqueue(store, "demo", "usr_0001", [message("p1", 0, { kind: "reactivation", consent: CONSENT, place: BOGOTA }), message("p2", 0, { kind: "reactivation", consent: CONSENT, place: BOGOTA, to: "+573009998877" })], NOW);
    await store.setOptOut("demo", "573009998877", true);
    // El cron llega tarde: 9 p. m. del mismo lunes en Bogotá.
    const late = Date.parse("2026-10-19T21:00:00-05:00");
    const fetcher = okFetch();
    expect(await runDue(store, configured, fetcher, late)).toMatchObject({ sent: 0, deferred: 1, cancelled: 1 });
    expect(fetcher).not.toHaveBeenCalled();
    expect(await statusOf(store, "demo", ["p1", "p2"])).toMatchObject([{ status: "scheduled" }, { status: "cancelled" }]);
  });

  test("una promoción por cliente cada 30 días; reprogramar la misma no cuenta y lo anulado libera el cupo", async () => {
    const store = createMemoryStore();
    const promo = (id: string, days = 0, to = "+573001234567") => ({ ...message(id, 0, { kind: "reactivation", consent: CONSENT, place: BOGOTA, to }), sendAt: new Date(NOW + days * 86_400_000).toISOString() });
    expect((await enqueue(store, "demo", "usr_0001", [promo("p1")], NOW)).items).toHaveLength(1);
    // Otra al mismo número dentro de los 30 días: rechazada; a otro número, sí.
    const second = await enqueue(store, "demo", "usr_0001", [promo("p2", 10), promo("p3", 0, "+573005556677")], NOW);
    expect(second.rejected).toEqual([{ id: "p2", message: expect.stringContaining("tope") }]);
    expect(second.items.map((item) => item.id)).toEqual(["p3"]);
    // Encolar otra vez la misma (reprogramarla) no choca consigo misma.
    expect((await enqueue(store, "demo", "usr_0001", [promo("p1", 1)], NOW)).rejected).toEqual([]);
    // Una programada para dentro de dos semanas también ocupa el cupo hacia atrás.
    expect((await enqueue(store, "demo", "usr_0001", [promo("p4", -20)], NOW)).rejected).toHaveLength(1);
    // Pasados los 30 días, otra sí; y si se anula la primera, el cupo queda libre.
    expect((await enqueue(store, "demo", "usr_0001", [promo("p5", 45)], NOW)).rejected).toEqual([]);
    await cancel(store, "demo", ["p1"]);
    expect((await enqueue(store, "demo", "usr_0001", [promo("p2", 10)], NOW)).rejected).toEqual([]);
  });

  test("si WhatsApp falla se reintenta con espera y, al tercer intento, queda fallido", async () => {
    const store = createMemoryStore();
    await enqueue(store, "demo", "usr_0001", [message("m1")], NOW);
    const down = vi.fn<typeof fetch>().mockRejectedValue(new Error("red caída"));
    expect(await runDue(store, configured, down, NOW)).toMatchObject({ retried: 1 });
    expect(await runDue(store, configured, down, NOW)).toMatchObject({ retried: 0, failed: 0 });
    let at = NOW;
    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      at += 60 * 60_000;
      await runDue(store, configured, down, at);
    }
    expect((await statusOf(store, "demo", ["m1"]))[0]).toMatchObject({ status: "failed", attempts: MAX_ATTEMPTS });
  });

  test("sin cuenta de WhatsApp queda simulado; un mensaje mal hecho no entra", async () => {
    const store = createMemoryStore();
    const result = await enqueue(store, "demo", "usr_0001", [message("m1"), { ...message("m2"), to: "12" }, { id: "../malo" }], NOW);
    expect(result.rejected).toHaveLength(2);
    expect(await runDue(store, readWhatsAppConfig({}), okFetch(), NOW)).toMatchObject({ simulated: 1 });
  });

  test("Upstash: guarda por REST, indexa lo pendiente y toma el mensaje con un candado", async () => {
    const calls: unknown[][][] = [];
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      const commands = JSON.parse(String(init?.body)) as unknown[][];
      calls.push(commands);
      return new Response(JSON.stringify(commands.map((command) => ({ result: command[0] === "SET" && command.includes("NX") ? "OK" : null }))), { status: 200 });
    });
    const store = createUpstashStore("https://redis.example", "tok", fetcher);
    await enqueue(store, "demo", "usr_0001", [message("m1")], NOW);
    expect(calls.flat().map((command) => command[0])).toEqual(expect.arrayContaining(["GET", "SET", "ZADD"]));
    expect(await store.claim({ id: "m1", tid: "demo" } as never)).toBe(true);
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ authorization: "Bearer tok" });
  });
});
