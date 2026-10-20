import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { messageKindSchema } from "@/features/calendar/messages";

/**
 * Lo que la reserva sabe del cliente y recepción pregunta a diario: membresía, paquetes, saldo,
 * tarjetas, reseñas, lista de espera, lo que se le escribió y si acepta promociones. Ver
 * docs/API_CONTRACT.md («Clientes»).
 */

const consentSchema = z.object({ accepted: z.boolean(), at: z.string(), source: z.enum(["booking", "app", "whatsapp", "sms"]), version: z.string().optional(), country: z.string().optional() });

/** El permiso aparte para anotar alergias y medicamentos (dato sensible): quién lo anotó y con qué texto. */
const healthConsentSchema = z.object({ accepted: z.boolean(), at: z.string(), source: z.enum(["booking", "app"]), version: z.string(), by: z.string().optional() });

export const relationshipSchema = z.object({
  membership: z.object({ every: z.number(), progress: z.number(), available: z.number(), reward: z.string(), rewardValue: z.number() }).nullable(),
  packages: z.array(z.object({ id: z.string(), name: z.string(), service: z.string(), remaining: z.number(), total: z.number(), expiresAt: z.string() })),
  credit: z.number(),
  giftCards: z.array(z.object({ code: z.string(), recipientName: z.string(), initial: z.number(), balance: z.number(), createdAt: z.string(), sent: z.object({ status: z.enum(["scheduled", "sent", "failed"]), at: z.string() }).nullable().optional() })),
  cards: z.array(z.object({ id: z.string(), brand: z.string(), last4: z.string(), expMonth: z.number(), expYear: z.number() })),
  reviews: z.array(z.object({ id: z.string(), rating: z.number(), comment: z.string(), barber: z.string(), createdAt: z.string() })),
  waitlist: z.array(z.object({ id: z.string(), branchId: z.string(), service: z.string(), barber: z.string().nullable(), slots: z.array(z.object({ date: z.string(), time: z.string() })), createdAt: z.string() })),
  messages: z.array(z.object({ id: z.string(), appointmentId: z.string(), kind: messageKindSchema, channel: z.enum(["whatsapp", "sms"]), status: z.enum(["sent", "failed"]), at: z.string(), simulated: z.boolean(), error: z.string().nullable(), body: z.string().nullable().optional(), by: z.string().nullable().optional() })),
  consent: z.object({ marketing: consentSchema.nullable(), health: healthConsentSchema.nullable().optional(), smsStop: z.object({ at: z.string() }).nullable().optional() }),
  /** La franja legal de promociones en su sede ahora: si no, desde cuándo se puede. */
  promoWindow: z.object({ allowed: z.boolean(), nextAt: z.string(), timeZone: z.string().optional() }).optional(),
  /** El tope por cliente (una promoción cada 30 días): la que ya tiene cerca, si la hay. */
  promoCap: z.object({ sendAt: z.string() }).nullable().optional(),
});

export type CustomerRelationship = z.infer<typeof relationshipSchema>;

export const sendBlockSchema = z.enum(["noPhone", "noConsent", "outsideWindow", "promoCap", "notFound"]);
export type SendBlock = z.infer<typeof sendBlockSchema>;
const bulkCheckSchema = z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), phone: z.string(), blocked: sendBlockSchema.nullable() })) });
export type BulkCheck = z.infer<typeof bulkCheckSchema>;
export type MarketingConsent = z.infer<typeof consentSchema>;
export type HealthConsent = z.infer<typeof healthConsentSchema>;

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
  /** Reenvía por WhatsApp el código de una tarjeta de regalo que compró el cliente. */
  resendGiftCard: (id: string, code: string) => api.post<CustomerRelationship>(`/customers/${id}/gift-cards/${encodeURIComponent(code)}/resend`, {}, { schema: relationshipSchema }),
  /** A quién de la lista se le puede escribir ese mensaje ahora y, si no, por qué. */
  checkBulk: (ids: readonly string[], purpose: MessagePurpose) => api.post("/customers/messages/check", { ids, purpose }, { schema: bulkCheckSchema }),
  /** Retirarlo borra sus alergias y medicamentos anotados (y queda en el registro de solicitudes). */
  setHealth: (id: string, health: boolean) => api.patch<CustomerRelationship>(`/customers/${id}/consent`, { health }, { schema: relationshipSchema }),
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

export function useSetHealthConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, health }: { id: string; health: boolean }) => relationshipApi.setHealth(id, health),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(relationshipKey(id), data);
      // Retirarlo borra las notas médicas: la ficha y el registro cambian.
      void queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["privacy-requests"] });
    },
  });
}

/** A quién de la lista se le puede escribir (se vuelve a pedir al cambiar el propósito). */
export function useBulkSendCheck(ids: readonly string[], purpose: MessagePurpose, enabled: boolean) {
  return useQuery({ queryKey: ["customers", "bulk-check", purpose, [...ids].sort().join(",")], queryFn: () => relationshipApi.checkBulk(ids, purpose), enabled: enabled && ids.length > 0 });
}

export function useResendGiftCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => relationshipApi.resendGiftCard(id, code),
    onSuccess: (data, { id }) => queryClient.setQueryData(relationshipKey(id), data),
  });
}
