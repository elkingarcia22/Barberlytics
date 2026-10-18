import * as React from "react";
import { toast } from "sonner";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MANUAL_KINDS, useMoveStock, type ManualKind, type StockItem } from "./inventory";

export interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  items: readonly StockItem[];
  /** El producto con el que abre (el marcado en la lista), si hay uno. */
  productId: string | null;
  kind: ManualKind;
}

const QTY_KEYS: Readonly<Record<ManualKind, AppMessageKey>> = {
  receive: "inventory.move.qtyReceive",
  count: "inventory.move.qtyCount",
  waste: "inventory.move.qtyOut",
  internal: "inventory.move.qtyOut",
};
const KIND_KEYS: Readonly<Record<ManualKind, AppMessageKey>> = {
  receive: "inventory.reason.receive",
  count: "inventory.reason.count",
  waste: "inventory.reason.waste",
  internal: "inventory.reason.internal",
};
const MIN_NOTE = 3;

/**
 * Lo que mueve el inventario a mano: llegó mercancía, se contó la estantería, se dañó algo o se usó en
 * la barbería. Un conteo escribe cuántas hay y el sistema anota la diferencia; merma y uso interno
 * piden el motivo. Quien lo abre lo monta de nuevo cada vez (`key`), así arranca limpio.
 */
export function StockMovementDialog({ open, onOpenChange, branchId, items, productId, kind: initialKind }: StockMovementDialogProps) {
  const t = useAppT();
  const move = useMoveStock(branchId);
  const [product, setProduct] = React.useState(productId ?? items[0]?.productId ?? "");
  const [kind, setKind] = React.useState<ManualKind>(initialKind);
  const [qty, setQty] = React.useState("");
  const [note, setNote] = React.useState("");

  const current = items.find((item) => item.productId === product);
  const amount = Number(qty);
  const needsNote = kind === "waste" || kind === "internal";
  const valid = product !== "" && qty !== "" && Number.isInteger(amount) && amount >= (kind === "count" ? 0 : 1) && (!needsNote || note.trim().length >= MIN_NOTE);

  const save = () =>
    move.mutate(
      { productId: product, kind, qty: amount, note: note.trim() || undefined },
      {
        onSuccess: (item) => {
          toast.success(t("inventory.move.done"), {
            description: t("inventory.move.doneHint", {
              name: item.name,
              count: item.onHand,
            }),
          });
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(describeError(error).title, {
            description: describeError(error).description,
          }),
      }
    );

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("inventory.move.title")}
      description={
        current
          ? t("inventory.move.current", {
              name: current.name,
              count: current.onHand,
            })
          : undefined
      }
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={!valid || move.isPending} data-testid="stock-move-save">
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("products.column.product")} required>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger data-testid="stock-move-product">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.productId} value={item.productId}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("inventory.move.kind")} required>
          <Select value={kind} onValueChange={(value) => setKind(value as ManualKind)}>
            <SelectTrigger data-testid="stock-move-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_KINDS.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(KIND_KEYS[item])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t(QTY_KEYS[kind])} required description={kind === "count" ? t("inventory.move.countHint") : undefined}>
          <Input type="number" inputMode="numeric" min={kind === "count" ? 0 : 1} step={1} value={qty} onChange={(event) => setQty(event.target.value)} data-testid="stock-move-qty" />
        </Field>
        <Field label={t(needsNote ? "inventory.move.reason" : "inventory.move.note")} required={needsNote}>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={200} data-testid="stock-move-note" />
        </Field>
      </div>
    </ModalShell>
  );
}
