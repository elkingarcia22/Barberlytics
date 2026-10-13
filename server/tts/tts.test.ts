import { describe, expect, test, vi } from "vitest";
import { geminiToWav, readTtsConfig, synthesize, toSsml, voiceFor } from "./tts.js";

const audio = () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } });

describe("readTtsConfig", () => {
  test("without keys there is no provider", () => {
    expect(readTtsConfig({}).provider).toBeNull();
  });

  test("picks the configured provider, and TTS_PROVIDER wins when several are set", () => {
    expect(readTtsConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "eastus" }).provider).toBe("azure");
    expect(readTtsConfig({ ELEVENLABS_API_KEY: "e", OPENAI_API_KEY: "o" }).provider).toBe("elevenlabs");
    expect(readTtsConfig({ ELEVENLABS_API_KEY: "e", AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "eastus" }).provider).toBe("azure");
    expect(readTtsConfig({ ELEVENLABS_API_KEY: "e", OPENAI_API_KEY: "o", TTS_PROVIDER: "openai" }).provider).toBe("openai");
  });
});

describe("voiceFor", () => {
  test("Azure speaks Spanish and English with male neural voices", () => {
    const config = readTtsConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "eastus" });
    expect(voiceFor(config, "es")).toBe("es-CO-GonzaloNeural");
    expect(voiceFor(config, "en")).toBe("en-US-AndrewMultilingualNeural");
  });

  test("ElevenLabs uses Clipper's chosen voice for both languages", () => {
    const config = readTtsConfig({ ELEVENLABS_API_KEY: "e" });
    expect(voiceFor(config, "es")).toBe("cjVigY5qzO86Huf0OWal");
    expect(voiceFor(config, "en")).toBe("cjVigY5qzO86Huf0OWal");
  });

  test("a voice set in the environment replaces the default", () => {
    expect(voiceFor(readTtsConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "eastus", TTS_VOICE_ES: "es-MX-JorgeNeural" }), "es")).toBe("es-MX-JorgeNeural");
  });
});

describe("toSsml", () => {
  test("escapes the text and sets the voice and language", () => {
    expect(toSsml("Corte & barba <hoy>", "es-CO-GonzaloNeural", "es")).toBe(
      '<speak version="1.0" xml:lang="es-CO"><voice name="es-CO-GonzaloNeural">Corte &amp; barba &lt;hoy&gt;</voice></speak>'
    );
  });
});

describe("synthesize", () => {
  test("rejects empty or too long text and unknown languages", async () => {
    const config = readTtsConfig({ OPENAI_API_KEY: "o" });
    expect((await synthesize({ text: "" , lang: "es" }, config)).status).toBe(400);
    expect((await synthesize({ text: "a".repeat(1201), lang: "es" }, config)).status).toBe(400);
    expect((await synthesize({ text: "hola", lang: "fr" }, config)).status).toBe(400);
  });

  test("without a provider answers 501 so the browser uses its own voice", async () => {
    expect((await synthesize({ text: "hola", lang: "es" }, readTtsConfig({}))).status).toBe(501);
  });

  test("Azure: SSML to the region endpoint with the key, mp3 back", async () => {
    const fetcher = vi.fn().mockResolvedValue(audio());
    const result = await synthesize({ text: "Hola", lang: "es" }, readTtsConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "eastus" }), fetcher);
    expect(result.status).toBe(200);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://eastus.tts.speech.microsoft.com/cognitiveservices/v1");
    expect(init.headers["Ocp-Apim-Subscription-Key"]).toBe("k");
    expect(init.body).toContain("es-CO-GonzaloNeural");
  });

  test("ElevenLabs: one multilingual voice for both languages", async () => {
    const fetcher = vi.fn().mockResolvedValue(audio());
    await synthesize({ text: "Hi", lang: "en" }, readTtsConfig({ ELEVENLABS_API_KEY: "e", TTS_VOICE: "voz123" }), fetcher);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voz123?output_format=mp3_44100_64");
    expect(init.headers["xi-api-key"]).toBe("e");
    expect(JSON.parse(init.body)).toMatchObject({ text: "Hi", model_id: "eleven_flash_v2_5", language_code: "en" });
  });

  test("OpenAI: gpt-4o-mini-tts with a male voice and how to speak", async () => {
    const fetcher = vi.fn().mockResolvedValue(audio());
    await synthesize({ text: "Hola", lang: "es" }, readTtsConfig({ OPENAI_API_KEY: "o" }), fetcher);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/audio/speech");
    expect(JSON.parse(init.body)).toMatchObject({ model: "gpt-4o-mini-tts", voice: "onyx", input: "Hola", response_format: "mp3" });
  });

  test("a provider failure is a 502 without leaking its message", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("bad key sk-123", { status: 401 }));
    const result = await synthesize({ text: "Hola", lang: "es" }, readTtsConfig({ OPENAI_API_KEY: "o" }), fetcher);
    expect(result.status).toBe(502);
    expect(await result.text()).not.toContain("sk-123");
  });
});

describe("Gemini", () => {
  const pcm = btoa(String.fromCharCode(1, 2, 3, 4));
  const geminiBody = { candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: pcm } }] } }] };

  test("goes first when its key is set, with a male voice for both languages", () => {
    const config = readTtsConfig({ GEMINI_API_KEY: "g", ELEVENLABS_API_KEY: "e", AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "eastus" });
    expect(config.provider).toBe("gemini");
    expect(voiceFor(config, "es")).toBe("Achird");
  });

  test("wraps the PCM it returns in a playable WAV", () => {
    const wav = geminiToWav(geminiBody);
    expect(wav).not.toBeNull();
    const text = (from: number) => String.fromCharCode(...(wav as Uint8Array).slice(from, from + 4));
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect((wav as Uint8Array).length).toBe(44 + 4);
    expect(new DataView((wav as Uint8Array).buffer).getUint32(24, true)).toBe(24000);
    expect(geminiToWav({ candidates: [] })).toBeNull();
  });

  test("asks Gemini for audio with the voice and the tone, and answers audio/wav", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(geminiBody), { status: 200, headers: { "content-type": "application/json" } }));
    const response = await synthesize({ text: "Hola, Marcela", lang: "es" }, readTtsConfig({ GEMINI_API_KEY: "g" }), fetcher);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toContain("gemini-2.5-flash-preview-tts:generateContent");
    expect(init.headers["x-goog-api-key"]).toBe("g");
    const body = JSON.parse(String(init.body));
    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Achird");
    expect(body.contents[0].parts[0].text).toMatch(/Hola, Marcela$/);
  });
});
