import { useShellConfig } from "@/components/app-shell";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { branchSchema } from "@/features/settings/settingsTypes";
import { DEFAULT_BRANCH_ID } from "./branches";

/** Mientras Configuración no responde: la moneda de la demo. */
const FALLBACK_CURRENCY = "USD";

/**
 * La moneda de la sucursal activa (la de la cabecera). Cada sucursal cobra
 * en la suya —dólares en Estados Unidos, pesos en Colombia—, así que todo
 * el dinero de la aplicación se escribe con esta.
 */
export function useBranchCurrency(): string {
  const { activeCompanyId } = useShellConfig();
  const branchId = activeCompanyId ?? DEFAULT_BRANCH_ID;
  const branches = useSettingsList("branches", branchSchema);
  return branches.data?.items.find((branch) => branch.id === branchId)?.currency ?? FALLBACK_CURRENCY;
}
