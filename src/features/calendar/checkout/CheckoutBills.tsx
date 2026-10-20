import * as React from "react";
import { Check, Pencil } from "lucide-react";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { SearchableSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import type { ModelContext } from "../calendarModel";
import { ServiceThumb } from "../calendarShared";
import type { Appointment } from "../types";
import { AddMenu, type AddKind } from "./AddMenu";
import { productOptions, serviceOptions, visitOptions } from "./addOptions";
import { DiscountField, GiftSaleField, ProductsSection, ServicesSection, VisitSection } from "./BillSection";
import type { CheckoutController } from "./useCheckout";

/**
 * Lo que se cobra, en una línea —qué y cuánto— con «Editar» para abrirla
 * (precios, cantidades, quitar). Lo ocasional sale de «Agregar»: un servicio,
 * un producto u otra cita se eligen en un buscador que ocupa el sitio del
 * botón y, al elegir, se suman y el buscador se va; el descuento y la tarjeta
 * de regalo que se vende abren su campo debajo de la línea.
 */

interface BillProps {
  checkout: CheckoutController;
  appointment: Appointment;
  ctx: ModelContext;
}

type PickKind = Extract<AddKind, "service" | "product" | "visit">;

/** Con qué monto empieza la tarjeta de regalo que se vende desde «Agregar». */
const GIFT_SALE_START = 50;

export function CheckoutBill({ checkout, appointment, ctx }: BillProps) {
  const { t } = checkout;
  const [editing, setEditing] = React.useState(false);
  const [picking, setPicking] = React.useState<PickKind | null>(null);

  const add = (kind: AddKind) => {
    if (kind === "discount") checkout.setDiscountValue(0);
    else if (kind === "giftSale") checkout.setGiftSale({ amount: GIFT_SALE_START, recipientName: "", recipientContact: "" });
    else setPicking(kind);
  };
  const pick = (value: string) => {
    if (picking === "service") checkout.addService(value);
    else if (picking === "product") checkout.addProduct(value);
    else if (picking === "visit") checkout.addExtra(value);
    setPicking(null);
  };
  const picker =
    picking &&
    {
      service: { options: serviceOptions(checkout, appointment, ctx), placeholder: t("calendar.checkout.addService"), search: t("calendar.create.searchServices") },
      product: { options: productOptions(ctx), placeholder: t("calendar.checkout.addProduct"), search: undefined },
      visit: { options: visitOptions(checkout, ctx), placeholder: t("calendar.checkout.addAppointment"), search: t("calendar.checkout.addAppointmentSearch") },
    }[picking];

  return (
    <div className="flex flex-col gap-4" data-testid="checkout-bill">
      <BillLine checkout={checkout} ctx={ctx} editing={editing} onToggle={() => setEditing((current) => !current)} />
      {editing && (
        <>
          <VisitSection checkout={checkout} appointment={appointment} ctx={ctx} />
          <ServicesSection checkout={checkout} ctx={ctx} />
          <ProductsSection checkout={checkout} ctx={ctx} />
        </>
      )}
      {checkout.discountValue !== null && <DiscountField checkout={checkout} ctx={ctx} />}
      {checkout.giftSale && <GiftSaleField checkout={checkout} ctx={ctx} />}
      {picker ? (
        <SearchableSelect defaultOpen value="" options={picker.options} placeholder={picker.placeholder} searchPlaceholder={picker.search} onValueChange={pick} onOpenChange={(open) => !open && setPicking(null)} />
      ) : (
        <AddMenu checkout={checkout} onAdd={add} className="w-full border-dashed" />
      )}
    </div>
  );
}

/** La cuenta en una línea —qué se cobra y, debajo, cuánto— con el lápiz para editarla (y el visto para cerrarla). */
function BillLine({ checkout, ctx, editing, onToggle }: { checkout: CheckoutController; ctx: ModelContext; editing: boolean; onToggle: () => void }) {
  const { t, bill } = checkout;
  const products = checkout.products.flatMap((line) => {
    const product = ctx.catalog.products.find((item) => item.id === line.productId);
    return product ? [line.qty > 1 ? `${product.name} × ${line.qty}` : product.name] : [];
  });
  const names = [checkout.services.map((service) => service.name).join(" + "), ...products];
  const count = checkout.services.length + checkout.together.length + checkout.products.reduce((sum, line) => sum + line.qty, 0);
  const others = checkout.together.length > 0 ? ` · ${t("calendar.checkout.togetherCount", { count: checkout.together.length })}` : "";
  return (
    <ListItemGroup data-testid="checkout-bill-line">
      <ListItem
        leading={<ServiceThumb service={checkout.services[0]} />}
        title={names.filter(Boolean).join(" · ")}
        description={`${t("calendar.checkout.summary.items", { count })} · ${ctx.formatMoney(bill.subtotal - bill.discount)}${others}`}
        actions={
          <Button type="button" variant="ghost" size="icon-sm" onClick={onToggle} aria-expanded={editing} aria-label={t(editing ? "calendar.checkout.summary.done" : "calendar.checkout.summary.edit")} title={t(editing ? "calendar.checkout.summary.done" : "calendar.checkout.summary.edit")} data-testid="checkout-summary-edit">
            {editing ? <Check /> : <Pencil />}
          </Button>
        }
      />
    </ListItemGroup>
  );
}
