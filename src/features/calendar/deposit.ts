import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { depositRequestSchema } from "./types";

/**
 * Pedir un anticipo desde la cita y pagarlo desde el enlace (docs/API_CONTRACT.md, «Calendario › Anticipo»).
 * El servidor arma el mensaje con el enlace: la app solo dice cuánto y por dónde.
 */

export type DepositChannel = "sms" | "email";

export interface DepositRequestInput {
  amount: number;
  channels: { channel: DepositChannel; to: string }[];
}

const requestedSchema = z.object({ depositRequest: depositRequestSchema.extend({ link: z.string() }) });

export const publicDepositSchema = z.object({
  status: z.enum(["requested", "paid", "inactive"]),
  amount: z.number(),
  currency: z.string(),
  start: z.string(),
  client: z.string(),
  barber: z.string(),
  branch: z.string(),
});
export type PublicDeposit = z.infer<typeof publicDepositSchema>;

const paidSchema = z.object({ status: z.literal("paid"), paidAt: z.string().nullable() });

export const depositApi = {
  request: (appointmentId: string, input: DepositRequestInput) => api.post<z.infer<typeof requestedSchema>>(`/appointments/${appointmentId}/deposit`, input, { schema: requestedSchema }),
  cancel: (appointmentId: string) => api.delete<void>(`/appointments/${appointmentId}/deposit`),
  /** Sin sesión: lo que ve el cliente al abrir el enlace. */
  get: (token: string, signal?: AbortSignal) => api.get<PublicDeposit>("/booking/deposit", { query: { token }, schema: publicDepositSchema, signal }),
  pay: (token: string) => api.post<z.infer<typeof paidSchema>>("/booking/deposit/pay", { token }, { schema: paidSchema }),
};

/** Pedir o retirar el anticipo refresca la agenda (la cita lo muestra) y los mensajes de la cita. */
export function useDepositActions(appointmentId: string) {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["calendar"] }), queryClient.invalidateQueries({ queryKey: ["messages", appointmentId] })]);
  const request = useMutation({ mutationFn: (input: DepositRequestInput) => depositApi.request(appointmentId, input), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: () => depositApi.cancel(appointmentId), onSuccess: refresh });
  return { request, cancel };
}
