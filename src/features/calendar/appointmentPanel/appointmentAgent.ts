import type { useAppT } from "@/app/i18n";
import type { AgentFocus, ChatReply } from "@/lib/chat";
import { formatClock } from "@/components/scheduling";
import { appointmentStart, type ModelContext } from "../calendarModel";
import { PAYMENT_METHOD_KEYS } from "../types";
import type { AppointmentInsight } from "../appointmentInsights";
import { LOYALTY_EVERY, type AppointmentModel } from "./useAppointmentModel";

/**
 * Lo que Clipper sabe de una cita cuando se le pregunta desde su panel: la
 * cita y el cliente, sacados de los mismos datos que el panel. Son reglas por
 * palabras —mientras no haya un modelo detrás— y cada respuesta dice de dónde
 * sale y propone qué preguntar después. Lo que no es de la cita lo responde
 * la ayuda de siempre.
 */

type Translate = ReturnType<typeof useAppT>;
type FormatDate = (date: Date, options: Intl.DateTimeFormatOptions) => string;

const LONG_DATE: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

/** Sin tildes ni mayúsculas: «Alérgico» y «alergico» son lo mismo. */
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Cada tema y las palabras que lo delatan, en el orden en que se prueban. */
const TOPICS = [
  ["summary", ["resum", "brief", "contexto", "saber", "quien es", "summar", "who is", "know"]],
  ["alerts", ["alerg", "medic", "cuidar", "cuidado", "riesgo de salud", "allerg", "careful"]],
  ["request", ["nota", "pidio", "foto", "referencia", "reserv", "note", "photo", "asked"]],
  ["reliability", ["falt", "planton", "no vino", "no asist", "cumpl", "cancel", "no-show", "no show", "reliab"]],
  ["loyalty", ["membres", "cortesia", "puntos", "fidel", "member", "reward", "loyal"]],
  ["next", ["proxim", "agend", "cuando vuelve", "volver", "next", "rebook", "book"]],
  ["rhythm", ["cada cuanto", "frecuen", "ritmo", "ultima", "visitas", "often", "rhythm", "last", "visits"]],
  ["barber", ["barber", "prefier", "con quien", "prefer"]],
  ["upsell", ["ofrec", "vend", "producto", "upsell", "sell", "offer"]],
  ["contact", ["telefono", "celular", "llamar", "whatsapp", "contact", "phone", "call"]],
  ["price", ["precio", "cuanto", "cobr", "pag", "price", "pay", "cost"]],
] as const;

type Topic = (typeof TOPICS)[number][0] | "unknown";

export function topicOf(question: string): Topic {
  const text = normalize(question);
  const found = TOPICS.find(([, words]) => words.some((word) => text.includes(word)));
  return found ? found[0] : "unknown";
}

export interface AppointmentAgentInput {
  model: AppointmentModel;
  ctx: ModelContext;
  t: Translate;
  formatDate: FormatDate;
}

/** El texto de una sugerencia de la IA, igual que en su tarjeta. */
function insightText({ t, ctx, formatDate }: AppointmentAgentInput, insight: AppointmentInsight): string {
  return t(insight.textKey, {
    ...insight.params,
    ...(insight.date ? { date: formatDate(insight.date, LONG_DATE) } : {}),
    ...(insight.price === undefined ? {} : { price: ctx.formatMoney(insight.price) }),
  });
}

function answerFor(topic: Topic, input: AppointmentAgentInput): string {
  const { model, ctx, t, formatDate } = input;
  const { appointment, known, firstName } = model;
  const services = model.services.map((service) => service.name).join(" + ") || "—";
  const time = formatClock(appointmentStart(appointment), ctx.intl);
  switch (topic) {
    case "summary": {
      const visits = !known ? t("calendar.agent.summary.walkIn") : known.visits <= 1 ? t("calendar.agent.summary.first") : t("calendar.agent.summary.visits", { visits: known.visits });
      const alert = model.critical.length > 0 ? ` ${t("calendar.agent.alerts.some", { list: model.critical.map((note) => note.text).join("; ") })}` : "";
      return `${t("calendar.agent.summary.lead", { name: model.clientName, services, barber: model.barber?.name ?? "—", time })} ${visits} ${model.headline}.${alert}`;
    }
    case "alerts":
      return model.critical.length > 0 ? t("calendar.agent.alerts.some", { list: model.critical.map((note) => note.text).join("; ") }) : t("calendar.agent.alerts.none", { name: firstName });
    case "request": {
      const photos = appointment.referencePhotos?.length ?? 0;
      const parts = [appointment.notes ? t("calendar.agent.request.note", { note: appointment.notes }) : null, photos > 0 ? t("calendar.agent.request.photos", { count: photos }) : null].filter(Boolean);
      return parts.length > 0 ? parts.join(" ") : t("calendar.agent.request.none", { name: firstName });
    }
    case "reliability":
      if (!known) return t("calendar.agent.noProfile");
      return known.noShows + known.cancellations === 0 ? t("calendar.agent.reliability.good", { name: firstName, visits: known.visits }) : t("calendar.agent.reliability.some", { visits: known.visits, noShows: known.noShows, cancellations: known.cancellations });
    case "loyalty": {
      if (!known) return t("calendar.agent.noProfile");
      const left = LOYALTY_EVERY - model.loyaltyProgress;
      return left === 0 ? t("calendar.agent.loyalty.earns", { reward: model.rewardName.toLowerCase() }) : t("calendar.agent.loyalty.progress", { count: model.loyaltyProgress, total: LOYALTY_EVERY, left, reward: model.rewardName.toLowerCase() });
    }
    case "next":
      return model.nextVisit ? t("calendar.agent.next.rhythm", { date: formatDate(model.nextVisit, LONG_DATE), days: known?.visitEveryDays ?? 0 }) : t("calendar.agent.next.none");
    case "rhythm":
      if (!known) return t("calendar.agent.noProfile");
      return known.visitEveryDays && model.lastVisit
        ? t("calendar.agent.rhythm.some", { days: known.visitEveryDays, date: formatDate(model.lastVisit, LONG_DATE), visits: known.visits })
        : t("calendar.agent.rhythm.none", { visits: known.visits });
    case "barber": {
      const preferred = known?.preferredBarberId ? ctx.catalog.barbers.find((barber) => barber.id === known.preferredBarberId) : undefined;
      const lines = [preferred ? t("calendar.agent.barber.preferred", { name: preferred.name }) : null, model.requested ? t("calendar.agent.barber.requested", { name: model.requested.name }) : t("calendar.agent.barber.notRequested")].filter(Boolean);
      return lines.join(" ");
    }
    case "upsell": {
      const offer = model.insights.find((insight) => insight.id === "upsell" || insight.id === "vip");
      return offer ? insightText(input, offer) : t("calendar.agent.upsell.none");
    }
    case "contact":
      return model.phone && known ? t("calendar.agent.contact.phone", { phone: known.phone }) : t("calendar.agent.contact.none");
    case "price":
      return appointment.payment
        ? t("calendar.agent.price.paid", { total: ctx.formatMoney(appointment.payment.total), method: t(PAYMENT_METHOD_KEYS[appointment.payment.method]) })
        : t("calendar.agent.price.due", { price: ctx.formatMoney(model.price) });
    case "unknown":
      return t("calendar.agent.unknown", { name: firstName });
  }
}

/** Las preguntas para seguir: las de la cita que aún no se hicieron. */
function followupsFor(topic: Topic, suggestions: readonly string[]): string[] {
  return suggestions.filter((suggestion) => topicOf(suggestion) !== topic).slice(0, 3);
}

/** El foco que el panel de una cita le pasa a Clipper al abrirlo. */
export function appointmentAgentFocus(input: AppointmentAgentInput): AgentFocus {
  const { model, ctx, t } = input;
  const time = formatClock(appointmentStart(model.appointment), ctx.intl);
  const suggestions = [t("calendar.agent.ask.alerts"), t("calendar.agent.ask.request"), t("calendar.agent.ask.rhythm"), t("calendar.agent.ask.upsell"), t("calendar.agent.ask.next")];
  const source = { label: t("calendar.agent.source", { name: model.clientName }) };
  return {
    title: t("calendar.agent.title", { name: model.firstName, time }),
    suggestions,
    opening: t("calendar.agent.opening", { name: model.firstName }),
    answer: (question): ChatReply => {
      const topic = topicOf(question);
      const reply: ChatReply = { text: answerFor(topic, input), sources: [source], followups: followupsFor(topic, suggestions), via: "appointment" };
      if (topic !== "summary" || !model.known) return reply;
      return {
        ...reply,
        card: {
          kind: "metrics",
          items: [
            { label: t("calendar.panel.client.visits"), value: String(model.known.visits) },
            { label: t("calendar.panel.client.rhythm"), value: model.known.visitEveryDays ? t("calendar.panel.client.rhythmValue", { days: model.known.visitEveryDays }) : "—" },
            { label: t("calendar.panel.loyalty.title"), value: `${model.loyaltyProgress}/${LOYALTY_EVERY}` },
            { label: t("calendar.client.noShows"), value: String(model.known.noShows), tone: model.known.noShows > 0 ? "negative" : "positive" },
          ],
        },
      };
    },
  };
}
