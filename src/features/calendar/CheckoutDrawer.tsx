import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Spinner } from "@/components/feedback/Spinner";
import { ModalShell, SidePanelShell } from "@/components/overlays";
import { Field, NumberField } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/selection";
import { ThemaIcon } from "@/icons";
import { appointmentStart, type ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { STATUS_KEYS, type Appointment } from "./types";
import { CheckoutBill } from "./checkout/CheckoutBills";
import { CHECKOUT_VERSIONS, useCheckoutVersion, type CheckoutVersion } from "./checkout/checkoutVersion";
import { OrderCard } from "./checkout/OrderCard";
import { PayMethods } from "./checkout/PaySection";
import { PanelQuestion } from "./appointmentPanel/bookingStyle";
import type { SendTarget } from "./appointmentPanel/sendTarget";
import { TRACK } from "./appointmentPanel/panelLogic";
import { Stepper } from "@/components/navigation";
import { formatClock } from "@/components/scheduling";
import { useCheckout, type CheckoutController } from "./checkout/useCheckout";
import { useCurrencyInput } from "@/features/branches";

/**
 * Cobrar, con la cara del panel de la cita: el avance de la cita arriba y una
 * tarjeta teñida con «Cobrar US$ …», y dentro lo que se cobra (citas juntas,
 * servicios con su precio, productos), el descuento y la tarjeta de regalo
 * que se vende, «¿Cómo paga?» (un selector y, debajo, lo de la forma
 * elegida), «Tu orden» y un solo botón principal. La propina se pregunta al
 * pulsar «Cobrar», en su ventana, como en la reserva. Arriba se elige la
 * versión del cobro (`checkout/checkoutVersion.ts`) para compararlas: cuánto
 * se ve de entrada y cuánto queda detrás de «Agregar».
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

export function CheckoutDrawer(props: CheckoutDrawerProps) {
  const key = `${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`;
  if (!props.appointment) return null;
  return <CheckoutPanel key={key} {...props} appointment={props.appointment} />;
}

function CheckoutPanel({ appointment, open, onOpenChange, ctx, onPaid, companions, candidates }: CheckoutDrawerProps & { appointment: Appointment }) {
  const t = useAppT();
  const checkout = useCheckout({
    appointment,
    companions,
    candidates,
    ctx,
    onPaid,
    onClose: () => onOpenChange(false),
  });
  const [tipOpen, setTipOpen] = React.useState(false);
  const [version, setVersion] = useCheckoutVersion();
  // Con propinas en Configuración se preguntan al cobrar; si no, se cobra directo.
  const charge = () => (checkout.tipOptions.length > 0 ? setTipOpen(true) : void checkout.pay(NO_TIP));
  const canContact = ctx.access?.canContact ?? true;
  const target: SendTarget | null = checkout.client
    ? {
        appointmentId: appointment.id,
        email: canContact ? (checkout.client.email ?? "") : "",
        phone: canContact ? checkout.client.phone.replace(/[^\d+]/g, "") : "",
      }
    : null;

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={checkout.together.length > 0 ? t("calendar.checkout.titleVisit") : t("calendar.checkout.title")}
      description={checkout.client ? `${checkout.client.name} · ${checkout.barber?.name ?? ""}` : undefined}
    >
      <div className="flex flex-col gap-5" data-testid="checkout-drawer">
        <div data-testid="checkout-version">
          <SegmentedControl
            size="sm"
            fullWidth
            ariaLabel={t("calendar.checkout.version.label")}
            value={version}
            onChange={(value) => setVersion(value as CheckoutVersion)}
            options={CHECKOUT_VERSIONS.map((id) => ({
              value: id,
              label: t(`calendar.checkout.version.${id}`),
            }))}
          />
        </div>
        <CheckoutStepper appointment={appointment} ctx={ctx} />
        <section className="flex flex-col gap-5 rounded-2xl bg-gradient-to-b from-warning/15 via-warning/5 to-transparent p-4" data-testid="checkout-card">
          <div className="flex flex-col gap-1">
            <Heading level={2}>
              {t("calendar.checkout.heading", {
                total: ctx.formatMoney(checkout.total),
              })}
            </Heading>
            <Text tone="secondary">{t("calendar.checkout.lead")}</Text>
          </div>
          <CheckoutBill key={version} version={version} checkout={checkout} appointment={appointment} ctx={ctx} />

          <PanelQuestion title={t("calendar.checkout.howPays")}>
            <PayMethods checkout={checkout} ctx={ctx} target={target} layout={version === "quick" ? "tiles" : "select"} />
          </PanelQuestion>
          {version !== "quick" && <OrderCard checkout={checkout} ctx={ctx} appointment={appointment} />}
          <Button className="w-full" size="lg" onClick={charge} disabled={!checkout.ready || checkout.paying} data-testid="checkout-pay">
            {checkout.paying ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name="lock" />}
            {checkout.payChoice === "link"
              ? t("calendar.checkout.link.paid", {
                  total: ctx.formatMoney(checkout.total),
                })
              : t("calendar.checkout.payAmount", {
                  total: ctx.formatMoney(checkout.total),
                })}
          </Button>
        </section>
      </div>
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
      steps={TRACK.map((status) => ({
        id: status,
        label: t(status === "scheduled" ? "calendar.detail.trackScheduled" : STATUS_KEYS[status]),
        description: status === "scheduled" ? formatClock(appointmentStart(appointment), ctx.intl) : undefined,
      }))}
    />
  );
}

/** La propina para el barbero, al pulsar «Cobrar» (como en la reserva): al elegirla se cobra. */
function TipModal({ open, onOpenChange, checkout, ctx }: { open: boolean; onOpenChange: (open: boolean) => void; checkout: CheckoutController; ctx: ModelContext }) {
  const { symbol: currencySymbol } = useCurrencyInput();
  const { t } = checkout;
  const [choice, setChoice] = React.useState(NO_TIP);
  const [custom, setCustom] = React.useState<number | null>(null);
  const tip = checkout.tipOf(choice, custom);
  const options = [
    { value: NO_TIP, label: t("calendar.checkout.noTip") },
    ...checkout.tipOptions.map((option) => ({
      value: option.id,
      label: option.type === "percent" ? `${option.value}% · ${ctx.formatMoney(checkout.tipOf(option.id))}` : ctx.formatMoney(option.value),
    })),
    { value: "custom", label: t("calendar.checkout.customTip") },
  ];
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={t("calendar.checkout.tipFor", {
        name: checkout.barber?.name.split(" ")[0] ?? "",
      })}
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
          {tip > 0
            ? t("calendar.checkout.tipAndPay", {
                total: ctx.formatMoney(checkout.totalWithTip(tip)),
              })
            : t("calendar.checkout.tipSkipPay", {
                total: ctx.formatMoney(checkout.total),
              })}
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
            <NumberField value={custom} onValueChange={setCustom} min={0} step={1} prefix={currencySymbol} size="sm" autoFocus />
          </Field>
        )}
      </div>
    </ModalShell>
  );
}
