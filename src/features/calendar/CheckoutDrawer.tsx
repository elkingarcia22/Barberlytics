import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Spinner } from "@/components/feedback/Spinner";
import { ModalShell, SidePanelShell } from "@/components/overlays";
import { Field, NumberField } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemaIcon } from "@/icons";
import { appointmentStart, servicesOf, type ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { STATUS_KEYS, type Appointment } from "./types";
import { BillSection, DiscountField, GiftSaleField } from "./checkout/BillSection";
import { PayMethods, PayPageContent, type PayPage } from "./checkout/PaySection";
import { PanelQuestion, PanelSubpage } from "./appointmentPanel/bookingStyle";
import type { SendTarget } from "./appointmentPanel/sendTarget";
import { TRACK } from "./appointmentPanel/panelLogic";
import { Stepper } from "@/components/navigation";
import { formatClock } from "@/components/scheduling";
import type { AppMessageKey } from "@/app/i18n/types";
import { useCheckout, type CheckoutController } from "./checkout/useCheckout";

/**
 * Cobrar, con la cara del panel de la cita: el avance de la cita arriba y una
 * tarjeta teñida con «Cobrar US$ …», y dentro lo que se cobra (citas juntas,
 * servicios con su precio, productos), el descuento y la tarjeta de regalo
 * que se vende, «¿Cómo paga?» en tarjetas, «Tu orden» y un solo botón
 * principal. Lo que pide más pasos (link de pago, mixto, en partes, la
 * tarjeta de regalo del cliente) entra a su propia página del panel. La
 * propina se pregunta al pulsar «Cobrar», en su ventana, como en la reserva.
 */

export interface CheckoutDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  onPaid: (appointment: Appointment) => void;
  /** Las otras citas sin cobrar de su visita: salen marcadas para cobrarlas juntas. */
  companions?: readonly Appointment[];
  /** Otras citas del día sin cobrar que se pueden sumar a este cobro. */
  candidates?: readonly Appointment[];
}

const NO_TIP = "none";
const PAGE_TITLE: Record<PayPage, AppMessageKey> = { link: "calendar.checkout.pay.link", mixed: "calendar.checkout.pay.mixed", parts: "calendar.checkout.pay.parts", gift: "calendar.checkout.pay.gift" };

export function CheckoutDrawer(props: CheckoutDrawerProps) {
  const key = `${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`;
  if (!props.appointment) return null;
  return <CheckoutPanel key={key} {...props} appointment={props.appointment} />;
}

function CheckoutPanel({ appointment, open, onOpenChange, ctx, onPaid, companions, candidates }: CheckoutDrawerProps & { appointment: Appointment }) {
  const t = useAppT();
  const checkout = useCheckout({ appointment, companions, candidates, ctx, onPaid, onClose: () => onOpenChange(false) });
  const [tipOpen, setTipOpen] = React.useState(false);
  const [page, setPage] = React.useState<PayPage | null>(null);
  // Con propinas en Configuración se preguntan al cobrar; si no, se cobra directo.
  const charge = () => (checkout.tipOptions.length > 0 ? setTipOpen(true) : void checkout.pay(NO_TIP));
  const canContact = ctx.access?.canContact ?? true;
  const target: SendTarget | null = checkout.client ? { appointmentId: appointment.id, email: canContact ? (checkout.client.email ?? "") : "", phone: canContact ? checkout.client.phone.replace(/[^\d+]/g, "") : "" } : null;

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={checkout.together.length > 0 ? t("calendar.checkout.titleVisit") : t("calendar.checkout.title")}
      description={checkout.client ? `${checkout.client.name} · ${checkout.barber?.name ?? ""}` : undefined}
    >
      {page ? (
        <PanelSubpage title={t(PAGE_TITLE[page])} onBack={() => setPage(null)}>
          <PayPageContent page={page} checkout={checkout} ctx={ctx} target={target} onDone={() => setPage(null)} />
        </PanelSubpage>
      ) : (
        <div className="flex flex-col gap-5" data-testid="checkout-drawer">
          <CheckoutStepper appointment={appointment} ctx={ctx} />
          <section className="flex flex-col gap-5 rounded-2xl bg-gradient-to-b from-warning/15 via-warning/5 to-transparent p-4" data-testid="checkout-card">
            <div className="flex flex-col gap-1">
              <Heading level={2}>{t("calendar.checkout.heading", { total: ctx.formatMoney(checkout.total) })}</Heading>
              <Text tone="secondary">{t("calendar.checkout.lead")}</Text>
            </div>
            <BillSection checkout={checkout} appointment={appointment} ctx={ctx} />

            {/* El descuento y vender una tarjeta de regalo: enlaces que se abren en su sitio. */}
            {(checkout.discountValue === null || !checkout.giftSale) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {checkout.discountValue === null && (
                  <Button type="button" variant="link" size="sm" className="px-0" onClick={() => checkout.setDiscountValue(0)} data-testid="checkout-discount-add">
                    {t("calendar.checkout.discount.ask")}
                  </Button>
                )}
                {!checkout.giftSale && (
                  <Button type="button" variant="link" size="sm" className="px-0" onClick={() => checkout.setGiftSale({ amount: 50, recipientName: "", recipientContact: "" })} data-testid="checkout-gift-sale-add">
                    {t("calendar.checkout.giftSale.ask")}
                  </Button>
                )}
              </div>
            )}
            {checkout.discountValue !== null && <DiscountField checkout={checkout} ctx={ctx} />}
            {checkout.giftSale && <GiftSaleField checkout={checkout} ctx={ctx} />}

            <PanelQuestion title={t("calendar.checkout.howPays")}>
              <PayMethods checkout={checkout} ctx={ctx} onOpenPage={setPage} />
            </PanelQuestion>
            <OrderCard checkout={checkout} ctx={ctx} appointment={appointment} />
            <Button className="w-full" size="lg" onClick={charge} disabled={!checkout.ready || checkout.paying} data-testid="checkout-pay">
              {checkout.paying ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name="lock" />}
              {checkout.payChoice === "link" ? t("calendar.checkout.link.paid", { total: ctx.formatMoney(checkout.total) }) : t("calendar.checkout.payAmount", { total: ctx.formatMoney(checkout.total) })}
            </Button>
          </section>
        </div>
      )}
      <TipModal open={tipOpen} onOpenChange={setTipOpen} checkout={checkout} ctx={ctx} />
    </SidePanelShell>
  );
}

/** El avance de la cita, como en su panel: el cobro es el último paso. */
function CheckoutStepper({ appointment, ctx }: { appointment: Appointment; ctx: ModelContext }) {
  const t = useAppT();
  return (
    <Stepper
      size="sm"
      aria-label={t("calendar.detail.track")}
      current={TRACK.length - 1}
      steps={TRACK.map((status) => ({ id: status, label: t(status === "scheduled" ? "calendar.detail.trackScheduled" : STATUS_KEYS[status]), description: status === "scheduled" ? formatClock(appointmentStart(appointment), ctx.intl) : undefined }))}
    />
  );
}

/** «Tu orden», como en la reserva: una línea por cita y por producto, y las cuentas. */
function OrderCard({ checkout, ctx, appointment }: { checkout: CheckoutController; ctx: ModelContext; appointment: Appointment }) {
  const { t, bill } = checkout;
  const lines = [
    ...checkout.services.map((service, index) => ({ id: `s-${index}`, label: service.name, detail: checkout.barber?.name, amount: checkout.servicePrices[index] ?? service.price })),
    ...checkout.together.map((item) => ({ id: `a-${item.id}`, label: servicesOf(ctx.catalog, item).map((service) => service.name).join(" + "), detail: t("calendar.checkout.togetherLine"), amount: servicesOf(ctx.catalog, item).reduce((sum, service) => sum + service.price, 0) })),
    ...checkout.products.flatMap((line) => {
      const product = ctx.catalog.products.find((item) => item.id === line.productId);
      return product ? [{ id: `p-${product.id}`, label: product.name, detail: `× ${line.qty}`, amount: (checkout.productPrices[product.id] ?? product.price) * line.qty }] : [];
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
        {bill.prepaid > 0 && <Row label={appointment.online?.reservation ? t("calendar.checkout.prepaid", { reservation: appointment.online.reservation }) : t("calendar.checkout.prepaidShort")} value={`−${ctx.formatMoney(bill.prepaid)}`} positive testId="checkout-prepaid" />}
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

/** La propina para el barbero, al pulsar «Cobrar» (como en la reserva): al elegirla se cobra. */
function TipModal({ open, onOpenChange, checkout, ctx }: { open: boolean; onOpenChange: (open: boolean) => void; checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  const [choice, setChoice] = React.useState(NO_TIP);
  const [custom, setCustom] = React.useState<number | null>(null);
  const tip = checkout.tipOf(choice, custom);
  const options = [
    { value: NO_TIP, label: t("calendar.checkout.noTip") },
    ...checkout.tipOptions.map((option) => ({ value: option.id, label: option.type === "percent" ? `${option.value}% · ${ctx.formatMoney(checkout.tipOf(option.id))}` : ctx.formatMoney(option.value) })),
    { value: "custom", label: t("calendar.checkout.customTip") },
  ];
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={t("calendar.checkout.tipFor", { name: checkout.barber?.name.split(" ")[0] ?? "" })}
      description={t("calendar.checkout.tipAsk")}
      actions={
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={checkout.paying}
          onClick={() => {
            onOpenChange(false);
            void checkout.pay(choice, custom);
          }}
          data-testid="checkout-tip-pay"
        >
          {checkout.paying ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name="lock" />}
          {tip > 0 ? t("calendar.checkout.tipAndPay", { total: ctx.formatMoney(checkout.totalWithTip(tip)) }) : t("calendar.checkout.tipSkipPay", { total: ctx.formatMoney(checkout.total) })}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-label={t("calendar.checkout.tip")} className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = choice === option.value;
            return (
              <Button key={option.value} type="button" role="radio" aria-checked={selected} variant={selected ? "default" : "outline"} className="min-w-[5rem] rounded-full tabular-nums" onClick={() => setChoice(option.value)}>
                {option.label}
              </Button>
            );
          })}
        </div>
        {choice === "custom" && (
          <Field label={t("calendar.checkout.tip")}>
            <NumberField value={custom} onValueChange={setCustom} min={0} step={1} prefix="$" size="sm" autoFocus />
          </Field>
        )}
      </div>
    </ModalShell>
  );
}
