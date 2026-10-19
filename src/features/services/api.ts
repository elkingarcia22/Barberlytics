import { api } from "@/lib/api";
import { serviceCategorySchema, serviceDetailSchema, serviceResourceSchema, serviceResourcesSchema, servicesCatalogSchema, type CategoryInput, type ResourceInput, type ServiceResource, type ServiceCategory, type ServiceDetail, type ServiceInput, type ServiceOrderInput, type ServicesCatalog } from "./types";

/** Contrato de servicios; ver docs/API_CONTRACT.md. */
export const servicesApi = {
  catalog: (branchId: string, signal?: AbortSignal) => api.get<ServicesCatalog>("/services", { query: { branchId }, schema: servicesCatalogSchema, signal }),
  get: (id: string, branchId: string, signal?: AbortSignal) => api.get<ServiceDetail>(`/services/${id}`, { query: { branchId }, schema: serviceDetailSchema, signal }),
  create: (input: ServiceInput, branchId: string) => api.post<ServiceDetail>("/services", { ...input, branchId }, { schema: serviceDetailSchema }),
  update: (id: string, input: ServiceInput, branchId: string) => api.patch<ServiceDetail>(`/services/${id}`, input, { query: { branchId }, schema: serviceDetailSchema }),
  remove: (id: string) => api.delete<void>(`/services/${id}`),
  setActive: (branchId: string, serviceIds: string[], active: boolean) => api.put<ServicesCatalog>("/services/activation", { branchId, serviceIds, active }, { schema: servicesCatalogSchema }),
  setTeam: (id: string, branchId: string, memberIds: string[]) => api.put<ServiceDetail>(`/services/${id}/team`, { branchId, memberIds }, { schema: serviceDetailSchema }),
  saveOrder: (branchId: string, order: ServiceOrderInput) => api.put<ServicesCatalog>("/services/order", order, { query: { branchId }, schema: servicesCatalogSchema }),
  createCategory: (input: CategoryInput) => api.post<ServiceCategory>("/service-categories", input, { schema: serviceCategorySchema }),
  updateCategory: (id: string, input: CategoryInput) => api.patch<ServiceCategory>(`/service-categories/${id}`, input, { schema: serviceCategorySchema }),
  removeCategory: (id: string) => api.delete<void>(`/service-categories/${id}`),
  /** Los recursos especiales (un sillón de lavado, el vaporizador…) y los servicios que los usan. */
  resources: (signal?: AbortSignal) => api.get<{ items: ServiceResource[] }>("/service-resources", { schema: serviceResourcesSchema, signal }),
  createResource: (input: ResourceInput) => api.post<ServiceResource>("/service-resources", input, { schema: serviceResourceSchema }),
  updateResource: (id: string, input: ResourceInput) => api.patch<ServiceResource>(`/service-resources/${id}`, input, { schema: serviceResourceSchema }),
  removeResource: (id: string) => api.delete<void>(`/service-resources/${id}`),
};
