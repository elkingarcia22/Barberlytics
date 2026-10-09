import { describe, expect, test } from "vitest";
import type { ChatTurn } from "./chatKit";
import { forVoice, fromVoice, matchSpokenOption, voiceReplyFromTurns } from "./voiceReply";

const LABELS = { someOf: (list: string) => `Por ejemplo: ${list}, o mira la lista`, oneOf: (list: string) => `Puedes decir ${list}` };
const agent = (id: string, text?: string, question?: ChatTurn["question"]): ChatTurn => ({ id, from: "agent", text, question });
const question = (title: string, options: string[]) => ({ title, options, kind: "time", values: {} }) as unknown as ChatTurn["question"];

describe("voiceReplyFromTurns", () => {
  test("says the agent's new messages, the question and its options, and offers them to tap", () => {
    const turns: ChatTurn[] = [
      { id: "u1", from: "user", text: "corte con barba mañana con Maicol" },
      agent("a1", "Perfecto, corte con barba con **Maicol**."),
      agent("a2", undefined, question("¿A qué hora?", ["2:00 p. m.", "2:30 p. m.", "3:00 p. m."])),
    ];
    const reply = voiceReplyFromTurns(turns, "es-CO", LABELS);
    expect(reply.text).toBe("Perfecto, corte con barba con **Maicol**. ¿A qué hora? Puedes decir 2:00 p. m., 2:30 p. m. o 3:00 p. m.");
    expect(reply.followups).toEqual(["2:00 p. m.", "2:30 p. m.", "3:00 p. m."]);
  });

  test("with a long list it reads three and points to the rest", () => {
    const turns = [agent("a1", undefined, question("Elige tu barbero", ["Andrés", "Maicol", "Daniela", "Julián", "Sara"]))];
    const reply = voiceReplyFromTurns(turns, "es-CO", LABELS);
    expect(reply.text).toBe("Elige tu barbero. Por ejemplo: Andrés, Maicol o Daniela, o mira la lista.");
    expect(reply.followups).toHaveLength(5);
  });

  test("does not repeat the question when the message already says it", () => {
    const turns = [agent("a1", "¿Para cuándo?", question("¿Para cuándo?", ["Hoy", "Mañana"]))];
    expect(voiceReplyFromTurns(turns, "es-CO", LABELS).text).toBe("¿Para cuándo? Puedes decir Hoy o Mañana.");
  });

  test("ignores the person's own messages and returns plain text without a question", () => {
    const turns: ChatTurn[] = [{ id: "u1", from: "user", text: "3001234567" }, agent("a1", "Te mandé un código por SMS.")];
    expect(voiceReplyFromTurns(turns, "es-CO", LABELS)).toEqual({ text: "Te mandé un código por SMS.", followups: [] });
  });
});

describe("forVoice", () => {
  test("turns typing instructions into speaking ones", () => {
    expect(forVoice("Escríbeme tu número de celular, solo los números, sin espacios ni signos.", "es-CO")).toBe("Dime tu número de celular, solo los números.");
    expect(forVoice("Mmm, ese número no se ve bien. Escríbelo con los 10 números.", "es-CO")).toBe("Mmm, ese número no se ve bien. Dímelo con los 10 números.");
    expect(forVoice("Escribe el código que te llegó.", "es-CO")).toBe("Di el código que te llegó.");
  });

  test("does the same in English", () => {
    expect(forVoice("Type your phone number, digits only, no spaces or symbols.", "en-US")).toBe("Tell me your phone number, digits only.");
  });
});

describe("fromVoice", () => {
  test("turns a dictated email into an address", () => {
    expect(fromVoice("carlos arroba correo punto com", "es-CO")).toBe("carlos@correo.com");
    expect(fromVoice("Carlos.Perez arroba Gmail punto com punto co", "es-CO")).toBe("carlos.perez@gmail.com.co");
    expect(fromVoice("john at mail dot com", "en-US")).toBe("john@mail.com");
  });

  test("turns a spoken ordinal into the option number", () => {
    expect(fromVoice("la primera", "es-CO")).toBe("1");
    expect(fromVoice("El segundo", "es-CO")).toBe("2");
    expect(fromVoice("la tercera opción", "es-CO")).toBe("3");
    expect(fromVoice("the second one", "en-US")).toBe("2");
  });

  test("leaves anything else as it was said", () => {
    expect(fromVoice("corte mañana a las 2 con Andrés", "es-CO")).toBe("corte mañana a las 2 con Andrés");
  });
});

describe("matchSpokenOption", () => {
  const promos = ["Sí, quiero recibirlas", "No, gracias"];
  const times = ["2:00 p. m.", "2:30 p. m.", "3:00 p. m."];

  test("matches what was said with the option, ignoring punctuation and accents", () => {
    expect(matchSpokenOption("no gracias", promos, "es-CO")).toBe("No, gracias");
    expect(matchSpokenOption("massachusetts", ["Massachusetts", "Utah"], "es-CO")).toBe("Massachusetts");
    expect(matchSpokenOption("si", promos, "es-CO")).toBe("Sí, quiero recibirlas");
  });

  test("an ordinal picks by place and a time picks that time", () => {
    expect(matchSpokenOption("la segunda", times, "es-CO")).toBe("2:30 p. m.");
    expect(matchSpokenOption("la de las 2:30", times, "es-CO")).toBe("2:30 p. m.");
  });

  test("returns null when nothing (or more than one) fits", () => {
    expect(matchSpokenOption("corte mañana con Andrés", ["Massachusetts", "Utah"], "es-CO")).toBeNull();
    expect(matchSpokenOption("p. m.", times, "es-CO")).toBeNull();
  });
});
