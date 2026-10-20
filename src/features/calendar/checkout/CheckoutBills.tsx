import * as React from "react";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Button } from "@/components/ui/button";
import type { ModelContext } from "../calendarModel";
import { ServiceThumb } from "../calendarShared";
import type { Appointment } from "../types";
import { AddMenu } from "./AddMenu";
import { BillSection, DiscountField, GiftSaleField, ProductsSection, ServicesSection, VisitSection } from "./BillSection";
import type { AddKind, CheckoutVersion } from "./checkoutVersion";
import { OrderCard } from "./OrderCard";
import type { CheckoutController } from "./useCheckout";

/**
 * Lo que se cobra, según la versión del cobro. «Actual» lo pone todo a la
 * vista (con los enlaces del descuento y la tarjeta). Las otras tres dejan a
 * la vista solo lo de casi siempre —los servicios de la cita— y lo demás sale
 * del botón «Agregar»: lo que se elige aparece en su sitio. «Resumen» además
 * cierra la cuenta en una línea (se abre con «Editar») y «Rápido» la muestra
 * como el ticket, sin campos, con las formas de pago en botones.
 */

interface BillProps {
  version: CheckoutVersion;
  checkout: CheckoutController;
  appointment: Appointment;
  ctx: ModelContext;
}

/** Con qué monto empieza la tarjeta de regalo que se vende desde «Agregar». */
const GIFT_SALE_START = 50;

export function CheckoutBill({ version, checkout, appointment, ctx }: BillProps) {
  const [opened, setOpened] = React.useState<readonly AddKind[]>([]);
  const [editing, setEditing] = React.useState(false);
  // Lo último que se pidió en «Agregar»: su lista se abre sola al aparecer.
  const [justAdded, setJustAdded] = React.useState<AddKind | null>(null);
  const add = (kind: AddKind) => {
    if (kind === "discount") checkout.setDiscountValue(0);
    else if (kind === "giftSale")
      checkout.setGiftSale({
        amount: GIFT_SALE_START,
        recipientName: "",
        recipientContact: "",
      });
    else setOpened((current) => (current.includes(kind) ? current : [...current, kind]));
    setJustAdded(kind);
    setEditing(true);
  };

  if (version === "full") return <FullBill checkout={checkout} appointment={appointment} ctx={ctx} />;

  const sections = <AddedSections checkout={checkout} appointment={appointment} ctx={ctx} opened={opened} justAdded={justAdded} services={version !== "quick" || opened.includes("service")} products={version !== "quick" || opened.includes("product")} />;
  const menu = <AddMenu checkout={checkout} onAdd={add} className="w-full border-dashed" />;

  if (version === "add") {
    return (
      <div className="flex flex-col gap-4" data-testid="checkout-bill">
        {sections}
        {menu}
      </div>
    );
  }

  if (version === "summary") {
    return (
      <div className="flex flex-col gap-4" data-testid="checkout-bill">
        {editing ? (
          <>
            {sections}
            <div className="flex gap-2">
              <AddMenu checkout={checkout} onAdd={add} className="flex-1 border-dashed" />
              <Button type="button" variant="ghost" size="lg" onClick={() => {
                  setJustAdded(null);
                  setEditing(false);
                }} data-testid="checkout-summary-done">
                {checkout.t("calendar.checkout.summary.done")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <BillLine checkout={checkout} ctx={ctx} onEdit={() => setEditing(true)} />
            {menu}
          </>
        )}
      </div>
    );
  }

  // Rápido: lo elegido en «Agregar» se edita arriba; la cuenta es el ticket.
  return (
    <div className="flex flex-col gap-4" data-testid="checkout-bill">
      {sections}
      <OrderCard checkout={checkout} ctx={ctx} appointment={appointment} />
      {menu}
    </div>
  );
}

/** Lo de «Actual»: todas las secciones con sus campos y los enlaces del descuento y la tarjeta. */
function FullBill({ checkout, appointment, ctx }: Omit<BillProps, "version">) {
  const { t } = checkout;
  return (
    <>
      <BillSection checkout={checkout} appointment={appointment} ctx={ctx} />
      {(checkout.discountValue === null || !checkout.giftSale) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {checkout.discountValue === null && (
            <Button type="button" variant="link" size="sm" className="px-0" onClick={() => checkout.setDiscountValue(0)} data-testid="checkout-discount-add">
              {t("calendar.checkout.discount.ask")}
            </Button>
          )}
          {!checkout.giftSale && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0"
              onClick={() =>
                checkout.setGiftSale({
                  amount: GIFT_SALE_START,
                  recipientName: "",
                  recipientContact: "",
                })
              }
              data-testid="checkout-gift-sale-add"
            >
              {t("calendar.checkout.giftSale.ask")}
            </Button>
          )}
        </div>
      )}
      {checkout.discountValue !== null && <DiscountField checkout={checkout} ctx={ctx} />}
      {checkout.giftSale && <GiftSaleField checkout={checkout} ctx={ctx} />}
    </>
  );
}

/** Las secciones que ya tienen algo, y las que se pidieron en «Agregar» con su campo para sumar. En «Rápido», servicios y productos solo si se pidieron: el ticket ya los cuenta. */
function AddedSections({ checkout, appointment, ctx, opened, justAdded, services, products }: Omit<BillProps, "version"> & { opened: readonly AddKind[]; justAdded: AddKind | null; services: boolean; products: boolean }) {
  return (
    <>
      <VisitSection checkout={checkout} appointment={appointment} ctx={ctx} adding={opened.includes("visit")} autoOpen={justAdded === "visit"} />
      {services && <ServicesSection checkout={checkout} appointment={appointment} ctx={ctx} adding={opened.includes("service")} autoOpen={justAdded === "service"} />}
      {products && <ProductsSection checkout={checkout} ctx={ctx} adding={opened.includes("product")} autoOpen={justAdded === "product"} />}
      {checkout.discountValue !== null && <DiscountField checkout={checkout} ctx={ctx} />}
      {checkout.giftSale && <GiftSaleField checkout={checkout} ctx={ctx} />}
    </>
  );
}

/** «Resumen»: la cuenta en una línea —qué se cobra y cuánto— con «Editar» para abrirla. */
function BillLine({ checkout, ctx, onEdit }: { checkout: CheckoutController; ctx: ModelContext; onEdit: () => void }) {
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
        description={`${t("calendar.checkout.summary.items", { count })}${others}`}
        meta={ctx.formatMoney(bill.subtotal - bill.discount)}
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={onEdit} data-testid="checkout-summary-edit">
            {t("calendar.checkout.summary.edit")}
          </Button>
        }
      />
    </ListItemGroup>
  );
}
