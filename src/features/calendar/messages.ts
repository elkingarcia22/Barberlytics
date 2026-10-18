import * as React from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/**
 * Los mensajes de WhatsApp de una cita (confirmación, recordatorios, hueco liberado) y el envío de
 * los que ya tocan. Contrato en docs/API_CONTRACT.md («Mensajes»).
 */

export const messageKindSchema = z.enum(["confirmation", "rescheduled", "reminder24h", "reminder2h", "slotFreed", "manual"]);
export type MessageKind = z.infer<typeof messageKindSchema>;

export const MESSAGE_KIND_KEYS: Readonly<Record<MessageKind, AppMessageKey>> = {
  confirmation: "calendar.messages.kind.confirmation",
  rescheduled: "calendar.messages.kind.rescheduled",
  reminder24h: "calendar.messages.kind.reminder24h",
  reminder2h: "calendar.messages.kind.reminder2h",
  slotFreed: "calendar.messages.kind.slotFreed",
  manual: "calendar.messages.kind.manual",
};

export const appointmentMessageSchema = z.object({
  id: z.string(),
  kind: messageKindSchema,
  channel: z.enum(["whatsapp", "sms"]),
  sendAt: z.string(),
  sentAt: z.string().nullable(),
  status: z.enum(["scheduled", "sent", "cancelled", "failed"]),
  /** Sin WhatsApp conectado se da por enviado sin salir. */
  simulated: z.boolean(),
  error: z.string().nullable(),
});
export type AppointmentMessage = z.infer<typeof appointmentMessageSchema>;

const dispatchSchema = z.object({ sent: z.number(), simulated: z.number(), failed: z.number() });

export const messagesApi = {
  list: (appointmentId: string, signal?: AbortSignal) => api.get<{ items: AppointmentMessage[] }>(`/appointments/${appointmentId}/messages`, { schema: z.object({ items: z.array(appointmentMessageSchema) }), signal }),
  dispatch: () => api.post<z.infer<typeof dispatchSchema>>("/messages/dispatch", {}, { schema: dispatchSchema }),
};

export function useAppointmentMessages(appointmentId: string, enabled: boolean) {
  return useQuery({ queryKey: ["messages", appointmentId], queryFn: ({ signal }) => messagesApi.list(appointmentId, signal), enabled });
}

/** Cada cuánto se revisan los mensajes que ya tocan. */
const DISPATCH_EVERY_MS = 60_000;

/**
 * Envía los mensajes que ya tocan mientras la app está abierta: al entrar y cada minuto. Con un
 * backend real esto lo hace su cola; aquí basta con que alguien tenga la app abierta.
 */
export function useMessageDispatcher(enabled: boolean): void {
  React.useEffect(() => {
    if (!enabled) return;
    const run = () => void messagesApi.dispatch().catch(() => undefined);
    run();
    const timer = window.setInterval(run, DISPATCH_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);
}
