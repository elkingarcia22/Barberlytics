import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field, NumberField } from "@/components/forms";
import { SegmentedControl, SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModelContext } from "../calendarModel";
import { ProductThumb, ServiceThumb } from "../calendarShared";
import { useRefundAppointment } from "../queries";
import type { RefundItem } from "../types";
import { PanelQuestion } from "./bookingStyle";
import type { AppointmentModel } from "./useAppointmentModel";
import { useCurrencyInput } from "@/features/branches";
import { PanelFooter } from "@/components/overlays";

/**
 * Devolver, dentro del panel (no en un modal ni en otra pantalla): se marca
 * qué se devuelve —cada servicio, los productos con cuántos (vuelven al
 * inventario) y la propina— y sale el monto con su parte de impuesto; o se
 * escribe otro. A dónde vuelve el dinero y por qué. Lo ya devuelto se descuenta.
 */

const cents = (value: number): number => Math.round(value * 100) / 100;

export function RefundPage({ model, ctx, onDone }: { model: AppointmentModel; ctx: ModelContext; onDone: () => void }) {
  const { symbol: currencySymbol } = useCurrencyInput();
  const t = useAppT();
  const refund = useRefundAppointment();
  const { appointment } = model;
  const payment = appointment.payment;
  const refunds = appointment.refunds ?? [];
  const returned = refunds.flatMap((item) => item.items ?? []);
  const alreadyRefunded = cents(refunds.reduce((sum, item) => sum + item.amount, 0));
  const serviceLines = model.services.map((service, index) => ({ key: `s-${index}`, id: service.id, name: service.name, amount: appointment.servicePrices?.[index] ?? service.price, service, done: returned.some((item) => item.kind === "service" && item.id === service.id) }));
  const productLines = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((item) => item.id === line.productId);
    const left = line.qty - returned.filter((item) => item.kind === "product" && item.id === line.productId).reduce((sum, item) => sum + item.qty, 0);
    return product && left > 0 ? [{ key: `p-${product.id}`, product, unit: appointment.productPrices?.[product.id] ?? product.price, left }] : [];
  });
  const tipLeft = payment && !returned.some((item) => item.kind === "tip") ? payment.tip : 0;

  const [services, setServices] = React.useState<readonly string[]>([]);
  const [products, setProducts] = React.useState<Record<string, number>>({});
  const [withTip, setWithTip] = React.useState(false);
  const [custom, setCustom] = React.useState<number | null>(null);
  const [to, setTo] = React.useState<"cash" | "card">(payment?.method === "cash" ? "cash" : "card");
  const [reason, setReason] = React.useState("");

  if (!payment) return null;
  // El impuesto de la cuenta, en proporción a lo que vale lo marcado (la propina no lleva).
  const preTax = cents(serviceLines.reduce((sum, line) => sum + line.amount, 0) + productLines.reduce((sum, line) => sum + line.unit * (appointment.products.find((item) => item.productId === line.product.id)?.qty ?? 0), 0));
  // Lo descontado (en línea o en la caja) se reparte entre las líneas: se devuelve lo que de verdad se pagó.
  const discounted = cents((appointment.online?.discount ?? 0) + (appointment.checkoutDiscount ?? 0));
  const paidShare = preTax > 0 ? Math.max(0, preTax - discounted) / preTax : 1;
  const taxRate = preTax - discounted > 0 && !ctx.catalog.taxInclusive ? payment.tax / (preTax - discounted) : 0;
  const lineValue = (amount: number) => cents(amount * paidShare * (1 + taxRate));
  const chosenBase = serviceLines.filter((line) => services.includes(line.key)).reduce((sum, line) => sum + line.amount, 0) + productLines.reduce((sum, line) => sum + line.unit * (products[line.product.id] ?? 0), 0);
  const fromLines = cents(lineValue(chosenBase) + (withTip ? tipLeft : 0));
  const refundable = cents(payment.total - alreadyRefunded);
  const amount = Math.min(refundable, custom ?? fromLines);
  const valid = amount > 0 && reason.trim().length >= 3;

  const toggleService = (key: string) => setServices((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const setQty = (productId: string, qty: number, max: number) => setProducts((current) => ({ ...current, [productId]: Math.max(0, Math.min(max, qty)) }));

  const submit = () => {
    const items: RefundItem[] = [
      ...serviceLines.filter((line) => services.includes(line.key)).map((line) => ({ kind: "service" as const, id: line.id, qty: 1, amount: line.amount })),
      ...productLines.filter((line) => (products[line.product.id] ?? 0) > 0).map((line) => ({ kind: "product" as const, id: line.product.id, qty: products[line.product.id], amount: cents(line.unit * products[line.product.id]) })),
      ...(withTip && tipLeft > 0 ? [{ kind: "tip" as const, id: "tip", qty: 1, amount: tipLeft }] : []),
    ];
    refund.mutate(
      { id: appointment.id, input: { amount, reason: reason.trim(), to, ...(items.length > 0 ? { items } : {}) } },
      {
        onSuccess: () => {
          toast.success(t("calendar.refund.done", { amount: ctx.formatMoney(amount) }), { description: t(to === "cash" ? "calendar.refund.toCash" : "calendar.refund.toCard") });
          onDone();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6" data-testid="panel-refund">
      <Text size="sm" tone="secondary">
        {alreadyRefunded > 0 ? t("calendar.refund.leadPartial", { paid: ctx.formatMoney(payment.total), refunded: ctx.formatMoney(alreadyRefunded) }) : t("calendar.refund.lead", { paid: ctx.formatMoney(payment.total) })}
      </Text>

      <PanelQuestion title={t("calendar.refund.what")}>
        <div className="flex flex-col gap-2">
          {serviceLines.map((line) => (
            <SelectableRow key={line.key} role="checkbox" checked={services.includes(line.key)} disabled={line.done} label={line.name} leading={<ServiceThumb service={line.service} size="md" />} onClick={() => !line.done && toggleService(line.key)}>
              <span className="flex flex-1 items-center justify-between gap-3">
                <Text as="span" weight="medium">
                  {line.name}
                </Text>
                <Text as="span" size="sm" tabular tone={line.done ? "muted" : undefined}>
                  {line.done ? t("calendar.refund.returned") : ctx.formatMoney(lineValue(line.amount))}
                </Text>
              </span>
            </SelectableRow>
          ))}
          {productLines.map((line) => {
            const qty = products[line.product.id] ?? 0;
            return (
              <div key={line.key} className="flex min-h-14 items-center gap-3 rounded-xl border border-input bg-surface px-3 py-2" data-testid="panel-refund-product">
                <ProductThumb product={line.product} size="md" tone="neutral" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Text weight="medium" truncate>
                    {line.product.name}
                  </Text>
                  <Text size="xs" tone="muted">
                    {t("calendar.refund.productHint", { left: line.left, price: ctx.formatMoney(lineValue(line.unit)) })}
                  </Text>
                </span>
                <span className="flex items-center gap-0.5">
                  <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.less")}: ${line.product.name}`} disabled={qty === 0} onClick={() => setQty(line.product.id, qty - 1, line.left)}>
                    <Minus />
                  </Button>
                  <Text as="span" size="sm" tabular className="w-5 text-center">
                    {qty}
                  </Text>
                  <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.more")}: ${line.product.name}`} disabled={qty >= line.left} onClick={() => setQty(line.product.id, qty + 1, line.left)}>
                    <Plus />
                  </Button>
                </span>
              </div>
            );
          })}
          {tipLeft > 0 && (
            <SelectableRow role="checkbox" checked={withTip} label={t("calendar.checkout.tip")} onClick={() => setWithTip((current) => !current)}>
              <span className="flex flex-1 items-center justify-between gap-3">
                <Text as="span" weight="medium">
                  {t("calendar.checkout.tip")}
                </Text>
                <Text as="span" size="sm" tabular>
                  {ctx.formatMoney(tipLeft)}
                </Text>
              </span>
            </SelectableRow>
          )}
        </div>
        <Field label={t("calendar.refund.otherAmount")} description={t("calendar.refund.otherHint", { max: ctx.formatMoney(refundable) })}>
          <NumberField value={custom} onValueChange={setCustom} min={0} max={refundable} step={1} prefix={currencySymbol} size="sm" data-testid="panel-refund-amount" />
        </Field>
      </PanelQuestion>

      <PanelQuestion title={t("calendar.refund.to")}>
        <SegmentedControl
          fullWidth
          value={to}
          onChange={(value) => setTo(value === "cash" ? "cash" : "card")}
          options={[
            { value: "cash", label: t("calendar.checkout.pay.cash") },
            { value: "card", label: t("calendar.checkout.pay.card") },
          ]}
        />
      </PanelQuestion>

      <PanelQuestion title={t("calendar.refund.why")}>
        <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("calendar.refund.whyPlaceholder")} aria-label={t("calendar.refund.why")} data-testid="panel-refund-reason" />
      </PanelQuestion>

      <PanelFooter>
        <Button size="lg" variant="destructive" disabled={!valid || refund.isPending} onClick={submit} data-testid="panel-refund-submit">
          {t("calendar.refund.submit", { amount: ctx.formatMoney(Math.max(0, amount)) })}
        </Button>
      </PanelFooter>
    </div>
  );
}
