/**
 * Hechos → narración. Las cifras las calcula el sistema; Claude solo redacta. Para que no pueda
 * inventar un número, el modelo escribe con marcadores (`{ventas}`) y nunca con dígitos: el servidor
 * rechaza cualquier respuesta con un dígito o con un marcador desconocido, y pone él las cifras. Si
 * algo falla, la app usa su resumen automático, que dice lo mismo sin adornos.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-haiku-5-5";
const MAX_OUTPUT_TOKENS = 400;
const MAX_FACTS = 20;
const KEY = /^[a-zA-Z][a-zA-Z0-9]{0,29}$/;
const MAX_LABEL = 80;
const MAX_VALUE = 40;
const KINDS = ["week", "pay"] as const;
export type NarrativeKind = (typeof KINDS)[number];

export interface NarrativeConfig {
  apiKey: string | null;
  model: string;
}

export const readNarrativeConfig = (env: Record<string, string | undefined> = process.env): NarrativeConfig => ({ apiKey: env.ANTHROPIC_API_KEY?.trim() || null, model: env.NARRATIVE_MODEL?.trim() || DEFAULT_MODEL });

export interface NarrativeInput {
  kind: NarrativeKind;
  locale: "es" | "en";
  facts: Record<string, { label: string; value: string }>;
}

/** Lo que llega de la app, validado: claves cortas, etiquetas y valores con tope y sin saltos de línea. */
export function parseNarrativeInput(body: unknown): NarrativeInput | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const kind = KINDS.find((item) => item === input.kind);
  const locale = input.locale === "en" ? "en" : "es";
  if (!kind || !input.facts || typeof input.facts !== "object") return null;
  const entries = Object.entries(input.facts as Record<string, unknown>);
  if (entries.length === 0 || entries.length > MAX_FACTS) return null;
  const facts: NarrativeInput["facts"] = {};
  for (const [key, raw] of entries) {
    const fact = raw as { label?: unknown; value?: unknown } | null;
    if (!KEY.test(key) || typeof fact?.label !== "string" || typeof fact.value !== "string") return null;
    const label = fact.label.replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
    const value = fact.value.replace(/\s+/g, " ").trim().slice(0, MAX_VALUE);
    if (!label || !value) return null;
    facts[key] = { label, value };
  }
  return { kind, locale, facts };
}

const SYSTEM = {
  es: [
    "Escribes para el dueño o el barbero de una barbería, en español de Colombia, claro y cálido, sin jerga.",
    "Recibes cifras ya calculadas. Escribe de 3 a 4 frases cortas que las cuenten: qué pasó, qué destaca y una sugerencia concreta que salga de esas cifras.",
    "REGLAS: nunca escribas dígitos; para cada cifra usa su marcador exacto entre llaves, por ejemplo {ventas}. No uses marcadores que no te den. No inventes datos, causas ni comparaciones que no estén. Sin saludos, sin títulos, sin listas, sin emojis.",
  ].join("\n"),
  en: [
    "You write for the owner or a barber of a barbershop, in plain, warm English.",
    "You receive already computed figures. Write 3 to 4 short sentences about them: what happened, what stands out and one concrete suggestion that follows from them.",
    "RULES: never write digits; for each figure use its exact placeholder in braces, e.g. {revenue}. Don't use placeholders you weren't given. Don't invent data, causes or comparisons. No greetings, titles, lists or emojis.",
  ].join("\n"),
};

const TOPIC = { week: { es: "Cómo le fue a la barbería esta semana.", en: "How the barbershop did this week." }, pay: { es: "Por qué el barbero cobra esta cifra en el periodo.", en: "Why the barber earns this amount in the period." } };

export function promptOf(input: NarrativeInput): { system: string; user: string } {
  const lines = Object.entries(input.facts).map(([key, fact]) => `{${key}} = ${fact.value} (${fact.label})`);
  return { system: SYSTEM[input.locale], user: [TOPIC[input.kind][input.locale], "", ...lines].join("\n") };
}

/** Comprueba la redacción y pone las cifras. `null` si trae un dígito o un marcador que no existe. */
export function fillNarrative(text: string, facts: NarrativeInput["facts"]): string | null {
  const clean = text.trim();
  if (!clean || /\d/.test(clean)) return null;
  const placeholders = [...clean.matchAll(/\{([a-zA-Z0-9]+)\}/g)].map((match) => match[1]);
  if (placeholders.some((key) => !(key in facts))) return null;
  return clean.replace(/\{([a-zA-Z0-9]+)\}/g, (_, key: string) => facts[key].value);
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function narrate(body: unknown, config: NarrativeConfig, fetcher: Fetcher = fetch): Promise<Response> {
  const input = parseNarrativeInput(body);
  if (!input) return json(400, { code: "validation", message: "Cifras inválidas." });
  if (!config.apiKey) return json(501, { code: "not_configured", message: "Sin clave de Claude: la app usa su resumen automático." });
  const { system, user } = promptOf(input);
  try {
    const response = await fetcher(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": config.apiKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({ model: config.model, max_tokens: MAX_OUTPUT_TOKENS, temperature: 0.3, system, messages: [{ role: "user", content: user }] }),
    });
    const data = (await response.json().catch(() => null)) as { model?: string; content?: { type: string; text?: string }[] } | null;
    if (!response.ok || !data) return json(502, { code: "provider_error", message: `Claude respondió ${response.status}.` });
    const text = (data.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("");
    const filled = fillNarrative(text, input.facts);
    // Si se coló un número o un marcador inventado, no se usa: la app cae a su resumen automático.
    if (!filled) return json(502, { code: "unsafe_output", message: "La redacción no respetó las cifras." });
    return json(200, { text: filled, model: data.model ?? config.model });
  } catch {
    return json(502, { code: "provider_error", message: "No se pudo hablar con Claude." });
  }
}
