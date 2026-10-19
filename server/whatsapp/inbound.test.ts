import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";
import { classifyReply, handleWebhook, parseWebhook, verifySignature, verifySubscription } from "./inbound.js";
import { createMemoryStore, enqueue, runDue } from "./queue.js";
import { readWhatsAppConfig } from "./whatsapp.js";

const SECRET = "app-secret";
const NOW = Date.UTC(2026, 9, 19, 15);
const PHONE_ID = "123";

/** Un aviso de Meta como llega: mensajes y estados dentro de entry[].changes[].value. */
const webhook = (value: Record<string, unknown>) => ({ object: "whatsapp_business_account", entry: [{ id: "WABA", changes: [{ field: "messages", value: { messaging_product: "whatsapp", metadata: { phone_number_id: PHONE_ID }, ...value } }] }] });
const textMessage = (id: string, body: string, context?: string) => ({ id, from: "573001234567", timestamp: String(NOW / 1000), type: "text", text: { body }, ...(context ? { context: { id: context } } : {}) });

describe("respuestas por WhatsApp", () => {
  test("se entiende confirmar, otra hora, cancelar y BAJA, en español e inglés; lo demás lo lee una persona", () => {
    expect(classifyReply("Sí")).toBe("confirm");
    expect(classifyReply("confirmo, ahí estaré")).toBe("confirm");
    expect(classifyReply("¿Me la pueden pasar a otra hora?")).toBe("reschedule");
    expect(classifyReply("No puedo ir, lo siento")).toBe("cancel");
    expect(classifyReply("Confirmo pero no puedo ir a esa hora, ¿la cancelan?")).toBe("cancel");
    expect(classifyReply("BAJA")).toBe("stop");
    expect(classifyReply("stop")).toBe("stop");
    expect(classifyReply("I'll be there")).toBe("confirm");
    expect(classifyReply("¿Tienen parqueadero?")).toBe("other");
    expect(classifyReply("Lo que sea", "RESCHEDULE")).toBe("reschedule");
    // A «ya casi te toca» de la fila sin cita.
    expect(classifyReply("Voy")).toBe("confirm");
    expect(classifyReply("Ya no voy, gracias")).toBe("cancel");
  });

  test("la firma de Meta se comprueba sobre el cuerpo tal cual; la suscripción pide el token", () => {
    const raw = JSON.stringify(webhook({}));
    const signature = `sha256=${createHmac("sha256", SECRET).update(raw).digest("hex")}`;
    expect(verifySignature(raw, signature, SECRET)).toBe(true);
    expect(verifySignature(`${raw} `, signature, SECRET)).toBe(false);
    expect(verifySignature(raw, null, SECRET)).toBe(false);
    expect(verifySubscription(new URL("https://x/api?hub.mode=subscribe&hub.verify_token=t&hub.challenge=42"), "t")).toBe("42");
    expect(verifySubscription(new URL("https://x/api?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=42"), "t")).toBeNull();
  });

  test("lee botones, texto y estados; ignora lo que no reconoce", () => {
    const parsed = parseWebhook(
      webhook({
        messages: [textMessage("wamid.a", "Confirmo"), { id: "wamid.b", from: "573001234567", type: "button", button: { payload: "CANCEL", text: "Cancelar" } }, { nada: true }],
        statuses: [{ id: "wamid.out", status: "delivered" }, { id: "wamid.out2", status: "rarito" }],
      })
    );
    expect(parsed.replies.map((item) => [item.wamid, item.text, item.payload])).toEqual([
      ["wamid.a", "Confirmo", null],
      ["wamid.b", "Cancelar", "CANCEL"],
    ]);
    expect(parsed.statuses).toEqual([{ providerId: "wamid.out", status: "delivered", error: null }]);
  });

  test("la respuesta se liga al mensaje que contesta, una sola vez; BAJA bloquea las promociones en el servidor", async () => {
    const store = createMemoryStore();
    await enqueue(store, "demo", "usr_0001", [{ id: "msg-1", to: "+573001234567", kind: "confirmation", params: ["Ana", "Corte", "mañana", "Centro"], sendAt: new Date(NOW).toISOString() }], NOW);
    const fetcher = async () => new Response(JSON.stringify({ messages: [{ id: "wamid.out" }] }), { status: 200 });
    await runDue(store, readWhatsAppConfig({ WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: PHONE_ID }), fetcher, NOW);

    const body = webhook({ messages: [textMessage("wamid.in1", "Reprogramar", "wamid.out"), textMessage("wamid.in2", "BAJA")], statuses: [{ id: "wamid.out", status: "read" }] });
    expect(await handleWebhook(store, body, { phoneNumberId: PHONE_ID })).toEqual({ saved: 2, optOuts: 1, statuses: 1 });
    // Meta reintenta: lo repetido no se guarda otra vez.
    expect(await handleWebhook(store, body, { phoneNumberId: PHONE_ID })).toMatchObject({ saved: 0 });
    const inbox = await store.inbox("demo", 0, 10);
    expect(inbox.map((item) => [item.seq, item.intent, item.messageId])).toEqual([
      [1, "reschedule", "msg-1"],
      [2, "stop", null],
    ]);
    expect((await store.get("demo", "msg-1"))?.delivery).toBe("read");

    const promo = await enqueue(store, "demo", "usr_0001", [{ id: "promo-1", to: "+573001234567", kind: "reactivation", params: ["Ana", "mañana", "Juan"], sendAt: new Date(NOW).toISOString(), consent: { version: "co-2026-10", at: new Date(NOW).toISOString() } }], NOW);
    expect(promo.rejected).toEqual([{ id: "promo-1", message: expect.stringContaining("BAJA") }]);
  });

  test("de otro número de WhatsApp y sin mensaje al que responder, no se sabe de qué barbería es: se ignora", async () => {
    const store = createMemoryStore();
    const result = await handleWebhook(store, webhook({ metadata: { phone_number_id: "otro" }, messages: [textMessage("wamid.x", "Hola")] }), { phoneNumberId: PHONE_ID });
    expect(result.saved).toBe(0);
  });
});
