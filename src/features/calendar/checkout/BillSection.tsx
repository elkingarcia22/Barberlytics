import { Gift, Minus, Percent, Plus, Trash2, X } from "lucide-react";
import { Chip } from "@/components/ai-interaction";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Field, NumberField, SearchableSelect } from "@/components/forms";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { appointmentRange, appointmentTotal, findClient, priceFor, servicesOf, type ModelContext } from "../calendarModel";
import { ClientAvatar, ProductThumb, ServiceThumb } from "../calendarShared";
import { CheckoutPrice } from "../CheckoutPrice";
import { PanelQuestion } from "../appointmentPanel/bookingStyle";
import type { Appointment } from "../types";
import type { CheckoutController } from "./useCheckout";

/**
 * Qué se cobra: las citas que van juntas (las de su visita y otras sin
 * cobrar que se sumen), los servicios con su precio (se cambia ahí mismo) y
 * los productos. Y dos piezas que se abren desde un enlace, como el cupón de
 * la reserva: vender una tarjeta de regalo y el descuento.
 */

/** Los montos de tarjeta de regalo que se ofrecen de un toque. */
const GIFT_AMOUNTS = [25, 50, 100] as const;

export function BillSection({ checkout, appointment, ctx }: { checkout: CheckoutController; appointment: Appointment; ctx: ModelContext }) {
  const { t } = checkout;
  const canEditPrices = ctx.access?.canEditPrices ?? true;
  const addable = checkout.candidates.filter((item) => !checkout.extras.some((extra) => extra.id === item.id));
  return (
    <div className="flex flex-col gap-6" data-testid="checkout-bill">
      {(checkout.companions.length > 0 || checkout.candidates.length > 0) && (
        <PanelQuestion title={t("calendar.checkout.visit")}>
          <ListItemGroup data-testid="checkout-visit">
            <VisitRow appointment={appointment} ctx={ctx} current meta={ctx.formatMoney(checkout.services.reduce((sum, service, index) => sum + (checkout.servicePrices[index] ?? service.price), 0))} />
            {checkout.companions.map((item) => (
              <VisitRow key={item.id} appointment={item} ctx={ctx} selected={checkout.companionIds.includes(item.id)} onClick={() => checkout.toggleCompanion(item.id)} />
            ))}
            {checkout.extras.map((item) => (
              <VisitRow
                key={item.id}
                appointment={item}
                ctx={ctx}
                selected
                actions={
                  <Button size="icon-xs" variant="ghost" aria-label={t("calendar.checkout.removeAppointment")} onClick={() => checkout.removeExtra(item.id)}>
                    <X />
                  </Button>
                }
              />
            ))}
          </ListItemGroup>
          {addable.length > 0 && (
            <SearchableSelect
              value=""
              onValueChange={checkout.addExtra}
              placeholder={t("calendar.checkout.addAppointment")}
              searchPlaceholder={t("calendar.checkout.addAppointmentSearch")}
              options={addable.map((item) => {
                const client = findClient(ctx.catalog, item.clientId);
                return { value: item.id, label: client?.name ?? t("calendar.clientType.walkin"), description: `${appointmentRange(item, ctx.intl)} · ${servicesOf(ctx.catalog, item).map((service) => service.name).join(" + ")}`, leading: <ClientAvatar client={client} size="sm" /> };
              })}
              data-testid="checkout-add-appointment"
            />
          )}
        </PanelQuestion>
      )}

      <PanelQuestion title={t("calendar.checkout.services")}>
        <ListItemGroup>
          {checkout.services.map((service, index) => (
            <ListItem
              key={`${service.id}-${index}`}
              size="sm"
              leading={<ServiceThumb service={service} />}
              title={service.name}
              description={checkout.servicePrices[index] != null ? `${t("calendar.field.minutes", { count: service.durationMin })} · ${t("calendar.checkout.listPrice", { price: ctx.formatMoney(service.price) })}` : t("calendar.field.minutes", { count: service.durationMin })}
              meta={<CheckoutPrice value={checkout.servicePrices[index] ?? service.price} listPrice={service.price} editable={canEditPrices} label={service.name} format={ctx.formatMoney} onChange={(next) => checkout.setServicePrice(index, next)} />}
              actions={
                checkout.services.length > 1 ? (
                  <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.remove")}: ${service.name}`} onClick={() => checkout.removeService(index)}>
                    <Trash2 />
                  </Button>
                ) : undefined
              }
            />
          ))}
        </ListItemGroup>
        <SearchableSelect
          value=""
          onValueChange={checkout.addService}
          placeholder={t("calendar.checkout.addService")}
          searchPlaceholder={t("calendar.create.searchServices")}
          options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(priceFor(ctx.catalog, appointment.barberId, item)) }), leading: <ServiceThumb service={item} /> }))}
        />
      </PanelQuestion>

      <PanelQuestion title={t("calendar.checkout.products")}>
        {checkout.products.length > 0 && (
          <ListItemGroup>
            {checkout.products.map((line) => {
              const product = ctx.catalog.products.find((item) => item.id === line.productId);
              if (!product) return null;
              const unit = checkout.productPrices[product.id] ?? product.price;
              return (
                <ListItem
                  key={product.id}
                  size="sm"
                  leading={<ProductThumb product={product} />}
                  title={product.name}
                  description={checkout.productPrices[product.id] !== undefined ? `${ctx.formatMoney(unit)} c/u · ${t("calendar.checkout.listPrice", { price: ctx.formatMoney(product.price) })}` : `${ctx.formatMoney(unit)} c/u`}
                  meta={<CheckoutPrice value={unit} listPrice={product.price} editable={canEditPrices} label={product.name} format={(value) => ctx.formatMoney(value * line.qty)} onChange={(next) => checkout.setProductPrice(product.id, next)} />}
                  actions={
                    <span className="flex items-center gap-0.5">
                      <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.less")}: ${product.name}`} onClick={() => checkout.setProductQty(product.id, line.qty - 1)}>
                        {line.qty > 1 ? <Minus /> : <Trash2 />}
                      </Button>
                      <Text as="span" size="sm" tabular className="w-5 text-center">
                        {line.qty}
                      </Text>
                      <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.checkout.more")}: ${product.name}`} onClick={() => checkout.setProductQty(product.id, line.qty + 1)}>
                        <Plus />
                      </Button>
                    </span>
                  }
                />
              );
            })}
          </ListItemGroup>
        )}
        <SearchableSelect
          value=""
          onValueChange={checkout.addProduct}
          placeholder={t("calendar.checkout.addProduct")}
          options={ctx.catalog.products.map((item) => ({ value: item.id, label: item.name, description: `${item.category} · ${ctx.formatMoney(item.price)}`, leading: <ProductThumb product={item} /> }))}
        />
      </PanelQuestion>

    </div>
  );
}

function VisitRow({ appointment, ctx, current = false, selected = false, onClick, actions, meta }: { appointment: Appointment; ctx: ModelContext; current?: boolean; selected?: boolean; onClick?: () => void; actions?: React.ReactNode; meta?: string }) {
  const services = servicesOf(ctx.catalog, appointment);
  const client = findClient(ctx.catalog, appointment.clientId);
  return (
    <ListItem
      size="sm"
      selected={current || selected}
      onClick={onClick}
      leading={<ServiceThumb service={services[0]} />}
      title={services.map((service) => service.name).join(" + ") || "—"}
      description={[appointmentRange(appointment, ctx.intl), client?.name].filter(Boolean).join(" · ")}
      meta={meta ?? ctx.formatMoney(appointmentTotal(ctx.catalog, appointment))}
      actions={actions}
      data-testid="checkout-visit-item"
    />
  );
}

/** Vender una tarjeta de regalo en el mismo cobro: el monto y para quién (le llega el código). */
export function GiftSaleField({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t, giftSale } = checkout;
  if (!giftSale) {
    return <ActionTile tone="dashed" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<Gift />} />} title={t("calendar.checkout.giftSale.add")} description={t("calendar.checkout.giftSale.hint")} onClick={() => checkout.setGiftSale({ amount: GIFT_AMOUNTS[1], recipientName: "", recipientContact: "" })} data-testid="checkout-gift-sale-add" />;
  }
  const custom = giftSale.amount !== null && !(GIFT_AMOUNTS as readonly number[]).includes(giftSale.amount);
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-input bg-surface p-3" data-testid="checkout-gift-sale">
      <div className="flex items-center gap-3">
        <IconTile size="md" shape="circle" tone="primary" icon={<Gift />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text weight="medium">{t("calendar.checkout.giftSale.title")}</Text>
          <Text size="xs" tone="muted">
            {t("calendar.checkout.giftSale.lead")}
          </Text>
        </span>
        <Button size="icon-xs" variant="ghost" aria-label={t("calendar.checkout.giftSale.remove")} onClick={() => checkout.setGiftSale(null)}>
          <X />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GIFT_AMOUNTS.map((amount) => (
          <Chip key={amount} size="sm" label={ctx.formatMoney(amount)} selected={giftSale.amount === amount} onClick={() => checkout.setGiftSale({ ...giftSale, amount })} />
        ))}
        <Chip size="sm" label={t("calendar.checkout.customTip")} selected={custom} onClick={() => checkout.setGiftSale({ ...giftSale, amount: null })} />
      </div>
      {(custom || giftSale.amount === null) && (
        <Field label={t("calendar.checkout.giftSale.amount")}>
          <NumberField value={giftSale.amount} onValueChange={(amount) => checkout.setGiftSale({ ...giftSale, amount })} min={5} max={500} step={5} prefix="$" size="sm" />
        </Field>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label={t("calendar.checkout.giftSale.for")}>
          <Input value={giftSale.recipientName} onChange={(event) => checkout.setGiftSale({ ...giftSale, recipientName: event.target.value })} placeholder={t("calendar.checkout.giftSale.forPlaceholder")} />
        </Field>
        <Field label={t("calendar.checkout.giftSale.contact")}>
          <Input value={giftSale.recipientContact} onChange={(event) => checkout.setGiftSale({ ...giftSale, recipientContact: event.target.value })} inputMode="tel" placeholder="+57 300 000 0000" />
        </Field>
      </div>
    </section>
  );
}

/** Un descuento de la caja: porcentaje o monto, con su motivo (queda en la cuenta). */
export function DiscountField({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  if (checkout.discountValue === null) {
    return <ActionTile tone="dashed" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<Percent />} />} title={t("calendar.checkout.discount.add")} description={t("calendar.checkout.discount.hint")} onClick={() => checkout.setDiscountValue(0)} data-testid="checkout-discount-add" />;
  }
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-input bg-surface p-3" data-testid="checkout-discount">
      <div className="flex items-center gap-3">
        <IconTile size="md" shape="circle" tone="positive" icon={<Percent />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text weight="medium">{t("calendar.checkout.discount.title")}</Text>
          <Text size="xs" tone="muted" tabular>
            {checkout.discount > 0 ? t("calendar.checkout.discount.amount", { amount: ctx.formatMoney(checkout.discount) }) : t("calendar.checkout.discount.lead")}
          </Text>
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={t("calendar.checkout.discount.remove")}
          onClick={() => {
            checkout.setDiscountValue(null);
            checkout.setDiscountReason("");
          }}
        >
          <X />
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <SegmentedControl
          size="sm"
          value={checkout.discountType}
          onChange={(value) => checkout.setDiscountType(value === "amount" ? "amount" : "percent")}
          options={[
            { value: "percent", label: "%" },
            { value: "amount", label: "$" },
          ]}
        />
        <div className="min-w-0 flex-1">
          <NumberField value={checkout.discountValue} onValueChange={(value) => checkout.setDiscountValue(value ?? 0)} min={0} max={checkout.discountType === "percent" ? 100 : undefined} step={checkout.discountType === "percent" ? 5 : 1} size="sm" prefix={checkout.discountType === "amount" ? "$" : undefined} suffix={checkout.discountType === "percent" ? "%" : undefined} aria-label={t("calendar.checkout.discount.title")} data-testid="checkout-discount-value" />
        </div>
      </div>
      <Input value={checkout.discountReason} onChange={(event) => checkout.setDiscountReason(event.target.value)} placeholder={t("calendar.checkout.discount.reason")} aria-label={t("calendar.checkout.discount.reason")} />
    </section>
  );
}
