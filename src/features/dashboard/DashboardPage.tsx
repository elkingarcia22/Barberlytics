import * as React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { QueryBoundary } from "@/lib/query";
import { useCurrentUser } from "@/features/auth";
import { useTheme } from "@/themes";
import { useDashboardSummary } from "./queries";

// ECharts pesa; se trae solo cuando esta pantalla lo necesita.
const KpiCard = React.lazy(() => import("@/components/charts/KpiCard").then((m) => ({ default: m.KpiCard })));
const BarChart = React.lazy(() => import("@/components/charts/BarChart").then((m) => ({ default: m.BarChart })));

function KpiSkeleton() {
  return <Skeleton className="h-[112px] rounded-2xl" />;
}

export function DashboardPage() {
  const user = useCurrentUser();
  const summary = useDashboardSummary();
  const { preset, resolvedMode } = useTheme();
  // Los gráficos resuelven los colores al montar; el tema los remonta.
  const chartKey = `${preset.id}-${resolvedMode}`;

  return (
    <div className="cascade-enter space-y-6">
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Un vistazo a las personas de la organización."
        actions={
          <Button asChild variant="outline">
            <Link to="/usuarios">
              Ver personas <ArrowRight />
            </Link>
          </Button>
        }
      />
      <QueryBoundary
        query={summary}
        loading={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <KpiSkeleton key={index} />
            ))}
          </div>
        }
      >
        {(data) => (
          <React.Suspense fallback={<Skeleton className="h-[320px] rounded-2xl" />}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-kpis">
              <KpiCard title="Personas" value={data.kpis.totalUsers} description="Registradas en la organización" />
              <KpiCard title="Activas" value={data.kpis.activeUsers} description="Con sesión en los últimos 30 días" trend="positive" />
              <KpiCard title="Invitadas" value={data.kpis.invitedUsers} description="Pendientes de aceptar" trend={data.kpis.invitedUsers > 5 ? "negative" : "neutral"} />
              <KpiCard title="Activación" value={`${data.kpis.activationRate}%`} description="Activas sobre el total" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart
                key={`area-${chartKey}`}
                title="Personas por área"
                description="Distribución actual"
                data={data.byArea.map((row) => ({ label: row.area, value: row.count }))}
                seriesName="Personas"
                horizontal
                height={320}
              />
              <BarChart
                key={`signups-${chartKey}`}
                title="Altas por mes"
                description="Últimos seis meses"
                data={data.signups.map((row) => ({ label: row.month, value: row.count }))}
                seriesName="Altas"
                height={320}
              />
            </div>
          </React.Suspense>
        )}
      </QueryBoundary>
    </div>
  );
}
