import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, NumberField } from "@/components/forms";
import { SegmentedControl } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/typography";
import { useAddAdjustment, useRemoveAdjustment } from "./queries";
import { ADJUSTMENT_KEYS, ADJUSTMENT_VIEW_KEYS, adjustmentKindSchema, type AdjustmentKind, type PayrollMember } from "./types";

export interface PayrollAdjustmentsProps {
  member: PayrollMember;
  period: { branchId: string; from: string; to: string };
  /** Aprobado o pagado: los ajustes se ven pero no se cambian. */
  locked: boolean;
  canManage: boolean;
  formatMoney: (value: number) => string;
}

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const MIN_NOTE = 3;

/**
 * Lo que no sale de las citas: un bono, un descuento (un faltante de caja, producto que usó) o un
 * adelanto que ya se le dio. Cada uno con su motivo y quién lo puso; entran en el neto del periodo.
 */
export function PayrollAdjustments({ member, period, locked, canManage, formatMoney }: PayrollAdjustmentsProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const add = useAddAdjustment();
  const remove = useRemoveAdjustment();
  const [kind, setKind] = React.useState<AdjustmentKind>("bonus");
  const [amount, setAmount] = React.useState<number | null>(null);
  const [note, setNote] = React.useState("");
  const adjustments = member.adjustments ?? [];
  const editable = canManage && !locked;
  const valid = (amount ?? 0) > 0 && note.trim().length >= MIN_NOTE;

  const submit = () => {
    if (!valid || amount === null) return;
    add.mutate(
      { ...period, memberId: member.memberId, kind, amount, note: note.trim() },
      {
        onSuccess: () => {
          setAmount(null);
          setNote("");
          toast.success(t("payroll.adjustment.added"));
        },
      }
    );
  };

  return (
    <section aria-label={t("payroll.adjustment.title")} className="space-y-3" data-testid="payroll-adjustments">
      <div>
        <Text variant="label">{t("payroll.adjustment.title")}</Text>
        <Text variant="muted">{locked ? t("payroll.adjustment.locked") : t("payroll.adjustment.hint")}</Text>
      </div>
      {adjustments.length === 0 ? (
        <Text variant="muted">{t("payroll.adjustment.empty")}</Text>
      ) : (
        <ul className="space-y-2">
          {adjustments.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2" data-testid="payroll-adjustment">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text-primary">
                  {t(ADJUSTMENT_VIEW_KEYS[item.kind])} · {item.note}
                </span>
                <span className="block text-xs text-text-muted">{t("payroll.adjustment.by", { name: item.createdBy, date: formatDate(new Date(item.createdAt), DATE) })}</span>
              </span>
              <span className={item.kind === "bonus" ? "text-sm font-semibold tabular-nums text-text-primary" : "text-sm font-semibold tabular-nums text-status-warning"}>
                {item.kind === "bonus" ? "+" : "−"}
                {formatMoney(item.amount)}
              </span>
              {/* La cuota de un préstamo la pone el sistema: se cancela el préstamo, no la cuota. */}
              {editable && item.kind !== "loan" && (
                <Button variant="ghost" size="icon" aria-label={t("payroll.adjustment.removeAria", { name: item.note })} onClick={() => remove.mutate(item.id)} disabled={remove.isPending}>
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="space-y-3 rounded-xl border border-border/60 p-3">
          <SegmentedControl
            size="sm"
            variant="outline"
            value={kind}
            onChange={(value) => setKind(value as AdjustmentKind)}
            options={adjustmentKindSchema.options.map((value) => ({ value, label: t(ADJUSTMENT_KEYS[value]) }))}
            ariaLabel={t("payroll.adjustment.kind")}
          />
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <Field label={t("payroll.adjustment.amount")} required>
              <NumberField value={amount} onValueChange={setAmount} min={0} precision={2} data-testid="payroll-adjustment-amount" />
            </Field>
            <Field label={t("payroll.adjustment.note")} required>
              <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("payroll.adjustment.notePlaceholder")} autoComplete="off" data-testid="payroll-adjustment-note" />
            </Field>
          </div>
          <Button size="sm" onClick={submit} disabled={!valid || add.isPending} data-testid="payroll-adjustment-add">
            <Plus /> {t("payroll.adjustment.add")}
          </Button>
        </div>
      )}
    </section>
  );
}
