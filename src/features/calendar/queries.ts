import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarApi } from "./api";
import type {
  Appointment,
  AppointmentInput,
  AppointmentPatch,
  BlockInput,
  CalendarCatalog,
  CalendarDay,
  Client,
  CheckoutInput,
  ClientRestriction,
  NoteInput,
  SaleInput,
  WaitlistInput,
} from "./types";

/**
 * Claves jerárquicas: invalidar `days()` refresca cualquier día abierto sin
 * tocar el catálogo, y `month()` se recalcula cuando cambia una cita.
 */
export const calendarKeys = {
  all: ["calendar"] as const,
  catalog: (branchId: string) => [...calendarKeys.all, "catalog", branchId] as const,
  days: () => [...calendarKeys.all, "day"] as const,
  day: (branchId: string, date: string) => [...calendarKeys.days(), branchId, date] as const,
  months: () => [...calendarKeys.all, "month"] as const,
  month: (branchId: string, month: string, barberId: string | null) => [...calendarKeys.months(), branchId, month, barberId] as const,
  ranges: () => [...calendarKeys.all, "range"] as const,
  range: (branchId: string, from: string, to: string) => [...calendarKeys.ranges(), branchId, from, to] as const,
  waitlist: (branchId: string, date: string | null) => [...calendarKeys.all, "waitlist", branchId, date] as const,
};

export function useCatalogQuery(branchId: string) {
  return useQuery({
    queryKey: calendarKeys.catalog(branchId),
    queryFn: ({ signal }) => calendarApi.catalog(branchId, signal),
    staleTime: 5 * 60_000,
  });
}

export function useDayQuery(branchId: string, date: string) {
  return useQuery({
    queryKey: calendarKeys.day(branchId, date),
    queryFn: ({ signal }) => calendarApi.day(branchId, date, signal),
    // Al cambiar de día se conserva el anterior en pantalla mientras llega el nuevo.
    placeholderData: keepPreviousData,
  });
}

/** Las citas de un rango, para el buscador: solo se piden cuando se abre. */
export function useRangeQuery(branchId: string, from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: calendarKeys.range(branchId, from, to),
    queryFn: ({ signal }) => calendarApi.range(branchId, from, to, signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useMonthQuery(branchId: string, month: string, barberId: string | null, enabled = true) {
  return useQuery({
    queryKey: calendarKeys.month(branchId, month, barberId),
    queryFn: ({ signal }) => calendarApi.month(branchId, month, barberId, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useWaitlistQuery(branchId: string, date: string | null, enabled = true) {
  return useQuery({
    queryKey: calendarKeys.waitlist(branchId, date),
    queryFn: ({ signal }) => calendarApi.waitlist(branchId, date, signal),
    enabled,
  });
}

/** Tras cualquier cambio de una cita, los días, los meses y las búsquedas abiertos se vuelven a pedir. */
function useInvalidateAgenda() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: calendarKeys.days() });
    void queryClient.invalidateQueries({ queryKey: calendarKeys.months() });
    void queryClient.invalidateQueries({ queryKey: calendarKeys.ranges() });
  };
}

/** Bloquear al cliente o pedirle pago en línea: cambia su ficha, así que se refrescan el catálogo y Clientes. */
export function useRestrictClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, patch }: { clientId: string; patch: ClientRestriction }) => calendarApi.restrictClient(clientId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...calendarKeys.all, "catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAgenda();
  return useMutation({
    mutationFn: (input: AppointmentInput) => calendarApi.createAppointment(input),
    onSuccess: invalidate,
  });
}

/** Cambia una cita con la respuesta optimista: la tarjeta se mueve al instante y vuelve si el servidor dice que no. */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAgenda();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AppointmentPatch }) => calendarApi.updateAppointment(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: calendarKeys.days() });
      const previous = queryClient.getQueriesData<CalendarDay>({ queryKey: calendarKeys.days() });
      queryClient.setQueriesData<CalendarDay>({ queryKey: calendarKeys.days() }, (day) =>
        day ? { ...day, appointments: day.appointments.map((item) => (item.id === id ? applyPatch(item, patch) : item)) } : day
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: invalidate,
  });
}

function applyPatch(item: Appointment, patch: AppointmentPatch): Appointment {
  const { notes, confirmation, ...rest } = patch;
  // La confirmación que marca recepción se ve al instante; la fecha la pone el servidor.
  const confirmed = confirmation === undefined ? {} : { confirmation: confirmation === "confirmed" ? { status: "confirmed" as const, at: new Date().toISOString(), via: "reception" as const } : null };
  return { ...item, ...rest, ...confirmed, ...(notes !== undefined ? { notes } : {}) };
}

export function useCheckoutAppointment() {
  const invalidate = useInvalidateAgenda();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CheckoutInput }) => calendarApi.checkout(id, input),
    onSuccess: invalidate,
  });
}

/**
 * Las notas son del cliente y se ven en la cita y en su ficha: cualquier cambio
 * refresca las dos (la agenda y el módulo de clientes).
 */
function useRefreshClientNotes() {
  const queryClient = useQueryClient();
  return (client: Client) => {
    // La respuesta ya trae las notas al día: se escriben donde se ven para que el cambio
    // aparezca al instante, y después se recarga por si algo más cambió en el servidor.
    queryClient.setQueriesData<CalendarCatalog>({ queryKey: [...calendarKeys.all, "catalog"] }, (old) =>
      old ? { ...old, clients: old.clients.map((item) => (item.id === client.id ? { ...item, notes: client.notes } : item)) } : old
    );
    queryClient.setQueriesData<{ notes: Client["notes"] }>({ queryKey: ["customers", "detail", client.id] }, (old) => (old ? { ...old, notes: client.notes } : old));
    void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
  };
}

export function useAddClientNote() {
  const refresh = useRefreshClientNotes();
  return useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: NoteInput }) => calendarApi.addClientNote(clientId, input),
    onSuccess: refresh,
  });
}

export function useUpdateClientNote() {
  const refresh = useRefreshClientNotes();
  return useMutation({
    mutationFn: ({ clientId, noteId, input }: { clientId: string; noteId: string; input: Partial<NoteInput> }) => calendarApi.updateClientNote(clientId, noteId, input),
    onSuccess: refresh,
  });
}

export function useRemoveClientNote() {
  const refresh = useRefreshClientNotes();
  return useMutation({
    mutationFn: ({ clientId, noteId }: { clientId: string; noteId: string }) => calendarApi.removeClientNote(clientId, noteId),
    onSuccess: refresh,
  });
}

export function useCreateBlock() {
  const invalidate = useInvalidateAgenda();
  return useMutation({ mutationFn: (input: BlockInput) => calendarApi.createBlock(input), onSuccess: invalidate });
}

export function useRemoveBlock() {
  const invalidate = useInvalidateAgenda();
  return useMutation({ mutationFn: (id: string) => calendarApi.removeBlock(id), onSuccess: invalidate });
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WaitlistInput) => calendarApi.addToWaitlist(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...calendarKeys.all, "waitlist"] }),
  });
}

export function useRemoveFromWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarApi.removeFromWaitlist(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...calendarKeys.all, "waitlist"] }),
  });
}

export function useCreateSale() {
  return useMutation({ mutationFn: (input: SaleInput) => calendarApi.createSale(input) });
}
