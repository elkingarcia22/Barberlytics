import { Heading, Text } from "@/components/typography";
import { Separator } from "@/components/ui/separator";
import { servicesOf, type ModelContext } from "../calendarModel";
import type { Appointment } from "../types";
import type { CheckoutController } from "./useCheckout";

/** «Tu orden», como en la reserva: una línea por cita y por producto, y las cuentas. */
export function OrderCard({ checkout, ctx, appointment }: { checkout: CheckoutController; ctx: ModelContext; appointment: Appointment }) {
  const { t, bill } = checkout;
  const lines = [
    ...checkout.services.map((service, index) => ({
      id: `s-${index}`,
      label: service.name,
      detail: checkout.barber?.name,
      amount: checkout.servicePrices[index] ?? service.price,
    })),
    ...checkout.together.map((item) => ({
      id: `a-${item.id}`,
      label: servicesOf(ctx.catalog, item)
        .map((service) => service.name)
        .join(" + "),
      detail: t("calendar.checkout.togetherLine"),
      amount: servicesOf(ctx.catalog, item).reduce((sum, service) => sum + service.price, 0),
    })),
    ...checkout.products.flatMap((line) => {
      const product = ctx.catalog.products.find((item) => item.id === line.productId);
      return product
        ? [
            {
              id: `p-${product.id}`,
              label: product.name,
              detail: `× ${line.qty}`,
              amount: (checkout.productPrices[product.id] ?? product.price) * line.qty,
            },
          ]
        : [];
    }),
  ];
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-subtle p-4" data-testid="checkout-ticket">
      <Heading level={6}>{t("calendar.checkout.order")}</Heading>
      <div className="flex flex-col gap-2">
        {lines.map((line) => (
          <div key={line.id} className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col">
              <Text size="sm" weight="medium" truncate>
                {line.label}
              </Text>
              {line.detail && (
                <Text size="xs" tone="muted" truncate>
                  {line.detail}
                </Text>
              )}
            </span>
            <Text size="sm" tabular>
              {ctx.formatMoney(line.amount)}
            </Text>
          </div>
        ))}
        <Separator className="my-1" />
        {bill.discount > 0 && <Row label={t("calendar.checkout.discountLine")} value={`−${ctx.formatMoney(bill.discount)}`} positive testId="checkout-discount-line" />}
        <Row label={t("calendar.checkout.subtotal")} value={ctx.formatMoney(bill.subtotal - bill.discount)} />
        <Row label={t(ctx.catalog.taxInclusive ? "calendar.checkout.taxIncluded" : "calendar.checkout.tax")} value={ctx.formatMoney(bill.tax)} />
        {checkout.giftSaleAmount > 0 && <Row label={t("calendar.checkout.giftSale.line")} value={ctx.formatMoney(checkout.giftSaleAmount)} />}
        {bill.prepaid > 0 && (
          <Row
            label={
              appointment.online?.reservation
                ? t("calendar.checkout.prepaid", {
                    reservation: appointment.online.reservation,
                  })
                : t("calendar.checkout.prepaidShort")
            }
            value={`−${ctx.formatMoney(bill.prepaid)}`}
            positive
            testId="checkout-prepaid"
          />
        )}
        {checkout.surcharge > 0 && <Row label={checkout.cardFeeName || t("calendar.checkout.surcharge")} value={ctx.formatMoney(checkout.surcharge)} />}
        {checkout.giftApplied > 0 && <Row label={t("calendar.checkout.giftCard.line")} value={`−${ctx.formatMoney(checkout.giftApplied)}`} positive />}
        <Separator className="my-1" />
        <div className="flex items-center justify-between gap-3" data-testid="checkout-total">
          <Text weight="semibold">{t(bill.prepaid > 0 ? "calendar.checkout.due" : "calendar.checkout.total")}</Text>
          <Text size="lg" weight="bold" tabular>
            {ctx.formatMoney(checkout.total)}
          </Text>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, positive = false, testId }: { label: string; value: string; positive?: boolean; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-3" data-testid={testId}>
      <Text size="sm" tone={positive ? "positive" : "secondary"}>
        {label}
      </Text>
      <Text size="sm" tabular tone={positive ? "positive" : "default"}>
        {value}
      </Text>
    </div>
  );
}
