import { isSameDay } from "date-fns";
import type { useAppT } from "@/app/i18n";
import { appointmentEnd, appointmentStart, durationLabel, isFirstVisit } from "../calendarModel";
import type { AppointmentActionId } from "../appointmentPlaybook";
import { PAYMENT_METHOD_KEYS, type AppointmentStatus } from "../types";
import { LOYALTY_EVERY, type AppointmentModel } from "./useAppointmentModel";

/** La lógica de las piezas del panel que no pinta nada: etiquetas, reloj y reparto de acciones. */

type Translate = ReturnType<typeof useAppT>;

export type TagTone = "neutral" | "info" | "success" | "warning" | "danger";
export interface ClientTag {
  id: string;
  label: string;
  tone: TagTone;
}

/**
 * Las etiquetas que van pegadas al nombre (SevenRooms, Mariana Tek): las que
 * se calculan solas a partir de datos de varias visitas, nunca de una sola.
 * `operational` deja solo lo que sirve en la silla.
 */
export function clientTags(model: AppointmentModel, t: Translate, options: { operational?: boolean } = {}): ClientTag[] {
  const { appointment, known, client, requested } = model;
  const tags: ClientTag[] = [];
  if (appointment.walkIn) tags.push({ id: "walkIn", label: t("calendar.card.walkIn"), tone: "neutral" });
  if (isFirstVisit(client)) tags.push({ id: "first", label: t("calendar.panel.tag.firstVisit"), tone: "info" });
  if (requested) tags.push({ id: "requested", label: t("calendar.panel.tag.requested", { name: requested.name.split(" ")[0] }), tone: "neutral" });
  if (appointment.referencePhotos?.length) tags.push({ id: "photo", label: t("calendar.panel.tag.photo"), tone: "neutral" });
  if (options.operational) return tags;
  if (known && known.noShows > 0) tags.push({ id: "noShows", label: known.noShows === 1 ? t("calendar.panel.tag.noShowsOne") : t("calendar.panel.tag.noShows", { count: known.noShows }), tone: "warning" });
  if (appointment.source === "online") tags.push({ id: "online", label: t("calendar.panel.tag.online"), tone: "neutral" });
  if (appointment.linkId) tags.push({ id: "linked", label: t("calendar.panel.tag.linked"), tone: "neutral" });
  if (known) {
    tags.push(
      model.loyaltyProgress === LOYALTY_EVERY
        ? { id: "member", label: t("calendar.panel.tag.reward"), tone: "success" }
        : { id: "member", label: t("calendar.panel.tag.member", { count: model.loyaltyProgress, total: LOYALTY_EVERY }), tone: "neutral" }
    );
  }
  return tags;
}

/** Cuánto falta o cuánto lleva, en una frase: lo que se pregunta en el mostrador antes que nada. */
export function clockRelation(model: AppointmentModel, now: Date | undefined, t: Translate): string | null {
  if (!now) return null;
  const { appointment, playbook, stepTimes } = model;
  const start = appointmentStart(appointment);
  const end = appointmentEnd(appointment);
  const minutes = (from: Date, to: Date) => durationLabel(Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000)));
  switch (playbook.stage) {
    case "upcoming":
      // Solo el mismo día: «empieza en 49 h» no le dice nada a nadie.
      return start > now && isSameDay(start, now) ? t("calendar.panel.desk.startsIn", { time: minutes(now, start) }) : null;
    case "waiting":
      return stepTimes.arrived ? t("calendar.panel.desk.waitingFor", { time: minutes(stepTimes.arrived, now) }) : null;
    case "seated":
      return end > now ? t("calendar.panel.desk.endsIn", { time: minutes(now, end) }) : t("calendar.panel.desk.overtime", { time: minutes(end, now) });
    default:
      return null;
  }
}

/** Las acciones del playbook que no son la principal ni un enlace de contacto. */
export const restActions = (model: AppointmentModel): AppointmentActionId[] =>
  [...model.playbook.primary.slice(0, -1), ...model.playbook.secondary, ...model.playbook.more].filter((action) => action !== "edit" && action !== "call" && action !== "whatsapp");

/** La principal es la última de `primary` (las de antes son contacto: llamar, escribir). */
export const mainAction = (model: AppointmentModel): AppointmentActionId => model.playbook.primary[model.playbook.primary.length - 1];

/** Las acciones rápidas en tarjetas, además de la principal del pie. */
export type QuickId = "call" | "whatsapp" | "noShow" | "cancel" | "change" | "ready" | "clipper";

/**
 * Qué atajos se ofrecen según el momento: si va tarde, llamar, escribir, «no
 * asistió» y cancelar (la principal sigue siendo ingresar); antes de llegar,
 * cambiar la cita; en la silla, sumar un servicio; cobrada, hablar con él.
 * El cliente no va aquí: cada versión ya tiene su entrada a él.
 */
export function quickActions(model: AppointmentModel): QuickId[] {
  const contact: QuickId[] = model.phone ? ["call", "whatsapp"] : [];
  switch (model.playbook.stage) {
    case "late":
      return [...contact, "noShow", "cancel"];
    case "upcoming":
      return [...contact, "change", "cancel"];
    case "waiting":
      return [...(model.appointment.barberReady ? [] : (["ready"] as QuickId[])), "change", ...contact.slice(1), "cancel"];
    case "seated":
    case "toCollect":
      return ["change", "clipper"];
    case "paid":
      return [...contact.slice(1), "clipper"];
    case "noShow":
    case "cancelled":
      return contact;
  }
}

/** Mientras no ha pasado a la silla, lo que pidió al reservar va delante (nota y fotos). */
export const showsRequest = (model: AppointmentModel): boolean =>
  ["upcoming", "late", "waiting", "seated"].includes(model.playbook.stage) && Boolean(model.appointment.notes || model.appointment.referencePhotos?.length);

export interface StageTitle {
  title: string;
  line: string;
  tone: "default" | "negative" | "positive" | "warning";
}

/** El titular del momento, en palabras de mostrador: «Va 12 min tarde», «En la silla con Nicolás». */
export function stageTitle(model: AppointmentModel, now: Date | undefined, t: Translate, money: (value: number) => string, intlClock: (date: Date) => string): StageTitle {
  const { appointment, playbook, stepTimes } = model;
  const barber = model.barber?.name.split(" ")[0] ?? "";
  const start = appointmentStart(appointment);
  const end = appointmentEnd(appointment);
  const relation = clockRelation(model, now, t);
  const since = (from: Date | null) => (from && now ? durationLabel(Math.max(1, Math.round((now.getTime() - from.getTime()) / 60_000))) : "");
  switch (playbook.stage) {
    case "upcoming":
      return { title: t("calendar.panel.stage.upcoming", { time: intlClock(start) }), line: relation ?? t("calendar.panel.stage.upcomingLine", { barber }), tone: "default" };
    case "late":
      return { title: model.headline, line: t("calendar.panel.stage.lateLine"), tone: "negative" };
    case "waiting":
      return { title: stepTimes.arrived && now ? t("calendar.panel.stage.waiting", { time: since(stepTimes.arrived) }) : t("calendar.panel.stage.waitingNow"), line: t("calendar.panel.stage.waitingLine", { barber }), tone: "default" };
    case "seated":
      return { title: t("calendar.panel.stage.seated", { barber }), line: relation ?? t("calendar.panel.stage.seatedLine", { time: intlClock(end) }), tone: "default" };
    case "toCollect":
      return { title: t("calendar.panel.stage.toCollect"), line: t("calendar.panel.stage.toCollectLine", { time: intlClock(end) }), tone: "warning" };
    case "paid":
      return {
        title: t("calendar.panel.stage.paid", { total: money(appointment.payment?.total ?? model.price) }),
        line: appointment.payment ? t("calendar.panel.stage.paidLine", { method: t(PAYMENT_METHOD_KEYS[appointment.payment.method]), tip: money(appointment.payment.tip) }) : "",
        tone: "positive",
      };
    case "noShow":
      return { title: t("calendar.panel.stage.noShow"), line: t("calendar.panel.stage.closedLine"), tone: "default" };
    case "cancelled":
      return { title: t("calendar.panel.stage.cancelled"), line: t("calendar.panel.stage.closedLine"), tone: "default" };
  }
}

/** El avance de una cita atendida, el mismo del panel de siempre. */
export const TRACK: readonly AppointmentStatus[] = ["scheduled", "arrived", "seated", "paid"];

/** En qué paso del avance va la cita (cobrada = todos hechos); -1 si se cerró sin atender. */
export const trackIndexOf = (model: AppointmentModel): number => TRACK.indexOf(model.appointment.status);
