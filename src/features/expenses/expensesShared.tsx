import { CalendarSync, Receipt } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/utility";
import { EXPENSE_KIND_KEYS, type ExpenseKind } from "./types";

/** Las piezas chicas del módulo de gastos: el icono y la insignia por tipo. */

export function ExpenseGlyph({ kind, size = "md" }: { kind: ExpenseKind; size?: "sm" | "md" | "lg" }) {
  return <IconTile icon={kind === "fixed" ? <CalendarSync /> : <Receipt />} tone={kind === "fixed" ? "primary" : "neutral"} size={size} />;
}

export function ExpenseKindBadge({ kind }: { kind: ExpenseKind }) {
  const t = useAppT();
  return <Badge variant={kind === "fixed" ? "default" : "neutral"}>{t(EXPENSE_KIND_KEYS[kind])}</Badge>;
}
