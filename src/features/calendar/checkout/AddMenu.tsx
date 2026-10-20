import * as React from "react";
import { CalendarPlus, Gift, Package, Percent, Plus, Scissors, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CheckoutController } from "./useCheckout";

/** Lo que el botón «Agregar» suma a la cuenta. */
export type AddKind = "service" | "product" | "visit" | "discount" | "coupon" | "giftSale";

/**
 * «Agregar»: lo que no hace falta casi nunca, a un toque y fuera de la vista
 * hasta que se pide —otro servicio, un producto, otra cita sin cobrar (que se
 * enlaza), un descuento o vender una tarjeta de regalo—. Lo elegido aparece
 * en la cuenta; lo que ya está (el descuento, la tarjeta) deja de ofrecerse.
 *
 * Lo elegido se suma cuando el menú termina de cerrarse (`onCloseAutoFocus`):
 * antes, el menú todavía guarda el foco y cerraría la lista que se abre sola.
 */
export function AddMenu({ checkout, onAdd, className }: { checkout: CheckoutController; onAdd: (kind: AddKind) => void; className?: string }) {
  const { t } = checkout;
  const pending = React.useRef<AddKind | null>(null);
  const items: { kind: AddKind; icon: typeof Plus; show: boolean }[] = [
    { kind: "service", icon: Scissors, show: true },
    { kind: "product", icon: Package, show: true },
    { kind: "visit", icon: CalendarPlus, show: checkout.candidates.length > checkout.extras.length },
    { kind: "discount", icon: Percent, show: checkout.discountValue === null && !checkout.coupon },
    { kind: "coupon", icon: Ticket, show: !checkout.coupon && !checkout.couponOpen },
    { kind: "giftSale", icon: Gift, show: !checkout.giftSale },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="lg" className={className} data-testid="checkout-add">
          <Plus /> {t("calendar.checkout.add.button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
        onCloseAutoFocus={(event) => {
          const kind = pending.current;
          if (!kind) return;
          event.preventDefault();
          pending.current = null;
          onAdd(kind);
        }}
      >
        {items
          .filter((item) => item.show)
          .map(({ kind, icon: Icon }) => (
            <DropdownMenuItem key={kind} onSelect={() => (pending.current = kind)} data-testid={`checkout-add-${kind}`}>
              <Icon className="size-4" /> {t(`calendar.checkout.add.${kind}`)}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
