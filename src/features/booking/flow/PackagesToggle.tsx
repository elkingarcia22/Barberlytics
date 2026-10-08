import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Switch } from "@/components/ui/switch";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "./BookingContext";
import { packageCoverage } from "../useBookingTotals";

/**
 * En el pago: si sus paquetes cubren algo de esta reserva, lo dice y deja usarlos o guardarlos
 * para otra vez. Cada servicio cubierto gasta una visita del paquete.
 */
export function PackagesToggle() {
  const t = useAppT();
  const { state, dispatch, catalog, fmt } = useBookingFlow();
  const owned = state.customer?.packages ?? [];
  const covered = packageCoverage({ ...state, usePackages: true }, catalog);
  if (owned.length === 0 || covered === 0) return null;
  const names = owned.map((item) => t("booking.packages.left", { name: item.name, count: item.remaining })).join(" · ");
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-3">
      <ThemaIcon name="ticket" tone="primary" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="sm" weight="medium">
          {t("booking.packages.use")}
        </Text>
        <Text as="span" size="xs" tone="secondary" tabular>
          {state.usePackages ? t("booking.packages.useOn", { amount: fmt.money(covered) }) : names}
        </Text>
      </span>
      <Switch checked={state.usePackages} onCheckedChange={(checked) => dispatch({ type: "setUsePackages", usePackages: checked })} aria-label={t("booking.packages.use")} />
    </label>
  );
}
