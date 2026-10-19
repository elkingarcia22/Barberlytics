import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "./webhook.js";

afterEach(() => vi.unstubAllEnvs());

const URL_BASE = "https://app.barberlytics.com/api/whatsapp/webhook";
const post = (body: string, signature: string | null) => POST(new Request(URL_BASE, { method: "POST", headers: signature ? { "x-hub-signature-256": signature } : {}, body }));

describe("/api/whatsapp/webhook", () => {
  test("sin secretos no atiende; con firma mala, 401; con la buena, 200", async () => {
    const body = JSON.stringify({ entry: [] });
    vi.stubEnv("WHATSAPP_APP_SECRET", "");
    expect((await post(body, "sha256=x")).status).toBe(503);
    vi.stubEnv("WHATSAPP_APP_SECRET", "secreto");
    expect((await post(body, "sha256=00")).status).toBe(401);
    expect((await post(body, null)).status).toBe(401);
    const ok = await post(body, `sha256=${createHmac("sha256", "secreto").update(body).digest("hex")}`);
    expect(ok.status).toBe(200);
  });

  test("la verificación de Meta devuelve el reto solo con el token correcto", async () => {
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "mi-token");
    const ok = GET(new Request(`${URL_BASE}?hub.mode=subscribe&hub.verify_token=mi-token&hub.challenge=777`));
    expect(ok.status).toBe(200);
    expect(await ok.text()).toBe("777");
    expect(GET(new Request(`${URL_BASE}?hub.mode=subscribe&hub.verify_token=no&hub.challenge=777`)).status).toBe(403);
  });
});
