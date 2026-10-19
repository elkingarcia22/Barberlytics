import * as React from "react";
import { CalendarClock, CheckCheck, ChevronDown, CircleSlash, Info, MessageSquareText, Reply } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { env } from "@/lib/api";
import { IconTile } from "@/components/utility/IconTile";
import { Text } from "@/components/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MESSAGE_KIND_KEYS, REPLY_INTENT_KEYS, replyIntentSchema, useAppointmentMessages, useSimulateReply, type AppointmentMessage } from "../messages";
import type { Appointment, AppointmentPatch } from "../types";

export interface AppointmentMessagesProps {
  appointment: Appointment;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

const statusKey = (message: AppointmentMessage): AppMessageKey =>
  message.status === "failed" ? "calendar.messages.status.failed" : message.status === "cancelled" ? "calendar.messages.status.cancelled" : message.status === "scheduled" ? "calendar.messages.status.scheduled" : message.simulated ? "calendar.messages.status.simulated" : "calendar.messages.status.sent";

const VIA_KEY: Readonly<Record<"link" | "reception" | "whatsapp", AppMessageKey>> = {
  link: "calendar.messages.confirmedLink",
  reception: "calendar.messages.confirmedReception",
  whatsapp: "calendar.messages.confirmedWhatsapp",
};

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
  // Lo que respondió por WhatsApp y recepción tiene que resolver: otra hora o que no puede venir.
  const asked = !arrived && appointment.confirmation?.status === "reschedule_requested" ? "reschedule" : !arrived && appointment.confirmation?.status === "declined" ? "declined" : null;
  const items = messages.data?.items ?? [];
  const replies = messages.data?.replies ?? [];
  const editable = appointment.status === "scheduled";
  const simulate = useSimulateReply(appointment.id);
  const how = arrived
    ? t("calendar.messages.confirmedArrived")
    : confirmed
      ? t(VIA_KEY[appointment.confirmation?.via ?? "reception"])
      : asked === "reschedule"
        ? t("calendar.messages.rescheduleHint")
        : asked === "declined"
          ? t("calendar.messages.declinedHint")
          : editable
            ? t("calendar.messages.pendingHint")
            : null;
  const title = confirmed ? t("calendar.messages.confirmed") : asked === "reschedule" ? t("calendar.messages.rescheduleRequested") : asked === "declined" ? t("calendar.messages.declined") : t("calendar.messages.notConfirmed");
  const tone = confirmed ? "positive" : asked === "reschedule" ? "warning" : asked === "declined" ? "negative" : "neutral";
  const icon = asked === "reschedule" ? <CalendarClock /> : asked === "declined" ? <CircleSlash /> : <CheckCheck />;
  const switchId = `confirm-${appointment.id}`;

  return (
    <section aria-label={t("calendar.messages.confirmation")} className="flex flex-col rounded-xl border border-input bg-surface shadow-xs" data-testid="appointment-messages">
      <div className="flex min-h-16 items-center gap-3 px-3 py-2.5">
        <IconTile size="md" shape="circle" tone={tone} icon={icon} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text as="span" size="xs" tone="muted">
            {t("calendar.messages.confirmation")}
          </Text>
          <label htmlFor={editable ? switchId : undefined} className="truncate font-medium text-text-primary" data-testid="appointment-confirmation">
            {title}
          </label>
          {how && (
            <Text as="span" size="xs" tone="muted" truncate>
              {how}
            </Text>
          )}
        </span>
        {editable && <Switch id={switchId} checked={confirmed} onCheckedChange={(next) => onPatch(appointment, { confirmation: next ? "confirmed" : "pending" })} data-testid="appointment-confirm-switch" />}
      </div>
      {replies.length > 0 && (
        <div className="border-t border-border px-3 py-2" data-testid="appointment-replies">
          <Text as="p" size="xs" weight="medium" tone="muted" className="flex items-center gap-1.5 py-1">
            <Reply className="size-3.5" aria-hidden />
            {t("calendar.messages.replies", { count: replies.length })}
          </Text>
          <ul className="space-y-1.5 pb-1 pt-0.5 text-sm">
            {replies.map((reply) => (
              <li key={reply.id} className="flex flex-col">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-text-primary">{t(REPLY_INTENT_KEYS[reply.intent])}</span>
                  <span className="shrink-0 text-xs text-text-muted">{formatDate(new Date(reply.at), WHEN)}</span>
                </span>
                {reply.text && <span className="text-text-secondary">«{reply.text}»</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
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
      {env.useMocks && editable && (
        <div className="border-t border-border px-3 py-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="-ml-2 h-auto min-h-8 max-w-full whitespace-normal text-left text-text-muted" disabled={simulate.isPending} data-testid="appointment-simulate-reply">
                <Reply aria-hidden />
                {t("calendar.messages.simulate")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {replyIntentSchema.options.map((intent) => (
                <DropdownMenuItem key={intent} onSelect={() => simulate.mutate(intent)}>
                  {t(REPLY_INTENT_KEYS[intent])}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </section>
  );
}
