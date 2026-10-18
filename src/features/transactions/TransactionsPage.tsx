import * as React from "react";
import { useNavigate } from "react-router";
import { Download, LayoutGrid, Loader2, Lock, RefreshCw } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { ShellHeaderSlot } from "@/components/app-shell";
import { DataListBlock } from "@/components/blocks";
import { MetricCard, MetricRing, getChartTheme } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import { PeriodNavigator } from "@/components/date";
import { Breadcrumbs } from "@/components/navigation";
import { OptionTile } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { STATUS_KEYS, appointmentStatusSchema } from "@/features/calendar/types";
import { useAccess } from "@/features/access";
import { maskPhone } from "@/features/customers/customersUtils";
import { useBranchId } from "@/features/team/teamUtils";
import { AccountDrawer } from "./AccountDrawer";
import { RegisterCloseDrawer } from "./RegisterCloseDrawer";
import { accountsFor, showsPeriodTotals } from "./transactionsAccess";
import { useTransactionsQuery } from "./queries";
import { countByStatus, describeLines, summarize, transactionCells, transactionColumns } from "./transactionsHome";
import { AccountStatusBadge } from "./transactionsShared";
import { STATUS_STYLE } from "./transactionsStyle";
import { ACCOUNT_STATUS_HINT_KEYS, ACCOUNT_STATUS_KEYS, METHOD_KEYS, accountStatusSchema, type Account } from "./types";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { AppMessageKey } from "@/app/i18n/types";

/** Las columnas del CSV: todo lo que el contador necesita para cuadrar. */
const CSV_COLUMNS: readonly AppMessageKey[] = [
  "transactions.csv.date",
  "transactions.csv.invoice",
  "transactions.column.client",
  "transactions.column.attended",
  "transactions.csv.status",
  "transactions.detail.subtotal",
  "transactions.csv.discount",
  "transactions.detail.tax",
  "transactions.column.total",
  "transactions.column.tip",
  "transactions.csv.prepaid",
  "transactions.column.collected",
  "transactions.csv.refunded",
  "transactions.detail.balance",
  "transactions.column.method",
];
import { ALL, useTransactionsFilters } from "./useTransactionsFilters";

const PAGE_SIZE = 15;
const ringColor = getChartTheme().color[0];
/* En el móvil los estados son una fila que se desliza; desde `sm`, una rejilla con todos a la vista. */
const TILE_CLASS = "w-44 shrink-0 sm:w-auto";
const DATE_TIME: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" };

/**
 * Las transacciones: las cuentas de un periodo, con lo que se facturó, lo
 * que ya entró y lo que falta por cobrar.
 *
 * Es una pantalla de consulta —aquí no se cobra ni se anula; eso pasa en el
 * calendario—, así que no lleva barra de acciones. El periodo se mueve con
 * el mismo navegador que Métricas, los estados son fichas con su recuento y
 * el detalle de una cuenta se abre en un panel. Todo vive en la URL.
 *
 * Según el rol (docs/roles/02-metricas-caja-nomina.md): el barbero de renta
 * ve solo sus cuentas (las que atendió; sin ventas de mostrador) y recepción
 * ve las cuentas sin los totales del periodo. Devolver un pago va con
 * `transactions`·edit; el cierre de caja del día, con quien ve todas las cuentas.
 */
export function TransactionsPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { current } = useLocale();
  const branchId = useBranchId();
  const filters = useTransactionsFilters();
  const query = useTransactionsQuery({ branchId, from: filters.from, to: filters.to });
  const access = useAccess();
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const formatMoney = useMoney();
  // El cierre es de un día: en la vista de día, para quien ve todas las cuentas (dueño, administración, recepción).
  const canCloseRegister = access.scope === "all" && filters.granularity === "day";
  const description = access.scope === "own" ? t("transactions.descriptionOwn") : showsPeriodTotals(access) ? t("transactions.description") : t("transactions.descriptionNoTotals");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("transactions.title")]} />
      </ShellHeaderSlot>

      <PageHeader
        title={t("transactions.title")}
        description={description}
        actions={
          <>
            {canCloseRegister && (
              <Button variant="outline" size="sm" onClick={() => setRegisterOpen(true)} data-testid="transactions-register">
                <Lock /> {t("transactions.register.action")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching} data-testid="transactions-refresh">
              {query.isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />} {t("transactions.refresh")}
            </Button>
          </>
        }
      />

      <div className="mb-section flex shrink-0 flex-wrap items-center justify-between gap-stack" role="group" aria-label={t("transactions.filtersAria")}>
        <PeriodNavigator
          granularity={filters.granularity}
          onGranularityChange={filters.setGranularity}
          date={filters.date}
          onDateChange={filters.setDate}
          locale={current.intl}
          labels={{
            day: t("metrics.period.day"),
            week: t("metrics.period.week"),
            month: t("metrics.period.month"),
            today: t("metrics.period.today"),
            previous: t("metrics.period.previous"),
            next: t("metrics.period.next"),
            aria: t("metrics.period.aria"),
          }}
        />
        <Select value={filters.appointment} onValueChange={filters.setAppointment}>
          <SelectTrigger className="w-[220px]" aria-label={t("transactions.appointmentFilter")} data-testid="transactions-appointment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("transactions.appointmentAll")}</SelectItem>
            {appointmentStatusSchema.options.map((status) => (
              <SelectItem key={status} value={status}>
                {t("transactions.appointmentIs", { status: t(STATUS_KEYS[status]) })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryBoundary
        query={query}
        loading={
          <div className="space-y-section" data-testid="transactions-loading">
            <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-[140px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        }
      >
        {(data) => <TransactionsHome accounts={accountsFor(access, data.items)} showTotals={showsPeriodTotals(access)} filters={filters} fetching={query.isFetching} canRefund={access.can("transactions", "edit")} />}
      </QueryBoundary>
      {canCloseRegister && <RegisterCloseDrawer open={registerOpen} onOpenChange={setRegisterOpen} branchId={branchId} date={filters.from} formatMoney={formatMoney} />}
    </div>
  );
}

interface TransactionsHomeProps {
  accounts: readonly Account[];
  /** Las tarjetas de Facturado, Cobrado, Por cobrar y Propinas. */
  showTotals: boolean;
  filters: ReturnType<typeof useTransactionsFilters>;
  fetching: boolean;
  /** Quien puede devolver un pago (Transacciones · editar). */
  canRefund: boolean;
}

function TransactionsHome({ accounts, showTotals, filters, fetching, canRefund }: TransactionsHomeProps) {
  const t = useAppT();
  const { formatNumber, formatDate } = useLocale();
  const formatMoney = useMoney();
  const { status, appointment, accountId, openAccount } = filters;

  const formatPercent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
  const summary = React.useMemo(() => summarize(accounts), [accounts]);
  const counts = React.useMemo(() => countByStatus(accounts), [accounts]);
  const filtered = React.useMemo(() => accounts.filter((account) => (status === ALL || account.status === status) && (appointment === ALL || account.appointmentStatus === appointment)), [accounts, status, appointment]);
  const opened = React.useMemo(() => accounts.find((account) => account.id === accountId) ?? null, [accounts, accountId]);

  const columns = React.useMemo(() => transactionColumns(t), [t]);
  const cells = React.useMemo(() => transactionCells(t, { formatMoney, formatDate, onOpen: (account) => openAccount(account.id) }), [t, formatMoney, formatDate, openAccount]);

  // Lo que se ve (periodo y filtros), para el contador o la hoja de cálculo.
  const download = () =>
    downloadCsv(
      `transacciones-${filters.from}-${filters.to}.csv`,
      toCsv(
        CSV_COLUMNS.map((key) => t(key)),
        filtered.map((row) => [row.date, row.invoice ?? "", row.client?.name ?? t("transactions.counterSale"), row.barber ?? "", t(ACCOUNT_STATUS_KEYS[row.status]), row.subtotal, row.discount ?? 0, row.tax, row.total, row.tip, row.prepaid ?? 0, row.collected, row.refunded, row.balance, row.method ? t(METHOD_KEYS[row.method]) : ""])
      )
    );

  const statusHint = status === ALL ? t("transactions.status.allHint") : t(ACCOUNT_STATUS_HINT_KEYS[status]);
  const hasFilter = status !== ALL || appointment !== ALL;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", fetching && "opacity-80 transition-opacity motion-reduce:transition-none")}>
      {showTotals && (
        <section aria-label={t("transactions.summaryAria")} className="mb-section shrink-0">
          <React.Suspense
            fallback={
              <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-[140px] rounded-2xl" />
                ))}
              </div>
            }
          >
            <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label={t("transactions.summary.billed")} value={formatMoney(summary.billed)} caption={t("transactions.summary.accounts", { count: summary.billedCount })} hint={t("transactions.summary.billedHint")} tone="brand" icon="chart" />
              <MetricCard
                label={t("transactions.summary.collected")}
                value={formatMoney(summary.collected)}
                caption={t("transactions.summary.collectedCaption", { rate: formatPercent(summary.collectedRate) })}
                hint={t("transactions.summary.collectedHint")}
                tone="positive"
                icon="success"
                chart={<MetricRing value={summary.collectedRate} color={ringColor} ariaLabel={`${t("transactions.summary.collected")}: ${formatPercent(summary.collectedRate)}`} />}
              />
              <MetricCard label={t("transactions.summary.receivable")} value={formatMoney(summary.receivable)} caption={t("transactions.summary.openAccounts", { count: summary.openCount })} hint={t("transactions.summary.receivableHint")} tone="warning" icon="clock" />
              <MetricCard
                label={t("transactions.summary.tips")}
                value={formatMoney(summary.tips)}
                caption={summary.refundedCount === 0 ? t("transactions.summary.noRefunds") : t("transactions.summary.refunded", { amount: formatMoney(summary.refunded), count: summary.refundedCount })}
                hint={t("transactions.summary.tipsHint")}
                tone="brand"
                icon="award"
              />
            </div>
          </React.Suspense>
        </section>
      )}

      <section aria-label={t("transactions.statusAria")} className="mb-section shrink-0">
        <div className="mb-stack flex items-baseline gap-2">
          <h2 className="shrink-0 text-sm font-semibold text-text-secondary">{t("transactions.statusTitle")}</h2>
          <p className="min-w-0 flex-1 truncate text-xs text-text-muted" data-testid="transactions-status-hint">
            {statusHint}
          </p>
          <Button variant="outline" size="sm" className="shrink-0" onClick={download} disabled={filtered.length === 0} data-testid="transactions-download">
            <Download /> {t("transactions.download")}
          </Button>
        </div>
        <div role="radiogroup" aria-label={t("transactions.statusAria")} className="-mx-1 flex gap-stack overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:p-0 xl:grid-cols-5">
          <OptionTile compact className={TILE_CLASS} option={{ value: ALL, label: t("transactions.status.all"), badge: formatNumber(accounts.length), icon: LayoutGrid }} selected={status === ALL} onSelect={filters.setStatus} />
          {accountStatusSchema.options.map((id) => (
            <OptionTile key={id} compact className={TILE_CLASS} option={{ value: id, label: t(ACCOUNT_STATUS_KEYS[id]), badge: formatNumber(counts[id]), icon: STATUS_STYLE[id].icon }} selected={status === id} onSelect={filters.setStatus} />
          ))}
        </div>
      </section>

      <DataListBlock
        tableId="transacciones-cuentas"
        title={t("transactions.listTitle")}
        noun={t("transactions.noun")}
        gender="f"
        rows={filtered}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.client?.name ?? t("transactions.counterSale")}
        searchBy={(row) => `${row.client?.name ?? ""} ${row.client?.phone.replace(/\D/g, "") ?? ""} ${row.invoice ?? ""} ${row.barber ?? ""} ${row.lines.map((line) => line.name).join(" ")}`}
        searchPlaceholder={t("transactions.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-text-muted">
            <p>{accounts.length === 0 ? t("transactions.emptyPeriod") : hasFilter ? t("transactions.emptyFiltered") : t("transactions.emptySearch")}</p>
            {accounts.length > 0 && hasFilter && (
              <Button size="sm" variant="outline" onClick={filters.clearFilters}>
                {t("transactions.clearFilters")}
              </Button>
            )}
          </div>
        }
        renderListItem={(row) => (
          <ListItem
            title={row.client?.name ?? t("transactions.counterSale")}
            description={[formatDate(new Date(row.date), DATE_TIME), row.client ? maskPhone(row.client.phone) : null, describeLines(row, t)].filter(Boolean).join(" · ")}
            meta={<span className="font-medium tabular-nums text-text-primary">{formatMoney(row.total)}</span>}
            actions={<AccountStatusBadge status={row.status} />}
            onClick={() => openAccount(row.id)}
          />
        )}
      />

      <AccountDrawer account={opened} onClose={() => openAccount(null)} formatMoney={formatMoney} canRefund={canRefund} />
    </div>
  );
}
