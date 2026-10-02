import * as React from "react";
import { Banknote, CreditCard, HandCoins, Link2, Package, Scissors, Split, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection, DrawerShell } from "@/components/overlays";
import { Field, NumberField, SearchableSelect } from "@/components/forms";
import { RadioCardGroup } from "@/components/selection";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { IconTile } from "@/components/utility";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { cn } from "@/lib/utils";
import { findBarber, findClient, type ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { useCheckoutAppointment } from "./queries";
import { PAYMENT_METHOD_KEYS, paymentMethodSchema, type Appointment, type PaymentMethod, type ProductLine } from "./types";

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

const TIP_PERCENTS = [10, 15, 20] as const;
const METHOD_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, mixed: Split };

export function CheckoutDrawer(props: CheckoutDrawerProps) {
  return <CheckoutPanel key={`${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`} {...props} />;
}

function CheckoutPanel({ appointment, open, onOpenChange, ctx, onPaid }: CheckoutDrawerProps) {
  const t = useAppT();
  const checkout = useCheckoutAppointment();
  const [serviceIds, setServiceIds] = React.useState<string[]>(appointment?.serviceIds ?? []);
  const [products, setProducts] = React.useState<ProductLine[]>(appointment?.products ?? []);
  const [tipChoice, setTipChoice] = React.useState<"none" | "custom" | (typeof TIP_PERCENTS)[number]>("none");
  const [customTip, setCustomTip] = React.useState<number | null>(null);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");

  if (!appointment) return null;

  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const services = serviceIds.map((id) => ctx.catalog.services.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const lines = products.map((line) => ({ line, product: ctx.catalog.products.find((item) => item.id === line.productId) })).filter((item): item is { line: ProductLine; product: NonNullable<typeof item.product> } => Boolean(item.product));
  const subtotal = services.reduce((sum, item) => sum + item.price, 0) + lines.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);
  const tip = tipChoice === "none" ? 0 : tipChoice === "custom" ? Math.max(0, customTip ?? 0) : Math.round(subtotal * (tipChoice / 100) * 100) / 100;
  const total = subtotal + tip;

  const addProduct = (productId: string) => {
    setProducts((current) => {
      const existing = current.find((line) => line.productId === productId);
      return existing ? current.map((line) => (line.productId === productId ? { ...line, qty: line.qty + 1 } : line)) : [...current, { productId, qty: 1 }];
    });
  };

  const pay = () => {
    checkout.mutate(
      { id: appointment.id, input: { serviceIds, products, tip, method } },
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
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t("calendar.checkout.title")}
      description={client ? `${client.name} · ${barber?.name ?? ""}` : undefined}
      footer={
        <div className="space-y-3 border-t border-border bg-surface p-4">
          <div className="space-y-1">
            <TotalRow label={t("calendar.checkout.subtotal")} value={ctx.formatMoney(subtotal)} />
            <TotalRow label={t("calendar.checkout.tip")} value={ctx.formatMoney(tip)} />
            <TotalRow label={t("calendar.checkout.tax")} value={ctx.formatMoney(0)} />
            <TotalRow label={t("calendar.checkout.total")} value={ctx.formatMoney(total)} strong />
          </div>
          <Button className="w-full" onClick={pay} disabled={checkout.isPending || services.length === 0} data-testid="checkout-pay">
            <HandCoins /> {t("calendar.checkout.pay")}
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
                  leading={<IconTile icon={<Scissors />} size="sm" />}
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
              options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) }) }))}
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
                    leading={<IconTile icon={<Package />} size="sm" tone="positive" />}
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
              options={ctx.catalog.products.map((item) => ({ value: item.id, label: item.name, description: `${item.category} · ${ctx.formatMoney(item.price)}` }))}
            />
          </div>
        </DrawerSection>

        <DrawerSection icon={HandCoins} tone="warning" title={t("calendar.checkout.tip")} hint={t("calendar.checkout.tipFor", { name: barber?.name.split(" ")[0] ?? "" })}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <TipChip active={tipChoice === "none"} onClick={() => setTipChoice("none")}>
                {t("calendar.checkout.noTip")}
              </TipChip>
              {TIP_PERCENTS.map((percent) => (
                <TipChip key={percent} active={tipChoice === percent} onClick={() => setTipChoice(percent)}>
                  {percent}% · {ctx.formatMoney(Math.round(subtotal * (percent / 100) * 100) / 100)}
                </TipChip>
              ))}
              <TipChip active={tipChoice === "custom"} onClick={() => setTipChoice("custom")}>
                {t("calendar.checkout.customTip")}
              </TipChip>
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
        </DrawerSection>
      </div>
    </DrawerShell>
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

function TipChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm tabular-nums transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-text-primary hover:bg-surface-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      {children}
    </button>
  );
}
