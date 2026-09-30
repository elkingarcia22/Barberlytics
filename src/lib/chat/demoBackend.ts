import { fold } from "@/lib/help/text";
import type { ChatBackend, ChatMessage, ChatReply } from "./types";

/**
 * Respuestas de ejemplo mientras no hay un modelo detrás.
 *
 * No intenta parecer inteligente: enseña lo que el chat sabe hacer. Un
 * pedido abierto («prepárame un plan…») devuelve una pregunta con opciones
 * para acotarlo; una pregunta de datos («cómo va la participación…»)
 * devuelve una tarjeta con fuentes y sugerencias. Todo lo que aquí es un
 * `if` mañana lo decide el modelo.
 */

export interface DemoBackendOptions {
  /** Cuánto tarda en «pensar», en ms. Con dos valores, un tiempo al azar entre ambos. */
  delay?: number | readonly [number, number];
}

const DEFAULT_DELAY: readonly [number, number] = [900, 1700];

interface Rule {
  test: RegExp;
  reply: (question: string, history: readonly ChatMessage[]) => ChatReply;
}

/** La última pregunta con opciones que quedó respondida, si la hay. */
function answeredQuestion(history: readonly ChatMessage[]) {
  return [...history].reverse().find((message) => message.role === "agent" && message.question?.answer);
}

/** El pedido original: el último mensaje de la persona que no sea la respuesta a una pregunta con opciones. */
function originalRequest(history: readonly ChatMessage[]): string {
  const answers = new Set(history.filter((message) => message.role === "agent" && message.question?.answer).map((message) => message.question?.answer));
  return [...history].reverse().find((message) => message.role === "user" && !answers.has(message.text) && !/^\d+$/.test(message.text.trim()))?.text ?? "";
}

const PLAN_QUESTION = {
  options: ["Un solo norte para todo el ciclo", "Dos: uno por trimestre", "Lo habitual: cubre el ciclo sin dispersarlo", "Cuatro, uno por mes", "Cinco o más"],
  otherPlaceholder: "Escribe cuántos quieres",
} as const;

const RULES: readonly Rule[] = [
  {
    test: /participaci|asistencia/,
    reply: () => ({
      text: "Ventas Bogotá está en **58 % de participación**, nueve puntos por debajo del promedio de la empresa. La caída está concentrada en el turno de la tarde.",
      card: {
        kind: "bars",
        title: "Participación por turno",
        rows: [
          { label: "Mañana", value: 71 },
          { label: "Tarde", value: 46 },
          { label: "Noche", value: 58 },
        ],
      },
      sources: [
        { label: "Participación · septiembre", detail: "Aprendizaje › Reportes" },
        { label: "Equipo Ventas Bogotá", detail: "32 personas" },
      ],
      followups: ["Preparar un aviso para el turno tarde", "Comparar con el mes pasado", "¿Quiénes no han entrado?"],
    }),
  },
  {
    test: /evaluaci/,
    reply: () => ({
      text: "Hay **14 evaluaciones vencidas** en tu equipo. Once son de Ventas y tres de Operaciones; la más antigua lleva 12 días.",
      card: {
        kind: "metrics",
        items: [
          { label: "Vencidas", value: "14", delta: "+3 esta semana", tone: "negative" },
          { label: "A tiempo", value: "86 %", delta: "−4 pp", tone: "negative" },
          { label: "Días de retraso", value: "12", tone: "neutral" },
        ],
      },
      sources: [{ label: "Evaluaciones · ciclo Q3", detail: "Desempeño › Evaluaciones" }],
      followups: ["Enviar un recordatorio a las 14 personas", "Ver la lista por líder", "Ampliar el plazo una semana"],
    }),
  },
  {
    test: /rotaci|riesgo|renuncia/,
    reply: () => ({
      text: "Veo **señales de rotación en 6 personas** del Q3. Cuatro llevan más de 3 meses sin formación y dos bajaron su participación a la mitad.",
      sources: [
        { label: "Participación en aprendizaje", detail: "Últimos 90 días" },
        { label: "Encuesta de clima", detail: "Agosto" },
      ],
      followups: ["Ver quiénes son", "Preparar una conversación uno a uno", "¿Qué equipos concentran el riesgo?"],
    }),
  },
  {
    test: /plan|formaci|feedback|capacitaci/,
    reply: (_question, history) => {
      const answered = answeredQuestion(history);
      if (!answered) {
        return {
          text: "Puedo prepararlo. Para que quede corto de verdad, dime cuántas sesiones quieres en el ciclo:",
          question: PLAN_QUESTION,
        };
      }
      const chosen = answered.question?.answer ?? "";
      const count = /^\d+/.exec(chosen)?.[0] ?? (PLAN_QUESTION.options.indexOf(chosen as (typeof PLAN_QUESTION.options)[number]) + 1 || 3);
      const request = originalRequest(history);
      return {
        text: `Listo: un plan de **${count} sesiones** para ${request ? `«${request.replace(/\.$/, "")}»` : "tu equipo"}.\n\n1. **Arranque:** qué esperamos del feedback y cómo se da en 5 minutos.\n2. **Práctica:** una situación real por líder, con guion y observador.\n${Number(count) >= 3 ? "3. **Cierre:** compromisos por persona y una fecha para revisarlos.\n" : ""}\nCada sesión dura 45 minutos y cabe en la reunión semanal.`,
        sources: [{ label: "Plantilla: feedback para líderes", detail: "Aprendizaje › Plantillas" }],
        followups: ["Asignarlo a los líderes de Ventas", "Cambiar la duración de las sesiones", "Añadir una sesión de seguimiento"],
      };
    },
  },
];

const FALLBACK = (question: string): ChatReply => ({
  text: `Puedo ayudarte con eso. Para no suponer, dime por dónde empezamos:`,
  question: {
    options: ["Ver cómo va hoy", "Preparar algo para enviar", "Revisar quién falta", "Solo explícamelo"],
    otherPlaceholder: `Cuéntame más sobre «${question.slice(0, 40)}${question.length > 40 ? "…" : ""}»`,
  },
});

function pickDelay(delay: DemoBackendOptions["delay"]): number {
  if (typeof delay === "number") return delay;
  const [min, max] = delay ?? DEFAULT_DELAY;
  return min + Math.random() * (max - min);
}

export function createDemoBackend(options: DemoBackendOptions = {}): ChatBackend {
  return {
    reply(question, history, signal) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
        const timer = setTimeout(() => {
          // Una respuesta a una pregunta con opciones se decide por el pedido original.
          const answered = answeredQuestion(history);
          const subject = answered ? `${originalRequest(history)} ${question}` : question;
          const folded = fold(subject);
          const rule = RULES.find((item) => item.test.test(folded));
          resolve({ ...(rule ? rule.reply(question, history) : FALLBACK(question)), via: "demo" });
        }, pickDelay(options.delay));
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    },
  };
}
