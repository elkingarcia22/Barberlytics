import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ShellHeaderSlot } from "@/components/app-shell";
import { QueryBoundary } from "@/lib/query";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { MetricsFilters } from "./MetricsFilters";
import { useBarbersMetrics, useBusinessMetrics, useCustomersMetrics, useInsightsMetrics, useMarketingMetrics } from "./queries";
import { METRICS_TABS, useMetricsFilters, type MetricsTab } from "./useMetricsFilters";
import { MetricsPulse } from "./sections/MetricsPulse";
import { MetricsAlerts } from "./sections/MetricsAlerts";
import { SalesSection } from "./sections/SalesSection";
import { AppointmentsSection } from "./sections/AppointmentsSection";
import { CatalogSection } from "./sections/CatalogSection";
import { CustomersDashboard } from "./tabs/CustomersDashboard";
import { BarbersDashboard } from "./tabs/BarbersDashboard";
import { MarketingDashboard } from "./tabs/MarketingDashboard";
import { InsightsDashboard } from "./tabs/InsightsDashboard";
import type { MetricsBusiness, MetricsParams } from "./types";

const TAB_LABELS: Readonly<Record<MetricsTab, AppMessageKey>> = {
  business: "metrics.tab.business",
  customers: "metrics.tab.customers",
  barbers: "metrics.tab.barbers",
  marketing: "metrics.tab.marketing",
  insights: "metrics.tab.insights",
};

/** El esqueleto de un tablero mientras llega la primera respuesta. */
function MetricsLoading() {
  return (
    <div className="flex flex-col space-y-section" role="status" aria-busy="true" aria-live="polite">
      <div className="grid gap-stack md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid gap-stack lg:grid-cols-3">
        <Skeleton className="h-[320px] rounded-2xl lg:col-span-2" />
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    </div>
  );
}

/** Mientras se recarga con otro periodo, el tablero anterior se queda a media luz. */
function Fading({ stale, children }: { stale: boolean; children: React.ReactNode }) {
  return (
    <div className={stale ? "opacity-70 transition-opacity duration-fast" : "transition-opacity duration-fast"} data-testid="metrics-dashboard">
      {children}
    </div>
  );
}

function BusinessDashboard({ data }: { data: MetricsBusiness }) {
  return (
    <div className="flex flex-col space-y-section">
      <MetricsPulse data={data} />
      <MetricsAlerts data={data} />
      <SalesSection data={data} />
      <AppointmentsSection data={data} />
      <CatalogSection data={data} />
    </div>
  );
}

/*
 * Cada pestaña monta su propia consulta: así el hook vive donde se usa y
 * cambiar de pestaña no dispara las cinco a la vez.
 */
function BusinessTab({ params }: { params: MetricsParams }) {
  const query = useBusinessMetrics(params);
  return (
    <Fading stale={query.isPlaceholderData}>
      <QueryBoundary query={query} loading={<MetricsLoading />}>
        {(data) => <BusinessDashboard data={data} />}
      </QueryBoundary>
    </Fading>
  );
}

function CustomersTab({ params }: { params: MetricsParams }) {
  const query = useCustomersMetrics(params);
  return (
    <Fading stale={query.isPlaceholderData}>
      <QueryBoundary query={query} loading={<MetricsLoading />}>
        {(data) => <CustomersDashboard data={data} />}
      </QueryBoundary>
    </Fading>
  );
}

function BarbersTab({ params }: { params: MetricsParams }) {
  const query = useBarbersMetrics(params);
  return (
    <Fading stale={query.isPlaceholderData}>
      <QueryBoundary query={query} loading={<MetricsLoading />}>
        {(data) => <BarbersDashboard data={data} />}
      </QueryBoundary>
    </Fading>
  );
}

function MarketingTab({ params }: { params: MetricsParams }) {
  const query = useMarketingMetrics(params);
  return (
    <Fading stale={query.isPlaceholderData}>
      <QueryBoundary query={query} loading={<MetricsLoading />}>
        {(data) => <MarketingDashboard data={data} />}
      </QueryBoundary>
    </Fading>
  );
}

function InsightsTab() {
  const query = useInsightsMetrics();
  return (
    <Fading stale={false}>
      <QueryBoundary query={query} loading={<MetricsLoading />}>
        {(data) => <InsightsDashboard data={data} />}
      </QueryBoundary>
    </Fading>
  );
}

/**
 * Métricas: cómo le fue a la barbería, en cinco pestañas.
 *
 * La pestaña, el periodo, la fecha y el barbero viven en la URL; la sucursal
 * la pone la cabecera. Cambiar de periodo deja el dato anterior en pantalla
 * hasta que llega el nuevo. La pestaña de IA diagnostica los últimos tres
 * meses, así que no lleva los filtros de periodo.
 */
export function MetricsPage() {
  const t = useAppT();
  const filters = useMetricsFilters();
  /* La lista de barberos llega con Negocio y no cambia con el filtro; se
     consulta aquí para que el selector la tenga en todas las pestañas. */
  const business = useBusinessMetrics(filters.params);
  const barbers = business.data?.barbers ?? [];
  const tabs = React.useMemo(() => METRICS_TABS.map((id) => ({ id, label: t(TAB_LABELS[id]) })), [t]);
  const withPeriod = filters.tab !== "insights";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[t("metrics.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("metrics.title")} description={t("metrics.description")} />

      <ThemaTabs
        className="mb-stack"
        variant="page"
        fitContent
        tabs={tabs}
        activeTabId={filters.tab}
        onTabChange={(id) => filters.setTab(id as MetricsTab)}
      />

      <div className="flex flex-col space-y-section">
        {withPeriod ? (
          <MetricsFilters
            granularity={filters.granularity}
            onGranularityChange={filters.setGranularity}
            date={filters.date}
            onDateChange={filters.setDate}
            barberId={filters.barberId}
            onBarberChange={filters.setBarberId}
            barbers={barbers}
          />
        ) : (
          <p className="text-sm text-text-secondary">{t("metrics.insights.window")}</p>
        )}

        {filters.tab === "business" && <BusinessTab params={filters.params} />}
        {filters.tab === "customers" && <CustomersTab params={filters.params} />}
        {filters.tab === "barbers" && <BarbersTab params={filters.params} />}
        {filters.tab === "marketing" && <MarketingTab params={filters.params} />}
        {filters.tab === "insights" && <InsightsTab />}
      </div>
    </div>
  );
}
