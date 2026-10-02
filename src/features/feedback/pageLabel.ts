import type { NavEntry } from "@/components/app-shell";

/**
 * El rótulo de menú de la entrada activa, buscado en los tres niveles. Es lo
 * que se lee en la hoja («Métricas») junto a la ruta cruda.
 */
export function findNavLabel(navigation: readonly NavEntry[], id: string | undefined): string | undefined {
  if (!id) return undefined;
  for (const entry of navigation) {
    if (entry.kind !== "item") continue;
    if (entry.id === id) return entry.label;
    for (const child of entry.children ?? []) {
      if (child.id === id) return child.label;
      const leaf = child.children?.find((item) => item.id === id);
      if (leaf) return leaf.label;
    }
  }
  return undefined;
}
