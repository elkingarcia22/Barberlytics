import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Timeline, TimelineItem } from "@/components/data-display/Timeline";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { appointmentEnd, appointmentStart, durationLabel, historyLabel, type ModelContext } from "../calendarModel";
import { PAYMENT_METHOD_KEYS } from "../types";
import type { AppointmentActionId } from "../appointmentPlaybook";
import { ActionButton, ClientTags, CriticalAlerts, MoreActionsMenu, RebookShortcuts } from "./PanelParts";
import { restActions } from "./panelLogic";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Versión «Recorrido de la visita»: la cita contada como una línea de tiempo
 * con horas reales (On my way → Start → Finish de Housecall Pro; llegada,
 * sentado y salida de Open Dental). Lo hecho, con su hora y cuánto tardó; el
 * paso en curso, abierto y con su botón; lo que falta, en gris con la hora en
 * que debería pasar; y al final, la próxima visita que toca por su ritmo. Los
 * cambios (movida, otro barbero) aparecen donde ocurrieron.
 */

type Tone = "default" | "primary" | "positive" | "negative" | "warning";
type StepState = "done" | "current" | "pending";

interface Step {
  id: string;
  title: string;
  time?: string;
  description?: string;
  tone: Tone;
  state: StepState;
  actions?: AppointmentActionId[];
}

const minutesBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 60_000);
const CHANGE_KINDS = new Set(["moved", "barber", "duration", "linked", "unlinked", "reason", "barber_ready"]);

function visitSteps(model: AppointmentModel, ctx: ModelContext, t: ReturnType<typeof useAppT>, formatDay: (date: Date) => string, formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string): Step[] {
  const { appointment, playbook, stepTimes } = model;
  const stage = playbook.stage;
  const start = appointmentStart(appointment);
  const end = appointmentEnd(appointment);
  const clock = (date: Date) => formatClock(date, ctx.intl);
  const contact: AppointmentActionId[] = model.phone ? ["call", "whatsapp"] : [];
  const closed = stage === "noShow" || stage === "cancelled";

  const booked: Step = {
    id: "booked",
    title: appointment.walkIn || appointment.source === "walkin" ? t("calendar.panel.visit.walkIn") : t("calendar.panel.visit.booked"),
    time: formatDay(new Date(appointment.createdAt)),
    description: appointment.source === "online" ? t("calendar.panel.visit.bookedOnline") : t("calendar.panel.visit.bookedShop", { actor: appointment.history[0]?.actor ?? appointment.createdBy }),
    tone: "primary",
    state: "done",
  };

  // Los cambios que tuvo por el camino, en el orden en que pasaron.
  const changes: Step[] = appointment.history
    .filter((entry) => CHANGE_KINDS.has(entry.event.split(":")[0]))
    .map((entry) => ({ id: entry.id, title: historyLabel(entry.event, ctx), time: formatDay(new Date(entry.at)), description: entry.actor, tone: "default" as const, state: "done" as const }));

  // El estado manda: una cita en silla ya llegó aunque su historial no guarde la hora.
  const hasArrived = stepTimes.arrived !== null || appointment.status === "arrived" || appointment.status === "seated" || appointment.status === "paid";
  const hasSeated = stepTimes.seated !== null || appointment.status === "seated" || appointment.status === "paid";
  const arrivedDelta = stepTimes.arrived ? minutesBetween(start, stepTimes.arrived) : 0;
  const arrivedNote = Math.abs(arrivedDelta) < 3 ? t("calendar.panel.visit.onTime") : t(arrivedDelta < 0 ? "calendar.panel.visit.early" : "calendar.panel.visit.late", { time: durationLabel(Math.abs(arrivedDelta)) });
  const arrived: Step = hasArrived
    ? {
        id: "arrived",
        title: t("calendar.panel.visit.arrived"),
        time: stepTimes.arrived ? clock(stepTimes.arrived) : undefined,
        description: stepTimes.arrived ? arrivedNote : undefined,
        tone: arrivedDelta > 5 ? "warning" : "positive",
        state: "done",
      }
    : {
        id: "arrived",
        title: t("calendar.panel.visit.arrive"),
        time: clock(start),
        description: stage === "late" ? model.headline : t("calendar.panel.visit.expected", { time: clock(start) }),
        tone: stage === "late" ? "negative" : "default",
        state: stage === "upcoming" || stage === "late" ? "current" : "pending",
        actions: stage === "late" ? [...contact, "checkIn"] : ["checkIn"],
      };

  const seated: Step = hasSeated
    ? {
        id: "seated",
        title: t("calendar.panel.visit.seated"),
        time: stepTimes.seated ? clock(stepTimes.seated) : undefined,
        description: stepTimes.arrived && stepTimes.seated ? t("calendar.panel.visit.waited", { time: durationLabel(Math.max(0, minutesBetween(stepTimes.arrived, stepTimes.seated))) }) : undefined,
        tone: "positive",
        state: "done",
      }
    : { id: "seated", title: t("calendar.panel.visit.seat"), tone: "default", state: stage === "waiting" ? "current" : "pending", actions: ["seat"] };

  const finishing = stage === "seated" || stage === "toCollect";
  const finish: Step = {
    id: "finish",
    title: t("calendar.panel.visit.finish"),
    time: clock(end),
    description: t("calendar.panel.visit.finishAt", { time: clock(end), duration: durationLabel(appointment.durationMin) }),
    tone: finishing ? "warning" : stage === "paid" ? "positive" : "default",
    state: stage === "paid" || stage === "toCollect" ? "done" : stage === "seated" ? "current" : "pending",
  };

  const pay: Step = appointment.payment
    ? {
        id: "pay",
        title: t("calendar.panel.visit.paid", { amount: ctx.formatMoney(appointment.payment.total) }),
        time: stepTimes.paid ? clock(stepTimes.paid) : undefined,
        description: t("calendar.panel.visit.paidDetail", { method: t(PAYMENT_METHOD_KEYS[appointment.payment.method]), tip: ctx.formatMoney(appointment.payment.tip) }),
        tone: "positive",
        state: "done",
      }
    : { id: "pay", title: t("calendar.panel.visit.pay"), description: ctx.formatMoney(model.price), tone: finishing ? "warning" : "default", state: finishing ? "current" : "pending", actions: ["pay"] };

  const next: Step = {
    id: "next",
    title: t("calendar.panel.visit.next"),
    description: model.nextVisit ? t("calendar.panel.visit.nextHint", { date: formatDate(model.nextVisit, { weekday: "long", day: "numeric", month: "long" }) }) : t("calendar.panel.visit.nextNoRhythm"),
    tone: stage === "paid" ? "primary" : "default",
    state: stage === "paid" ? "current" : "pending",
    actions: ["rebook"],
  };

  if (closed) {
    const ended: Step = { id: "ended", title: model.headline, description: t("calendar.panel.visit.ended"), tone: "negative", state: "done" };
    return [booked, ...changes, ended, { ...next, state: "current", tone: "primary" }];
  }
  return [booked, ...changes, arrived, seated, finish, pay, next];
}

export function VisitPanel({ model, ctx }: { model: AppointmentModel; ctx: ModelContext }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const formatDay = React.useCallback((date: Date) => formatDate(date, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }), [formatDate]);
  const steps = visitSteps(model, ctx, t, formatDay, formatDate);
  const services = model.services.map((service) => service.name).join(" + ");

  return (
    <div className="flex flex-col gap-5" data-testid="panel-visit">
      <div className="space-y-1">
        <Text weight="semibold">{services || "—"}</Text>
        <Text size="sm" tone="secondary">
          {[model.barber?.name, ctx.formatMoney(model.price)].filter(Boolean).join(" · ")}
        </Text>
      </div>
      <ClientTags model={model} />
      <CriticalAlerts model={model} compact />

      <Timeline aria-label={t("calendar.history.title")}>
        {steps.map((step) => {
          const actions = step.state === "current" ? (step.actions ?? []) : [];
          return (
          <TimelineItem
            key={step.id}
            tone={step.state === "pending" ? "default" : step.tone}
            time={step.time}
            title={
              step.state === "pending" ? (
                <Text as="span" tone="muted">
                  {step.title}
                </Text>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {step.title}
                  {step.state === "current" && (
                    <Text as="span" size="xs" weight="semibold" tone="primary" className="uppercase tracking-wide">
                      {t("calendar.panel.visit.now")}
                    </Text>
                  )}
                </span>
              )
            }
            description={step.state === "pending" && !step.description ? t("calendar.panel.visit.pending") : step.description}
          >
            {step.id === "next" && step.state === "current" && <RebookShortcuts model={model} />}
            {actions.length > 0 && step.id !== "next" && (
              <div className="flex flex-wrap gap-2 pt-2" data-testid={step.id === "next" ? undefined : "appointment-primary"}>
                {actions.map((action, index) => (
                  <ActionButton key={action} model={model} action={action} size="sm" variant={index === actions.length - 1 ? "default" : "outline"} />
                ))}
              </div>
            )}
          </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
}

/** El pie del recorrido es discreto: el paso en curso ya tiene su botón en la línea; aquí, lo raro. */
export function VisitFooter({ model }: { model: AppointmentModel }) {
  const rest = restActions(model).filter((action) => action === "noShow" || action === "cancel" || action === "ready");
  if (rest.length === 0) return null;
  return (
    <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
      {rest
        .filter((action) => action !== "cancel")
        .map((action) => (
          <ActionButton key={action} model={model} action={action} size="sm" variant="ghost" />
        ))}
      <MoreActionsMenu model={model} actions={rest.filter((action) => action === "cancel")} />
    </footer>
  );
}
