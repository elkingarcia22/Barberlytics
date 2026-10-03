import { api } from "@/lib/api";
import { catalogProductSchema, productCategorySchema, productsCatalogSchema, type CatalogProduct, type ProductCategory, type ProductCategoryInput, type ProductInput, type ProductsCatalog } from "./types";

/** Contrato de productos; ver docs/API_CONTRACT.md. */
export const productsApi = {
  catalog: (branchId: string, signal?: AbortSignal) => api.get<ProductsCatalog>("/products", { query: { branchId }, schema: productsCatalogSchema, signal }),
  get: (id: string, branchId: string, signal?: AbortSignal) => api.get<CatalogProduct>(`/products/${id}`, { query: { branchId }, schema: catalogProductSchema, signal }),
  create: (input: ProductInput, branchId: string) => api.post<CatalogProduct>("/products", { ...input, branchId }, { schema: catalogProductSchema }),
  update: (id: string, input: ProductInput, branchId: string) => api.patch<CatalogProduct>(`/products/${id}`, input, { query: { branchId }, schema: catalogProductSchema }),
  remove: (id: string) => api.delete<void>(`/products/${id}`),
  setActive: (branchId: string, productIds: string[], active: boolean) => api.put<ProductsCatalog>("/products/activation", { branchId, productIds, active }, { schema: productsCatalogSchema }),
  createCategory: (input: ProductCategoryInput) => api.post<ProductCategory>("/product-categories", input, { schema: productCategorySchema }),
  updateCategory: (id: string, input: ProductCategoryInput) => api.patch<ProductCategory>(`/product-categories/${id}`, input, { schema: productCategorySchema }),
  removeCategory: (id: string) => api.delete<void>(`/product-categories/${id}`),
};
