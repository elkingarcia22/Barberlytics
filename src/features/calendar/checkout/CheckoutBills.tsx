import * as React from "react";
import { SearchableSelect } from "@/components/forms";
import type { ModelContext } from "../calendarModel";
import type { Appointment } from "../types";
import { AddMenu, type AddKind } from "./AddMenu";
import { productOptions, serviceOptions, visitOptions } from "./addOptions";
import { DiscountField, GiftSaleField, ProductsSection, ServicesSection, VisitSection } from "./BillSection";
import { CouponField } from "./CouponField";
import type { CheckoutController } from "./useCheckout";

/**
 * Lo que se cobra, cada cosa en su sección —las citas que van juntas, los
 * servicios y los productos—, donde se cambia el precio o la cantidad y se
 * quita. Lo ocasional sale de «Agregar»: un servicio, un producto u otra cita
 * se eligen en un buscador que ocupa el sitio del botón y, al elegir, quedan
 * como una fila más en su sección y el buscador se va; el descuento y la
 * tarjeta de regalo que se vende abren su campo.
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
  const [picking, setPicking] = React.useState<PickKind | null>(null);

  const add = (kind: AddKind) => {
    if (kind === "discount") checkout.setDiscountValue(0);
    else if (kind === "coupon") checkout.setCouponOpen(true);
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
      <VisitSection checkout={checkout} appointment={appointment} ctx={ctx} />
      <ServicesSection checkout={checkout} ctx={ctx} />
      <ProductsSection checkout={checkout} ctx={ctx} />
      {checkout.discountValue !== null && !checkout.coupon && <DiscountField checkout={checkout} ctx={ctx} />}
      {(checkout.coupon || checkout.couponOpen) && <CouponField checkout={checkout} ctx={ctx} />}
      {checkout.giftSale && <GiftSaleField checkout={checkout} ctx={ctx} />}
      {picker ? (
        <SearchableSelect defaultOpen value="" options={picker.options} placeholder={picker.placeholder} searchPlaceholder={picker.search} onValueChange={pick} onOpenChange={(open) => !open && setPicking(null)} />
      ) : (
        <AddMenu checkout={checkout} onAdd={add} className="w-full border-dashed" />
      )}
    </div>
  );
}
