import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/**
 * Lo que la barbería recuerda y premia de cada cliente (docs/API_CONTRACT.md, «Clientes › Cortes, etiquetas y
 * referidos»): la fórmula y las fotos de cada corte, sus etiquetas y su código de referido.
 */

export const CUSTOMER_SOURCES = ["instagram", "google", "facebook", "tiktok", "referral", "walkin", "other"] as const;
export const customerSourceSchema = z.enum(CUSTOMER_SOURCES);
export type CustomerSource = z.infer<typeof customerSourceSchema>;

export const CUT_FORMULA_KEYS = ["tool", "guard", "fade", "beard", "products", "notes"] as const;
export type CutFormulaKey = (typeof CUT_FORMULA_KEYS)[number];

export const cutFormulaSchema = z.object({ tool: z.string(), guard: z.string(), fade: z.string(), beard: z.string(), products: z.string(), notes: z.string() });
export type CutFormula = z.infer<typeof cutFormulaSchema>;

export const cutRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  appointmentId: z.string().nullable(),
  barberId: z.string().nullable(),
  barber: z.string().nullable().optional(),
  formula: cutFormulaSchema,
  photos: z.array(z.string()),
  createdAt: z.string(),
  by: z.string(),
});
export type CutRecord = z.infer<typeof cutRecordSchema>;

export const referralSummarySchema = z.object({
  code: z.string(),
  referredBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  referred: z.number(),
  rewarded: z.number(),
  earned: z.number(),
});
export type ReferralSummary = z.infer<typeof referralSummarySchema>;

export const EMPTY_FORMULA: CutFormula = { tool: "", guard: "", fade: "", beard: "", products: "", notes: "" };

/** «Fade bajo · 1 a los lados, 3 arriba · cera mate»: la fórmula en una línea. */
export const formulaLine = (formula: CutFormula): string => [formula.fade, formula.guard, formula.tool, formula.beard, formula.products].map((part) => part.trim()).filter(Boolean).join(" · ");

const tagCatalogSchema = z.object({ items: z.array(z.object({ name: z.string(), count: z.number() })) });
const cutsSchema = z.object({ items: z.array(cutRecordSchema) });

export interface CutInput {
  formula: CutFormula;
  photos: string[];
  date?: string;
  appointmentId?: string | null;
}

export const loyaltyApi = {
  tags: (signal?: AbortSignal) => api.get<z.infer<typeof tagCatalogSchema>>("/customers/tags", { schema: tagCatalogSchema, signal }),
  bulkTags: (input: { ids: readonly string[]; add?: readonly string[]; remove?: readonly string[] }) => api.post<{ updated: number }>("/customers/tags", input),
  setTags: (id: string, tags: readonly string[]) => api.put<{ tags: string[] }>(`/customers/${id}/tags`, { tags }),
  cuts: (id: string, signal?: AbortSignal) => api.get<z.infer<typeof cutsSchema>>(`/customers/${id}/cuts`, { schema: cutsSchema, signal }),
  addCut: (id: string, input: CutInput) => api.post<CutRecord>(`/customers/${id}/cuts`, input, { schema: cutRecordSchema }),
  removeCut: (id: string, cutId: string) => api.delete<void>(`/customers/${id}/cuts/${cutId}`),
};

const loyaltyKeys = {
  tags: ["customers", "tags"] as const,
  cuts: (id: string) => ["customers", "cuts", id] as const,
};

export function useTagCatalog() {
  return useQuery({ queryKey: loyaltyKeys.tags, queryFn: ({ signal }) => loyaltyApi.tags(signal) });
}

/** Cambiar etiquetas refresca la lista, la ficha y el catálogo. */
function useRefreshCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["customers"] });
}

export function useBulkTags() {
  const refresh = useRefreshCustomers();
  return useMutation({ mutationFn: loyaltyApi.bulkTags, onSuccess: refresh });
}

export function useSetTags(id: string) {
  const refresh = useRefreshCustomers();
  return useMutation({ mutationFn: (tags: readonly string[]) => loyaltyApi.setTags(id, tags), onSuccess: refresh });
}

export function useCustomerCuts(id: string) {
  return useQuery({ queryKey: loyaltyKeys.cuts(id), queryFn: ({ signal }) => loyaltyApi.cuts(id, signal), enabled: id !== "" });
}

export function useCutActions(id: string) {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: loyaltyKeys.cuts(id) }), queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] })]);
  const add = useMutation({ mutationFn: (input: CutInput) => loyaltyApi.addCut(id, input), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (cutId: string) => loyaltyApi.removeCut(id, cutId), onSuccess: refresh });
  return { add, remove };
}
