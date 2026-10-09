import { describe, expect, test } from "vitest";
import type { ChatTurn } from "./chatKit";
import { forVoice, fromVoice, matchSpokenOption, saysOnlyOption, voiceReplyFromTurns } from "./voiceReply";

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
    expect(reply.text).toBe("Perfecto, corte con barba con **Maicol**. ¿A qué hora? Puedes decir a las 2 de la tarde, a las 2 y 30 de la tarde o a las 3 de la tarde.");
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

  test("a phone or code said in words or groups arrives as digits", () => {
    expect(fromVoice("trescientos ciento veintitrés cuarenta y cinco sesenta y siete", "es-CO")).toBe("3001234567");
    expect(fromVoice("24 68 10", "es-CO")).toBe("246810");
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

  test("a name said on its own picks the option that starts with it", () => {
    const near = ["2:00 p. m.", "Emilio a las 3:00 p. m.", "Nicolás a las 3:00 p. m.", "Ver todas las horas"];
    expect(matchSpokenOption("con Emilio", near, "es-CO")).toBe("Emilio a las 3:00 p. m.");
    expect(matchSpokenOption("la de nicolas", near, "es-CO")).toBe("Nicolás a las 3:00 p. m.");
  });

  test("returns null when nothing (or more than one) fits", () => {
    expect(matchSpokenOption("corte mañana con Andrés", ["Massachusetts", "Utah"], "es-CO")).toBeNull();
    expect(matchSpokenOption("p. m.", times, "es-CO")).toBeNull();
  });
});

describe("forVoice: fechas, horas y precios como se dicen", () => {
  test("los días y meses abreviados se dicen completos", () => {
    expect(forVoice("vie, 9 de oct, 6:00 p. m.", "es-CO")).toBe("viernes 9 de octubre, a las 6 de la tarde.");
    expect(forVoice("Jue, 15 de ene", "es-CO")).toBe("Jueves 15 de enero");
    expect(forVoice("mar, 13 de mar", "es-CO")).toBe("martes 13 de marzo");
  });

  test("las horas como se dicen: de la mañana, del mediodía, de la tarde, de la noche", () => {
    expect(forVoice("a las 9:30 a. m.", "es-CO")).toBe("a las 9 y 30 de la mañana.");
    expect(forVoice("12:00 p. m.", "es-CO")).toBe("a las 12 del mediodía.");
    expect(forVoice("Tenemos 3:15 p. m. o 7:00 p. m.", "es-CO")).toBe("Tenemos a las 3 y 15 de la tarde o a las 7 de la noche.");
  });

  test("precios y porcentajes con sus palabras", () => {
    expect(forVoice("Total: US$ 71", "es-CO")).toBe("Total: 71 dólares");
    expect(forVoice("Propina 15 %", "es-CO")).toBe("Propina 15 por ciento");
  });

  test("en inglés, también completo", () => {
    expect(forVoice("Fri, Oct 9, 6:00 PM", "en-US")).toBe("Friday, October 9, at 6 PM");
    expect(forVoice("Total: US$ 71", "en-US")).toBe("Total: 71 dollars");
  });
});

describe("forVoice: números de teléfono y códigos como se dictan", () => {
  test("un celular: los tres primeros juntos y luego de a tres, dos y dos", () => {
    expect(forVoice("Por ejemplo: 3001234567.", "es-CO")).toBe("Por ejemplo: 300, 123, 45, 67.");
    expect(forVoice("Llama al 6012345678", "es-CO")).toBe("Llama al 601, 234, 56, 78");
  });

  test("el celular oculto se dice por sus últimas cifras, de a dos", () => {
    expect(forVoice("Te mandé un código por WhatsApp a •••• 2738.", "es-CO")).toBe("Te mandé un código por WhatsApp al número terminado en 27, 38.");
    expect(forVoice("SMS al •••• 4567", "es-CO")).toBe("SMS al número terminado en 45, 67");
  });

  test("un código de seis cifras, de a dos; los precios no se tocan", () => {
    expect(forVoice("Tu código es 246810", "es-CO")).toBe("Tu código es 24, 68, 10");
    expect(forVoice("Total: US$ 1500", "es-CO")).toBe("Total: 1500 dólares");
  });

  test("en inglés, igual", () => {
    expect(forVoice("For example: 3001234567.", "en-US")).toBe("For example: 300, 123, 45, 67.");
    expect(forVoice("to •••• 2738", "en-US")).toBe("to the number ending in 27, 38");
  });
});

describe("saysOnlyOption: elegir de la lista o decirlo todo de una vez", () => {
  test("solo la opción (con palabras de relleno) es elegirla", () => {
    expect(saysOnlyOption("corte clásico", "Corte clásico", "es-CO")).toBe(true);
    expect(saysOnlyOption("quiero el corte clásico por favor", "Corte clásico", "es-CO")).toBe(true);
    expect(saysOnlyOption("con Emilio", "Emilio a las 3:00 p. m.", "es-CO")).toBe(true);
  });

  test("con más datos (barbero, día, hora) es una petición completa, no la opción", () => {
    expect(saysOnlyOption("quiero un corte clásico con Andrés mañana a las 3", "Corte clásico", "es-CO")).toBe(false);
    expect(saysOnlyOption("agendar una cita de corte para el viernes", "Agendar una cita", "es-CO")).toBe(false);
  });
});
