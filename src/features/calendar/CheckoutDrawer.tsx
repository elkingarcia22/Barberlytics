import * as React from "react";
import { Banknote, CreditCard, HandCoins, Link2, Package, Scissors, Split, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection, SidePanelShell } from "@/components/overlays";
import { Field, NumberField, SearchableSelect } from "@/components/forms";
import { RadioCardGroup } from "@/components/selection";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { Chip } from "@/components/ai-interaction";
import { findBarber, findClient, type ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { useCheckoutAppointment } from "./queries";
import { useSettingsSection } from "@/features/settings/settingsQueries";
import { cardFeeSchema, tipsSchema } from "@/features/settings/settingsTypes";
import { FALLBACK_TIPS, changeDue, surchargeAmount, tipAmount, type TipChoice } from "./checkoutMath";
import { PAYMENT_METHOD_KEYS, paymentMethodSchema, type Appointment, type PaymentMethod, type ProductLine } from "./types";
import { ProductThumb, ServiceThumb } from "./calendarShared";

/**
 * Cobrar una cita: los servicios y productos de la cuenta, la propina para
 * el barbero, cómo paga el cliente y el pedido total. «Pagar cita» cierra
 * la cita como cobrada.
 */

export interface CheckoutDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  onPaid: (appointment: Appointment) => void;
}

const METHOD_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, mixed: Split };

export function CheckoutDrawer(props: CheckoutDrawerProps) {
  return <CheckoutPanel key={`${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`} {...props} />;
}

function CheckoutPanel({ appointment, open, onOpenChange, ctx, onPaid }: CheckoutDrawerProps) {
  const t = useAppT();
  const checkout = useCheckoutAppointment();
  const [serviceIds, setServiceIds] = React.useState<string[]>(appointment?.serviceIds ?? []);
  const [products, setProducts] = React.useState<ProductLine[]>(appointment?.products ?? []);
  // Las propinas sugeridas y el recargo por tarjeta son los de Configuración.
  const tipSettings = useSettingsSection("tips", tipsSchema);
  const cardFee = useSettingsSection("cardFee", cardFeeSchema);
  const tipOptions: readonly TipChoice[] = tipSettings.data?.options.length ? tipSettings.data.options : FALLBACK_TIPS;
  const [tipChoice, setTipChoice] = React.useState<string>("none");
  const [received, setReceived] = React.useState<number | null>(null);
  const [customTip, setCustomTip] = React.useState<number | null>(null);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");

  if (!appointment) return null;

  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const services = serviceIds.map((id) => ctx.catalog.services.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const lines = products.map((line) => ({ line, product: ctx.catalog.products.find((item) => item.id === line.productId) })).filter((item): item is { line: ProductLine; product: NonNullable<typeof item.product> } => Boolean(item.product));
  const subtotal = services.reduce((sum, item) => sum + item.price, 0) + lines.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);
  const chosenTip = tipOptions.find((option) => option.id === tipChoice);
  const tip = tipChoice === "custom" ? Math.max(0, customTip ?? 0) : chosenTip ? tipAmount(chosenTip, subtotal) : 0;
  const surcharge = surchargeAmount(cardFee.data, method, subtotal);
  const total = subtotal + tip + surcharge;
  const change = method === "cash" ? changeDue(received, total) : null;

  const addProduct = (productId: string) => {
    setProducts((current) => {
      const existing = current.find((line) => line.productId === productId);
      return existing ? current.map((line) => (line.productId === productId ? { ...line, qty: line.qty + 1 } : line)) : [...current, { productId, qty: 1 }];
    });
  };

  const pay = () => {
    checkout.mutate(
      { id: appointment.id, input: { serviceIds, products, tip, method, surcharge } },
      {
        onSuccess: (paid) => {
          toast.success(t("calendar.checkout.paid"), { description: t("calendar.checkout.paidHint", { total: ctx.formatMoney(paid.payment?.total ?? total), method: t(PAYMENT_METHOD_KEYS[method]) }) });
          onOpenChange(false);
          onPaid(paid);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t("calendar.checkout.title")}
      description={client ? `${client.name} · ${barber?.name ?? ""}` : undefined}
      footer={
        <div className="space-y-3 border-t border-border px-5 py-4">
          <div className="space-y-1">
            <TotalRow label={t("calendar.checkout.subtotal")} value={ctx.formatMoney(subtotal)} />
            {tip > 0 && <TotalRow label={t("calendar.checkout.tip")} value={ctx.formatMoney(tip)} />}
            {surcharge > 0 && <TotalRow label={cardFee.data?.name || t("calendar.checkout.surcharge")} value={ctx.formatMoney(surcharge)} />}
            <TotalRow label={t("calendar.checkout.total")} value={ctx.formatMoney(total)} strong />
            {change !== null && change >= 0 && <TotalRow label={t("calendar.checkout.change")} value={ctx.formatMoney(change)} />}
          </div>
          <Button className="w-full" onClick={pay} disabled={checkout.isPending || services.length === 0} data-testid="checkout-pay">
            <HandCoins /> {t("calendar.checkout.payAmount", { total: ctx.formatMoney(total) })}
          </Button>
        </div>
      }
    >
      <div className="space-y-3" data-testid="checkout-drawer">
        <DrawerSection icon={Scissors} tone="brand" title={t("calendar.checkout.services")} hint={t("calendar.section.appointmentHint")} badge={String(services.length)}>
          <div className="space-y-3">
            <ListItemGroup>
              {services.map((service, index) => (
                <ListItem
                  key={`${service.id}-${index}`}
                  size="sm"
                  leading={<ServiceThumb service={service} />}
                  title={service.name}
                  description={t("calendar.field.minutes", { count: service.durationMin })}
                  meta={ctx.formatMoney(service.price)}
                  actions={
                    services.length > 1 ? (
                      <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.remove")}: ${service.name}`} onClick={() => setServiceIds((current) => current.filter((_, i) => i !== index))}>
                        <Trash2 />
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </ListItemGroup>
            <SearchableSelect
              value=""
              onValueChange={(id) => setServiceIds((current) => [...current, id])}
              placeholder={t("calendar.checkout.addService")}
              searchPlaceholder={t("calendar.create.searchServices")}
              options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) }), leading: <ServiceThumb service={item} /> }))}
            />
          </div>
        </DrawerSection>

        <DrawerSection icon={Package} tone="positive" title={t("calendar.checkout.products")} hint={t("calendar.quickSale.hint")} badge={String(lines.reduce((sum, { line }) => sum + line.qty, 0))}>
          <div className="space-y-3">
            {lines.length > 0 && (
              <ListItemGroup>
                {lines.map(({ line, product }) => (
                  <ListItem
                    key={product.id}
                    size="sm"
                    leading={<ProductThumb product={product} />}
                    title={product.name}
                    description={`${line.qty} × ${ctx.formatMoney(product.price)}`}
                    meta={ctx.formatMoney(product.price * line.qty)}
                    actions={
                      <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.remove")}: ${product.name}`} onClick={() => setProducts((current) => current.filter((item) => item.productId !== product.id))}>
                        <Trash2 />
                      </Button>
                    }
                  />
                ))}
              </ListItemGroup>
            )}
            <SearchableSelect
              value=""
              onValueChange={addProduct}
              placeholder={t("calendar.checkout.addProduct")}
              options={ctx.catalog.products.map((item) => ({ value: item.id, label: item.name, description: `${item.category} · ${ctx.formatMoney(item.price)}`, leading: <ProductThumb product={item} /> }))}
            />
          </div>
        </DrawerSection>

        <DrawerSection icon={HandCoins} tone="warning" title={t("calendar.checkout.tip")} hint={t("calendar.checkout.tipFor", { name: barber?.name.split(" ")[0] ?? "" })}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Chip label={t("calendar.checkout.noTip")} selected={tipChoice === "none"} tone={tipChoice === "none" ? "primary" : "default"} onClick={() => setTipChoice("none")} />
              {tipOptions.map((option) => (
                <Chip key={option.id} label={option.type === "percent" ? `${option.value}% · ${ctx.formatMoney(tipAmount(option, subtotal))}` : ctx.formatMoney(option.value)} selected={tipChoice === option.id} tone={tipChoice === option.id ? "primary" : "default"} onClick={() => setTipChoice(option.id)} />
              ))}
              <Chip label={t("calendar.checkout.customTip")} selected={tipChoice === "custom"} tone={tipChoice === "custom" ? "primary" : "default"} onClick={() => setTipChoice("custom")} />
            </div>
            {tipChoice === "custom" && (
              <Field label={t("calendar.checkout.tip")}>
                <NumberField value={customTip} onValueChange={setCustomTip} min={0} step={1} prefix="$" size="sm" />
              </Field>
            )}
          </div>
        </DrawerSection>

        <DrawerSection icon={CreditCard} tone="neutral" title={t("calendar.checkout.method")} hint={t("calendar.checkout.methodHint")}>
          <RadioCardGroup
            columns={2}
            value={method}
            onChange={(value) => setMethod(value as PaymentMethod)}
            options={paymentMethodSchema.options.map((option) => ({ value: option, label: t(PAYMENT_METHOD_KEYS[option]), icon: METHOD_ICONS[option] }))}
          />
          {method === "cash" && (
            <div className="mt-3 space-y-1">
              <Field label={t("calendar.checkout.received")}>
                <NumberField value={received} onValueChange={setReceived} min={0} step={1} prefix="$" size="sm" data-testid="checkout-received" />
              </Field>
              {change !== null && (
                <Text variant="muted" className={change < 0 ? "text-destructive" : undefined} data-testid="checkout-change">
                  {change < 0 ? t("calendar.checkout.missing", { amount: ctx.formatMoney(-change) }) : t("calendar.checkout.changeHint", { amount: ctx.formatMoney(change) })}
                </Text>
              )}
            </div>
          )}
          {surcharge > 0 && (
            <Text variant="muted" className="mt-3" data-testid="checkout-surcharge">
              {t("calendar.checkout.surchargeHint", { amount: ctx.formatMoney(surcharge) })}
            </Text>
          )}
        </DrawerSection>
      </div>
    </SidePanelShell>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Text variant={strong ? "body" : "muted"} weight={strong ? "semibold" : undefined}>
        {label}
      </Text>
      <Text weight={strong ? "semibold" : undefined} size={strong ? "lg" : undefined} tabular>
        {value}
      </Text>
    </div>
  );
}
