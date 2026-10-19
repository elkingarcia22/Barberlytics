import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "./index.js";
import { signSession } from "../../server/auth/session.js";

const SECRET = "x".repeat(48);
const token = () => signSession({ sub: "usr_0001", tid: "demo", role: "owner", scope: "staff" }, SECRET, 600);

const URL_BASE = "https://app.barberlytics.com/api/tts";
const post = (body: unknown, origin = "https://app.barberlytics.com", auth: string | null = `Bearer ${token()}`) =>
  POST(new Request(URL_BASE, { method: "POST", headers: { "content-type": "application/json", origin, ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify(body) }));

beforeEach(() => vi.stubEnv("SESSION_SECRET", SECRET));

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
  test("sin sesión firmada (un script) no se acepta", async () => {
    expect((await post({ text: "hola", lang: "es" }, "https://app.barberlytics.com", null)).status).toBe(401);
  });

  test("un token con otra firma no vale", async () => {
    expect((await post({ text: "hola", lang: "es" }, "https://app.barberlytics.com", `Bearer ${token()}x`)).status).toBe(401);
  });
});
