import * as React from "react";
import { Banknote, CalendarCheck, CreditCard, HandCoins, Link2, Package, Scissors, Split, Trash2 } from "lucide-react";
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
import { appointmentRange, appointmentTotal, findBarber, findClient, priceFor, servicesOf, type ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { useCheckoutAppointment } from "./queries";
import { useSettingsSection } from "@/features/settings/settingsQueries";
import { cardFeeSchema, tipsSchema } from "@/features/settings/settingsTypes";
import { FALLBACK_TIPS, appointmentBill, changeDue, splitAcross, sumBills, surchargeAmount, tipAmount, type TipChoice } from "./checkoutMath";
import { PAYMENT_METHOD_KEYS, paymentMethodSchema, type Appointment, type PaymentMethod, type ProductLine } from "./types";
import { ProductThumb, ServiceThumb } from "./calendarShared";
import { CheckoutPrice } from "./CheckoutPrice";

/**
 * Cobrar una cita: los servicios y productos de la cuenta, la propina para
 * el barbero, cómo paga el cliente y el pedido total. «Pagar cita» cierra
 * la cita como cobrada.
 *
 * Si la cita es parte de una visita con servicios añadidos, las otras citas
 * pendientes de esa visita salen arriba ya marcadas: se cobran todas de una
 * vez. Productos, propina y recargo van en la cita que se abrió (el barbero
 * es el mismo); las demás se cierran con lo suyo y el mismo método.
 */

export interface CheckoutDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  onPaid: (appointment: Appointment) => void;
  /** Las otras citas sin cobrar de su visita: salen marcadas para cobrarlas juntas. */
  companions?: readonly Appointment[];
}

const METHOD_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, mixed: Split };

export function CheckoutDrawer(props: CheckoutDrawerProps) {
  return <CheckoutPanel key={`${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`} {...props} />;
}

const NO_COMPANIONS: readonly Appointment[] = [];

function CheckoutPanel({ appointment, open, onOpenChange, ctx, onPaid, companions = NO_COMPANIONS }: CheckoutDrawerProps) {
  const t = useAppT();
  const checkout = useCheckoutAppointment();
  const [serviceIds, setServiceIds] = React.useState<string[]>(appointment?.serviceIds ?? []);
  const [products, setProducts] = React.useState<ProductLine[]>(appointment?.products ?? []);
  // Los precios cambiados en la caja: por servicio (alineados con `serviceIds`; `null` = el de lista) y por producto.
  const [servicePrices, setServicePrices] = React.useState<(number | null)[]>(() => (appointment?.serviceIds ?? []).map((_, index) => appointment?.servicePrices?.[index] ?? null));
  const [productPrices, setProductPrices] = React.useState<Record<string, number>>(appointment?.productPrices ?? {});
  const canEditPrices = ctx.access?.canEditPrices ?? true;
  // Las propinas sugeridas y el recargo por tarjeta son los de Configuración.
  const tipSettings = useSettingsSection("tips", tipsSchema);
  const cardFee = useSettingsSection("cardFee", cardFeeSchema);
  const tipOptions: readonly TipChoice[] = tipSettings.data?.options.length ? tipSettings.data.options : FALLBACK_TIPS;
  const [tipChoice, setTipChoice] = React.useState<string>("none");
  const [received, setReceived] = React.useState<number | null>(null);
  // Pago mixto: cuánto entrega en efectivo; el resto va con tarjeta.
  const [cashPart, setCashPart] = React.useState<number | null>(null);
  const [customTip, setCustomTip] = React.useState<number | null>(null);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  // Las demás citas de la visita vienen marcadas: lo normal es cobrar la visita entera.
  const [companionIds, setCompanionIds] = React.useState<readonly string[]>(() => companions.map((item) => item.id));

  if (!appointment) return null;

  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  // Cada servicio al precio de su barbero: lo mismo que se cobra en la reserva en línea.
  const services = servicesOf(ctx.catalog, { serviceIds, barberId: appointment.barberId });
  const lines = products.map((line) => ({ line, product: ctx.catalog.products.find((item) => item.id === line.productId) })).filter((item): item is { line: ProductLine; product: NonNullable<typeof item.product> } => Boolean(item.product));
  const chosenCompanions = companions.filter((item) => companionIds.includes(item.id));
  // La cuenta con el impuesto de la sucursal, menos lo ya pagado al reservar en línea: aquí se cobra solo el resto.
  const companionBills = chosenCompanions.map((item) => appointmentBill(ctx.catalog, item.serviceIds, item.products, item.online, item.barberId));
  const prices = { servicePrices, productPrices };
  const bill = sumBills([appointmentBill(ctx.catalog, serviceIds, products, appointment.online, appointment.barberId, prices), ...companionBills]);
  const unitPrice = (productId: string, listPrice: number) => productPrices[productId] ?? listPrice;
  const pricesChanged = servicePrices.some((price) => price !== null) || Object.keys(productPrices).length > 0;
  const subtotal = bill.subtotal;
  const chosenTip = tipOptions.find((option) => option.id === tipChoice);
  const tip = tipChoice === "custom" ? Math.max(0, customTip ?? 0) : chosenTip ? tipAmount(chosenTip, subtotal) : 0;
  const mixed = method === "mixed";
  const cash = mixed ? Math.min(Math.max(0, cashPart ?? 0), bill.due + tip) : 0;
  // El recargo solo va sobre lo que se paga con tarjeta (en mixto, la parte de tarjeta).
  const surcharge = mixed ? surchargeAmount(cardFee.data, "card", bill.due + tip - cash) : surchargeAmount(cardFee.data, method, bill.due);
  const total = bill.due + tip + surcharge;
  const change = method === "cash" ? changeDue(received, total) : null;

  const addProduct = (productId: string) => {
    setProducts((current) => {
      const existing = current.find((line) => line.productId === productId);
      return existing ? current.map((line) => (line.productId === productId ? { ...line, qty: line.qty + 1 } : line)) : [...current, { productId, qty: 1 }];
    });
  };

  const toggleCompanion = (id: string) => setCompanionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const pay = async () => {
    try {
      // En mixto, cada cita lleva su parte de efectivo y de tarjeta; la abierta lleva propina y recargo.
      const ownDue = Math.round((appointmentBill(ctx.catalog, serviceIds, products, appointment.online, appointment.barberId, prices).due + tip + surcharge) * 100) / 100;
      const splits = mixed ? splitAcross(cash, [ownDue, ...companionBills.map((item) => item.due)]) : [];
      const [paid, ...others] = await Promise.all([
        checkout.mutateAsync({ id: appointment.id, input: { serviceIds, products, tip, method, surcharge, ...(mixed ? { split: splits[0] } : {}), ...(pricesChanged ? { servicePrices, productPrices } : {}) } }),
        ...chosenCompanions.map((item, index) => checkout.mutateAsync({ id: item.id, input: { serviceIds: item.serviceIds, products: item.products, tip: 0, method, surcharge: 0, ...(mixed ? { split: splits[index + 1] } : {}) } })),
      ]);
      // Lo cobrado ahora: lo pagado en línea ya estaba cobrado.
      const charged = [paid, ...others].reduce((sum, item) => sum + (item.payment?.total ?? 0) - (item.payment?.prepaid ?? 0), 0);
      toast.success(others.length > 0 ? t("calendar.checkout.paidVisit", { count: others.length + 1 }) : t("calendar.checkout.paid"), {
        description: t("calendar.checkout.paidHint", { total: ctx.formatMoney(charged || total), method: t(PAYMENT_METHOD_KEYS[method]) }),
      });
      onOpenChange(false);
      onPaid(paid);
    } catch (error) {
      toast.error(describeError(error).title, { description: describeError(error).description });
    }
  };

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={companions.length > 0 ? t("calendar.checkout.titleVisit") : t("calendar.checkout.title")}
      description={client ? `${client.name} · ${barber?.name ?? ""}` : undefined}
      footer={
        <div className="space-y-3 border-t border-border px-5 py-4">
          <div className="space-y-1">
            <TotalRow label={t("calendar.checkout.subtotal")} value={ctx.formatMoney(subtotal)} />
            {bill.discount > 0 && <TotalRow label={t("calendar.checkout.discountOnline")} value={`−${ctx.formatMoney(bill.discount)}`} />}
            {bill.tax > 0 && <TotalRow label={t(ctx.catalog.taxInclusive ? "calendar.checkout.taxIncluded" : "calendar.checkout.tax")} value={ctx.formatMoney(bill.tax)} />}
            {bill.prepaid > 0 && <TotalRow label={t("calendar.checkout.prepaid", { reservation: appointment.online?.reservation ?? "" })} value={`−${ctx.formatMoney(bill.prepaid)}`} testId="checkout-prepaid" />}
            {tip > 0 && <TotalRow label={t("calendar.checkout.tip")} value={ctx.formatMoney(tip)} />}
            {surcharge > 0 && <TotalRow label={cardFee.data?.name || t("calendar.checkout.surcharge")} value={ctx.formatMoney(surcharge)} />}
            <TotalRow label={t(bill.prepaid > 0 ? "calendar.checkout.due" : "calendar.checkout.total")} value={ctx.formatMoney(total)} strong />
            {change !== null && change >= 0 && <TotalRow label={t("calendar.checkout.change")} value={ctx.formatMoney(change)} />}
          </div>
          <Button className="w-full" onClick={pay} disabled={checkout.isPending || services.length === 0} data-testid="checkout-pay">
            <HandCoins /> {t("calendar.checkout.payAmount", { total: ctx.formatMoney(total) })}
          </Button>
        </div>
      }
    >
      <div className="space-y-3" data-testid="checkout-drawer">
        {companions.length > 0 && (
          <DrawerSection icon={CalendarCheck} tone="brand" title={t("calendar.checkout.visit")} hint={t("calendar.checkout.visitHint")} badge={String(chosenCompanions.length + 1)}>
            <ListItemGroup data-testid="checkout-visit">
              {[appointment, ...companions].map((item) => {
                const isCurrent = item.id === appointment.id;
                const itemServices = isCurrent ? services : servicesOf(ctx.catalog, item);
                return (
                  <ListItem
                    key={item.id}
                    size="sm"
                    selected={isCurrent || companionIds.includes(item.id)}
                    onClick={isCurrent ? undefined : () => toggleCompanion(item.id)}
                    leading={<ServiceThumb service={itemServices[0]} />}
                    title={itemServices.map((service) => service.name).join(" + ") || "—"}
                    description={isCurrent ? `${appointmentRange(item, ctx.intl)} · ${t("calendar.checkout.thisAppointment")}` : appointmentRange(item, ctx.intl)}
                    meta={ctx.formatMoney(isCurrent ? itemServices.reduce((sum, service, index) => sum + (servicePrices[index] ?? service.price), 0) : appointmentTotal(ctx.catalog, item))}
                    data-testid="checkout-visit-item"
                  />
                );
              })}
            </ListItemGroup>
          </DrawerSection>
        )}

        <DrawerSection icon={Scissors} tone="brand" title={t("calendar.checkout.services")} hint={t("calendar.section.appointmentHint")} badge={String(services.length)}>
          <div className="space-y-3">
            <ListItemGroup>
              {services.map((service, index) => (
                <ListItem
                  key={`${service.id}-${index}`}
                  size="sm"
                  leading={<ServiceThumb service={service} />}
                  title={service.name}
                  description={
                    servicePrices[index] != null ? `${t("calendar.field.minutes", { count: service.durationMin })} · ${t("calendar.checkout.listPrice", { price: ctx.formatMoney(service.price) })}` : t("calendar.field.minutes", { count: service.durationMin })
                  }
                  meta={
                    <CheckoutPrice
                      value={servicePrices[index] ?? service.price}
                      listPrice={service.price}
                      editable={canEditPrices}
                      label={service.name}
                      format={ctx.formatMoney}
                      onChange={(next) => setServicePrices((current) => current.map((price, i) => (i === index ? next : price)))}
                    />
                  }
                  actions={
                    services.length > 1 ? (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`${t("calendar.checkout.remove")}: ${service.name}`}
                        onClick={() => {
                          setServiceIds((current) => current.filter((_, i) => i !== index));
                          setServicePrices((current) => current.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 />
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </ListItemGroup>
            <SearchableSelect
              value=""
              onValueChange={(id) => {
                setServiceIds((current) => [...current, id]);
                setServicePrices((current) => [...current, null]);
              }}
              placeholder={t("calendar.checkout.addService")}
              searchPlaceholder={t("calendar.create.searchServices")}
              options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(priceFor(ctx.catalog, appointment.barberId, item)) }), leading: <ServiceThumb service={item} /> }))}
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
                    description={
                      productPrices[product.id] !== undefined
                        ? `${line.qty} × ${ctx.formatMoney(unitPrice(product.id, product.price))} · ${t("calendar.checkout.listPrice", { price: ctx.formatMoney(product.price) })}`
                        : `${line.qty} × ${ctx.formatMoney(product.price)}`
                    }
                    meta={
                      <CheckoutPrice
                        value={unitPrice(product.id, product.price)}
                        listPrice={product.price}
                        editable={canEditPrices}
                        label={product.name}
                        format={(value) => ctx.formatMoney(value * line.qty)}
                        onChange={(next) =>
                          setProductPrices((current) => {
                            const rest = Object.fromEntries(Object.entries(current).filter(([id]) => id !== product.id));
                            return next === null ? rest : { ...rest, [product.id]: next };
                          })
                        }
                      />
                    }
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
          {mixed && (
            <div className="mt-3 space-y-1">
              <Field label={t("calendar.checkout.splitCash")}>
                <NumberField value={cashPart} onValueChange={setCashPart} min={0} step={1} prefix="$" size="sm" data-testid="checkout-split-cash" />
              </Field>
              <Text variant="muted" data-testid="checkout-split-card">
                {t("calendar.checkout.splitCard", { amount: ctx.formatMoney(Math.max(0, total - cash)) })}
              </Text>
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
