import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { STOCK_REASON_KEYS, useSetStockMin, useStockMovements, type StockItem } from "./inventory";

export interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  item: StockItem;
  /** Cambiar el mínimo es de quien edita el catálogo. */
  canEdit: boolean;
}

const WHEN: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
};

/** De dónde salen las existencias de un producto: cada venta, entrada, conteo y merma, con quién y cuándo. */
export function StockHistoryDialog({ open, onOpenChange, branchId, item, canEdit }: StockHistoryDialogProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const movements = useStockMovements(branchId, open ? item.productId : null);
  const setMin = useSetStockMin(branchId);
  const [min, setMinValue] = React.useState(String(item.min));
  const parsed = Number(min);
  const minValid = min !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed !== item.min;

  const saveMin = () =>
    setMin.mutate(
      { productId: item.productId, min: parsed },
      {
        onSuccess: () => toast.success(t("inventory.history.minSaved", { count: parsed })),
        onError: (error) =>
          toast.error(describeError(error).title, {
            description: describeError(error).description,
          }),
      }
    );

  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title={item.name} description={t("inventory.history.description", { count: item.onHand })} size="md">
      <div className="space-y-section">
        {canEdit && (
          <div className="flex items-end gap-2">
            <Field label={t("inventory.column.min")} description={t("inventory.history.minHint")} className="flex-1">
              <Input type="number" inputMode="numeric" min={0} step={1} value={min} onChange={(event) => setMinValue(event.target.value)} data-testid="stock-min" />
            </Field>
            <Button variant="outline" onClick={saveMin} disabled={!minValid || setMin.isPending} data-testid="stock-min-save">
              {t("common.save")}
            </Button>
          </div>
        )}
        <section aria-label={t("inventory.history.title")} className="space-y-2">
          <Text variant="label">{t("inventory.history.title")}</Text>
          {movements.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (movements.data?.items.length ?? 0) === 0 ? (
            <Text variant="muted">{t("inventory.history.empty")}</Text>
          ) : (
            <ul className="divide-y divide-border/60 text-sm" data-testid="stock-movements">
              {movements.data?.items.map((movement) => (
                <li key={movement.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="text-text-primary">{t(STOCK_REASON_KEYS[movement.reason])}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {formatDate(new Date(movement.at), WHEN)} · {movement.by}
                      {movement.note ? ` · ${movement.note}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className={cn("font-semibold", movement.delta < 0 ? "text-status-negative" : "text-status-positive")}>{movement.delta > 0 ? `+${movement.delta}` : movement.delta}</span>
                    <span className="block text-xs text-text-muted">{t("inventory.history.left", { count: movement.onHand })}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ModalShell>
  );
}
