import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { payrollApi } from "./api";
import type { PayrollParams } from "./types";

export const payrollKeys = {
  all: ["payroll"] as const,
  period: (params: PayrollParams) => [...payrollKeys.all, params] as const,
};

export function usePayrollQuery(params: PayrollParams) {
  return useQuery({
    queryKey: payrollKeys.period(params),
    queryFn: ({ signal }) => payrollApi.get(params, signal),
    /* Al cambiar de periodo se conserva el anterior en pantalla mientras llega el nuevo. */
    placeholderData: keepPreviousData,
  });
}
