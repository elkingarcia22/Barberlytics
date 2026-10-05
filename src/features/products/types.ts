import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";

export const productVisibilitySchema = z.enum(["public", "private"]);
export type ProductVisibility = z.infer<typeof productVisibilitySchema>;

export const productCategorySchema = z.object({ id: z.string(), name: z.string(), description: z.string() });
export type ProductCategory = z.infer<typeof productCategorySchema>;

export const catalogProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  categoryId: z.string(),
  /** Precio de venta. */
  price: z.number(),
  /** Precio de compra; `null` si no se ha registrado. */
  cost: z.number().nullable(),
  taxRate: z.number().nullable(),
  sku: z.string().nullable(),
  brand: z.string().nullable(),
  distributor: z.string().nullable(),
  /** Si el cliente lo ve al reservar en línea. */
  visibility: productVisibilitySchema,
  /** Si los barberos pueden venderlo desde su caja. */
  sellable: z.boolean(),
  /** Si se vende en la sucursal activa. */
  active: z.boolean(),
  /** La foto del producto; sin ella se pinta el icono. */
  imageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type CatalogProduct = z.infer<typeof catalogProductSchema>;

export const productsCatalogSchema = z.object({ categories: z.array(productCategorySchema), items: z.array(catalogProductSchema) });
export type ProductsCatalog = z.infer<typeof productsCatalogSchema>;

/** La categoría a la que caen los productos cuando se borra la suya. */
export const UNCATEGORIZED_PRODUCT_ID = "pcat_none";

/** Lo que captura el formulario. Los mensajes son claves del diccionario. */
export const productInputSchema = z.object({
  name: z.string().trim().min(2, "products.form.error.name"),
  description: z.string().trim(),
  categoryId: z.string().min(1, "products.form.error.category"),
  price: z.number({ error: "products.form.error.price" }).min(0, "products.form.error.price"),
  cost: z.number().min(0, "products.form.error.cost").nullable(),
  taxRate: z.number().min(0, "products.form.error.tax").max(100, "products.form.error.tax").nullable(),
  sku: z.string().trim(),
  brand: z.string().trim(),
  distributor: z.string().trim(),
  visibility: productVisibilitySchema,
  sellable: z.boolean(),
  /** Enlace o imagen subida (data URL); `null` = sin foto. */
  imageUrl: z.string().nullable(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const emptyProductInput = (categoryId: string): ProductInput => ({ name: "", description: "", categoryId, price: Number.NaN, cost: null, taxRate: null, sku: "", brand: "", distributor: "", visibility: "public", sellable: true, imageUrl: null });

export function inputFromProduct(product: CatalogProduct): ProductInput {
  return { name: product.name, description: product.description, categoryId: product.categoryId, price: product.price, cost: product.cost, taxRate: product.taxRate, sku: product.sku ?? "", brand: product.brand ?? "", distributor: product.distributor ?? "", visibility: product.visibility, sellable: product.sellable, imageUrl: product.imageUrl ?? null };
}

export interface ProductCategoryInput {
  name: string;
  description: string;
}

export const PRODUCT_VISIBILITY_KEYS: Readonly<Record<ProductVisibility, AppMessageKey>> = { public: "products.visibility.public", private: "products.visibility.private" };
