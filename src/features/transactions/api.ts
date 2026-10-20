import { api } from "@/lib/api";
import { appointmentSchema, type Appointment, type RefundItem } from "@/features/calendar/types";
import { transactionsResponseSchema, unpaidAccountsSchema, type TransactionsParams, type TransactionsResponse, type UnpaidAccounts } from "./types";

export interface RefundInput {
  amount: number;
  reason: string;
  to: "cash" | "card";
  /** Las líneas que se devuelven (los productos vuelven al inventario). Sin ellas, es solo un monto. */
  items?: RefundItem[];
}

/** Contrato de transacciones; ver docs/API_CONTRACT.md. */
export const transactionsApi = {
  list: (params: TransactionsParams, signal?: AbortSignal) => api.get<TransactionsResponse>("/transactions", { query: { ...params }, schema: transactionsResponseSchema, signal }),
  /** Las cuentas de días anteriores que nadie cobró (hasta 30 días atrás). */
  unpaid: (branchId: string, signal?: AbortSignal) => api.get<UnpaidAccounts>("/transactions/unpaid", { query: { branchId }, schema: unpaidAccountsSchema, signal }),
  /** Devolver una cuenta cobrada (de una cita), entera o en parte. */
  refund: (appointmentId: string, input: RefundInput) => api.post<Appointment>(`/appointments/${appointmentId}/refund`, input, { schema: appointmentSchema }),
};
