import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { messageKindSchema } from "@/features/calendar/messages";

/**
 * Lo que la reserva sabe del cliente y recepción pregunta a diario: membresía, paquetes, saldo,
 * tarjetas, reseñas, lista de espera, lo que se le escribió y si acepta promociones. Ver
 * docs/API_CONTRACT.md («Clientes»).
 */

const consentSchema = z.object({ accepted: z.boolean(), at: z.string(), source: z.enum(["booking", "app", "whatsapp"]), version: z.string().optional(), country: z.string().optional() });

export const relationshipSchema = z.object({
  membership: z.object({ every: z.number(), progress: z.number(), available: z.number(), reward: z.string(), rewardValue: z.number() }).nullable(),
  packages: z.array(z.object({ id: z.string(), name: z.string(), service: z.string(), remaining: z.number(), total: z.number(), expiresAt: z.string() })),
  credit: z.number(),
  giftCards: z.array(z.object({ code: z.string(), recipientName: z.string(), initial: z.number(), balance: z.number(), createdAt: z.string() })),
  cards: z.array(z.object({ id: z.string(), brand: z.string(), last4: z.string(), expMonth: z.number(), expYear: z.number() })),
  reviews: z.array(z.object({ id: z.string(), rating: z.number(), comment: z.string(), barber: z.string(), createdAt: z.string() })),
  waitlist: z.array(z.object({ id: z.string(), branchId: z.string(), service: z.string(), barber: z.string().nullable(), slots: z.array(z.object({ date: z.string(), time: z.string() })), createdAt: z.string() })),
  messages: z.array(z.object({ id: z.string(), appointmentId: z.string(), kind: messageKindSchema, channel: z.enum(["whatsapp", "sms"]), status: z.enum(["sent", "failed"]), at: z.string(), simulated: z.boolean(), error: z.string().nullable(), body: z.string().nullable().optional(), by: z.string().nullable().optional() })),
  consent: z.object({ marketing: consentSchema.nullable() }),
});

export type CustomerRelationship = z.infer<typeof relationshipSchema>;
export type MarketingConsent = z.infer<typeof consentSchema>;

export const MESSAGE_PURPOSES = ["thanks", "rebook", "birthday", "free"] as const;
export type MessagePurpose = (typeof MESSAGE_PURPOSES)[number];
/** Volver y cumpleaños son promoción: piden el permiso del cliente. */
export const isPromotional = (purpose: MessagePurpose): boolean => purpose === "rebook" || purpose === "birthday";

/** El enlace de WhatsApp con el mensaje ya escrito: solo dígitos en el número (con el indicativo). */
export const whatsappLink = (phone: string, body: string): string => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;

export const relationshipApi = {
  get: (id: string, signal?: AbortSignal) => api.get<CustomerRelationship>(`/customers/${id}/relationship`, { schema: relationshipSchema, signal }),
  /** Anota un mensaje escrito desde la ficha (se abre en WhatsApp aparte). `409 no_consent` si es promoción sin permiso. */
  logMessage: (id: string, input: { purpose: MessagePurpose; body: string }) => api.post<CustomerRelationship>(`/customers/${id}/messages`, input, { schema: relationshipSchema }),
  setMarketing: (id: string, marketing: boolean) => api.patch<CustomerRelationship>(`/customers/${id}/consent`, { marketing }, { schema: relationshipSchema }),
};

const relationshipKey = (id: string) => ["customers", "relationship", id] as const;

export function useCustomerRelationship(id: string) {
  return useQuery({ queryKey: relationshipKey(id), queryFn: ({ signal }) => relationshipApi.get(id, signal), enabled: id !== "" });
}

export function useLogMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, purpose, body }: { id: string; purpose: MessagePurpose; body: string }) => relationshipApi.logMessage(id, { purpose, body }),
    onSuccess: (data, { id }) => queryClient.setQueryData(relationshipKey(id), data),
  });
}

export function useSetMarketingConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, marketing }: { id: string; marketing: boolean }) => relationshipApi.setMarketing(id, marketing),
    onSuccess: (data, { id }) => queryClient.setQueryData(relationshipKey(id), data),
  });
}
