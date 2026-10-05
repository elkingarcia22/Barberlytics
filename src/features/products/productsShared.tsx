import { Globe, Lock, Package, ShoppingBag, Wrench } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/utility";
import { PRODUCT_VISIBILITY_KEYS, type ProductVisibility } from "./types";

/** Las piezas chicas del módulo de productos: el icono y las insignias de estado, venta y reserva. */

/** La foto del producto y, mientras no hay o no carga, el icono. */
export function ProductGlyph({ size = "md", imageUrl }: { size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  return <IconTile icon={<Package />} tone="neutral" size={size} src={imageUrl} />;
}

export function ProductActiveBadge({ active }: { active: boolean }) {
  const t = useAppT();
  return <StatusBadge status={active ? "active" : "inactive"} label={t(active ? "products.status.active" : "products.status.inactive")} />;
}

/** Si el equipo lo puede vender o es de uso interno de la barbería. */
export function SellableBadge({ sellable }: { sellable: boolean }) {
  const t = useAppT();
  const Icon = sellable ? ShoppingBag : Wrench;
  return (
    <Badge variant={sellable ? "positive" : "neutral"}>
      <Icon className="size-3" aria-hidden /> {t(sellable ? "products.sellable.yes" : "products.sellable.no")}
    </Badge>
  );
}

export function ProductVisibilityBadge({ visibility }: { visibility: ProductVisibility }) {
  const t = useAppT();
  const Icon = visibility === "public" ? Globe : Lock;
  return (
    <Badge variant={visibility === "public" ? "info" : "neutral"}>
      <Icon className="size-3" aria-hidden /> {t(PRODUCT_VISIBILITY_KEYS[visibility])}
    </Badge>
  );
}
