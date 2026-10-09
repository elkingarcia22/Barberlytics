import type { ChatReply } from "@/lib/chat";
import type { ChatTurn } from "./chatKit";

/** Cuántas opciones se dicen en voz alta; con más, se dicen las primeras y se remite a la lista. */
const SPOKEN_OPTIONS = 4;
const SAMPLE_OPTIONS = 3;

export interface VoiceReplyLabels {
  /** «Puedes decir {list}»: todas las opciones caben en la frase. */
  oneOf: (list: string) => string;
  /** «Por ejemplo: {list}, o mira la lista»: se dicen algunas. */
  someOf: (list: string) => string;
}

/** Instrucciones para escribir que, dichas, se vuelven para hablar; y lo que solo importa al teclear. */
const VOICE_WORDING: Record<string, ReadonlyArray<[RegExp, string]>> = {
  es: [
    [/,? sin espacios ni signos/g, ""],
    [/\bEscr[ií]beme\b/g, "Dime"],
    [/\bescr[ií]beme\b/g, "dime"],
    [/\bEscr[ií]belo\b/g, "Dímelo"],
    [/\bescr[ií]belo\b/g, "dímelo"],
    [/\bEscr[ií]bela\b/g, "Dímela"],
    [/\bescr[ií]bela\b/g, "dímela"],
    [/\bEscribe\b/g, "Di"],
    [/\bescribe\b/g, "di"],
  ],
  en: [
    [/,? no spaces or symbols/g, ""],
    [/\bType\b/g, "Tell me"],
    [/\btype\b/g, "tell me"],
  ],
};

/** El texto de Clipper como se dice en una llamada: «Dime tu número» en vez de «Escríbeme tu número». */
export function forVoice(text: string, locale: string): string {
  const rules = VOICE_WORDING[locale.slice(0, 2)] ?? [];
  return rules.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

/** Cómo se dicta un correo: «arroba» y «punto» (o «at» y «dot»). */
const SPOKEN_EMAIL: Record<string, { at: RegExp; dot: RegExp }> = {
  es: { at: /\s+arroba\s+/gi, dot: /\s+punto\s+/gi },
  en: { at: /\s+at\s+/gi, dot: /\s+dot\s+/gi },
};

/** «La primera», «el segundo», «the third one»: elegir de una lista por su lugar. */
const SPOKEN_ORDINALS: Record<string, { pattern: RegExp; words: readonly RegExp[] }> = {
  es: {
    pattern: /^(?:el|la)?\s*(\S+)(?:\s+opci[oó]n)?\.?$/i,
    words: [/^primer[oa]?$/i, /^segund[oa]$/i, /^tercer[oa]?$/i, /^cuart[oa]$/i, /^quint[oa]$/i, /^sext[oa]$/i],
  },
  en: {
    pattern: /^(?:the)?\s*(\S+)(?:\s+(?:one|option))?\.?$/i,
    words: [/^first$/i, /^second$/i, /^third$/i, /^fourth$/i, /^fifth$/i, /^sixth$/i],
  },
};

/**
 * Lo dicho como lo entiende el chat escrito: un ordinal («la primera») se vuelve el número de la
 * opción, y un correo dictado («carlos arroba correo punto com») se
 * vuelve una dirección. Lo demás pasa tal cual.
 */
export function fromVoice(text: string, locale: string): string {
  const ordinals = SPOKEN_ORDINALS[locale.slice(0, 2)];
  const word = ordinals?.pattern.exec(text.trim())?.[1];
  const place = word ? ordinals.words.findIndex((ordinal) => ordinal.test(word)) : -1;
  if (place >= 0) return String(place + 1);
  const spoken = SPOKEN_EMAIL[locale.slice(0, 2)];
  if (!spoken || !spoken.at.test(text)) return text;
  spoken.at.lastIndex = 0;
  return text.replace(spoken.at, "@").replace(spoken.dot, ".").replace(/\s+/g, "").toLowerCase();
}

/** Sin tildes, mayúsculas ni signos: «No, gracias» y «no gracias» quedan iguales. */
const plainWords = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, " ")
    .trim();
const TIME = /\b\d{1,2}:\d{2}\b/;

/**
 * La opción de la pregunta abierta que corresponde a lo dicho, exacta como se escribe: por su lugar
 * («la segunda»), por su hora («la de las 2:30») o por su texto aunque se diga sin signos («no
 * gracias») o solo su comienzo («sí»). `null` si no encaja ninguna o encajan varias.
 */
export function matchSpokenOption(text: string, options: readonly string[], locale: string): string | null {
  if (options.length === 0) return null;
  const place = fromVoice(text, locale);
  if (/^\d+$/.test(place) && place !== text.trim()) return options[Number(place) - 1] ?? null;
  const said = plainWords(text);
  if (!said) return null;
  const exact = options.filter((option) => plainWords(option) === said);
  if (exact.length === 1) return exact[0];
  const time = said.match(TIME)?.[0];
  const byTime = time ? options.filter((option) => plainWords(option).match(TIME)?.[0] === time) : [];
  if (byTime.length === 1) return byTime[0];
  const fits = options.filter((option) => {
    const label = plainWords(option);
    return (label.length >= 3 && ` ${said} `.includes(` ${label} `)) || (said.length >= 2 && label.startsWith(`${said} `));
  });
  return fits.length === 1 ? fits[0] : null;
}

const endsSentence = (text: string) => /[.!?…:]$/.test(text.trim());
const sentence = (text: string) => (endsSentence(text) ? text.trim() : `${text.trim()}.`);

/**
 * Lo que Clipper dice en el modo voz tras lo que dijo la persona: sus mensajes nuevos de la
 * conversación (la misma que se escribe), la pregunta abierta y sus opciones dichas como frase
 * («las 2:00, las 2:30 o las 3:00»). Las opciones vuelven también para tocarlas en pantalla.
 */
export function voiceReplyFromTurns(turns: readonly ChatTurn[], locale: string, labels: VoiceReplyLabels): ChatReply {
  const said = turns.filter((turn) => turn.from === "agent");
  const texts = said.map((turn) => turn.text?.trim()).filter((text): text is string => Boolean(text));
  const question = [...said].reverse().find((turn) => turn.question)?.question;
  const parts = [...texts];
  if (question?.title && !texts.some((text) => text.includes(question.title as string))) parts.push(question.title);
  const options = question?.options ?? [];
  if (options.length > 0) {
    const list = new Intl.ListFormat(locale, { type: "disjunction" });
    parts.push(options.length <= SPOKEN_OPTIONS ? labels.oneOf(list.format(options)) : labels.someOf(list.format(options.slice(0, SAMPLE_OPTIONS))));
  }
  // Lo mismo dos veces seguidas (el mensaje y el título de su pregunta) se dice una vez.
  const unique = parts.filter((part, index) => index === 0 || plainWords(part) !== plainWords(parts[index - 1]));
  return { text: forVoice(unique.map(sentence).join(" "), locale), followups: [...options] };
}
