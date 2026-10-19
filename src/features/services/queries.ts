import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "./api";
import type { CategoryInput, ResourceInput, ServiceInput, ServiceOrderInput } from "./types";

export const serviceKeys = {
  all: ["services"] as const,
  catalog: (branchId: string) => [...serviceKeys.all, "catalog", branchId] as const,
  detail: (id: string, branchId: string) => [...serviceKeys.all, "detail", id, branchId] as const,
  resources: () => [...serviceKeys.all, "resources"] as const,
};

/** Los recursos especiales; también los lee la agenda para filtrar por ellos. */
export function useResourcesQuery(enabled = true) {
  return useQuery({ queryKey: serviceKeys.resources(), queryFn: ({ signal }) => servicesApi.resources(signal), enabled, staleTime: 5 * 60_000 });
}

export function useServicesQuery(branchId: string) {
  return useQuery({ queryKey: serviceKeys.catalog(branchId), queryFn: ({ signal }) => servicesApi.catalog(branchId, signal) });
}

export function useServiceQuery(id: string, branchId: string) {
  return useQuery({ queryKey: serviceKeys.detail(id, branchId), queryFn: ({ signal }) => servicesApi.get(id, branchId, signal), enabled: id !== "" });
}

/**
 * Un cambio en el catálogo se nota en tres sitios: aquí, en la agenda —que
 * agenda lo que el catálogo ofrece— y en la ficha de cada barbero.
 */
function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    void queryClient.invalidateQueries({ queryKey: ["team"] });
  };
}

export function useCreateService(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (input: ServiceInput) => servicesApi.create(input, branchId), onSuccess: invalidate });
}

export function useUpdateService(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ServiceInput }) => servicesApi.update(id, input, branchId), onSuccess: invalidate });
}

export function useRemoveService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (id: string) => servicesApi.remove(id), onSuccess: invalidate });
}

export function useSetServicesActive(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ serviceIds, active }: { serviceIds: string[]; active: boolean }) => servicesApi.setActive(branchId, serviceIds, active), onSuccess: invalidate });
}

export function useSetServiceTeam(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ id, memberIds }: { id: string; memberIds: string[] }) => servicesApi.setTeam(id, branchId, memberIds), onSuccess: invalidate });
}

export function useSaveServiceOrder(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (order: ServiceOrderInput) => servicesApi.saveOrder(branchId, order), onSuccess: invalidate });
}

export function useSaveCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ id, input }: { id: string | null; input: CategoryInput }) => (id ? servicesApi.updateCategory(id, input) : servicesApi.createCategory(input)), onSuccess: invalidate });
}

export function useRemoveCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (id: string) => servicesApi.removeCategory(id), onSuccess: invalidate });
}

export function useSaveResource() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ id, input }: { id: string | null; input: ResourceInput }) => (id ? servicesApi.updateResource(id, input) : servicesApi.createResource(input)), onSuccess: invalidate });
}

export function useRemoveResource() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (id: string) => servicesApi.removeResource(id), onSuccess: invalidate });
}
