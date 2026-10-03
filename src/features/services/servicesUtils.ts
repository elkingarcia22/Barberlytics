import type { CatalogService, ServiceCategory } from "./types";

/** Las ayudas sin JSX del módulo de servicios: márgenes, duraciones y agrupaciones. */

/** Lo que queda del precio tras el costo, en porcentaje; `null` si no hay costo registrado o el precio es cero. */
export function marginOf(service: Pick<CatalogService, "price" | "cost">): number | null {
  if (service.cost === null || service.price <= 0) return null;
  return Math.round(((service.price - service.cost) / service.price) * 1000) / 10;
}

/** «45 min», «1 h», «1 h 30 min»: lo que se lee en una agenda. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export const categoryName = (categories: readonly ServiceCategory[], id: string): string => categories.find((category) => category.id === id)?.name ?? "—";

/** Lo que valdrían por separado los servicios de un combo, y lo que durarían. */
export function comboTotals(includes: readonly string[], items: readonly Pick<CatalogService, "id" | "price" | "durationMin">[]): { price: number; durationMin: number } {
  return includes.reduce(
    (totals, id) => {
      const service = items.find((item) => item.id === id);
      return service ? { price: totals.price + service.price, durationMin: totals.durationMin + service.durationMin } : totals;
    },
    { price: 0, durationMin: 0 }
  );
}

/** Los servicios agrupados por categoría, en el orden del catálogo; las vacías no salen. */
export function groupByCategory<T extends Pick<CatalogService, "categoryId">>(categories: readonly ServiceCategory[], items: readonly T[]): { category: ServiceCategory; items: T[] }[] {
  return categories.map((category) => ({ category, items: items.filter((item) => item.categoryId === category.id) })).filter((group) => group.items.length > 0);
}
