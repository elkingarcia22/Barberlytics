import { describe, expect, test, vi } from "vitest";
import { MAX_ATTEMPTS, cancel, createMemoryStore, createUpstashStore, enqueue, runDue, statusOf } from "./queue.js";
import { readWhatsAppConfig } from "./whatsapp.js";

const NOW = Date.UTC(2026, 9, 19, 15);
const configured = readWhatsAppConfig({ WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "123" });
const message = (id: string, minutes = 0, extra: Record<string, unknown> = {}) => ({ id, to: "+573001234567", kind: "confirmation", params: ["Marcela", "Corte", "mañana", "Centro"], sendAt: new Date(NOW + minutes * 60_000).toISOString(), ...extra });
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
    const result = await enqueue(store, "demo", "usr_0001", [message("m1", 0, { kind: "reactivation" }), message("m2", 0, { kind: "reactivation", consent: { version: "co-2026-10", at: new Date(NOW).toISOString() } })], NOW);
    expect(result.rejected).toEqual([{ id: "m1", message: expect.stringContaining("permiso") }]);
    expect(result.items.map((item) => item.id)).toEqual(["m2"]);
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
