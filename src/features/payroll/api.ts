import { api } from "@/lib/api";
import { payrollResponseSchema, type PayrollParams, type PayrollResponse } from "./types";

/** Contrato de nómina; ver docs/API_CONTRACT.md. */
export const payrollApi = {
  get: (params: PayrollParams, signal?: AbortSignal) => api.get<PayrollResponse>("/payroll", { query: { ...params }, schema: payrollResponseSchema, signal }),
};
