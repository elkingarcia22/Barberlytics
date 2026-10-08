import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "./api";
import type { NewCustomerInput, RescheduleInput, ReservationInput } from "./types";

/** Claves jerárquicas: reservar o cancelar invalida la disponibilidad y «Mis citas» sin tocar el catálogo. */
export const bookingKeys = {
  all: ["booking"] as const,
  shop: () => [...bookingKeys.all, "shop"] as const,
  branch: (branchId: string) => [...bookingKeys.all, "branch", branchId] as const,
  catalog: (branchId: string) => [...bookingKeys.all, "catalog", branchId] as const,
  availabilities: () => [...bookingKeys.all, "availability"] as const,
  availability: (branchId: string, date: string, serviceIds: readonly string[], barberId: string | null, exclude?: string) =>
    [...bookingKeys.availabilities(), branchId, date, serviceIds.join(","), barberId, exclude ?? null] as const,
  suggestion: (customerId: string) => [...bookingKeys.all, "suggestion", customerId] as const,
  mine: (token: string) => [...bookingKeys.all, "mine", token] as const,
};

export function useBookingShopQuery() {
  return useQuery({ queryKey: bookingKeys.shop(), queryFn: ({ signal }) => bookingApi.shop(signal), staleTime: 10 * 60_000 });
}

export function useBranchDetailQuery(branchId: string | null) {
  return useQuery({
    queryKey: bookingKeys.branch(branchId ?? ""),
    queryFn: ({ signal }) => bookingApi.branch(branchId as string, signal),
    enabled: branchId !== null,
    staleTime: 10 * 60_000,
  });
}

export function useBookingCatalogQuery(branchId: string | null) {
  return useQuery({
    queryKey: bookingKeys.catalog(branchId ?? ""),
    queryFn: ({ signal }) => bookingApi.catalog(branchId as string, signal),
    enabled: branchId !== null,
    staleTime: 10 * 60_000,
  });
}

export interface AvailabilityParams {
  branchId: string | null;
  date: string;
  serviceIds: readonly string[];
  barberId: string | null;
  /** La cita que se está moviendo: su propia hora cuenta como libre. */
  exclude?: string;
}

export function useAvailabilityQuery(params: AvailabilityParams) {
  return useQuery({
    queryKey: bookingKeys.availability(params.branchId ?? "", params.date, params.serviceIds, params.barberId, params.exclude),
    queryFn: ({ signal }) => bookingApi.availability({ ...params, branchId: params.branchId as string }, signal),
    enabled: params.branchId !== null && params.serviceIds.length > 0,
    // Al cambiar de día se queda el anterior mientras llega: la rejilla no parpadea.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** La próxima visita que le toca según su frecuencia, con horas libres propuestas. */
export function useVisitSuggestionQuery(customerId: string | null) {
  return useQuery({
    queryKey: bookingKeys.suggestion(customerId ?? ""),
    queryFn: ({ signal }) => bookingApi.suggestion(customerId as string, signal),
    enabled: customerId !== null,
    staleTime: 60_000,
  });
}

export function useLookupMutation() {
  return useMutation({ mutationFn: (phone: string) => bookingApi.lookup(phone) });
}

export function useCreateCustomerMutation() {
  return useMutation({ mutationFn: (input: NewCustomerInput) => bookingApi.createCustomer(input) });
}

export function useReserveMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ReservationInput) => bookingApi.reserve(input),
    onSuccess: () => client.invalidateQueries({ queryKey: bookingKeys.availabilities() }),
  });
}

export function useMyAppointmentsQuery(token: string | null) {
  return useQuery({
    queryKey: bookingKeys.mine(token ?? ""),
    queryFn: ({ signal }) => bookingApi.myAppointments(token as string, signal),
    enabled: token !== null,
  });
}

export function useRescheduleMutation(token: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RescheduleInput }) => bookingApi.reschedule(token, id, input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: bookingKeys.mine(token) });
      void client.invalidateQueries({ queryKey: bookingKeys.availabilities() });
    },
  });
}

export function useCancelMutation(token: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, refundTo }: { id: string; refundTo: "card" | "credit" }) => bookingApi.cancel(token, id, refundTo),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: bookingKeys.mine(token) });
      void client.invalidateQueries({ queryKey: bookingKeys.availabilities() });
    },
  });
}

export function useSendReceiptMutation() {
  return useMutation({ mutationFn: ({ reservationId, channel, to }: { reservationId: string; channel: "email" | "sms"; to: string }) => bookingApi.sendReceipt(reservationId, { channel, to }) });
}
