import * as React from "react";
import type { Company } from "@/components/app-shell";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { branchSchema, type Branch } from "@/features/settings/settingsTypes";
import { BRANCHES } from "./branches";

/** Las iniciales del chip: las dos primeras palabras («North Carolina» → «NC»). */
const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const toCompany = (branch: Pick<Branch, "id" | "name" | "address" | "city">): Company => ({
  id: branch.id,
  name: branch.name,
  initial: initialsOf(branch.name),
  meta: [branch.address, branch.city].filter(Boolean).join(", "),
});

/**
 * Las sucursales activas de Configuración, en la forma que espera el shell. Una sucursal creada
 * o editada allí aparece aquí sin tocar código; mientras Configuración responde, las de la demo.
 */
export function useBranches(): readonly Company[] {
  const query = useSettingsList("branches", branchSchema);
  return React.useMemo(() => {
    const active = (query.data?.items ?? []).filter((branch) => branch.status === "active");
    return active.length > 0 ? active.map(toCompany) : BRANCHES;
  }, [query.data]);
}
