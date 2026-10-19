import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { customerKeys } from "./queries";

/**
 * Los derechos del cliente sobre sus datos (docs/API_CONTRACT.md, «Clientes › Datos y privacidad»):
 * la copia de todo lo que hay de él, el borrado (anonimiza; la contabilidad queda sin datos personales)
 * y el registro de cada solicitud con su plazo legal según el país de la sede.
 */

export const PRIVACY_REQUEST_TYPES = ["access", "export", "rectify", "erase", "revoke", "other"] as const;
export const PRIVACY_CHANNELS = ["app", "phone", "email", "in_person", "whatsapp", "sms"] as const;
export type PrivacyRequestType = (typeof PRIVACY_REQUEST_TYPES)[number];
export type PrivacyChannel = (typeof PRIVACY_CHANNELS)[number];

export const PRIVACY_TYPE_KEYS = {
  access: "customers.privacy.type.access",
  export: "customers.privacy.type.export",
  rectify: "customers.privacy.type.rectify",
  erase: "customers.privacy.type.erase",
  revoke: "customers.privacy.type.revoke",
  other: "customers.privacy.type.other",
} as const satisfies Record<PrivacyRequestType, string>;

export const PRIVACY_CHANNEL_KEYS = {
  app: "customers.privacy.channel.app",
  phone: "customers.privacy.channel.phone",
  email: "customers.privacy.channel.email",
  in_person: "customers.privacy.channel.in_person",
  whatsapp: "customers.privacy.channel.whatsapp",
  sms: "customers.privacy.channel.sms",
} as const satisfies Record<PrivacyChannel, string>;

export const privacyRequestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  type: z.enum(PRIVACY_REQUEST_TYPES),
  channel: z.enum(PRIVACY_CHANNELS),
  status: z.enum(["open", "done"]),
  note: z.string(),
  requestedAt: z.string(),
  dueAt: z.string(),
  doneAt: z.string().nullable(),
  by: z.string(),
  overdue: z.boolean(),
});
export type PrivacyRequest = z.infer<typeof privacyRequestSchema>;

const listSchema = z.object({ items: z.array(privacyRequestSchema), open: z.number() });

export const privacyApi = {
  list: (filter: { clientId?: string; status?: "open" | "done" }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filter.clientId) params.set("clientId", filter.clientId);
    if (filter.status) params.set("status", filter.status);
    const query = params.toString();
    return api.get(`/privacy-requests${query ? `?${query}` : ""}`, { schema: listSchema, signal });
  },
  log: (clientId: string, input: { type: PrivacyRequestType; channel: PrivacyChannel; note: string }) => api.post(`/customers/${clientId}/privacy-requests`, input, { schema: privacyRequestSchema }),
  done: (id: string, note: string) => api.post(`/privacy-requests/${id}/done`, { note }, { schema: privacyRequestSchema }),
  /** El JSON con todo lo del cliente; queda anotado como solicitud resuelta. */
  export: (clientId: string, channel: PrivacyChannel) => api.get<unknown>(`/customers/${clientId}/export?channel=${channel}`),
  /** Pide confirmar la identidad (`step_up_required`): el cliente de la API la pide y reintenta. */
  erase: (clientId: string, input: { channel: PrivacyChannel; note: string }) => api.post<{ erasedAt: string }>(`/customers/${clientId}/erase`, input),
};

const privacyKeys = {
  all: ["privacy-requests"] as const,
  list: (filter: { clientId?: string; status?: "open" | "done" }) => [...privacyKeys.all, filter] as const,
};

export function usePrivacyRequests(filter: { clientId?: string; status?: "open" | "done" }, enabled = true) {
  return useQuery({ queryKey: privacyKeys.list(filter), queryFn: ({ signal }) => privacyApi.list(filter, signal), enabled });
}

export function useLogPrivacyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, ...input }: { clientId: string; type: PrivacyRequestType; channel: PrivacyChannel; note: string }) => privacyApi.log(clientId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: privacyKeys.all }),
  });
}

export function useClosePrivacyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => privacyApi.done(id, note),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: privacyKeys.all }),
  });
}

/** Baja la copia de los datos del cliente como `cliente-<id>.json`. */
export function downloadJson(filename: string, data: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useExportCustomerData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, channel }: { clientId: string; channel: PrivacyChannel }) => privacyApi.export(clientId, channel),
    onSuccess: (data, { clientId }) => {
      downloadJson(`cliente-${clientId}.json`, data);
      void queryClient.invalidateQueries({ queryKey: privacyKeys.all });
    },
  });
}

export function useEraseCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, ...input }: { clientId: string; channel: PrivacyChannel; note: string }) => privacyApi.erase(clientId, input),
    onSuccess: (_result, { clientId }) => {
      queryClient.removeQueries({ queryKey: customerKeys.detail(clientId) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      void queryClient.invalidateQueries({ queryKey: privacyKeys.all });
    },
  });
}
