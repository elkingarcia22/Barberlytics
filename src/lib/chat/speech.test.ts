import { describe, expect, test } from "vitest";
import { pickVoice, toSpeech, type VoiceLike } from "./speech";

const voice = (name: string, lang: string, localService = true): VoiceLike => ({ name, lang, localService });

describe("pickVoice", () => {
  test("prefers a male Spanish voice over a female one", () => {
    const voices = [voice("Paulina", "es-MX"), voice("Jorge", "es-ES"), voice("Samantha", "en-US")];
    expect(pickVoice(voices, "es-CO", "male")?.name).toBe("Jorge");
  });

  test("prefers a natural (neural) male voice of the same region", () => {
    const voices = [
      voice("Microsoft Raul - Spanish (Mexico)", "es-MX"),
      voice("Microsoft Gonzalo Online (Natural) - Spanish (Colombia)", "es-CO", false),
      voice("Microsoft Salome Online (Natural) - Spanish (Colombia)", "es-CO", false),
    ];
    expect(pickVoice(voices, "es-CO", "male")?.name).toContain("Gonzalo");
  });

  test("falls back to any voice of the language, and to null without one", () => {
    expect(pickVoice([voice("Mónica", "es-ES")], "es-CO", "male")?.name).toBe("Mónica");
    expect(pickVoice([voice("Samantha", "en-US")], "es-CO", "male")).toBeNull();
  });
});

describe("toSpeech", () => {
  test("drops markdown, emoji and symbols that would be read aloud", () => {
    expect(toSpeech("**Listo** ✂️ tu cita → mañana · 2:00 p. m.")).toBe("Listo tu cita, mañana, 2:00 p. m.");
  });

  test("drops masked digits so only the visible ones are read", () => {
    expect(toSpeech("Te mandé un código a •••• 4567.")).toBe("Te mandé un código a 4567.");
  });

  test("reads lines and list items with a pause between them and no double periods", () => {
    expect(toSpeech("Esto es lo que llevas:\n- Corte + barba, 3:00 p. m.\nTotal: US$ 71")).toBe("Esto es lo que llevas: Corte + barba, 3:00 p. m. Total: US$ 71");
    expect(toSpeech("sáb, 10 de oct, **3:00 p. m.**.")).toBe("sáb, 10 de oct, 3:00 p. m.");
    expect(toSpeech("para confirmar que eres tú.\n\n¿No te llegó?")).toBe("para confirmar que eres tú. ¿No te llegó?");
  });

  test("keeps the text of links and removes the url", () => {
    expect(toSpeech("Mira [la sede](https://x.co/sede) antes")).toBe("Mira la sede antes");
  });
});
