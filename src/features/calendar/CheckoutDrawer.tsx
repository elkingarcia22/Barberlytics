import * as React from "react";
import { ArrowLeft, ArrowRight, HandCoins } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { SidePanelShell } from "@/components/overlays";
import { Stepper } from "@/components/navigation";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import type { ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import type { Appointment } from "./types";
import { BillStep } from "./checkout/BillStep";
import { PayStep } from "./checkout/PayStep";
import { useCheckout, type CheckoutController } from "./checkout/useCheckout";

/**
 * Cobrar, en dos pasos dentro del mismo panel, como el pago de la reserva en
 * línea: «La cuenta» (qué se cobra: citas juntas, servicios con su precio,
 * productos, tarjeta de regalo que se vende y descuento) y «¿Cómo paga?»
 * (propina, tarjeta de regalo del cliente y el método: efectivo, tarjeta con
 * su datáfono, link de pago, mixto o en partes). Abajo, siempre, el ticket y
 * el botón que dice lo que pasa.
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

type Step = "bill" | "pay";

export function CheckoutDrawer(props: CheckoutDrawerProps) {
  const key = `${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`;
  if (!props.appointment) return null;
  return <CheckoutPanel key={key} {...props} appointment={props.appointment} />;
}

function CheckoutPanel({ appointment, open, onOpenChange, ctx, onPaid, companions, candidates }: CheckoutDrawerProps & { appointment: Appointment }) {
  const t = useAppT();
  const [step, setStep] = React.useState<Step>("bill");
  const checkout = useCheckout({ appointment, companions, candidates, ctx, onPaid, onClose: () => onOpenChange(false) });
  const together = checkout.together.length > 0;

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={together ? t("calendar.checkout.titleVisit") : t("calendar.checkout.title")}
      description={checkout.client ? `${checkout.client.name} · ${checkout.barber?.name ?? ""}` : undefined}
      footer={<CheckoutFooter checkout={checkout} ctx={ctx} step={step} onNext={() => setStep("pay")} onBack={() => setStep("bill")} />}
    >
      <div className="flex flex-col gap-5" data-testid="checkout-drawer">
        <Stepper
          size="sm"
          aria-label={t("calendar.checkout.steps")}
          current={step === "bill" ? 0 : 1}
          onStepClick={(index) => setStep(index === 0 ? "bill" : "pay")}
          steps={[
            { id: "bill", label: t("calendar.checkout.step.bill") },
            { id: "pay", label: t("calendar.checkout.step.pay") },
          ]}
        />
        {step === "bill" ? <BillStep checkout={checkout} appointment={appointment} ctx={ctx} /> : <PayStep checkout={checkout} ctx={ctx} />}
      </div>
    </SidePanelShell>
  );
}

/** El ticket y el botón del paso: «Continuar al pago» y, en el pago, «Cobrar» (o «Ya pagó» con el link). */
function CheckoutFooter({ checkout, ctx, step, onNext, onBack }: { checkout: CheckoutController; ctx: ModelContext; step: Step; onNext: () => void; onBack: () => void }) {
  const { t, bill } = checkout;
  return (
    <div className="space-y-3 border-t border-border px-5 py-4">
      <div className="space-y-1" data-testid="checkout-ticket">
        <TotalRow label={t("calendar.checkout.subtotal")} value={ctx.formatMoney(bill.subtotal)} />
        {bill.discount > 0 && <TotalRow label={t("calendar.checkout.discountLine")} value={`−${ctx.formatMoney(bill.discount)}`} testId="checkout-discount-line" />}
        {bill.tax > 0 && <TotalRow label={t(ctx.catalog.taxInclusive ? "calendar.checkout.taxIncluded" : "calendar.checkout.tax")} value={ctx.formatMoney(bill.tax)} />}
        {checkout.giftSaleAmount > 0 && <TotalRow label={t("calendar.checkout.giftSale.line")} value={ctx.formatMoney(checkout.giftSaleAmount)} />}
        {bill.prepaid > 0 && <TotalRow label={checkout.reservation ? t("calendar.checkout.prepaid", { reservation: checkout.reservation }) : t("calendar.checkout.prepaidShort")} value={`−${ctx.formatMoney(bill.prepaid)}`} testId="checkout-prepaid" />}
        {checkout.tip > 0 && <TotalRow label={t("calendar.checkout.tip")} value={ctx.formatMoney(checkout.tip)} />}
        {checkout.surcharge > 0 && <TotalRow label={checkout.cardFeeName || t("calendar.checkout.surcharge")} value={ctx.formatMoney(checkout.surcharge)} />}
        {checkout.giftApplied > 0 && <TotalRow label={t("calendar.checkout.giftCard.line")} value={`−${ctx.formatMoney(checkout.giftApplied)}`} />}
        <TotalRow label={t(bill.prepaid > 0 ? "calendar.checkout.due" : "calendar.checkout.total")} value={ctx.formatMoney(checkout.total)} strong testId="checkout-total" />
      </div>
      {step === "bill" ? (
        <Button className="w-full" size="lg" onClick={onNext} disabled={checkout.services.length === 0} data-testid="checkout-next">
          {t("calendar.checkout.next", { total: ctx.formatMoney(checkout.total) })}
          <ArrowRight />
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={onBack} aria-label={t("common.back")}>
            <ArrowLeft />
          </Button>
          <Button className="flex-1" size="lg" onClick={() => void checkout.pay()} disabled={!checkout.ready || checkout.paying} data-testid="checkout-pay">
            <HandCoins />
            {checkout.payChoice === "link" ? t("calendar.checkout.link.paid", { total: ctx.formatMoney(checkout.total) }) : t("calendar.checkout.payAmount", { total: ctx.formatMoney(checkout.total) })}
          </Button>
        </div>
      )}
    </div>
  );
}

function TotalRow({ label, value, strong, testId }: { label: string; value: string; strong?: boolean; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-4" data-testid={testId}>
      <Text variant={strong ? "body" : "muted"} weight={strong ? "semibold" : undefined}>
        {label}
      </Text>
      <Text weight={strong ? "semibold" : undefined} size={strong ? "lg" : undefined} tabular>
        {value}
      </Text>
    </div>
  );
}
