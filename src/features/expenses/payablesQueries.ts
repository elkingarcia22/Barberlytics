import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/** Las cuentas por pagar del mes (docs/API_CONTRACT.md, «Gastos › Por pagar»). */

const paymentSchema = z.object({ id: z.string(), expenseId: z.string(), dueDate: z.string(), amount: z.number(), paidAt: z.string(), method: z.enum(["cash", "bank", "card", "wallet"]).nullable(), by: z.string() });

export const payableSchema = z.object({
  expenseId: z.string(),
  name: z.string(),
  categoryId: z.string(),
  supplier: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  status: z.enum(["paid", "overdue", "dueSoon", "upcoming"]),
  payment: paymentSchema.nullable(),
});
export type Payable = z.infer<typeof payableSchema>;

export const payablesSchema = z.object({
  month: z.string(),
  items: z.array(payableSchema),
  totals: z.object({ due: z.number(), paid: z.number(), pending: z.number(), overdue: z.number() }),
});
export type Payables = z.infer<typeof payablesSchema>;

export const payablesApi = {
  list: (branchId: string, month: string, ownerMemberId: string | null, signal?: AbortSignal) => api.get<Payables>("/expenses/payables", { query: { branchId, month, ownerMemberId }, schema: payablesSchema, signal }),
  pay: (expenseId: string, dueDate: string) => api.post<z.infer<typeof paymentSchema>>(`/expenses/${expenseId}/payments`, { dueDate }, { schema: paymentSchema }),
  undo: (expenseId: string, paymentId: string) => api.delete<void>(`/expenses/${expenseId}/payments/${paymentId}`),
};

const key = (branchId: string, month: string, ownerMemberId: string | null) => ["expenses", "payables", branchId, month, ownerMemberId] as const;

export function usePayables(branchId: string, month: string, ownerMemberId: string | null) {
  return useQuery({ queryKey: key(branchId, month, ownerMemberId), queryFn: ({ signal }) => payablesApi.list(branchId, month, ownerMemberId, signal) });
}

export function usePayableActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["expenses", "payables"] });
  const pay = useMutation({ mutationFn: ({ expenseId, dueDate }: { expenseId: string; dueDate: string }) => payablesApi.pay(expenseId, dueDate), onSuccess: refresh });
  const undo = useMutation({ mutationFn: ({ expenseId, paymentId }: { expenseId: string; paymentId: string }) => payablesApi.undo(expenseId, paymentId), onSuccess: refresh });
  return { pay, undo };
}
