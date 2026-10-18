import { describe, expect, test, vi } from "vitest";
import { parseSendInput, readWhatsAppConfig, sendTemplate, templatePayload } from "./whatsapp.js";

const configured = readWhatsAppConfig({ WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "123" });
const message = { to: "+57 300 123 4567", kind: "reminder24h", params: ["Marcela", "mañana a las 10:00"], buttonParam: "abc" };

describe("WhatsApp", () => {
  test("sin cuenta conectada responde 501: la app lo deja como simulado", async () => {
    expect((await sendTemplate(message, readWhatsAppConfig({}))).status).toBe(501);
  });

  test("rechaza números, tipos o valores que no son de una plantilla", () => {
    expect(parseSendInput({ ...message, to: "123" })).toBe("El número no es válido.");
    expect(parseSendInput({ ...message, kind: "promo" })).toBe("Ese tipo de mensaje no existe.");
    expect(parseSendInput({ ...message, params: [""] })).toBe("Los valores de la plantilla no son válidos.");
    expect(parseSendInput(message)).toMatchObject({ to: "573001234567", kind: "reminder24h" });
  });

  test("manda la plantilla del tipo, con sus valores y el botón con enlace", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), { status: 200 }));
    const response = await sendTemplate(message, configured, fetcher);
    expect(await response.json()).toEqual({ id: "wamid.1" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect(init.headers.authorization).toBe("Bearer t");
    expect(JSON.parse(init.body)).toEqual(templatePayload(parseSendInput(message) as never, configured));
    expect(JSON.parse(init.body).template).toMatchObject({ name: "cita_recordatorio_24h", language: { code: "es" } });
  });

  test("si WhatsApp lo rechaza, devuelve 502 con su motivo", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Template not found", code: 132001 } }), { status: 400 }));
    const response = await sendTemplate(message, configured, fetcher);
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ message: "Template not found", providerCode: 132001 });
  });

  test("el nombre de cada plantilla se puede cambiar por entorno", () => {
    expect(readWhatsAppConfig({ WHATSAPP_TEMPLATE_REMINDER2H: "recordatorio_corto" }).templates.reminder2h).toBe("recordatorio_corto");
  });
});
