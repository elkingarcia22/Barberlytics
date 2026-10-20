import { api } from "@/lib/api";
import { z } from "zod";
import { adjustmentSchema, loanSchema, payrollResponseSchema, payrollRunSchema, type AdjustmentInput, type LoanInput, type PayrollAdjustment, type PayrollParams, type PayrollResponse, type PayrollRun, type RentPaymentInput } from "./types";

/** Contrato de nómina; ver docs/API_CONTRACT.md. */
export const payrollApi = {
  get: (params: PayrollParams, signal?: AbortSignal) => api.get<PayrollResponse>("/payroll", { query: { ...params }, schema: payrollResponseSchema, signal }),
  addAdjustment: (input: AdjustmentInput) => api.post<PayrollAdjustment>("/payroll/adjustments", input, { schema: adjustmentSchema }),
  removeAdjustment: (id: string) => api.delete<void>(`/payroll/adjustments/${id}`),
  approve: (period: Pick<PayrollParams, "branchId" | "from" | "to">) => api.post<PayrollRun>("/payroll/runs", period, { schema: payrollRunSchema }),
  pay: (id: string, body: { method: string; reference?: string }) => api.post<PayrollRun>(`/payroll/runs/${id}/pay`, body, { schema: payrollRunSchema }),
  reopen: (id: string, reason: string) => api.post<void>(`/payroll/runs/${id}/reopen`, { reason }),
  addRentPayment: (input: RentPaymentInput) => api.post<unknown>("/payroll/rent-payments", input),
  removeRentPayment: (id: string) => api.delete<void>(`/payroll/rent-payments/${id}`),
  loans: (branchId: string, memberId: string, signal?: AbortSignal) => api.get("/payroll/loans", { query: { branchId, memberId }, schema: z.object({ items: z.array(loanSchema) }), signal }),
  addLoan: (input: LoanInput) => api.post("/payroll/loans", input, { schema: loanSchema }),
  cancelLoan: (id: string) => api.post(`/payroll/loans/${id}/cancel`, {}, { schema: loanSchema }),
};
