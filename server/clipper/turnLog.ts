/**
 * El registro de Clipper: cada paso de una pregunta y cada 👍/👎, como una línea JSON en los logs del
 * servidor (Vercel los guarda y se pueden exportar). No lleva la pregunta ni la respuesta —pueden traer
 * nombres o datos de salud de clientes— salvo que la persona marque «compartir» al dar su opinión.
 * Con esto se mide costo, latencia, qué herramientas usa y dónde falla, y se arma el conjunto de evaluación.
 */

export type ClipperStepOutcome = "tools" | "answer" | "corrected" | "unsafe_tool" | "unsafe_numbers" | "provider_error" | "not_configured" | "invalid";

export interface ClipperStepLog {
  type: "clipper_step";
  at: string;
  turnId: string | null;
  role: string | null;
  locale: string | null;
  outcome: ClipperStepOutcome;
  tools: string[];
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  ms: number;
}

export interface ClipperFeedbackLog {
  type: "clipper_feedback";
  at: string;
  turnId: string;
  value: "up" | "down" | null;
  reasons: string[];
  comment: string;
  /** Solo si la persona aceptó compartir la conversación. */
  question?: string;
  answer?: string;
}

type Sink = (line: string) => void;
let sink: Sink = (line) => console.info(line);

/** Para pruebas: a dónde van las líneas. */
export function setClipperLogSink(next: Sink): () => void {
  const previous = sink;
  sink = next;
  return () => {
    sink = previous;
  };
}

export const logClipper = (entry: ClipperStepLog | ClipperFeedbackLog): void => sink(JSON.stringify(entry));

const TURN_ID = /^[\w-]{8,64}$/;
const MAX_COMMENT = 500;
const MAX_SHARED = 4_000;
const MAX_REASONS = 5;
const MAX_REASON = 40;

export const parseTurnId = (value: unknown): string | null => (typeof value === "string" && TURN_ID.test(value) ? value : null);

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** POST /api/clipper/feedback: el 👍/👎 de una respuesta, con motivos y, si se compartió, la conversación. */
export function clipperFeedback(body: unknown): Response {
  if (!body || typeof body !== "object") return json(400, { code: "validation", message: "Falta la opinión." });
  const input = body as Record<string, unknown>;
  const turnId = parseTurnId(input.turnId);
  if (!turnId) return json(400, { code: "validation", message: "Falta el turno." });
  const value = input.value === "up" || input.value === "down" ? input.value : null;
  const reasons = (Array.isArray(input.reasons) ? input.reasons : []).filter((item): item is string => typeof item === "string").slice(0, MAX_REASONS).map((item) => item.slice(0, MAX_REASON));
  const comment = typeof input.comment === "string" ? input.comment.slice(0, MAX_COMMENT) : "";
  const shared = input.share === true;
  logClipper({
    type: "clipper_feedback",
    at: new Date().toISOString(),
    turnId,
    value,
    reasons,
    comment,
    ...(shared && typeof input.question === "string" ? { question: input.question.slice(0, MAX_SHARED) } : {}),
    ...(shared && typeof input.answer === "string" ? { answer: input.answer.slice(0, MAX_SHARED) } : {}),
  });
  return new Response(null, { status: 204 });
}
