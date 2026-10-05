import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CalendarSync, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { DataListBlock } from "@/components/blocks";
import { MetricCard, MetricRing, getChartTheme } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useAccess } from "@/features/access";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { ExpenseFormDrawer } from "./ExpenseFormDrawer";
import { ALL, expenseCells, expenseColumns, parseKind } from "./expensesHome";
import { ExpenseGlyph, ExpenseKindBadge } from "./expensesShared";
import { monthlyEquivalent, summarizeExpenses } from "./expensesUtils";
import { useExpensesQuery, useRemoveExpense } from "./queries";
import { FREQUENCY_KEYS, type Expense, type ExpenseKind } from "./types";

const PAGE_SIZE = 10;
const ringColor = getChartTheme().color[0];

/**
 * Los gastos de la sucursal.
 *
 * Una sola lista donde antes había dos pestañas, con un selector para ver
 * solo los fijos o solo los variables. Lo que la pantalla añade es la
 * cuenta que antes había que hacer a mano: cada gasto fijo llevado a «por
 * mes» —una limpieza semanal y un seguro anual no se pueden sumar tal
 * cual—, lo variable del mes y el total que hay que cubrir. El filtro vive
 * en la URL.
 *
 * Por rol: el barbero de renta (alcance «own») ve y gestiona solo sus
 * gastos —lo que compra para su silla—, nunca los de la barbería. Registrar,
 * editar y borrar dependen de `expenses`·create/edit/delete.
 */
export function ExpensesPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const access = useAccess();
  const branchId = useBranchId();
  /* «Lo suyo» sin ficha no existe: se piden los de un dueño que no hay y la lista sale vacía. */
  const ownerMemberId = access.scope === "own" ? (access.member?.id ?? "none") : null;
  const query = useExpensesQuery(branchId, ownerMemberId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("expenses.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("expenses.title")} description={t(ownerMemberId ? "expenses.ownDescription" : "expenses.description")} />

      <QueryBoundary
        query={query}
        loading={
          <div className="space-y-section" data-testid="expenses-loading">
            <div className="grid gap-stack lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[168px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        }
      >
        {(data) => <ExpensesHome expenses={data.items} branchId={branchId} ownerMemberId={ownerMemberId} />}
      </QueryBoundary>
    </div>
  );
}

type Drawer = { kind: "create"; of: ExpenseKind } | { kind: "edit"; expense: Expense };

function ExpensesHome({ expenses, branchId, ownerMemberId }: { expenses: readonly Expense[]; branchId: string; ownerMemberId: string | null }) {
  const t = useAppT();
  const access = useAccess();
  const canCreate = access.can("expenses", "create");
  const canEdit = access.can("expenses", "edit");
  const canDelete = access.can("expenses", "delete");
  const { formatNumber, formatDate } = useLocale();
  const formatMoney = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const remove = useRemoveExpense();

  const kind = parseKind(searchParams.get("tipo"));
  const pickKind = (value: string) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (value === ALL) params.delete("tipo");
        else params.set("tipo", value);
        return params;
      },
      { replace: true }
    );
    setSelected(new Set());
  };

  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [drawer, setDrawer] = React.useState<Drawer | null>(null);
  const [removing, setRemoving] = React.useState<Expense | null>(null);
  const [actionsPlacement, setActionsPlacement] = React.useState<TableActionsPlacement>("rail");
  const railOwnsActions = actionsPlacement === "rail";

  const summary = React.useMemo(() => summarizeExpenses(expenses), [expenses]);
  const filtered = React.useMemo(() => (kind === ALL ? expenses : expenses.filter((expense) => expense.kind === kind)), [expenses, kind]);
  const countOf = (of: ExpenseKind) => expenses.filter((expense) => expense.kind === of).length;
  const formatPercent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;

  const columns = React.useMemo(() => expenseColumns(t), [t]);
  /* Sin permiso de editar, abrir un gasto no lleva al formulario. */
  const cells = React.useMemo(() => expenseCells(t, { formatMoney, formatDate, onOpen: (expense) => canEdit && setDrawer({ kind: "edit", expense }) }), [t, formatMoney, formatDate, canEdit]);

  const single = selected.size === 1 ? expenses.find((expense) => expense.id === [...selected][0]) : undefined;
  /* Al registrar, el tipo arranca en lo que se está mirando: en la pestaña de variables, un variable. */
  const createKind: ExpenseKind = kind === "variable" ? "variable" : "fixed";

  /* Cada acción, solo si el rol tiene esa casilla de `expenses`. */
  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => [
      ...(canCreate ? [{ id: "create", label: t("expenses.action.create"), icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: () => setDrawer({ kind: "create", of: createKind }) } satisfies RailActionSpec] : []),
      ...(canEdit ? [{ id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: () => single && setDrawer({ kind: "edit", expense: single }) } satisfies RailActionSpec] : []),
      ...(canDelete ? [{ id: "delete", label: t("action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["single"], tone: "danger", onSelect: () => single && setRemoving(single) } satisfies RailActionSpec] : []),
    ],
    [canCreate, canEdit, canDelete, createKind, single, t]
  );

  const formDrawer = (
    <ExpenseFormDrawer open={drawer !== null} onOpenChange={(open) => !open && setDrawer(null)} expense={drawer?.kind === "edit" ? drawer.expense : null} kind={drawer?.kind === "create" ? drawer.of : "fixed"} branchId={branchId} ownerMemberId={ownerMemberId} />
  );

  if (expenses.length === 0) {
    return (
      <>
        <EmptyState
          icon="file"
          title={t("expenses.emptyTitle")}
          description={t("expenses.emptyHint")}
          action={
            canCreate ? (
              <Button onClick={() => setDrawer({ kind: "create", of: "fixed" })}>
                <Plus /> {t("expenses.action.create")}
              </Button>
            ) : undefined
          }
        />
        {formDrawer}
      </>
    );
  }

  return (
    <>
      <section aria-label={t("expenses.summaryAria")} className="mb-section shrink-0">
        <React.Suspense
          fallback={
            <div className="grid gap-stack lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[168px] rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className="grid gap-stack lg:grid-cols-3">
            <MetricCard
              label={t("expenses.summary.monthTotal")}
              value={formatMoney(summary.monthTotal)}
              caption={t("expenses.summary.monthTotalCaption", { share: formatPercent(summary.fixedShare) })}
              hint={t("expenses.summary.monthTotalHint")}
              tone="brand"
              icon="chart"
              chart={<MetricRing value={summary.fixedShare} color={ringColor} ariaLabel={`${t("expenses.summary.monthTotal")}: ${formatPercent(summary.fixedShare)}`} />}
            />
            <MetricCard label={t("expenses.summary.fixed")} value={formatMoney(summary.fixedMonthly)} caption={t("expenses.summary.fixedCaption", { yearly: formatMoney(summary.fixedYearly), count: summary.fixedCount })} hint={t("expenses.summary.fixedHint")} tone="warning" icon="calendar" />
            <MetricCard
              label={t("expenses.summary.variable")}
              value={formatMoney(summary.variableThisMonth)}
              caption={t("expenses.summary.variableCaption", { amount: formatMoney(summary.variableLastMonth) })}
              hint={t("expenses.summary.variableHint")}
              tone="positive"
              icon="file"
            />
          </div>
        </React.Suspense>
      </section>

      <div className="shrink-0">
        <ThemaTabs
          className="mb-3"
          variant="page"
          fitContent
          tabs={[
            { id: ALL, label: t("expenses.kind.all"), badge: expenses.length },
            { id: "fixed", label: t("expenses.kind.fixedPlural"), icon: <CalendarSync className="size-4" />, badge: countOf("fixed") },
            { id: "variable", label: t("expenses.kind.variablePlural"), icon: <Receipt className="size-4" />, badge: countOf("variable") },
          ]}
          activeTabId={kind}
          onTabChange={pickKind}
        />
      </div>

      <DataListBlock
        tableId="gastos-lista"
        title={t("expenses.listTitle")}
        noun={t("expenses.noun")}
        gender="m"
        rows={filtered}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        searchBy={(row) => `${row.name} ${row.description}`}
        searchPlaceholder={t("expenses.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onActionsPlacementChange={setActionsPlacement}
        recordActions={actions}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-text-muted">
            <p>{kind === ALL ? t("expenses.emptySearch") : t("expenses.emptyFiltered")}</p>
            {kind !== ALL && (
              <Button size="sm" variant="outline" onClick={() => pickKind(ALL)}>
                {t("expenses.clearFilters")}
              </Button>
            )}
          </div>
        }
        renderListItem={(row, state) => {
          const monthly = monthlyEquivalent(row);
          return (
            <ListItem
              leading={
                <span className="flex items-center gap-3">
                  {state.checkbox}
                  <ExpenseGlyph kind={row.kind} />
                </span>
              }
              title={row.name}
              description={row.frequency ? `${t(FREQUENCY_KEYS[row.frequency])}${monthly !== null && row.frequency !== "monthly" ? ` · ${t("expenses.perMonth", { amount: formatMoney(monthly) })}` : ""}` : row.description || undefined}
              meta={<span className="font-medium tabular-nums text-text-primary">{formatMoney(row.amount)}</span>}
              actions={
                <>
                  <ExpenseKindBadge kind={row.kind} />
                  {state.menu}
                </>
              }
              selected={state.selected}
            />
          );
        }}
      />

      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail selectedCount={selected.size} onClearSelection={() => setSelected(new Set())} actions={actions} gender="m" isBlocked={drawer !== null || removing !== null} />
        </ShellRailSlot>
      )}

      {formDrawer}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        variant="destructive"
        title={t("expenses.remove.title", { name: removing?.name ?? "" })}
        description={t(removing?.kind === "fixed" ? "expenses.remove.fixedHint" : "expenses.remove.variableHint")}
        confirmLabel={t("action.delete")}
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success(t("expenses.remove.done"), { description: removing.name });
              setRemoving(null);
              setSelected(new Set());
            },
            onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
          });
        }}
      />
    </>
  );
}
