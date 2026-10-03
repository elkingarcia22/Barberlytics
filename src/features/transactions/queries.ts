import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { transactionsApi } from "./api";
import type { TransactionsParams } from "./types";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: TransactionsParams) => [...transactionKeys.all, "list", params] as const,
};

export function useTransactionsQuery(params: TransactionsParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: ({ signal }) => transactionsApi.list(params, signal),
    /* Al cambiar de periodo se conserva el anterior en pantalla mientras llega el nuevo. */
    placeholderData: keepPreviousData,
  });
}
