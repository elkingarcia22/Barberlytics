import type * as React from "react";
import { Ban, CircleCheck, Hourglass, Undo2, type LucideIcon } from "lucide-react";
import type { Badge } from "@/components/ui/badge";
import type { AccountStatus } from "./types";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/** Un color y un icono por estado de cuenta: lo pendiente avisa, lo cobrado tranquiliza, lo anulado se apaga. */
export const STATUS_STYLE: Readonly<Record<AccountStatus, { icon: LucideIcon; badge: BadgeVariant }>> = {
  open: { icon: Hourglass, badge: "warning" },
  paid: { icon: CircleCheck, badge: "positive" },
  refunded: { icon: Undo2, badge: "info" },
  void: { icon: Ban, badge: "neutral" },
};
