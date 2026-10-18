import { api } from "@/lib/api";
import { appointmentSchema, type Appointment } from "@/features/calendar/types";
import { transactionsResponseSchema, type TransactionsParams, type TransactionsResponse } from "./types";

export interface RefundInput {
  amount: number;
  reason: string;
  to: "cash" | "card";
}

/** Contrato de transacciones; ver docs/API_CONTRACT.md. */
export const transactionsApi = {
  list: (params: TransactionsParams, signal?: AbortSignal) => api.get<TransactionsResponse>("/transactions", { query: { ...params }, schema: transactionsResponseSchema, signal }),
  /** Devolver una cuenta cobrada (de una cita), entera o en parte. */
  refund: (appointmentId: string, input: RefundInput) => api.post<Appointment>(`/appointments/${appointmentId}/refund`, input, { schema: appointmentSchema }),
};
