import { useAppT } from "@/app/i18n";
import { NumberField } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { BookingProduct } from "../types";
import { useBookingFlow } from "./BookingContext";

const MAX_QTY = 9;

/**
 * Un producto de la tienda, con su foto y el botón para sumarlo; ya en la
 * reserva, el mismo hueco se vuelve un contador. Lo usan el carrusel del
 * resumen y el catálogo completo, así se ve igual en los dos.
 */
export function ProductCard({ product }: { product: BookingProduct }) {
  const t = useAppT();
  const { state, dispatch, fmt } = useBookingFlow();
  const qty = state.products[product.id] ?? 0;
  const setQty = (value: number) => dispatch({ type: "setProduct", productId: product.id, qty: value });

  return (
    <div className={cn("flex h-full flex-col gap-3 rounded-2xl border bg-surface p-3 transition-colors duration-fast", qty > 0 ? "border-primary" : "border-border")}>
      <IconTile size="xl" src={product.imageUrl} icon={<ThemaIcon name="layers" />} />
      <div className="flex flex-1 flex-col gap-0.5">
        <Text size="sm" weight="medium" className="line-clamp-2">
          {product.name}
        </Text>
        <Text size="sm" tone="secondary" tabular>
          {fmt.money(product.price)}
        </Text>
      </div>
      {qty === 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setQty(1)} aria-label={`${t("booking.review.add")} ${product.name}`}>
          <ThemaIcon name="plus" />
          {t("booking.review.add")}
        </Button>
      ) : (
        <NumberField size="sm" stepper="sides" min={0} max={MAX_QTY} value={qty} onValueChange={(value) => setQty(value ?? 0)} aria-label={product.name} />
      )}
    </div>
  );
}
