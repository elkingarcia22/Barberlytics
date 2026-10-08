import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { personName } from "../bookingState";
import { parseStart } from "../bookingFormat";
import { draftOrderLines, itemPrice } from "../useBookingTotals";
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
      <DraftPreview />
      {lines.length > 0 ? (
        <OrderSummary totals={totals} money={fmt.money} lines={lines} promoCode={state.promo?.code} />
      ) : state.draft ? null : (
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

/** Pasos en los que el barbero ya se decidió: «sin preferencia» solo cuenta desde ahí. */
const AFTER_BARBER = new Set(["time", "review"]);

/**
 * La cita que se está armando, antes de añadirla: cada elección aparece aquí
 * en cuanto se hace —servicios, barbero, hora— y lo que falta se dice en gris.
 */
function DraftPreview() {
  const t = useAppT();
  const { state, catalog, fmt } = useBookingFlow();
  const draft = state.draft;
  if (!draft) return null;
  const services = draft.serviceIds.map((id) => catalog?.services.find((service) => service.id === id)).filter((service) => service !== undefined);
  const barber = catalog?.barbers.find((entry) => entry.id === draft.barberId);
  const barberChosen = draft.barberId !== null || AFTER_BARBER.has(state.step);
  const rows = [
    {
      key: "services",
      icon: "scissors" as const,
      value: services.length > 0 ? services.map((service) => service.name).join(" + ") : null,
      pending: t("booking.summary.pendingServices"),
    },
    {
      key: "barber",
      icon: "users" as const,
      value: barberChosen ? (barber?.name ?? t("booking.review.noPreference")) : null,
      pending: t("booking.summary.pendingBarber"),
    },
    {
      key: "time",
      icon: "clock" as const,
      value: draft.start ? fmt.when(parseStart(draft.start)) : null,
      pending: t("booking.summary.pendingTime"),
    },
  ];
  return (
    <section aria-label={t("booking.summary.inProgress")} className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Text size="sm" weight="semibold">
          {t("booking.summary.inProgress")}
        </Text>
        {services.length > 0 && (
          <Text size="sm" weight="medium" tabular>
            {fmt.money(itemPrice(draft, catalog))}
          </Text>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-2">
            <ThemaIcon name={row.icon} size="sm" tone={row.value ? "primary" : "muted"} />
            <Text size="sm" tone={row.value ? "default" : "muted"}>
              {row.value ?? row.pending}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
