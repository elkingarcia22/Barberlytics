import { api } from "@/lib/api";
import { transactionsResponseSchema, type TransactionsParams, type TransactionsResponse } from "./types";

/** Contrato de transacciones; ver docs/API_CONTRACT.md. */
export const transactionsApi = {
  list: (params: TransactionsParams, signal?: AbortSignal) => api.get<TransactionsResponse>("/transactions", { query: { ...params }, schema: transactionsResponseSchema, signal }),
};
