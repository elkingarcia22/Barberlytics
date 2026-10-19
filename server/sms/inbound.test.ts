import { describe, expect, test } from "vitest";
import { createMemoryStore, enqueue } from "../whatsapp/queue.js";
import { classifySms, handleSms, smsSignature, twiml, verifySmsSignature } from "./inbound.js";

const CONFIG = { fromNumber: "16175550100", brand: "Barbería Demo", contact: "+1 617 555 0100" };
const NOW = new Date("2026-10-19T15:00:00.000Z");
const sms = (body: string, sid = "SM1", to = "+16175550100") => new URLSearchParams({ From: "+16175550199", To: to, Body: body, MessageSid: sid });

describe("SMS entrantes", () => {
  test("las palabras de los operadores y en español; lo demás como en WhatsApp", () => {
    expect(classifySms("STOP")).toBe("stop");
    expect(classifySms("Baja")).toBe("stop");
    expect(classifySms("cancel")).toBe("stop");
    expect(classifySms("UNSTOP")).toBe("start");
    expect(classifySms("ayuda")).toBe("help");
    expect(classifySms("Cancelar la cita, no puedo ir")).toBe("cancel");
    expect(classifySms("Confirmo")).toBe("confirm");
  });

  test("STOP corta los SMS y las promociones, contesta una vez y queda en la bandeja", async () => {
    const store = createMemoryStore();
    const first = await handleSms(store, sms("STOP"), CONFIG, NOW);
    expect(first).toMatchObject({ saved: true, intent: "stop", reply: expect.stringContaining("Reply START") });
    expect(await store.isOptedOut("demo", "16175550199", "sms")).toBe(true);
    expect(await store.isOptedOut("demo", "16175550199")).toBe(true);
    expect(await store.inbox("demo", 0, 10)).toEqual([expect.objectContaining({ wamid: "sms:SM1", intent: "stop", channel: "sms" })]);
    // El proveedor reintenta el mismo aviso: no se contesta otra vez.
    expect((await handleSms(store, sms("STOP"), CONFIG, NOW)).reply).toBeNull();
    // Y una promoción a ese número ya no entra a la cola.
    const promo = await enqueue(store, "demo", "usr_1", [{ id: "p1", to: "+16175550199", kind: "reactivation", params: ["Ana", "mañana", "Juan"], sendAt: NOW.toISOString(), consent: { version: "us-2026-10b", at: NOW.toISOString() }, place: { country: "US", timeZone: "America/New_York" } }], NOW.getTime());
    expect(promo.rejected).toHaveLength(1);
  });

  test("ALTA vuelve a dejar los SMS; AYUDA dice quién escribe y cómo darse de baja", async () => {
    const store = createMemoryStore();
    await handleSms(store, sms("BAJA", "SM1"), CONFIG, NOW);
    const back = await handleSms(store, sms("ALTA", "SM2"), CONFIG, NOW);
    expect(back.reply).toContain("Responde BAJA");
    expect(await store.isOptedOut("demo", "16175550199", "sms")).toBe(false);
    const help = await handleSms(store, sms("ayuda", "SM3"), CONFIG, NOW);
    expect(help.reply).toMatch(/Barbería Demo.*\+1 617 555 0100.*BAJA/);
    expect(twiml(help.reply)).toContain("<Response><Message>Barbería Demo");
  });

  test("a otro número no se sabe de qué barbería es: se ignora", async () => {
    const store = createMemoryStore();
    expect(await handleSms(store, sms("STOP", "SM1", "+15550000000"), CONFIG, NOW)).toMatchObject({ saved: false, reply: null });
    expect(await store.isOptedOut("demo", "16175550199", "sms")).toBe(false);
  });

  test("la firma de Twilio: URL y parámetros ordenados, en base64", () => {
    const params = sms("STOP");
    const url = "https://app.example/api/sms/inbound";
    const signature = smsSignature(url, params, "secreto");
    expect(verifySmsSignature(url, params, signature, "secreto")).toBe(true);
    expect(verifySmsSignature(url, params, signature, "otro")).toBe(false);
    expect(verifySmsSignature(url, sms("START"), signature, "secreto")).toBe(false);
    expect(verifySmsSignature(url, params, null, "secreto")).toBe(false);
  });
});
