import { transferBrand } from "@/features/payments/transferApps";
import { format, parseISO } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Heading, Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { OrderSummary, type OrderLine } from "@/features/booking/flow/OrderSummary";
import type { Totals } from "@/features/booking/pricing";
import { durationLabel, type ModelContext } from "../calendarModel";
import { PAYMENT_METHOD_KEYS, type Payment } from "../types";
import type { AppointmentModel } from "./useAppointmentModel";
import { PanelFooter } from "@/components/overlays";

/**
 * El recibo de la cita cobrada, dentro del panel y con la cara del de la
 * reserva en línea: el número y el día, con qué se pagó, la orden línea por
 * línea con sus cuentas, y un solo botón: «Enviar recibo» (por correo, SMS o
 * los dos). Es lo que queda a la vista justo después de cobrar.
 */
export function ReceiptPage({ model, ctx, onSend }: { model: AppointmentModel; ctx: ModelContext; onSend?: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const { appointment, services } = model;
  const payment = appointment.payment;
  if (!payment) return null;

  const serviceLines: OrderLine[] = services.map((service, index) => ({ id: `s-${index}`, label: service.name, detail: `${model.barber?.name ?? ""} · ${durationLabel(service.durationMin)}`, amount: appointment.servicePrices?.[index] ?? service.price }));
  const productLines: OrderLine[] = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((item) => item.id === line.productId);
    const unit = appointment.productPrices?.[line.productId] ?? product?.price ?? 0;
    return product ? [{ id: `p-${product.id}`, label: line.qty > 1 ? `${product.name} × ${line.qty}` : product.name, amount: unit * line.qty }] : [];
  });
  const servicesTotal = serviceLines.reduce((sum, line) => sum + line.amount, 0);
  const productsTotal = productLines.reduce((sum, line) => sum + line.amount, 0);
  const discount = (payment.discount ?? 0) + (appointment.online?.discount ?? 0);
  const subtotal = servicesTotal + productsTotal - discount;
  const gift = payment.gift?.amount ?? 0;
  const giftSale = payment.giftSale?.amount ?? 0;
  // El recargo de tarjeta es lo que el total trae de más sobre la cuenta, la propina y la tarjeta de regalo vendida.
  const beforeFee = (ctx.catalog.taxInclusive ? subtotal : subtotal + payment.tax) + payment.tip + giftSale;
  const fee = Math.max(0, Math.round((payment.total - beforeFee) * 100) / 100);
  const totals: Totals = {
    services: servicesTotal,
    products: productsTotal,
    discount,
    subtotal,
    tax: payment.tax,
    taxIncluded: Boolean(ctx.catalog.taxInclusive),
    tip: payment.tip,
    fee,
    feeName: fee > 0 ? t("calendar.checkout.surcharge") : null,
    gift,
    reward: 0,
    prepaid: payment.prepaid ?? 0,
    total: payment.total,
  };
  const lines = [...serviceLines, ...productLines, ...(giftSale > 0 ? [{ id: "gift-sale", label: t("calendar.checkout.giftSale.line"), detail: payment.giftSale?.code, amount: giftSale }] : [])];
  // El número de la reserva en línea, o uno corto sacado de la cita (sin guiones bajos).
  const number = appointment.online?.reservation ?? `#${appointment.id.replace(/^apt_\d{4}/, "").replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
  const when = format(parseISO(payment.paidAt), "EEEE d 'de' MMMM, h:mm a", { locale: calendarLocale(locale) });

  return (
    <div className="flex flex-col gap-5" data-testid="panel-receipt">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <div className="flex min-w-[10rem] flex-1 flex-col">
            <Heading level={6}>{t("calendar.receipt.order")}</Heading>
            <Text size="xs" tone="muted" tabular className="first-letter:uppercase">
              {t("calendar.receipt.number", { number })} · {when}
            </Text>
          </div>
          <Badge variant="secondary" data-testid="panel-receipt-method">
            {t("calendar.receipt.paidWith", { method: methodLabel(payment, t, ctx) })}
          </Badge>
        </div>
        <OrderSummary totals={totals} money={ctx.formatMoney} lines={lines} />
      </div>
      {onSend && (
        <PanelFooter>
          <Button type="button" size="lg" className="w-full" onClick={onSend} data-testid="panel-receipt-send">
            <ThemaIcon name="send" />
            {t("calendar.panel.after.send")}
          </Button>
        </PanelFooter>
      )}
    </div>
  );
}

/** Con qué se pagó, en una línea: el método, o las partes y lo de cada una. */
function methodLabel(payment: Payment, t: ReturnType<typeof useAppT>, ctx: ModelContext): string {
  const name = (method: "cash" | "card" | "link" | "transfer") => t(PAYMENT_METHOD_KEYS[method]);
  const parts = payment.parts?.length
    ? payment.parts.map((part) => `${name(part.method)} ${ctx.formatMoney(part.amount)}`)
    : payment.split
      ? [`${name("cash")} ${ctx.formatMoney(payment.split.cash)}`, `${name("card")} ${ctx.formatMoney(payment.split.card)}`]
      : [t(PAYMENT_METHOD_KEYS[payment.method])];
  // La transferencia dice por dónde llegó y su referencia («Nequi · ref 4821»).
  const transfer = payment.transfer ? [[transferBrand(payment.transfer.via) ?? t("calendar.checkout.transferBank"), payment.transfer.reference ? t("calendar.checkout.transferRef", { reference: payment.transfer.reference }) : null].filter(Boolean).join(" · ")] : [];
  return [...(payment.gift ? [`${t("calendar.checkout.pay.gift")} ${ctx.formatMoney(payment.gift.amount)}`] : []), ...parts, ...transfer].join(" · ");
}
