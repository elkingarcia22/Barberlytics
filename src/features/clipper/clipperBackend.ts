import type { ChatAction, ChatBackend, ChatMessage, ChatReply } from "@/lib/chat";
import { runClipperTool, type ClipperToolContext } from "./tools";

/**
 * Clipper con modelo detrás del chat. Cada pregunta es un ciclo corto: la app manda la conversación a
 * `/api/clipper`; si el modelo pide consultas, las ejecuta aquí con la sesión de quien pregunta (cada
 * endpoint aplica su permiso) y vuelve con los resultados, hasta que contesta. Bajo la respuesta queda
 * lo que se consultó. Sin clave en el servidor (501), o si algo falla, responde `fallback` (el centro
 * de ayuda), como antes.
 */

export interface ClipperBackendContext extends ClipperToolContext {
  branch: string;
  currency: string;
  userName: string;
}

export interface ClipperBackendOptions {
  context: ClipperBackendContext;
  fallback: ChatBackend;
  labels: { consulted: string; tool: (name: string) => string };
  /** Para pruebas: quién hace la petición. */
  fetcher?: typeof fetch;
}

type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
type Message = { role: "user" | "assistant"; content: string | Block[] };
type Step = { kind: "tools"; content: Block[]; calls: { id: string; name: string; input: Record<string, unknown> }[] } | { kind: "answer"; text: string; model: string };

const newTurnId = (): string => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`);

/** Manda el 👍/👎 de una respuesta de Clipper al registro (con la conversación solo si se compartió). */
export async function sendClipperFeedback(input: { turnId: string; value: "up" | "down" | undefined; reasons?: readonly string[]; comment?: string; share?: boolean; question?: string; answer?: string }, fetcher: typeof fetch = fetch): Promise<void> {
  try {
    await fetcher("/api/clipper/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ turnId: input.turnId, value: input.value ?? null, reasons: input.reasons ?? [], comment: input.comment ?? "", share: input.share === true, ...(input.share ? { question: input.question, answer: input.answer } : {}) }),
    });
  } catch {
    // Opinar no puede romper el chat: si no llega, se pierde esa opinión.
  }
}

/** Vueltas máximas consulta → respuesta por pregunta. */
const MAX_STEPS = 5;
/** Lo que se le recuerda de la conversación: las últimas idas y vueltas, solo el texto. */
const HISTORY = 12;

/** Sin clave en el servidor: se recuerda mientras dure la página para no preguntar en cada mensaje. */
let notConfigured = false;
export const resetClipperAvailability = (): void => {
  notConfigured = false;
};

/** La conversación del chat como mensajes para el modelo: solo texto, alternando, terminando en la pregunta. */
export function toModelMessages(question: string, history: readonly ChatMessage[]): Message[] {
  const turns = history
    .filter((message) => message.text.trim() && (message.role === "user" || message.status === "done"))
    .slice(-HISTORY)
    .map((message): Message => ({ role: message.role === "user" ? "user" : "assistant", content: message.text }));
  const last = turns[turns.length - 1];
  if (!last || last.role !== "user" || last.content !== question) turns.push({ role: "user", content: question });
  const merged = turns.reduce<Message[]>((acc, turn) => {
    const prev = acc[acc.length - 1];
    return prev && prev.role === turn.role ? [...acc.slice(0, -1), { role: turn.role, content: `${prev.content as string}\n\n${turn.content as string}` }] : [...acc, turn];
  }, []);
  while (merged.length > 0 && merged[0].role !== "user") merged.shift();
  return merged;
}

export function createClipperBackend({ context, fallback, labels, fetcher = fetch }: ClipperBackendOptions): ChatBackend {
  const step = async (messages: readonly Message[], turnId: string, signal: AbortSignal): Promise<Step | "fallback"> => {
    const response = await fetcher("/api/clipper", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ context: { locale: context.locale, role: context.role, today: context.today, branch: context.branch, currency: context.currency, userName: context.userName, turnId }, messages }),
      signal,
    });
    if (response.status === 501) notConfigured = true;
    if (!response.ok) return "fallback";
    return (await response.json()) as Step;
  };

  return {
    async reply(question, history, signal): Promise<ChatReply> {
      if (notConfigured) return fallback.reply(question, history, signal);
      const messages = toModelMessages(question, history);
      // Un id por pregunta: une sus pasos en el registro del servidor y el 👍/👎 que venga después.
      const turnId = newTurnId();
      const used: string[] = [];
      // Las propuestas de este turno: van como tarjetas bajo la respuesta.
      const proposed: ChatAction[] = [];
      try {
        for (let turn = 0; turn < MAX_STEPS; turn++) {
          const result = await step(messages, turnId, signal);
          if (result === "fallback") break;
          if (result.kind === "answer") {
            const names = [...new Set(used)];
            return { text: result.text, sources: names.length > 0 ? [{ label: labels.consulted, detail: [...new Set(names.map(labels.tool))].join(" · ") }] : undefined, actions: proposed.length > 0 ? proposed : undefined, via: "model", traceId: turnId };
          }
          const results = await Promise.all(result.calls.map(async (call) => ({ call, outcome: await runClipperTool(call.name, call.input, context, signal, (action) => proposed.push(action)) })));
          used.push(...result.calls.map((call) => call.name));
          messages.push({ role: "assistant", content: result.content });
          messages.push({ role: "user", content: results.map(({ call, outcome }) => ({ type: "tool_result" as const, tool_use_id: call.id, content: outcome.content, ...(outcome.isError ? { is_error: true } : {}) })) });
        }
      } catch (error) {
        if (signal.aborted) throw error;
      }
      return fallback.reply(question, history, signal);
    },
  };
}
