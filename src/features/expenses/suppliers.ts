import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/** Los proveedores (docs/API_CONTRACT.md, «Gastos › Proveedores»): con cuánto se les paga y lo pendiente del mes. */

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  taxId: z.string(),
  phone: z.string(),
  email: z.string(),
  categoryId: z.string().nullable(),
  notes: z.string(),
  createdAt: z.string(),
  expenses: z.number().default(0),
  perMonth: z.number().default(0),
  lastDate: z.string().nullable().default(null),
  pending: z.number().default(0),
});
export type Supplier = z.infer<typeof supplierSchema>;
export type SupplierInput = Pick<Supplier, "name" | "taxId" | "phone" | "email" | "categoryId" | "notes">;

const keys = { all: ["expenses", "suppliers"] as const };

export function useSuppliers(branchId: string, ownerMemberId: string | null = null, enabled = true) {
  return useQuery({
    queryKey: [...keys.all, branchId, ownerMemberId],
    queryFn: ({ signal }) => api.get("/expenses/suppliers", { query: { branchId, ownerMemberId: ownerMemberId ?? undefined }, schema: z.object({ items: z.array(supplierSchema) }), signal }),
    enabled,
  });
}

export function useSupplierActions() {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: keys.all }), queryClient.invalidateQueries({ queryKey: ["expenses"] })]);
  return {
    create: useMutation({ mutationFn: (input: SupplierInput) => api.post("/expenses/suppliers", input, { schema: supplierSchema }), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: SupplierInput }) => api.patch(`/expenses/suppliers/${id}`, input, { schema: supplierSchema }), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.delete<void>(`/expenses/suppliers/${id}`), onSuccess: refresh }),
  };
}
