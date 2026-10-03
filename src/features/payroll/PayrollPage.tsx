import * as React from "react";
import { useNavigate } from "react-router";
import { Armchair, Download, Percent, Wallet } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { ShellHeaderSlot } from "@/components/app-shell";
import { DataListBlock } from "@/components/blocks";
import { MetricCard } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import { PeriodNavigator } from "@/components/date";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { PayrollMemberDrawer } from "./PayrollMemberDrawer";
import { columnIdsFor, columnLabel, columnValue, payrollCells, payrollColumns } from "./payrollHome";
import { countByPayout, summarizePayroll, toCsv } from "./payrollUtils";
import { usePayrollQuery } from "./queries";
import { PAYOUT_HINT_KEYS, PAYOUT_KEYS, type Payout, type PayrollResponse } from "./types";
import { usePayrollFilters } from "./usePayrollFilters";

const PAGE_SIZE = 15;
/* Marca de orden de bytes: sin ella Excel abre el CSV con las tildes rotas. */
const BOM = String.fromCharCode(0xfeff);
const PAYOUT_ICONS: Readonly<Record<Payout, React.ReactNode>> = {
  commission: <Percent className="size-4" />,
  rent: <Armchair className="size-4" />,
  salary: <Wallet className="size-4" />,
};

/**
 * La nómina del periodo: cuánto se le paga a cada barbero y cuánto le deben
 * a la barbería los que rentan su puesto.
 *
 * Es de consulta, como el resto de reportes: las reglas se cambian en la
 * ficha de cada persona en Equipo. Las tres formas de pago siguen separadas
 * porque se liquidan distinto —cada una con sus columnas—, pero el resumen
 * de arriba las junta. El detalle de un barbero se abre en un panel y la
 * pestaña visible se descarga en CSV. Todo vive en la URL.
 */
export function PayrollPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { current } = useLocale();
  const branchId = useBranchId();
  const filters = usePayrollFilters();
  const query = usePayrollQuery({ branchId, from: filters.from, to: filters.to });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("payroll.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("payroll.title")} description={t("payroll.description")} />

      <div className="mb-section shrink-0" role="group" aria-label={t("payroll.periodAria")}>
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
      </div>

      <QueryBoundary
        query={query}
        loading={
          <div className="space-y-section" data-testid="payroll-loading">
            <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-[140px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        }
      >
        {(data) => <PayrollHome data={data} filters={filters} fetching={query.isFetching} />}
      </QueryBoundary>
    </div>
  );
}

interface PayrollHomeProps {
  data: PayrollResponse;
  filters: ReturnType<typeof usePayrollFilters>;
  fetching: boolean;
}

function PayrollHome({ data, filters, fetching }: PayrollHomeProps) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const formatMoney = useMoney();
  const { payout, memberId, openMember } = filters;

  const summary = React.useMemo(() => summarizePayroll(data.members), [data.members]);
  const counts = React.useMemo(() => countByPayout(data.members), [data.members]);
  const rows = React.useMemo(() => data.members.filter((member) => member.payout === payout), [data.members, payout]);
  const opened = React.useMemo(() => data.members.find((member) => member.memberId === memberId) ?? null, [data.members, memberId]);

  const formatCount = React.useCallback((value: number) => formatNumber(value), [formatNumber]);
  const columns = React.useMemo(() => payrollColumns(t, payout), [t, payout]);
  const cells = React.useMemo(() => payrollCells(t, payout, { formatMoney, formatNumber: formatCount, onOpen: (member) => openMember(member.memberId) }), [t, payout, formatMoney, formatCount, openMember]);

  const download = () => {
    const ids = columnIdsFor(payout);
    const csv = toCsv(
      ids.map((id) => columnLabel(t, id)),
      rows.map((member) => ids.map((id) => (id === "member" ? member.name : columnValue(member, id))))
    );
    const url = URL.createObjectURL(new Blob([`${BOM}${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nomina-${payout}-${data.from}-${data.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", fetching && "opacity-80 transition-opacity motion-reduce:transition-none")}>
      <section aria-label={t("payroll.summaryAria")} className="mb-section shrink-0">
        <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={t("payroll.summary.toPay")} value={formatMoney(summary.toPay)} caption={t("payroll.summary.toPayCaption", { count: summary.toPayCount })} hint={t("payroll.summary.toPayHint")} tone="brand" icon="users" />
          <MetricCard label={t("payroll.summary.toCollect")} value={formatMoney(summary.toCollect)} caption={t("payroll.summary.toCollectCaption", { count: summary.toCollectCount })} hint={t("payroll.summary.toCollectHint")} tone="warning" icon="building" />
          <MetricCard label={t("payroll.summary.commissions")} value={formatMoney(summary.commissions)} caption={t("payroll.summary.commissionsCaption", { count: summary.services })} hint={t("payroll.summary.commissionsHint")} tone="positive" icon="chart" />
          <MetricCard label={t("payroll.summary.tips")} value={formatMoney(summary.tips)} caption={t("payroll.summary.tipsCaption")} tone="brand" icon="award" />
        </div>
      </section>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3">
        <ThemaTabs
          className="mb-3"
          variant="page"
          fitContent
          tabs={(["commission", "rent", "salary"] as const).map((id) => ({ id, label: t(PAYOUT_KEYS[id]), icon: PAYOUT_ICONS[id], badge: counts[id] }))}
          activeTabId={payout}
          onTabChange={filters.setPayout}
        />
        <Button variant="outline" size="sm" className="mb-3 ml-auto" onClick={download} disabled={rows.length === 0} data-testid="payroll-download">
          <Download /> {t("payroll.download")}
        </Button>
      </div>
      <p className="mb-stack shrink-0 text-xs text-text-muted" data-testid="payroll-payout-hint">
        {t(PAYOUT_HINT_KEYS[payout])}
      </p>

      <DataListBlock
        tableId={`nomina-${payout}`}
        title={t(PAYOUT_KEYS[payout])}
        noun={t("payroll.noun")}
        gender="f"
        rows={rows}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.memberId}
        getRowLabel={(row) => row.name}
        searchBy={(row) => row.name}
        searchPlaceholder={t("payroll.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        emptyState={<p className="py-6 text-center text-sm text-text-muted">{t("payroll.empty")}</p>}
        renderListItem={(row) => (
          <ListItem
            title={row.name}
            description={t("payroll.services", { count: row.services })}
            meta={<span className={row.net < 0 ? "font-semibold tabular-nums text-status-warning" : "font-semibold tabular-nums text-text-primary"}>{row.net < 0 ? t("payroll.owes", { amount: formatMoney(-row.net) }) : formatMoney(row.net)}</span>}
            onClick={() => openMember(row.memberId)}
          />
        )}
      />

      <PayrollMemberDrawer member={opened} onClose={() => openMember(null)} formatMoney={formatMoney} />
    </div>
  );
}

