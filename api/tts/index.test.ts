import { afterEach, describe, expect, test, vi } from "vitest";
import { POST } from "./index.js";

const URL_BASE = "https://app.barberlytics.com/api/tts";
const post = (body: unknown, origin = "https://app.barberlytics.com") =>
  POST(new Request(URL_BASE, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) }));

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/tts", () => {
  test("another origin cannot use the voice", async () => {
    expect((await post({ text: "hola", lang: "es" }, "https://otro.com")).status).toBe(403);
  });

  test("without a voice service it answers 501", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("AZURE_SPEECH_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    expect((await post({ text: "hola", lang: "es" })).status).toBe(501);
  });
});

describe("abuso", () => {
  test("sin Origin ni Referer (un script) no se acepta", async () => {
    const response = await POST(new Request(URL_BASE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hola", lang: "es" }) }));
    expect(response.status).toBe(403);
  });
});
