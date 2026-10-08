import { useAppT } from "@/app/i18n";
import { NumberField } from "@/components/forms";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import type { BookingProduct } from "../types";
import { useBookingFlow } from "./BookingContext";

const MAX_QTY = 9;

/**
 * Lo que ya va en la reserva, se haya sumado desde el carrusel o desde el
 * catálogo completo: una fila por producto con su cantidad (a cero se quita).
 * Sin esto, lo elegido en «Ver todos» no se veía en ningún sitio al cerrar.
 */
export function PickedProducts({ products }: { products: readonly BookingProduct[] }) {
  const t = useAppT();
  const { state, dispatch, fmt } = useBookingFlow();
  const picked = products.filter((product) => (state.products[product.id] ?? 0) > 0);
  if (picked.length === 0) return null;
  const count = picked.reduce((sum, product) => sum + (state.products[product.id] ?? 0), 0);
  const amount = picked.reduce((sum, product) => sum + product.price * (state.products[product.id] ?? 0), 0);

  return (
    <div aria-labelledby="picked-title" role="group" className="flex flex-col rounded-2xl border border-primary/40 bg-primary/5">
      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
        <Text id="picked-title" size="sm" weight="semibold" className="flex items-center gap-1.5">
          <ThemaIcon name="check" size="sm" tone="primary" />
          {t("booking.review.pickedTitle")}
        </Text>
        <Text size="sm" tone="secondary" tabular>
          {t("booking.products.selected", { count, amount: fmt.money(amount) })}
        </Text>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {picked.map((product) => {
          const qty = state.products[product.id] ?? 0;
          return (
            <li key={product.id} className="flex items-center gap-3 px-4 py-2.5">
              <IconTile size="md" src={product.imageUrl} icon={<ThemaIcon name="layers" />} />
              <div className="flex min-w-0 flex-1 flex-col">
                <Text size="sm" weight="medium" className="truncate">
                  {product.name}
                </Text>
                <Text size="xs" tone="secondary" tabular>
                  {fmt.money(product.price * qty)}
                </Text>
              </div>
              <NumberField
                size="sm"
                stepper="sides"
                min={0}
                max={MAX_QTY}
                value={qty}
                onValueChange={(value) => dispatch({ type: "setProduct", productId: product.id, qty: value ?? 0 })}
                aria-label={product.name}
                className="w-28 shrink-0"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
