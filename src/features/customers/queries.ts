import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NoteInput } from "@/features/calendar/types";
import { customersApi } from "./api";
import type { CustomerDetail, CustomerInput, GuestInput } from "./types";

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomersQuery() {
  return useQuery({ queryKey: customerKeys.list(), queryFn: ({ signal }) => customersApi.list(signal) });
}

export function useCustomerQuery(id: string) {
  return useQuery({ queryKey: customerKeys.detail(id), queryFn: ({ signal }) => customersApi.get(id, signal), enabled: id !== "" });
}

/** Toda mutación devuelve la ficha ya actualizada: se guarda tal cual y la lista se refresca. */
function useStoreDetail() {
  const queryClient = useQueryClient();
  return (customer: CustomerDetail) => {
    queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    void queryClient.invalidateQueries({ queryKey: customerKeys.list() });
  };
}

export function useCreateCustomer() {
  const store = useStoreDetail();
  return useMutation({ mutationFn: ({ input, branchId }: { input: CustomerInput; branchId: string }) => customersApi.create(input, branchId), onSuccess: store });
}

export function useUpdateCustomer() {
  const store = useStoreDetail();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => customersApi.update(id, input), onSuccess: store });
}

export function useSetCustomerBlocked() {
  const store = useStoreDetail();
  return useMutation({ mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => customersApi.setBlocked(id, blocked), onSuccess: store });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.list() });
    },
  });
}

export function useAddCustomerNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NoteInput }) => customersApi.addNote(id, input),
    /* La nota también se ve en la cita, así que la agenda se entera. */
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.list() });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useAddGuest() {
  const store = useStoreDetail();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: GuestInput }) => customersApi.addGuest(id, input), onSuccess: store });
}

export function useRemoveGuest() {
  const store = useStoreDetail();
  return useMutation({ mutationFn: ({ id, guestId }: { id: string; guestId: string }) => customersApi.removeGuest(id, guestId), onSuccess: store });
}
