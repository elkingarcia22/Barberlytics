import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { messageKindSchema } from "@/features/calendar/messages";

/**
 * Lo que la reserva sabe del cliente y recepción pregunta a diario: membresía, paquetes, saldo,
 * tarjetas, reseñas, lista de espera, lo que se le escribió y si acepta promociones. Ver
 * docs/API_CONTRACT.md («Clientes»).
 */

const consentSchema = z.object({ accepted: z.boolean(), at: z.string(), source: z.enum(["booking", "app"]) });

export const relationshipSchema = z.object({
  membership: z.object({ every: z.number(), progress: z.number(), available: z.number(), reward: z.string(), rewardValue: z.number() }).nullable(),
  packages: z.array(z.object({ id: z.string(), name: z.string(), service: z.string(), remaining: z.number(), total: z.number(), expiresAt: z.string() })),
  credit: z.number(),
  giftCards: z.array(z.object({ code: z.string(), recipientName: z.string(), initial: z.number(), balance: z.number(), createdAt: z.string() })),
  cards: z.array(z.object({ id: z.string(), brand: z.string(), last4: z.string(), expMonth: z.number(), expYear: z.number() })),
  reviews: z.array(z.object({ id: z.string(), rating: z.number(), comment: z.string(), barber: z.string(), createdAt: z.string() })),
  waitlist: z.array(z.object({ id: z.string(), branchId: z.string(), service: z.string(), barber: z.string().nullable(), slots: z.array(z.object({ date: z.string(), time: z.string() })), createdAt: z.string() })),
  messages: z.array(z.object({ id: z.string(), appointmentId: z.string(), kind: messageKindSchema, channel: z.enum(["whatsapp", "sms"]), status: z.enum(["sent", "failed"]), at: z.string(), simulated: z.boolean(), error: z.string().nullable() })),
  consent: z.object({ marketing: consentSchema.nullable() }),
});

export type CustomerRelationship = z.infer<typeof relationshipSchema>;
export type MarketingConsent = z.infer<typeof consentSchema>;

export const relationshipApi = {
  get: (id: string, signal?: AbortSignal) => api.get<CustomerRelationship>(`/customers/${id}/relationship`, { schema: relationshipSchema, signal }),
  setMarketing: (id: string, marketing: boolean) => api.patch<CustomerRelationship>(`/customers/${id}/consent`, { marketing }, { schema: relationshipSchema }),
};

const relationshipKey = (id: string) => ["customers", "relationship", id] as const;

export function useCustomerRelationship(id: string) {
  return useQuery({ queryKey: relationshipKey(id), queryFn: ({ signal }) => relationshipApi.get(id, signal), enabled: id !== "" });
}

export function useSetMarketingConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, marketing }: { id: string; marketing: boolean }) => relationshipApi.setMarketing(id, marketing),
    onSuccess: (data, { id }) => queryClient.setQueryData(relationshipKey(id), data),
  });
}
