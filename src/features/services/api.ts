import { api } from "@/lib/api";
import { serviceCategorySchema, serviceDetailSchema, servicesCatalogSchema, type CategoryInput, type ServiceCategory, type ServiceDetail, type ServiceInput, type ServiceOrderInput, type ServicesCatalog } from "./types";

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
};
