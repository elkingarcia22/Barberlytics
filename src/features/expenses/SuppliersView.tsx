import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { RowActionsMenu } from "@/components/data-display";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Field } from "@/components/forms";
import { ConfirmDialog, ModalShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useSupplierActions, useSuppliers, type Supplier, type SupplierInput } from "./suppliers";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const EMPTY: SupplierInput = { name: "", taxId: "", phone: "", email: "", categoryId: null, notes: "" };

/**
 * Gastos › Proveedores: a quién se le paga, con su identificación fiscal y su contacto, cuánto se le paga al mes (fijos
 * llevados al mes y variables de los últimos 90 días), el último gasto y lo pendiente del mes. «Ver sus gastos» filtra la
 * lista por su nombre.
 */
export function SuppliersView({ branchId, ownerMemberId, canDelete, onSeeExpenses }: { branchId: string; ownerMemberId: string | null; canDelete: boolean; onSeeExpenses: (name: string) => void }) {
  const t = useAppT();
  const query = useSuppliers(branchId, ownerMemberId);
  const [editing, setEditing] = React.useState<Supplier | "new" | null>(null);
  const [removing, setRemoving] = React.useState<Supplier | null>(null);
  const { remove } = useSupplierActions();

  return (
    <div className="space-y-stack" data-testid="expenses-suppliers">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")} data-testid="supplier-new">
          <Plus /> {t("expenses.suppliers.new")}
        </Button>
      </div>
      <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full rounded-2xl" />} empty={{ when: (data) => data.items.length === 0, render: <EmptyState icon="building" title={t("expenses.suppliers.emptyTitle")} description={t("expenses.suppliers.emptyHint")} /> }}>
        {(data) => (
          <ListItemGroup>
            {data.items.map((supplier) => (
              <SupplierRow key={supplier.id} supplier={supplier} onEdit={() => setEditing(supplier)} onRemove={canDelete ? () => setRemoving(supplier) : undefined} onSeeExpenses={() => onSeeExpenses(supplier.name)} />
            ))}
          </ListItemGroup>
        )}
      </QueryBoundary>
      <SupplierDialog key={editing === "new" ? "new" : (editing?.id ?? "none")} supplier={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        variant="destructive"
        title={t("expenses.suppliers.removeTitle", { name: removing?.name ?? "" })}
        description={t("expenses.suppliers.removeHint")}
        confirmLabel={t("expenses.suppliers.remove")}
        loading={remove.isPending}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success(t("expenses.suppliers.removed"));
              setRemoving(null);
            },
            onError: (error) => toast.error(describeError(error).description),
          })
        }
      />
    </div>
  );
}

function SupplierRow({ supplier, onEdit, onRemove, onSeeExpenses }: { supplier: Supplier; onEdit: () => void; onRemove?: () => void; onSeeExpenses: () => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const formatMoney = useMoney();
  const contact = [supplier.taxId, supplier.phone, supplier.email].filter(Boolean).join(" · ");
  const facts = [
    supplier.expenses > 0 ? t("expenses.suppliers.count", { count: supplier.expenses }) : t("expenses.suppliers.none"),
    supplier.lastDate ? t("expenses.suppliers.last", { date: formatDate(new Date(`${supplier.lastDate}T12:00:00`), DAY) }) : null,
    supplier.pending > 0 ? t("expenses.suppliers.pending", { amount: formatMoney(supplier.pending) }) : null,
  ].filter(Boolean);
  return (
    <ListItem
      title={supplier.name}
      description={[contact, facts.join(" · ")].filter(Boolean).join(" — ")}
      meta={
        supplier.perMonth > 0 ? (
          <span className="text-right">
            <span className="block font-semibold tabular-nums text-text-primary">{formatMoney(supplier.perMonth)}</span>
            <span className="text-xs text-text-muted">{t("expenses.suppliers.perMonth")}</span>
          </span>
        ) : undefined
      }
      actions={
        <RowActionsMenu
          rowLabel={supplier.name}
          actions={[
            { id: "expenses", label: t("expenses.suppliers.seeExpenses"), onSelect: onSeeExpenses },
            { id: "edit", label: t("expenses.suppliers.edit"), icon: <Pencil />, onSelect: onEdit },
            ...(onRemove ? [{ id: "remove", label: t("expenses.suppliers.remove"), icon: <Trash2 />, tone: "danger" as const, onSelect: onRemove }] : []),
          ]}
        />
      }
    />
  );
}

function SupplierDialog({ supplier, onClose }: { supplier: Supplier | "new" | null; onClose: () => void }) {
  const t = useAppT();
  const { create, update } = useSupplierActions();
  const current = supplier && supplier !== "new" ? supplier : null;
  const [draft, setDraft] = React.useState<SupplierInput>(current ? { name: current.name, taxId: current.taxId, phone: current.phone, email: current.email, categoryId: current.categoryId, notes: current.notes } : EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const set = <K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) => setDraft((prev) => ({ ...prev, [key]: value }));
  const pending = create.isPending || update.isPending;
  const save = () => {
    setErrors({});
    const done = {
      onSuccess: () => {
        toast.success(t(current ? "expenses.suppliers.updated" : "expenses.suppliers.created"));
        onClose();
      },
      onError: (error: unknown) => {
        const fields = isApiError(error) ? error.fieldErrors : undefined;
        if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0] ?? ""])));
        else toast.error(describeError(error).description);
      },
    };
    if (current) update.mutate({ id: current.id, input: draft }, done);
    else create.mutate(draft, done);
  };
  return (
    <ModalShell
      open={supplier !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t(current ? "expenses.suppliers.edit" : "expenses.suppliers.new")}
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={pending || draft.name.trim().length < 2} data-testid="supplier-save">
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("expenses.suppliers.name")} required error={errors.name} className="sm:col-span-2">
          <Input value={draft.name} onChange={(event) => set("name", event.target.value)} maxLength={80} data-testid="supplier-name" />
        </Field>
        <Field label={t("expenses.suppliers.taxId")}>
          <Input value={draft.taxId} onChange={(event) => set("taxId", event.target.value)} maxLength={30} />
        </Field>
        <Field label={t("expenses.suppliers.phone")}>
          <Input value={draft.phone} onChange={(event) => set("phone", event.target.value)} inputMode="tel" maxLength={30} />
        </Field>
        <Field label={t("expenses.suppliers.email")} error={errors.email} className="sm:col-span-2">
          <Input type="email" value={draft.email} onChange={(event) => set("email", event.target.value)} maxLength={120} />
        </Field>
        <Field label={t("expenses.suppliers.notes")} className="sm:col-span-2">
          <Textarea value={draft.notes} onChange={(event) => set("notes", event.target.value)} rows={2} maxLength={300} />
        </Field>
      </div>
      <Text size="xs" tone="muted" className="mt-3">
        {t("expenses.suppliers.dialogHint")}
      </Text>
    </ModalShell>
  );
}
