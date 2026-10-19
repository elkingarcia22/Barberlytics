import * as React from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/**
 * Los mensajes de una cita (confirmación, recordatorios, hueco liberado, y lo que el equipo manda
 * desde su panel: el recibo y el enlace para reagendar) y el envío de los que ya tocan. Contrato en
 * docs/API_CONTRACT.md («Mensajes»).
 */

export const messageKindSchema = z.enum(["confirmation", "rescheduled", "reminder24h", "reminder2h", "reminder", "slotFreed", "manual", "reactivation", "receipt", "rebookLink"]);
export type MessageKind = z.infer<typeof messageKindSchema>;

export const MESSAGE_KIND_KEYS: Readonly<Record<MessageKind, AppMessageKey>> = {
  confirmation: "calendar.messages.kind.confirmation",
  rescheduled: "calendar.messages.kind.rescheduled",
  reminder24h: "calendar.messages.kind.reminder24h",
  reminder2h: "calendar.messages.kind.reminder2h",
  reminder: "calendar.messages.kind.reminder",
  slotFreed: "calendar.messages.kind.slotFreed",
  manual: "calendar.messages.kind.manual",
  reactivation: "calendar.messages.kind.reactivation",
  receipt: "calendar.messages.kind.receipt",
  rebookLink: "calendar.messages.kind.rebookLink",
};

export const appointmentMessageSchema = z.object({
  id: z.string(),
  kind: messageKindSchema,
  channel: z.enum(["whatsapp", "sms", "email"]),
  sendAt: z.string(),
  sentAt: z.string().nullable(),
  status: z.enum(["scheduled", "sent", "cancelled", "failed"]),
  /** Sin WhatsApp conectado se da por enviado sin salir. */
  simulated: z.boolean(),
  error: z.string().nullable(),
});
export type AppointmentMessage = z.infer<typeof appointmentMessageSchema>;

const dispatchSchema = z.object({ sent: z.number(), simulated: z.number(), failed: z.number() });

/** Lo que el equipo manda desde el panel de la cita: el recibo o el enlace para reagendar, por SMS o correo. */
export type SendChannel = "email" | "sms";
export interface SendToClientInput {
  kind: "receipt" | "rebookLink";
  channel: SendChannel;
  to: string;
  body: string;
}
const sentSchema = z.object({ channel: z.enum(["email", "sms"]), to: z.string() });

export const messagesApi = {
  list: (appointmentId: string, signal?: AbortSignal) => api.get<{ items: AppointmentMessage[] }>(`/appointments/${appointmentId}/messages`, { schema: z.object({ items: z.array(appointmentMessageSchema) }), signal }),
  send: (appointmentId: string, input: SendToClientInput) => api.post<z.infer<typeof sentSchema>>(`/appointments/${appointmentId}/messages`, input, { schema: sentSchema }),
  dispatch: () => api.post<z.infer<typeof dispatchSchema>>("/messages/dispatch", {}, { schema: dispatchSchema }),
};

export function useAppointmentMessages(appointmentId: string, enabled: boolean) {
  return useQuery({ queryKey: ["messages", appointmentId], queryFn: ({ signal }) => messagesApi.list(appointmentId, signal), enabled });
}

/** Mandar el recibo o el enlace; queda en los mensajes de la cita. */
export function useSendToClient(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendToClientInput) => messagesApi.send(appointmentId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["messages", appointmentId] }),
  });
}

/** Cada cuánto se pone el outbox al día con la cola de WhatsApp del servidor. */
const DISPATCH_EVERY_MS = 60_000;

/**
 * Mientras la app está abierta (al entrar y cada minuto) encola en el servidor lo que el backend
 * simulado programó y refleja lo que el cron ya envió. Con un backend real, él encola al programar y
 * esto sobra; el envío nunca sale del navegador.
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
