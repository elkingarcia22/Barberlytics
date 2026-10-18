import { CheckCheck, MessageCircle, Undo2 } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
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
 * Si el cliente confirmó que viene y qué mensajes se le mandaron. Confirma con el enlace del
 * WhatsApp; si lo dice por teléfono o en persona, recepción lo marca aquí.
 */
export function AppointmentMessages({ appointment, onPatch }: AppointmentMessagesProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const messages = useAppointmentMessages(appointment.id, true);
  const confirmed = appointment.confirmation?.status === "confirmed";
  const items = messages.data?.items ?? [];

  return (
    <section aria-label={t("calendar.messages.title")} className="space-y-2" data-testid="appointment-messages">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <MessageCircle className="size-4 text-text-muted" aria-hidden />
          <Text variant="label">{t("calendar.messages.title")}</Text>
          <Badge variant={confirmed ? "positive" : "neutral"} data-testid="appointment-confirmation">
            {confirmed ? t(appointment.confirmation?.via === "link" ? "calendar.messages.confirmedLink" : "calendar.messages.confirmedReception") : t("calendar.messages.notConfirmed")}
          </Badge>
        </span>
        {appointment.status === "scheduled" &&
          (confirmed ? (
            <Button variant="ghost" size="sm" onClick={() => onPatch(appointment, { confirmation: "pending" })} data-testid="appointment-unconfirm">
              <Undo2 /> {t("calendar.messages.unconfirm")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onPatch(appointment, { confirmation: "confirmed" })} data-testid="appointment-confirm">
              <CheckCheck /> {t("calendar.messages.confirm")}
            </Button>
          ))}
      </div>
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
      {items.some((message) => message.simulated) && <Text variant="muted">{t("calendar.messages.simulatedHint")}</Text>}
    </section>
  );
}
