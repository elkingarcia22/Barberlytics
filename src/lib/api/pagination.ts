import { z } from "zod";

/**
 * Sobre de paginación que devuelve cualquier listado de la API. Es el mismo
 * para todas las colecciones, así las tablas y los hooks se escriben una vez.
 */
export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), meta: paginationMetaSchema });
}

export type Paginated<T> = { items: T[]; meta: PaginationMeta };

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
