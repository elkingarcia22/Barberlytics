import * as React from "react";
import { ChevronDown, Info, MessageSquareText, Reply } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { env } from "@/lib/api";
import { Text } from "@/components/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MESSAGE_KIND_KEYS, REPLY_INTENT_KEYS, replyIntentSchema, useAppointmentMessages, useSimulateReply, type AppointmentMessage } from "../messages";
import type { Appointment } from "../types";

export interface AppointmentMessagesProps {
  appointment: Appointment;
}

const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

const statusKey = (message: AppointmentMessage): AppMessageKey =>
  message.status === "failed" ? "calendar.messages.status.failed" : message.status === "cancelled" ? "calendar.messages.status.cancelled" : message.status === "scheduled" ? "calendar.messages.status.scheduled" : message.simulated ? "calendar.messages.status.simulated" : "calendar.messages.status.sent";


/**
 * Lo que se habló con el cliente sobre la cita, como una tarjeta más: lo que
 * respondió al mensaje y los mensajes que se le mandaron por correo o SMS,
 * plegados. Si confirmó o no va en el badge junto al título
 * (`ConfirmationBadge`) y se cambia desde el «⋯»; el riesgo de que no venga va
 * con las demás alertas (`CareAlerts`). Que los envíos sean simulados se avisa
 * con un icono y su tooltip. Sin nada que contar, no se pinta.
 */
export function AppointmentMessages({ appointment }: AppointmentMessagesProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const messages = useAppointmentMessages(appointment.id, true);
  const [showMessages, setShowMessages] = React.useState(false);
  const items = messages.data?.items ?? [];
  const replies = messages.data?.replies ?? [];
  const editable = appointment.status === "scheduled";
  const simulate = useSimulateReply(appointment.id);
  const canSimulate = env.useMocks && editable;
  if (items.length === 0 && replies.length === 0 && !canSimulate) return null;

  return (
    <section aria-label={t("calendar.messages.title")} className="flex flex-col divide-y divide-border rounded-xl border border-input bg-surface shadow-xs" data-testid="appointment-messages">
      {replies.length > 0 && (
        <div className="px-3 py-2" data-testid="appointment-replies">
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
        <div className="px-3 py-2">
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
      {canSimulate && (
        <div className="px-3 py-1.5">
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
