import { CheckCheck, Info, MessageSquareText } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Switch } from "@/components/ui/switch";
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
 * Si el cliente confirmó que viene y qué mensajes se le mandaron (por correo o SMS). Confirma con el enlace del
 * mensaje; si lo dice por teléfono o en persona, recepción lo marca aquí. El riesgo de que no
 * venga va con las demás alertas de la cita (`CareAlerts`); que los envíos sean simulados se avisa
 * con un icono y su tooltip, no con un párrafo.
 */
export function AppointmentMessages({ appointment, onPatch }: AppointmentMessagesProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const messages = useAppointmentMessages(appointment.id, true);
  const confirmed = appointment.confirmation?.status === "confirmed";
  const items = messages.data?.items ?? [];

  const editable = appointment.status === "scheduled";
  const how = confirmed ? t(appointment.confirmation?.via === "link" ? "calendar.messages.confirmedLink" : "calendar.messages.confirmedReception") : editable ? t("calendar.messages.pendingHint") : null;
  const switchId = `confirm-${appointment.id}`;

  return (
    <section aria-label={t("calendar.messages.title")} className="space-y-3" data-testid="appointment-messages">
      {/* Un estado, no un botón: confirmada o no, y cómo. Recepción lo cambia aquí mientras la cita está por llegar. */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <CheckCheck className={confirmed ? "size-4 shrink-0 text-status-positive" : "size-4 shrink-0 text-text-muted"} aria-hidden />
          <span className="flex min-w-0 flex-col">
            <label htmlFor={editable ? switchId : undefined} className="text-sm font-medium text-text-primary" data-testid="appointment-confirmation">
              {confirmed ? t("calendar.messages.confirmed") : t("calendar.messages.notConfirmed")}
            </label>
            {how && (
              <Text as="span" size="xs" tone="muted" truncate>
                {how}
              </Text>
            )}
          </span>
        </span>
        {editable && <Switch id={switchId} checked={confirmed} onCheckedChange={(next) => onPatch(appointment, { confirmation: next ? "confirmed" : "pending" })} data-testid="appointment-confirm-switch" />}
      </div>
      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-4 text-text-muted" aria-hidden />
          <Text variant="label">{t("calendar.messages.title")}</Text>
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
      )}
      {items.length > 0 && (
        <ul className="space-y-1 text-sm">
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
    </section>
  );
}
