import type { useAppT } from "@/app/i18n";
import { appointmentEnd, appointmentStart, durationLabel, isFirstVisit } from "../calendarModel";
import type { AppointmentActionId } from "../appointmentPlaybook";
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
      return start > now ? t("calendar.panel.desk.startsIn", { time: minutes(now, start) }) : null;
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
