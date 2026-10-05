import type { Access } from "@/features/access";

/**
 * Qué deja hacer el rol con un catálogo —servicios o productos— y si ve sus
 * cifras de negocio. Lo leen la lista, la ficha y el panel de categorías, así
 * que la regla vive en un solo sitio (docs/roles/03-clientes-catalogo.md):
 * - cada acción va por su casilla de la matriz (`services`, `products` y sus categorías);
 * - borrar es para toda la barbería: solo el dueño [D]; el administrador desactiva en su sucursal;
 * - costo y margen son de quien gestiona el catálogo; recepción ve el precio de venta, no lo que cuesta.
 */
export type CatalogKind = "services" | "products";

export interface CatalogAccess {
  canCreate: boolean;
  canEdit: boolean;
  /** Activar o desactivar en la sucursal. */
  canToggle: boolean;
  canDelete: boolean;
  categories: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  /** El orden de la reserva en línea (solo servicios). */
  canOrder: boolean;
  /** Costo, margen y su pulso: las cifras de negocio del catálogo. */
  seesMoney: boolean;
}

const CATEGORY_ROW: Readonly<Record<CatalogKind, string>> = { services: "service-categories", products: "product-categories" };

export function catalogAccess(access: Access, kind: CatalogKind): CatalogAccess {
  const categoryRow = CATEGORY_ROW[kind];
  const canEdit = access.can(kind, "edit");
  return {
    canCreate: access.can(kind, "create"),
    canEdit,
    canToggle: canEdit,
    canDelete: access.role === "owner" && access.can(kind, "delete"),
    categories: {
      view: access.can(categoryRow),
      create: access.can(categoryRow, "create"),
      edit: access.can(categoryRow, "edit"),
      delete: access.can(categoryRow, "delete"),
    },
    canOrder: kind === "services" && access.can("service-lineup", "edit"),
    // Quien puede cambiar el catálogo ve lo que cuesta; quien solo lo consulta, no.
    seesMoney: canEdit,
  };
}
