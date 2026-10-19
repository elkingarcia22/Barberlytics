import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { calendarKeys } from "@/features/calendar/queries";

/**
 * Recepción para el equipo: los kioscos de cada sede (Configuración) y la fila de quien llega sin cita
 * (Calendario). Contrato en docs/API_CONTRACT.md («Recepción y kiosco»).
 */

export const kioskDeviceSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  branchName: z.string(),
  name: z.string(),
  status: z.enum(["pending", "active", "revoked"]),
  pairingCode: z.string().nullable(),
  pairingExpiresAt: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string(),
  pairedAt: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
});
export type KioskDevice = z.infer<typeof kioskDeviceSchema>;

export const queueEntrySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  clientId: z.string().nullable(),
  hasPhone: z.boolean(),
  services: z.array(z.string()),
  serviceIds: z.array(z.string()),
  barberId: z.string().nullable(),
  barberName: z.string().nullable(),
  joinedAt: z.string(),
  source: z.enum(["kiosk", "reception"]),
  position: z.number(),
  waitMin: z.number().nullable(),
  waitMax: z.number().nullable(),
  suggestedBarberId: z.string().nullable(),
  suggestedBarberName: z.string().nullable(),
});
export type QueueEntry = z.infer<typeof queueEntrySchema>;

export const queueSchema = z.object({ branchId: z.string(), waiting: z.array(queueEntrySchema), served: z.number(), left: z.number() });
export type WalkInQueue = z.infer<typeof queueSchema>;

export interface JoinQueueInput {
  branchId: string;
  firstName: string;
  phone?: string;
  serviceIds: string[];
  barberId: string | null;
}

const devicesSchema = z.object({ items: z.array(kioskDeviceSchema) });

export const frontDeskApi = {
  devices: (branchId: string | null, signal?: AbortSignal) => api.get<z.infer<typeof devicesSchema>>("/front-desk/devices", { query: { branchId }, schema: devicesSchema, signal }),
  createDevice: (input: { branchId: string; name: string }) => api.post<KioskDevice>("/front-desk/devices", input, { schema: kioskDeviceSchema }),
  newCode: (id: string) => api.post<KioskDevice>(`/front-desk/devices/${id}/code`, {}, { schema: kioskDeviceSchema }),
  revoke: (id: string) => api.delete<void>(`/front-desk/devices/${id}`),
  queue: (branchId: string, signal?: AbortSignal) => api.get<WalkInQueue>("/front-desk/queue", { query: { branchId }, schema: queueSchema, signal }),
  join: (input: JoinQueueInput) => api.post<WalkInQueue>("/front-desk/queue", input, { schema: queueSchema }),
  call: (id: string, barberId: string | null) => api.post<{ queue: WalkInQueue }>(`/front-desk/queue/${id}/call`, { barberId }, { schema: z.object({ queue: queueSchema }).passthrough() }),
  leave: (id: string, reason: "left" | "removed") => api.post<WalkInQueue>(`/front-desk/queue/${id}/leave`, { reason }, { schema: queueSchema }),
};

const keys = {
  devices: (branchId: string | null) => ["frontDesk", "devices", branchId] as const,
  queue: (branchId: string) => ["frontDesk", "queue", branchId] as const,
};

/** Cada cuánto se refresca la fila en recepción: alguien pudo unirse desde el kiosco. */
const QUEUE_REFRESH_MS = 20_000;

export function useKioskDevices(branchId: string | null, enabled = true) {
  return useQuery({ queryKey: keys.devices(branchId), queryFn: ({ signal }) => frontDeskApi.devices(branchId, signal), enabled });
}

export function useKioskDeviceActions(branchId: string | null) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["frontDesk", "devices"] });
  return {
    create: useMutation({ mutationFn: (name: string) => frontDeskApi.createDevice({ branchId: branchId ?? "", name }), onSuccess: refresh }),
    newCode: useMutation({ mutationFn: frontDeskApi.newCode, onSuccess: refresh }),
    revoke: useMutation({ mutationFn: frontDeskApi.revoke, onSuccess: refresh }),
  };
}

export function useWalkInQueue(branchId: string, enabled = true) {
  return useQuery({ queryKey: keys.queue(branchId), queryFn: ({ signal }) => frontDeskApi.queue(branchId, signal), enabled, refetchInterval: QUEUE_REFRESH_MS });
}

export function useQueueActions(branchId: string) {
  const queryClient = useQueryClient();
  const setQueue = (queue: WalkInQueue) => queryClient.setQueryData(keys.queue(branchId), queue);
  return {
    join: useMutation({ mutationFn: frontDeskApi.join, onSuccess: setQueue }),
    // Llamar crea una cita «Llegó»: la agenda se vuelve a pedir.
    call: useMutation({
      mutationFn: ({ id, barberId }: { id: string; barberId: string | null }) => frontDeskApi.call(id, barberId),
      onSuccess: (data) => {
        setQueue(data.queue);
        return queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      },
    }),
    leave: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: "left" | "removed" }) => frontDeskApi.leave(id, reason), onSuccess: setQueue }),
  };
}
