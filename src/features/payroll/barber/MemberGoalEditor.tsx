import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Field, NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { useCurrencyInput } from "@/features/branches/useBranchMoney";
import { useMemberGoal, useSetMemberGoal, type MemberGoalInput } from "../barberPay";

/**
 * La meta de una persona por ciclo de pago, desde su panel de Nómina: ventas de servicios, de productos y % de clientes
 * que dejan la siguiente cita. Lo que se deja vacío no se mide; todo vacío quita la meta. El barbero la ve en su pago.
 */
export function MemberGoalEditor({ branchId, memberId, formatMoney }: { branchId: string; memberId: string; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const { symbol } = useCurrencyInput();
  const query = useMemberGoal(branchId, memberId);
  const save = useSetMemberGoal(branchId, memberId);
  const goal = query.data?.goal ?? null;
  const [draft, setDraft] = React.useState<MemberGoalInput | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const value = draft ?? { serviceSales: goal?.serviceSales ?? null, productSales: goal?.productSales ?? null, rebookRate: goal?.rebookRate ?? null };
  const set = (key: keyof MemberGoalInput, next: number | null) => setDraft({ ...value, [key]: next });

  const submit = () => {
    setErrors({});
    save.mutate(value, {
      onSuccess: () => {
        toast.success(t("payroll.goal.saved"));
        setDraft(null);
      },
      onError: (error) => {
        const fields = isApiError(error) ? error.fieldErrors : undefined;
        if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0] ?? ""])));
        else toast.error(describeError(error).description);
      },
    });
  };

  return (
    <section aria-label={t("payroll.goal.editTitle")} className="space-y-3" data-testid="member-goal-editor">
      <div>
        <Text variant="label">{t("payroll.goal.editTitle")}</Text>
        <Text size="xs" tone="muted">
          {query.data ? t("payroll.goal.editHint", { sales: formatMoney(query.data.progress.serviceSales), rebook: query.data.progress.rebookRate }) : null}
        </Text>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("payroll.goal.serviceSales")} error={errors.serviceSales}>
          <NumberField value={value.serviceSales} onValueChange={(next) => set("serviceSales", next)} min={0} precision={0} prefix={symbol} data-testid="member-goal-services" />
        </Field>
        <Field label={t("payroll.goal.productSales")} error={errors.productSales}>
          <NumberField value={value.productSales} onValueChange={(next) => set("productSales", next)} min={0} precision={0} prefix={symbol} />
        </Field>
        <Field label={t("payroll.goal.rebookRate")} error={errors.rebookRate}>
          <NumberField value={value.rebookRate} onValueChange={(next) => set("rebookRate", next)} min={0} max={100} precision={0} suffix="%" />
        </Field>
      </div>
      <Button size="sm" variant="outline" onClick={submit} disabled={save.isPending || draft === null} data-testid="member-goal-save">
        {t("payroll.goal.save")}
      </Button>
    </section>
  );
}
