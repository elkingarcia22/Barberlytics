import * as React from "react";
import { Loader2, Paperclip, X } from "lucide-react";
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
import { useCreateExpense, useCreateExpenseCategory, useExpenseCategories, useUpdateExpense } from "./queries";
import { useAccess } from "@/features/access";
import { useBranchToday, useCurrencyInput } from "@/features/branches";
import {
  CATEGORY_KEYS,
  EXPENSE_KIND_KEYS,
  FREQUENCY_KEYS,
  MAX_EXPENSE_ATTACHMENTS,
  PAYMENT_METHOD_KEYS,
  emptyExpenseInput,
  expenseCategorySchema,
  expenseFrequencySchema,
  expenseInputSchema,
  expenseKindSchema,
  expensePaymentMethodSchema,
  inputFromExpense,
  type Expense,
  type ExpenseAttachment,
  type ExpenseFrequency,
  type ExpenseInput,
  type ExpenseKind,
  type ExpensePaymentMethod,
} from "./types";

export interface ExpenseFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con gasto se edita; sin él se registra uno nuevo del tipo `kind`. */
  expense?: Expense | null;
  kind?: ExpenseKind;
  branchId: string;
  /** Un gasto nuevo de este barbero de renta; `null` (por defecto), de la sucursal. */
  ownerMemberId?: string | null;
}

const FORM_ID = "expense-form";
const NO_METHOD = "none";
const MAX_FILE_BYTES = 1_000_000;
const ACCEPTED = "image/png,image/jpeg,image/webp,application/pdf";

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
const KIND_HINT_KEYS: Readonly<Record<ExpenseKind, AppMessageKey>> = { fixed: "expenses.kind.fixedHint", variable: "expenses.kind.variableHint" };

/**
 * Registrar o editar un gasto sin salir de la lista. Un solo formulario para
 * los dos tipos: se elige si es fijo o variable y, si es fijo, cada cuánto
 * se paga —y al momento se lee cuánto pesa en un mes—.
 */
export function ExpenseFormDrawer({ open, onOpenChange, expense = null, kind = "fixed", branchId, ownerMemberId = null }: ExpenseFormDrawerProps) {
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
      {open && <ExpenseFormBody expense={expense} kind={kind} branchId={branchId} ownerMemberId={ownerMemberId} onSubmittingChange={setSubmitting} onDone={() => onOpenChange(false)} />}
    </DrawerShell>
  );
}

/** La opción del selector que abre «Nueva categoría». */
const NEW_CATEGORY = "__nueva";

interface ExpenseFormBodyProps {
  expense: Expense | null;
  kind: ExpenseKind;
  branchId: string;
  ownerMemberId: string | null;
  onSubmittingChange: (submitting: boolean) => void;
  onDone: () => void;
}

type Errors = Partial<Record<keyof ExpenseInput, string>>;

function ExpenseFormBody({ expense, kind, branchId, ownerMemberId, onSubmittingChange, onDone }: ExpenseFormBodyProps) {
  const t = useAppT();
  const formatMoney = useMoney();
  const create = useCreateExpense(branchId, ownerMemberId);
  const update = useUpdateExpense();
  // La moneda y el «hoy» son los de la sucursal: ni un `$` fijo ni el día del dispositivo.
  const money = useCurrencyInput();
  const today = useBranchToday();
  const access = useAccess();
  const customCategories = useExpenseCategories().data?.custom ?? [];
  const createCategory = useCreateExpenseCategory();
  const [newCategory, setNewCategory] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ExpenseInput>(() => (expense ? inputFromExpense(expense) : emptyExpenseInput(kind, today)));
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const set = <K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const message = (value?: string) => (value?.startsWith("expenses.") ? t(value as AppMessageKey) : value);

  const pickKind = (value: ExpenseKind) => setDraft((current) => ({ ...current, kind: value, frequency: value === "fixed" ? (current.frequency ?? "monthly") : null }));

  const isFixed = draft.kind === "fixed";
  const [fileError, setFileError] = React.useState<string | null>(null);
  const addFiles = async (files: FileList | null) => {
    setFileError(null);
    const picked = Array.from(files ?? []);
    if (picked.length === 0) return;
    if (draft.attachments.length + picked.length > MAX_EXPENSE_ATTACHMENTS) return setFileError(t("expenses.form.attachmentsMax", { count: MAX_EXPENSE_ATTACHMENTS }));
    if (picked.some((file) => file.size > MAX_FILE_BYTES)) return setFileError(t("expenses.form.attachmentsSize"));
    try {
      const added: ExpenseAttachment[] = await Promise.all(picked.map(async (file, index) => ({ id: `att_${Date.now().toString(36)}_${index}`, name: file.name, type: file.type, dataUrl: await readAsDataUrl(file) })));
      set("attachments", [...draft.attachments, ...added]);
    } catch {
      setFileError(t("expenses.form.attachmentsRead"));
    }
  };
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
          <NumberField value={Number.isFinite(draft.amount) ? draft.amount : null} onValueChange={(value) => set("amount", value ?? Number.NaN)} min={0} precision={money.decimals} prefix={money.symbol} aria-invalid={!!errors.amount} data-testid="expense-form-amount" />
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

      {isFixed && (
        <Field label={t("expenses.form.dueDay")} description={t("expenses.form.dueDayHint")} error={message(errors.dueDay)}>
          <NumberField value={draft.dueDay} onValueChange={(value) => set("dueDay", value === null ? null : Math.round(value))} min={1} max={31} step={1} size="sm" data-testid="expense-form-due-day" />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t(isFixed ? "expenses.form.startDate" : "expenses.form.date")} required error={message(errors.date)}>
          <Input type="date" value={draft.date} onChange={(event) => set("date", event.target.value)} aria-invalid={!!errors.date} data-testid="expense-form-date" />
        </Field>
        <Field label={t("expenses.form.category")} required>
          <Select value={draft.categoryId} onValueChange={(value) => (value === NEW_CATEGORY ? setNewCategory("") : set("categoryId", value))}>
            <SelectTrigger data-testid="expense-form-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseCategorySchema.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(CATEGORY_KEYS[option])}
                </SelectItem>
              ))}
              {customCategories.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
              {(access.role === "owner" || access.role === "admin") && <SelectItem value={NEW_CATEGORY}>{t("expenses.form.newCategory")}</SelectItem>}
            </SelectContent>
          </Select>
          {newCategory !== null && (
            <div className="mt-2 flex gap-2">
              <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} maxLength={40} placeholder={t("expenses.form.newCategoryPlaceholder")} autoFocus data-testid="expense-form-new-category" />
              <Button
                type="button"
                size="sm"
                disabled={newCategory.trim().length < 2 || createCategory.isPending}
                onClick={() =>
                  createCategory.mutate(newCategory.trim(), {
                    onSuccess: (created) => {
                      set("categoryId", created.id);
                      setNewCategory(null);
                    },
                    onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
                  })
                }
                data-testid="expense-form-new-category-save"
              >
                {t("expenses.form.newCategorySave")}
              </Button>
            </div>
          )}
        </Field>
        <Field label={t("expenses.form.supplier")}>
          <Input value={draft.supplier} onChange={(event) => set("supplier", event.target.value)} maxLength={80} autoComplete="off" data-testid="expense-form-supplier" />
        </Field>
        <Field label={t("expenses.form.paymentMethod")}>
          <Select value={draft.paymentMethod ?? NO_METHOD} onValueChange={(value) => set("paymentMethod", value === NO_METHOD ? null : (value as ExpensePaymentMethod))}>
            <SelectTrigger data-testid="expense-form-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_METHOD}>{t("expenses.method.none")}</SelectItem>
              {expensePaymentMethodSchema.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(PAYMENT_METHOD_KEYS[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label={t("expenses.form.attachments")} description={t("expenses.form.attachmentsHint", { count: MAX_EXPENSE_ATTACHMENTS })} error={fileError ?? message(errors.attachments)}>
        <div className="space-y-2">
          {draft.attachments.map((file) => (
            <div key={file.id} className="flex items-center gap-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-text-muted" aria-hidden />
              <a href={file.dataUrl} download={file.name} className="min-w-0 flex-1 truncate text-text-primary hover:underline">
                {file.name}
              </a>
              <Button type="button" variant="ghost" size="icon-xs" aria-label={t("expenses.form.attachmentsRemove", { name: file.name })} onClick={() => set("attachments", draft.attachments.filter((item) => item.id !== file.id))}>
                <X />
              </Button>
            </div>
          ))}
          {draft.attachments.length < MAX_EXPENSE_ATTACHMENTS && (
            <Input type="file" accept={ACCEPTED} multiple onChange={(event) => void addFiles(event.target.files)} data-testid="expense-form-attachments" />
          )}
        </div>
      </Field>

      <Field label={t("expenses.form.description")} description={t("expenses.form.descriptionHint")}>
        <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
      </Field>
    </form>
  );
}
