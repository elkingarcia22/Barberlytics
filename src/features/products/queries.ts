import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "./api";
import type { ProductCategoryInput, ProductInput } from "./types";

export const productKeys = {
  all: ["products"] as const,
  catalog: (branchId: string) => [...productKeys.all, "catalog", branchId] as const,
  detail: (id: string, branchId: string) => [...productKeys.all, "detail", id, branchId] as const,
};

export function useProductsQuery(branchId: string) {
  return useQuery({ queryKey: productKeys.catalog(branchId), queryFn: ({ signal }) => productsApi.catalog(branchId, signal) });
}

export function useProductQuery(id: string, branchId: string) {
  return useQuery({ queryKey: productKeys.detail(id, branchId), queryFn: ({ signal }) => productsApi.get(id, branchId, signal), enabled: id !== "" });
}

/** Un cambio en el catálogo se nota aquí y en la agenda, que cobra lo que el catálogo ofrece. */
function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: productKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["calendar"] });
  };
}

export function useCreateProduct(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (input: ProductInput) => productsApi.create(input, branchId), onSuccess: invalidate });
}

export function useUpdateProduct(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ProductInput }) => productsApi.update(id, input, branchId), onSuccess: invalidate });
}

export function useRemoveProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (id: string) => productsApi.remove(id), onSuccess: invalidate });
}

export function useSetProductsActive(branchId: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ productIds, active }: { productIds: string[]; active: boolean }) => productsApi.setActive(branchId, productIds, active), onSuccess: invalidate });
}

export function useSaveProductCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ id, input }: { id: string | null; input: ProductCategoryInput }) => (id ? productsApi.updateCategory(id, input) : productsApi.createCategory(input)), onSuccess: invalidate });
}

export function useRemoveProductCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (id: string) => productsApi.removeCategory(id), onSuccess: invalidate });
}
