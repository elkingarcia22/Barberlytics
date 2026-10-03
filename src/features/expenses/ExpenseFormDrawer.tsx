import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError, isApiError } from "@/lib/api";
import { DrawerShell } from "@/components/overlays";
import { Field, NumberField } from "@/components/forms";
import { CardSelection } from "@/components/selection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMoney } from "@/features/calendar/calendarFormat";
import { monthlyEquivalent } from "./expensesUtils";
import { useCreateExpense, useUpdateExpense } from "./queries";
import { EXPENSE_KIND_KEYS, FREQUENCY_KEYS, emptyExpenseInput, expenseFrequencySchema, expenseInputSchema, expenseKindSchema, inputFromExpense, type Expense, type ExpenseFrequency, type ExpenseInput, type ExpenseKind } from "./types";

export interface ExpenseFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con gasto se edita; sin él se registra uno nuevo del tipo `kind`. */
  expense?: Expense | null;
  kind?: ExpenseKind;
  branchId: string;
}

const FORM_ID = "expense-form";
const KIND_HINT_KEYS: Readonly<Record<ExpenseKind, AppMessageKey>> = { fixed: "expenses.kind.fixedHint", variable: "expenses.kind.variableHint" };

/**
 * Registrar o editar un gasto sin salir de la lista. Un solo formulario para
 * los dos tipos: se elige si es fijo o variable y, si es fijo, cada cuánto
 * se paga —y al momento se lee cuánto pesa en un mes—.
 */
export function ExpenseFormDrawer({ open, onOpenChange, expense = null, kind = "fixed", branchId }: ExpenseFormDrawerProps) {
  const t = useAppT();
  const isEdit = expense !== null;
  const [submitting, setSubmitting] = React.useState(false);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={t(isEdit ? "expenses.form.editTitle" : "expenses.form.createTitle")}
      description={t(isEdit ? "expenses.form.editHint" : "expenses.form.createHint")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting} data-testid="expense-form-submit">
            {submitting && <Loader2 className="animate-spin" />}
            {t(isEdit ? "expenses.form.save" : "expenses.form.create")}
          </Button>
        </>
      }
    >
      {/* El cuerpo se monta al abrir: cada apertura arranca limpia. */}
      {open && <ExpenseFormBody expense={expense} kind={kind} branchId={branchId} onSubmittingChange={setSubmitting} onDone={() => onOpenChange(false)} />}
    </DrawerShell>
  );
}

interface ExpenseFormBodyProps {
  expense: Expense | null;
  kind: ExpenseKind;
  branchId: string;
  onSubmittingChange: (submitting: boolean) => void;
  onDone: () => void;
}

type Errors = Partial<Record<keyof ExpenseInput, string>>;

function ExpenseFormBody({ expense, kind, branchId, onSubmittingChange, onDone }: ExpenseFormBodyProps) {
  const t = useAppT();
  const formatMoney = useMoney();
  const create = useCreateExpense(branchId);
  const update = useUpdateExpense();
  const [draft, setDraft] = React.useState<ExpenseInput>(() => (expense ? inputFromExpense(expense) : emptyExpenseInput(kind)));
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const set = <K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const message = (value?: string) => (value?.startsWith("expenses.") ? t(value as AppMessageKey) : value);

  const pickKind = (value: ExpenseKind) => setDraft((current) => ({ ...current, kind: value, frequency: value === "fixed" ? (current.frequency ?? "monthly") : null }));

  const isFixed = draft.kind === "fixed";
  const monthly = Number.isFinite(draft.amount) ? monthlyEquivalent(draft) : null;
  const frequencyHint = monthly === null || draft.frequency === "monthly" ? t("expenses.form.frequencyHint") : t("expenses.form.monthlyEquivalent", { amount: formatMoney(monthly) });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = expenseInputSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ExpenseInput;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    onSubmittingChange(true);
    try {
      if (expense) {
        const updated = await update.mutateAsync({ id: expense.id, input: parsed.data });
        toast.success(t("expenses.form.saved"), { description: updated.name });
      } else {
        const created = await create.mutateAsync(parsed.data);
        toast.success(t("expenses.form.created"), { description: created.name });
      }
      onDone();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([name, messages]) => [name, messages[0]])) as Errors);
      else setFormError(describeError(error).description);
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate className="space-y-5" data-testid="expense-form">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* El tipo solo se elige al registrar: fijo y variable se cuentan distinto y un gasto no cambia de uno a otro. */}
      {expense === null && (
        <Field label={t("expenses.form.kind")} required>
          <CardSelection columns={2} value={draft.kind} onChange={(value) => pickKind(value as ExpenseKind)} options={expenseKindSchema.options.map((option) => ({ value: option, label: t(EXPENSE_KIND_KEYS[option]), description: t(KIND_HINT_KEYS[option]) }))} />
        </Field>
      )}

      <Field label={t("expenses.form.name")} required error={message(errors.name)}>
        <Input value={draft.name} onChange={(event) => set("name", event.target.value)} autoComplete="off" aria-invalid={!!errors.name} data-testid="expense-form-name" />
      </Field>

      <div className={isFixed ? "grid gap-4 sm:grid-cols-2" : undefined}>
        <Field label={t("expenses.form.amount")} required error={message(errors.amount)}>
          <NumberField value={Number.isFinite(draft.amount) ? draft.amount : null} onValueChange={(value) => set("amount", value ?? Number.NaN)} min={0} precision={2} prefix="$" aria-invalid={!!errors.amount} data-testid="expense-form-amount" />
        </Field>
        {isFixed && (
          <Field label={t("expenses.form.frequency")} required error={message(errors.frequency)} description={frequencyHint}>
            <Select value={draft.frequency ?? ""} onValueChange={(value) => set("frequency", value as ExpenseFrequency)}>
              <SelectTrigger aria-invalid={!!errors.frequency} data-testid="expense-form-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseFrequencySchema.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(FREQUENCY_KEYS[option])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      <Field label={t("expenses.form.description")} description={t("expenses.form.descriptionHint")}>
        <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
      </Field>
    </form>
  );
}
