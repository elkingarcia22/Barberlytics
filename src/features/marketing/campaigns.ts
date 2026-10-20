import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { ALERT_IDS, sameFilters, type GroupFilters } from "@/features/customers/groupFilter";

/**
 * Grupos guardados y campañas (docs/API_CONTRACT.md, «Clientes › Grupos y campañas»): un filtro de Clientes con nombre,
 * y el mensaje que se le manda por WhatsApp con su vista previa (a cuántos sí y por qué no a los demás, un ejemplo y el
 * costo estimado) y sus resultados (salieron, reservaron en 14 días, lo cobrado, el uso del cupón y el retorno).
 */

export const groupFiltersSchema = z.object({ segment: z.string().nullable(), alert: z.enum(ALERT_IDS).nullable(), tag: z.string().nullable(), source: z.string().nullable() });

export const customerGroupSchema = z.object({ id: z.string(), name: z.string(), filters: groupFiltersSchema, createdAt: z.string(), by: z.string(), size: z.number() });
export type CustomerGroup = z.infer<typeof customerGroupSchema>;

const excludedSchema = z.object({ noConsent: z.number(), noPhone: z.number(), promoCap: z.number(), blocked: z.number() });
export type ExcludedCounts = z.infer<typeof excludedSchema>;

export const campaignPreviewSchema = z.object({
  audience: z.number(),
  eligible: z.number(),
  excluded: excludedSchema,
  cost: z.object({ amount: z.number(), currency: z.string() }),
  sample: z.object({ name: z.string(), text: z.string() }).nullable(),
  names: z.array(z.string()),
  firstSendAt: z.string().nullable(),
});
export type CampaignPreview = z.infer<typeof campaignPreviewSchema>;

export const campaignResultsSchema = z.object({
  sent: z.number(),
  scheduled: z.number(),
  failed: z.number(),
  cancelled: z.number(),
  bookedClients: z.number(),
  bookings: z.number(),
  revenue: z.number(),
  couponUses: z.number(),
  cost: z.number(),
  roi: z.number().nullable(),
  open: z.boolean(),
});
export type CampaignResults = z.infer<typeof campaignResultsSchema>;

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  groupId: z.string().nullable(),
  filters: groupFiltersSchema,
  body: z.string(),
  couponCode: z.string().nullable(),
  createdAt: z.string(),
  by: z.string(),
  sendAt: z.string(),
  recipients: z.number(),
  excluded: excludedSchema,
  estimatedCost: z.number(),
  status: z.enum(["scheduled", "cancelled"]),
  results: campaignResultsSchema,
});
export type Campaign = z.infer<typeof campaignSchema>;

export interface CampaignDraft {
  groupId?: string | null;
  filters?: GroupFilters;
  body: string;
  couponCode?: string | null;
}

export interface CampaignInput extends CampaignDraft {
  name: string;
  /** ISO; sin ella, en la próxima franja legal. */
  scheduleAt?: string | null;
}

const groupsSchema = z.object({ items: z.array(customerGroupSchema) });
const campaignsSchema = z.object({ items: z.array(campaignSchema) });

export const campaignsApi = {
  groups: (signal?: AbortSignal) => api.get<z.infer<typeof groupsSchema>>("/customers/groups", { schema: groupsSchema, signal }),
  createGroup: (input: { name: string; filters: GroupFilters }) => api.post<CustomerGroup>("/customers/groups", input, { schema: customerGroupSchema }),
  removeGroup: (id: string) => api.delete<void>(`/customers/groups/${id}`),
  preview: (draft: CampaignDraft) => api.post<CampaignPreview>("/campaigns/preview", draft, { schema: campaignPreviewSchema }),
  create: (input: CampaignInput) => api.post<Campaign>("/campaigns", input, { schema: campaignSchema }),
  list: (signal?: AbortSignal) => api.get<z.infer<typeof campaignsSchema>>("/campaigns", { schema: campaignsSchema, signal }),
  cancel: (id: string) => api.post<Campaign>(`/campaigns/${id}/cancel`, {}, { schema: campaignSchema }),
};

const keys = { groups: ["customers", "groups"] as const, campaigns: ["campaigns"] as const };

export function useCustomerGroups() {
  return useQuery({ queryKey: keys.groups, queryFn: ({ signal }) => campaignsApi.groups(signal) });
}

export function useGroupActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.groups });
  const create = useMutation({ mutationFn: campaignsApi.createGroup, onSuccess: refresh });
  const remove = useMutation({ mutationFn: campaignsApi.removeGroup, onSuccess: refresh });
  return { create, remove };
}

export function useCampaigns(enabled = true) {
  return useQuery({ queryKey: keys.campaigns, queryFn: ({ signal }) => campaignsApi.list(signal), enabled });
}

export function useCampaignActions() {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: keys.campaigns }), queryClient.invalidateQueries({ queryKey: ["customers"] })]);
  const create = useMutation({ mutationFn: campaignsApi.create, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: campaignsApi.cancel, onSuccess: refresh });
  return { create, cancel };
}

/** La vista previa cambia con el texto: se pide de nuevo a mano («Ver a quién y cuánto»). */
export function useCampaignPreview() {
  return useMutation({ mutationFn: campaignsApi.preview });
}

/** El grupo guardado que coincide con los filtros puestos, si hay uno (para mandarle la campaña con su nombre). */
export function useActiveGroup(filters: GroupFilters): CustomerGroup | undefined {
  const groups = useCustomerGroups();
  return (groups.data?.items ?? []).find((group) => sameFilters(group.filters, filters));
}
