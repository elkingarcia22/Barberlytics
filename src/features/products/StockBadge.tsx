import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "./inventory";

const STATUS_BADGE: Readonly<Record<StockStatus, "positive" | "warning" | "negative">> = { ok: "positive", low: "warning", out: "negative" };

/** Disponible, por reponer o agotado, con el tono de su estado. */
export function StockBadge({ status, label }: { status: StockStatus; label: string }) {
  return <Badge variant={STATUS_BADGE[status]}>{label}</Badge>;
}
