import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FileBadge, HandCoins, ListChecks, MessageCircleWarning } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { ShellHeaderSlot } from "@/components/app-shell";
import { DataListBlock } from "@/components/blocks";
import { MetricCard } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import { PeriodNavigator } from "@/components/date";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useAccess } from "@/features/access";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { BarberGoalCard } from "./barber/BarberGoalCard";
import { MyClientsView } from "./barber/MyClientsView";
import { MyReputationView } from "./barber/MyReputationView";
import { PayDisputeDialog, PayDisputeList, type DisputeTarget } from "./barber/PayDisputes";
import { RentProfitCard } from "./barber/RentProfitCard";
import { RentStatementView } from "./barber/RentStatementView";
import { MyPayStatus } from "./MyPayStatus";
import { PayNarrative } from "./PayNarrative";
import { PayrollMemberDrawer } from "./PayrollMemberDrawer";
import { myPayCells, myPayColumns } from "./myPayHome";
import { usePayrollQuery } from "./queries";
import { RULE_KEYS, type PayrollMember, type PayrollResponse } from "./types";
import { usePayrollFilters } from "./usePayrollFilters";

const PAGE_SIZE = 15;
/** El panel con la cuenta completa vive en la URL (`?miembro=`), como en Nómina; aquí solo hay uno. */
const OWN = "yo";
/** Las pestañas, en la URL (`?vista=`): el pago del periodo, el estado de cuenta (renta), sus clientes y su reputación. */
type MyPayView = "pago" | "estado" | "clientes" | "reputacion";
const VIEWS: readonly MyPayView[] = ["pago", "estado", "clientes", "reputacion"];

/**
 * El pago del propio barbero, sobre la nómina recortada a su ficha:
 * - «Lo que llevo» (comisión): cuánto lleva ganado en el periodo —comisiones de
 *   servicios y productos, propinas— y cita por cita qué regla se le aplicó;
 * - «Mi negocio» (renta): lo que vendió, lo que le paga a la barbería (renta y
 *   deducciones) y su pago neto, que sale negativo cuando le debe a la barbería.
 *
 * El periodo usa el mismo navegador que Nómina. Es de consulta: las reglas las
 * cambia el dueño en su ficha de Equipo, por eso el panel no enlaza allí.
 */
export function MyPayPage() {
  const t = useAppT();
  const { current } = useLocale();
  const access = useAccess();
  const branchId = useBranchId();
  const filters = usePayrollFilters();
  const memberId = access.member?.id;
  const isRent = access.role === "barbero-renta";
  const formatMoney = useMoney();
  const title = t(isRent ? "nav.myBusiness" : "nav.myEarnings");
  const query = usePayrollQuery({ branchId, from: filters.from, to: filters.to, memberId });
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get("vista") as MyPayView | null;
  const view: MyPayView = requested && VIEWS.includes(requested) && (requested !== "estado" || isRent) ? requested : "pago";
  const tabs = [
    { id: "pago", label: t("payroll.mine.tab.pay") },
    ...(isRent ? [{ id: "estado", label: t("payroll.mine.tab.statement") }] : []),
    { id: "clientes", label: t("payroll.mine.tab.clients") },
    { id: "reputacion", label: t("payroll.mine.tab.reputation") },
  ];
  const setView = (next: string) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next === "pago") copy.delete("vista");
        else copy.set("vista", next);
        return copy;
      },
      { replace: true }
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[title]} />
      </ShellHeaderSlot>

      <PageHeader
        title={title}
        description={t(isRent ? "payroll.mine.rentDescription" : "payroll.mine.commissionDescription")}
        actions={
          memberId ? (
            <Button variant="outline" size="sm" onClick={() => navigate(`/mi-pago/certificado?sucursal=${branchId}&miembro=${memberId}`)} data-testid="my-pay-certificate">
              <FileBadge /> {t("payroll.certificate.open")}
            </Button>
          ) : undefined
        }
      />

      <ThemaTabs className="mb-stack" variant="page" fitContent tabs={tabs} activeTabId={view} onTabChange={setView} />

      {memberId && view === "estado" && <RentStatementView branchId={branchId} memberId={memberId} formatMoney={formatMoney} />}
      {memberId && view === "clientes" && <MyClientsView branchId={branchId} memberId={memberId} barberName={(access.member?.name ?? "").split(" ")[0] ?? ""} />}
      {memberId && view === "reputacion" && <MyReputationView memberId={memberId} />}

      {view === "pago" && (
        <>
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

      {memberId ? (
        <QueryBoundary
          query={query}
          loading={
            <div className="space-y-section" data-testid="my-pay-loading">
              <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-[140px] rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          }
        >
          {(data) => <MyPayHome data={data} memberId={memberId} filters={filters} fetching={query.isFetching} />}
        </QueryBoundary>
      ) : (
        <EmptyState icon="users" title={title} description={t("payroll.mine.noMember")} />
      )}
        </>
      )}
    </div>
  );
}

interface MyPayHomeProps {
  data: PayrollResponse;
  memberId: string;
  filters: ReturnType<typeof usePayrollFilters>;
  fetching: boolean;
}

function MyPayHome({ data, memberId, filters, fetching }: MyPayHomeProps) {
  const branchId = useBranchId();
  const [dispute, setDispute] = React.useState<DisputeTarget | null>(null);
  const t = useAppT();
  const { formatDate } = useLocale();
  const formatMoney = useMoney();
  /* El servidor ya recorta a su ficha; se busca por id por si llegara alguien más. */
  const member = data.members.find((item) => item.memberId === memberId) ?? null;

  const payout = member?.payout ?? "commission";
  const columns = React.useMemo(() => myPayColumns(t, payout), [t, payout]);
  const cells = React.useMemo(() => myPayCells(t, payout, { formatMoney, formatDate }), [t, payout, formatMoney, formatDate]);

  if (!member) return <EmptyState icon="calendar" title={t("payroll.mine.emptyTitle")} description={t("payroll.mine.empty")} />;

  const isRent = member.payout === "rent";
  const detailOpen = filters.memberId === OWN;
  const period = { branchId, from: data.from, to: data.to };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", fetching && "opacity-80 transition-opacity motion-reduce:transition-none")}>
      <section aria-label={t("payroll.mine.summaryAria")} className="mb-section shrink-0 space-y-stack">
        <MyPayStatus run={data.run ?? null} member={member} formatMoney={formatMoney} />
        <PayNarrative member={member} formatMoney={formatMoney} />
        <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">{isRent ? <RentCards member={member} formatMoney={formatMoney} /> : <CommissionCards member={member} formatMoney={formatMoney} />}</div>
        {isRent && (member.balance ?? member.net) < 0 && (
          <Alert variant="warning" data-testid="my-pay-owes">
            <HandCoins />
            <AlertTitle>{t("payroll.mine.owesTitle", { amount: formatMoney(-(member.balance ?? member.net)) })}</AlertTitle>
            <AlertDescription>{t("payroll.mine.owesDetail", { rent: formatMoney(member.rent), deductions: formatMoney(member.deductions), held: formatMoney(member.held ?? 0), paid: formatMoney(member.rentPaid ?? 0) })}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-stack lg:grid-cols-2">
          {isRent && <RentProfitCard member={member} formatMoney={formatMoney} />}
          <BarberGoalCard branchId={branchId} memberId={memberId} formatMoney={formatMoney} />
        </div>
        <PayDisputeList branchId={branchId} memberId={memberId} />
      </section>

      <DataListBlock
        tableId={isRent ? "mi-negocio-cuentas" : "lo-que-llevo-servicios"}
        title={t(isRent ? "payroll.mine.rentLinesTitle" : "payroll.mine.linesTitle")}
        noun={t("payroll.mine.linesNoun")}
        gender="m"
        rows={member.lines}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.appointmentId}
        getRowLabel={(row) => row.client}
        searchBy={(row) => `${row.client} ${row.service}`}
        searchPlaceholder={t("payroll.mine.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDispute({ period })} data-testid="my-pay-dispute">
              <MessageCircleWarning /> {t("payroll.dispute.cta")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => filters.openMember(OWN)} data-testid="my-pay-detail">
              <ListChecks /> {t("payroll.mine.seeDetail")}
            </Button>
          </>
        }
        emptyState={<p className="py-6 text-center text-sm text-text-muted">{t("payroll.mine.empty")}</p>}
        renderListItem={(row) => (
          <ListItem
            title={row.client}
            description={`${row.service} · ${t(RULE_KEYS[row.rule])}`}
            meta={<span className="font-semibold tabular-nums text-text-primary">{formatMoney(isRent ? row.sale : row.commission)}</span>}
          />
        )}
      />

      <PayrollMemberDrawer
        member={detailOpen ? member : null}
        onClose={() => filters.openMember(null)}
        formatMoney={formatMoney}
        showRulesLink={false}
        period={period}
        onDispute={(line) => setDispute({ period, line: { appointmentId: line.appointmentId, label: `${line.client} · ${line.service}` } })}
      />
      <PayDisputeDialog target={dispute} onClose={() => setDispute(null)} />
    </div>
  );
}

interface CardsProps {
  member: PayrollMember;
  formatMoney: (value: number) => string;
}

/** Comisión (o salario): lo que lleva, de dónde sale y sus propinas. */
function CommissionCards({ member, formatMoney }: CardsProps) {
  const t = useAppT();
  const isSalary = member.payout === "salary";
  return (
    <>
      <MetricCard label={t("payroll.mine.earned")} value={formatMoney(member.net)} caption={t("payroll.services", { count: member.services })} hint={t("payroll.mine.earnedHint")} tone="positive" icon="award" />
      {isSalary ? (
        <MetricCard label={t("payroll.column.salary")} value={formatMoney(member.salary)} caption={t("payroll.mine.salaryCaption", { amount: formatMoney(member.salaryBase ?? 0) })} tone="brand" icon="calendar" />
      ) : (
        <MetricCard label={t("payroll.column.serviceCommission")} value={formatMoney(member.serviceCommission)} caption={t("payroll.mine.onSales", { amount: formatMoney(member.serviceSales) })} tone="brand" icon="scissors" />
      )}
      <MetricCard label={t("payroll.column.productCommission")} value={formatMoney(member.productCommission)} caption={t("payroll.mine.onSales", { amount: formatMoney(member.productSales) })} tone="neutral" icon="chart" />
      <MetricCard label={t("payroll.column.tips")} value={formatMoney(member.tips)} caption={t("payroll.mine.tipsCaption")} tone="brand" icon="users" />
    </>
  );
}

/** Renta: lo que vendió, lo que le paga a la barbería y lo que le queda (o debe). */
function RentCards({ member, formatMoney }: CardsProps) {
  const t = useAppT();
  // Cómo queda contando lo que ya pagó de renta.
  const balance = member.balance ?? member.net;
  const owes = balance < 0;
  return (
    <>
      <MetricCard
        label={t("payroll.mine.sales")}
        value={formatMoney(member.serviceSales + member.productSales)}
        caption={t("payroll.mine.salesCaption", { services: formatMoney(member.serviceSales), products: formatMoney(member.productSales) })}
        hint={t("payroll.mine.salesHint")}
        tone="brand"
        icon="chart"
      />
      <MetricCard label={t("payroll.rent.held")} value={formatMoney(member.held ?? 0)} caption={t("payroll.mine.heldCaption")} hint={t("payroll.mine.heldHint")} tone="positive" icon="award" />
      <MetricCard
        label={t("payroll.mine.toBarbershop")}
        value={formatMoney(member.rent + member.deductions)}
        caption={t("payroll.mine.toBarbershopCaption", { rent: formatMoney(member.rent), deductions: formatMoney(member.deductions) })}
        hint={t("payroll.mine.toBarbershopHint")}
        tone="warning"
        icon="building"
      />
      <MetricCard
        label={t("payroll.column.net")}
        value={owes ? t("payroll.mine.netOwes", { amount: formatMoney(-balance) }) : balance === 0 ? t("payroll.rent.upToDate") : formatMoney(balance)}
        caption={(member.rentPaid ?? 0) > 0 ? t("payroll.mine.rentPaidCaption", { amount: formatMoney(member.rentPaid ?? 0) }) : t(owes ? "payroll.mine.netCaptionNegative" : "payroll.mine.netCaptionPositive")}
        hint={t("payroll.mine.netHint")}
        tone={owes ? "warning" : "positive"}
        icon="users"
      />
    </>
  );
}
