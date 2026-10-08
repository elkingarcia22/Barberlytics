import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { personName } from "../bookingState";
import { parseStart } from "../bookingFormat";
import { draftOrderLines } from "../useBookingTotals";
import { useBookingFlow } from "./BookingContext";
import { OrderSummary } from "./OrderSummary";

/**
 * En monitor, la reserva que se va armando queda a la derecha todo el
 * tiempo: la sede, cada cita y el total. En celular eso vive en el resumen.
 */
export function BookingSummaryAside() {
  const t = useAppT();
  const { state, shop, catalog, totals, fmt } = useBookingFlow();
  const branch = shop.branches.find((item) => item.id === state.branchId);
  const lines = draftOrderLines(state, catalog, (item) => {
    const barber = catalog?.barbers.find((entry) => entry.id === item.barberId)?.name ?? t("booking.review.noPreference");
    return `${personName(item.person, state.customer)} · ${barber}${item.start ? ` · ${fmt.when(parseStart(item.start))}` : ""}`;
  });

  return (
    <aside aria-label={t("booking.step.review")} className="flex flex-col gap-5 p-6">
      <Heading level={5}>{t("booking.step.review")}</Heading>
      {branch ? (
        <div className="flex items-center gap-3">
          <IconTile size="lg" src={branch.imageUrl} icon={<ThemaIcon name="building" />} />
          <div className="flex min-w-0 flex-col">
            <Text weight="semibold" truncate>
              {branch.name}
            </Text>
            <Text size="xs" tone="muted" truncate>
              {branch.address}, {branch.city}
            </Text>
          </div>
        </div>
      ) : (
        <Text size="sm" tone="muted">
          {t("booking.branch.lead")}
        </Text>
      )}
      {lines.length > 0 ? (
        <OrderSummary totals={totals} money={fmt.money} lines={lines} promoCode={state.promo?.code} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
          <ThemaIcon name="calendar" tone="muted" />
          <Text size="sm" tone="muted">
            {t("booking.review.emptyLead")}
          </Text>
        </div>
      )}
      <Text size="xs" tone="muted" className="flex items-start gap-1.5">
        <ThemaIcon name="info" size="xs" />
        {t("booking.confirmed.arrive", { hours: shop.cancelHours })}
      </Text>
    </aside>
  );
}
