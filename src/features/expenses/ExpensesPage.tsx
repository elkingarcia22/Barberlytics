import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CalendarOff, CalendarSync, ChevronLeft, ChevronRight, Download, Pencil, Plus, Receipt, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, railFilterAction, type RailActionSpec } from "@/components/action-rail";
import { DataListBlock } from "@/components/blocks";
import { MetricCard, MetricRing, getChartTheme } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useAccess } from "@/features/access";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { ExpenseFormDrawer } from "./ExpenseFormDrawer";
import { IncomeStatementView } from "./IncomeStatementView";
import { PayablesView } from "./PayablesView";
import { SuppliersView } from "./SuppliersView";
import { shiftMonth } from "./income";
import { useBranchToday } from "@/features/branches";
import { ALL, expenseCells, expenseColumns, expensesCsvRows, parseCategory, parseKind } from "./expensesHome";
import { ExpenseGlyph, ExpenseKindBadge } from "./expensesShared";
import { activeInMonth, monthlyEquivalent, summarizeExpenses } from "./expensesUtils";
import { useEndExpense, useExpenseCategories, useExpensesQuery, useRemoveExpense } from "./queries";
import { CATEGORY_KEYS, FREQUENCY_KEYS, expenseCategorySchema, isEnded, type Expense, type ExpenseKind } from "./types";

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
  const [searchParams, setSearchParams] = useSearchParams();
  /* El estado de resultados cruza ventas y nómina: solo para quien ve las dos y mira la sucursal entera. */
  const canSeeIncome = ownerMemberId === null && access.can("payroll") && access.can("transactions");
  const vista = searchParams.get("vista");
  // Por pagar: los vencimientos de los fijos (gerencia los de la barbería; el barbero de renta, los suyos).
  const canSeePayables = ownerMemberId !== null || access.role === "owner" || access.role === "admin";
  const view = canSeeIncome && vista === "resultado" ? "income" : canSeePayables && vista === "por-pagar" ? "payables" : canSeePayables && vista === "proveedores" ? "suppliers" : "expenses";
  const monthParam = searchParams.get("mes") ?? "";
  const today = useBranchToday();
  const month = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const setParam = (key: string, value: string | null) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (value === null) params.delete(key);
        else params.set(key, value);
        return params;
      },
      { replace: true }
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("expenses.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("expenses.title")} description={t(ownerMemberId ? "expenses.ownDescription" : "expenses.description")} />

      {(canSeeIncome || canSeePayables) && (
        <ThemaTabs
          className="mb-section"
          fitContent
          tabs={[
            { id: "expenses", label: t("expenses.view.list") },
            ...(canSeePayables ? [{ id: "payables", label: t("expenses.view.payables") }] : []),
            ...(canSeePayables ? [{ id: "suppliers", label: t("expenses.view.suppliers") }] : []),
            ...(canSeeIncome ? [{ id: "income", label: t("expenses.view.income") }] : []),
          ]}
          activeTabId={view}
          onTabChange={(next) => setParam("vista", next === "income" ? "resultado" : next === "payables" ? "por-pagar" : next === "suppliers" ? "proveedores" : null)}
        />
      )}

      {view === "income" ? (
        <IncomeStatementView branchId={branchId} month={month} onMonthChange={(next) => setParam("mes", next)} />
      ) : view === "suppliers" ? (
        <SuppliersView
          branchId={branchId}
          ownerMemberId={ownerMemberId}
          canDelete={access.role === "owner" || access.role === "admin"}
          onSeeExpenses={(name) =>
            setSearchParams(
              (current) => {
                const params = new URLSearchParams(current);
                params.delete("vista");
                params.set("proveedor", name);
                return params;
              },
              { replace: true }
            )
          }
        />
      ) : view === "payables" ? (
        <PayablesView branchId={branchId} month={month} ownerMemberId={ownerMemberId} onMonthChange={(next) => setParam("mes", next === today.slice(0, 7) ? null : next)} />
      ) : (
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
          {(data) => <ExpensesHome expenses={data.items} branchId={branchId} ownerMemberId={ownerMemberId} month={month} today={today} onMonthChange={(next) => setParam("mes", next === today.slice(0, 7) ? null : next)} />}
        </QueryBoundary>
      )}
    </div>
  );
}

type Drawer = { kind: "create"; of: ExpenseKind } | { kind: "edit"; expense: Expense };

interface ExpensesHomeProps {
  expenses: readonly Expense[];
  branchId: string;
  ownerMemberId: string | null;
  /** «AAAA-MM»: el mes que se mira (en la URL, `?mes=`). */
  month: string;
  /** Hoy en la sucursal (su zona). */
  today: string;
  onMonthChange: (month: string) => void;
}

function ExpensesHome({ expenses: allExpenses, branchId, ownerMemberId, month, today, onMonthChange }: ExpensesHomeProps) {
  const t = useAppT();
  const access = useAccess();
  const canCreate = access.can("expenses", "create");
  const canEdit = access.can("expenses", "edit");
  const canDelete = access.can("expenses", "delete");
  const { formatNumber, formatDate } = useLocale();
  const formatMoney = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const remove = useRemoveExpense();
  const end = useEndExpense();
  const categoriesQuery = useExpenseCategories();
  const customCategories = React.useMemo(() => categoriesQuery.data?.custom ?? [], [categoriesQuery.data]);
  // El mes que se mira: los variables de ese mes y los fijos que corrían en él.
  const expenses = React.useMemo(() => allExpenses.filter((expense) => activeInMonth(expense, month)), [allExpenses, month]);
  const isCurrentMonth = month >= today.slice(0, 7);
  const rawLabel = formatDate(new Date(`${month}-15T12:00:00`), { month: "long", year: "numeric" });
  const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const kind = parseKind(searchParams.get("tipo"));
  const category = parseCategory(searchParams.get("categoria"));
  const pickCategory = (value: string) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (value === ALL) params.delete("categoria");
        else params.set("categoria", value);
        return params;
      },
      { replace: true }
    );
    setSelected(new Set());
  };
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

  // El resumen del mes, con los variables del mes anterior para comparar.
  const summary = React.useMemo(() => {
    const previous = allExpenses.filter((expense) => expense.kind === "variable" && activeInMonth(expense, shiftMonth(month, -1)));
    return summarizeExpenses([...expenses, ...previous], new Date(`${month}-15T12:00:00`), isCurrentMonth ? today : `${month}-01`);
  }, [allExpenses, expenses, month, isCurrentMonth, today]);
  // «Ver sus gastos» desde Proveedores: los de ese proveedor (`?proveedor=`), con un chip para quitarlo.
  const supplier = searchParams.get("proveedor");
  const filtered = React.useMemo(
    () => expenses.filter((expense) => (kind === ALL || expense.kind === kind) && (category === null || (expense.categoryId ?? "other") === category) && (supplier === null || (expense.supplier ?? "").toLowerCase() === supplier.toLowerCase())),
    [expenses, kind, category, supplier]
  );
  const countOf = (of: ExpenseKind) => expenses.filter((expense) => expense.kind === of).length;
  const formatPercent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;

  const columns = React.useMemo(() => expenseColumns(t), [t]);
  /* Sin permiso de editar, abrir un gasto no lleva al formulario. */
  const cells = React.useMemo(() => expenseCells(t, { formatMoney, formatDate, onOpen: (expense) => canEdit && setDrawer({ kind: "edit", expense }), customCategories }), [t, formatMoney, formatDate, canEdit, customCategories]);

  const single = selected.size === 1 ? expenses.find((expense) => expense.id === [...selected][0]) : undefined;
  /* Al registrar, el tipo arranca en lo que se está mirando: en la pestaña de variables, un variable. */
  const createKind: ExpenseKind = kind === "variable" ? "variable" : "fixed";

  /* Terminar un fijo: deja de contar desde mañana; los meses pasados lo conservan. */
  const endFixed = React.useCallback(
    (expense: Expense) =>
      end.mutate(
        { id: expense.id, endDate: today },
        {
          onSuccess: () => {
            toast.success(t("expenses.end.done"), { description: expense.name });
            setSelected(new Set());
          },
          onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
        }
      ),
    [end, t, today]
  );
  const exportCsv = React.useCallback(() => {
    const csv = expensesCsvRows(t, filtered, customCategories);
    downloadCsv(`gastos-${branchId}-${month}.csv`, toCsv(csv.header, csv.rows));
  }, [t, filtered, branchId, month, customCategories]);

  /* Cada acción, solo si el rol tiene esa casilla de `expenses`. */
  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => [
      ...(canCreate ? [{ id: "create", label: t("expenses.action.create"), icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: () => setDrawer({ kind: "create", of: createKind }) } satisfies RailActionSpec] : []),
      ...(canEdit ? [{ id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: () => single && setDrawer({ kind: "edit", expense: single }) } satisfies RailActionSpec] : []),
      ...(canEdit && single?.kind === "fixed" && !isEnded(single)
        ? [{ id: "end", label: t("expenses.action.end"), icon: <CalendarOff className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: () => single && endFixed(single) } satisfies RailActionSpec]
        : []),
      { id: "export", label: t("expenses.action.export"), icon: <Download className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: exportCsv } satisfies RailActionSpec,
      ...(canDelete ? [{ id: "delete", label: t("action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["single"], tone: "danger", onSelect: () => single && setRemoving(single) } satisfies RailActionSpec] : []),
    ],
    [canCreate, canEdit, canDelete, createKind, single, t, endFixed, exportCsv]
  );
  // Fijos y variables también se pueden poner a la vista en la barra («Editar acciones»).
  const railActions = React.useMemo<readonly RailActionSpec[]>(() => {
    const toggleKind = (of: ExpenseKind) =>
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (params.get("tipo") === of) params.delete("tipo");
          else params.set("tipo", of);
          return params;
        },
        { replace: true }
      );
    return [
      ...actions,
      railFilterAction({ id: "kind-fixed", label: t("expenses.kind.fixedPlural"), icon: <CalendarSync className="size-5" strokeWidth={2} />, active: kind === "fixed", onToggle: () => toggleKind("fixed") }),
      railFilterAction({ id: "kind-variable", label: t("expenses.kind.variablePlural"), icon: <Receipt className="size-5" strokeWidth={2} />, active: kind === "variable", onToggle: () => toggleKind("variable") }),
    ];
  }, [actions, kind, setSearchParams, t]);

  const formDrawer = (
    <ExpenseFormDrawer open={drawer !== null} onOpenChange={(open) => !open && setDrawer(null)} expense={drawer?.kind === "edit" ? drawer.expense : null} kind={drawer?.kind === "create" ? drawer.of : "fixed"} branchId={branchId} ownerMemberId={ownerMemberId} />
  );

  if (allExpenses.length === 0) {
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
      <div className="mb-stack flex shrink-0 items-center gap-2" role="group" aria-label={t("expenses.monthAria")} data-testid="expenses-month">
        <Button variant="outline" size="icon-sm" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label={t("metrics.period.previous")}>
          <ChevronLeft />
        </Button>
        <span className="min-w-36 text-center text-sm font-medium text-text-primary">{monthLabel}</span>
        <Button variant="outline" size="icon-sm" onClick={() => onMonthChange(shiftMonth(month, 1))} disabled={isCurrentMonth} aria-label={t("metrics.period.next")}>
          <ChevronRight />
        </Button>
      </div>
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

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-x-stack">
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
        {supplier && (
          <Button
            size="sm"
            variant="outline"
            className="mb-3"
            onClick={() =>
              setSearchParams(
                (current) => {
                  const params = new URLSearchParams(current);
                  params.delete("proveedor");
                  return params;
                },
                { replace: true }
              )
            }
            data-testid="expenses-supplier-filter"
          >
            {t("expenses.suppliers.filter", { name: supplier })} <X />
          </Button>
        )}
        <Select value={category ?? ALL} onValueChange={pickCategory}>
          <SelectTrigger className="mb-3 w-[220px]" aria-label={t("expenses.column.category")} data-testid="expenses-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("expenses.category.all")}</SelectItem>
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
          </SelectContent>
        </Select>
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
        searchBy={(row) => `${row.name} ${row.description} ${row.supplier ?? ""}`}
        searchPlaceholder={t("expenses.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onActionsPlacementChange={setActionsPlacement}
        recordActions={actions}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-text-muted">
            <p>{kind === ALL && category === null ? t("expenses.emptySearch") : t("expenses.emptyFiltered")}</p>
            {(kind !== ALL || category !== null) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  pickKind(ALL);
                  pickCategory(ALL);
                }}
              >
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
          <DataListActionRail selectedCount={selected.size} onClearSelection={() => setSelected(new Set())} actions={railActions} gender="m" isBlocked={drawer !== null || removing !== null} />
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
