import * as React from "react";
import { CheckCheck, ChevronDown, Info, MessageSquareText } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { IconTile } from "@/components/utility/IconTile";
import { Text } from "@/components/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MESSAGE_KIND_KEYS, useAppointmentMessages, type AppointmentMessage } from "../messages";
import type { Appointment, AppointmentPatch } from "../types";

export interface AppointmentMessagesProps {
  appointment: Appointment;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

const statusKey = (message: AppointmentMessage): AppMessageKey =>
  message.status === "failed" ? "calendar.messages.status.failed" : message.status === "cancelled" ? "calendar.messages.status.cancelled" : message.status === "scheduled" ? "calendar.messages.status.scheduled" : message.simulated ? "calendar.messages.status.simulated" : "calendar.messages.status.sent";

/**
 * Si el cliente confirmó que viene, como una tarjeta más de la cita: el estado
 * (confirmada o no, y cómo) con su interruptor —recepción lo cambia mientras
 * la cita está por llegar— y, dentro, los mensajes que se le mandaron por
 * correo o SMS, plegados. El riesgo de que no venga va con las demás alertas
 * (`CareAlerts`); que los envíos sean simulados se avisa con un icono y su tooltip.
 */
export function AppointmentMessages({ appointment, onPatch }: AppointmentMessagesProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const messages = useAppointmentMessages(appointment.id, true);
  const [showMessages, setShowMessages] = React.useState(false);
  // Si ya llegó, vino: queda confirmada sola, sin interruptor.
  const arrived = appointment.status === "arrived" || appointment.status === "seated" || appointment.status === "paid";
  const confirmed = arrived || appointment.confirmation?.status === "confirmed";
  const items = messages.data?.items ?? [];
  const editable = appointment.status === "scheduled";
  const how = arrived
    ? t("calendar.messages.confirmedArrived")
    : confirmed
      ? t(appointment.confirmation?.via === "link" ? "calendar.messages.confirmedLink" : "calendar.messages.confirmedReception")
      : editable
        ? t("calendar.messages.pendingHint")
        : null;
  const switchId = `confirm-${appointment.id}`;

  return (
    <section aria-label={t("calendar.messages.confirmation")} className="flex flex-col rounded-xl border border-input bg-surface shadow-xs" data-testid="appointment-messages">
      <div className="flex min-h-16 items-center gap-3 px-3 py-2.5">
        <IconTile size="md" shape="circle" tone={confirmed ? "positive" : "neutral"} icon={<CheckCheck />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text as="span" size="xs" tone="muted">
            {t("calendar.messages.confirmation")}
          </Text>
          <label htmlFor={editable ? switchId : undefined} className="truncate font-medium text-text-primary" data-testid="appointment-confirmation">
            {confirmed ? t("calendar.messages.confirmed") : t("calendar.messages.notConfirmed")}
          </label>
          {how && (
            <Text as="span" size="xs" tone="muted" truncate>
              {how}
            </Text>
          )}
        </span>
        {editable && <Switch id={switchId} checked={confirmed} onCheckedChange={(next) => onPatch(appointment, { confirmation: next ? "confirmed" : "pending" })} data-testid="appointment-confirm-switch" />}
      </div>
      {items.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-expanded={showMessages}
              onClick={() => setShowMessages((current) => !current)}
              className="group flex flex-1 items-center gap-2 rounded-md py-1 text-left text-xs font-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
              data-testid="appointment-messages-toggle"
            >
              <MessageSquareText className="size-3.5" aria-hidden />
              {t("calendar.messages.sent", { count: items.length })}
              <ChevronDown className="ml-auto size-3.5 transition-transform duration-fast group-aria-expanded:rotate-180" aria-hidden />
            </button>
            {items.some((message) => message.simulated) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-full text-text-muted outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={t("calendar.messages.simulatedHint")} data-testid="appointment-messages-simulated">
                    <Info className="size-3.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">{t("calendar.messages.simulatedHint")}</TooltipContent>
              </Tooltip>
            )}
          </div>
          {showMessages && (
            <ul className="space-y-1 pb-1 pt-1.5 text-sm">
              {items.map((message) => (
                <li key={message.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-text-secondary">{t(MESSAGE_KIND_KEYS[message.kind])}</span>
                  <span className={message.status === "failed" ? "text-xs text-status-warning" : "text-xs text-text-muted"} title={message.error ?? undefined}>
                    {t(statusKey(message))} · {formatDate(new Date(message.sentAt ?? message.sendAt), WHEN)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
