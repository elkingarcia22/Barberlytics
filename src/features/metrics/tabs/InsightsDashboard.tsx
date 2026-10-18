import * as React from "react";
import { ClipperIcon } from "@/components/ai-interaction";
import { CheckCircle2, TrendingUp, UserMinus, Users, UserX, Wrench, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { HeatmapMatrix, MetricCard, MetricDial, PanelHeading, type HeatmapColumn, type HeatmapRow } from "@/components/charts";
import { AIInsightCard } from "@/components/ai";
import { AttentionAction, AttentionStrip } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useMetricsFormatters } from "../metricsFormat";
import type { MetricsInsights, SuggestionGroup } from "../types";

const GROUPS: readonly { id: SuggestionGroup; labelKey: AppMessageKey; icon: LucideIcon }[] = [
  { id: "clients", labelKey: "metrics.insights.group.clients", icon: Users },
  { id: "growth", labelKey: "metrics.insights.group.growth", icon: TrendingUp },
  { id: "operations", labelKey: "metrics.insights.group.operations", icon: Wrench },
];

/** Cada riesgo abre esa misma lista en Clientes (segmento o aviso), con los parámetros que Clientes lee. */
const RISK_LINKS: Readonly<Record<"churned" | "atRisk" | "overdue", string>> = {
  churned: "/clientes?tipo=lost",
  atRisk: "/clientes?tipo=atRisk",
  overdue: "/clientes?aviso=overdue",
};

/** A dónde lleva cada sugerencia; las que no tienen pantalla todavía (una campaña) no muestran botón. */
const SUGGESTION_LINKS: Readonly<Record<string, string | undefined>> = {
  "never-booked": "/clientes?tipo=new",
  overdue: "/clientes?aviso=overdue",
  "peak-hour": "/calendario",
  cancellations: "/configuracion/centro-notificaciones",
};

const RISKS: readonly { id: "churned" | "atRisk" | "overdue"; labelKey: AppMessageKey; hintKey: AppMessageKey; icon: LucideIcon; tone: "negative" | "warning" | "neutral" }[] = [
  { id: "churned", labelKey: "metrics.insights.churned", hintKey: "metrics.insights.churnedHint", icon: UserX, tone: "negative" },
  { id: "atRisk", labelKey: "metrics.insights.atRisk", hintKey: "metrics.insights.atRiskHint", icon: UserMinus, tone: "warning" },
  { id: "overdue", labelKey: "metrics.insights.overdue", hintKey: "metrics.insights.overdueHint", icon: Users, tone: "neutral" },
];

/**
 * IA: un diagnóstico de los últimos tres meses. La salud del negocio en un
 * medidor con sus cuatro lecturas, los clientes en riesgo como avisos que
 * abren la lista, la ocupación por día y hora en la matriz del sistema y las
 * sugerencias agrupadas, cada una con su evidencia y su acción.
 */
export function InsightsDashboard({ data }: { data: MetricsInsights }) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const navigate = useNavigate();
  const risksTotal = data.risks.churned + data.risks.atRisk + data.risks.overdue;

  const columns: HeatmapColumn[] = React.useMemo(
    () => data.capacity.hours.map((hour) => ({ id: String(hour), label: `${String(hour).padStart(2, "0")}:00` })),
    [data.capacity.hours]
  );
  const rows: HeatmapRow[] = React.useMemo(
    () =>
      data.capacity.rows.map((row) => ({
        id: String(row.day),
        label: t(`metrics.weekday.${row.day}` as AppMessageKey),
        values: Object.fromEntries(row.values.map((value, index) => [String(data.capacity.hours[index]), value])),
      })),
    [data.capacity, t]
  );

  return (
    <div className="flex flex-col space-y-section">
      <div className="grid gap-stack xl:grid-cols-4">
        <MetricCard
          className="lg:col-span-2"
          label={t("metrics.insights.health")}
          value={`${data.health.score}`}
          caption={t("metrics.insights.healthCaption")}
          hint={t("metrics.insights.healthHint")}
          tone={data.health.score >= 80 ? "positive" : data.health.score >= 50 ? "warning" : "negative"}
          icon="sparkles"
          chart={<MetricDial value={data.health.score} ariaLabel={`${data.health.score} / 100`} />}
        />
        <MetricCard label={t("metrics.insights.completion")} value={format.percent(data.health.completionRate)} tone={data.health.completionRate >= 70 ? "positive" : "warning"} icon="check" />
        <MetricCard label={t("metrics.insights.retention")} value={format.percent(data.health.retentionRate)} tone="brand" icon="refresh" />
        <MetricCard label={t("metrics.insights.noShow")} value={format.percent(data.health.noShowRate)} tone={data.health.noShowRate > 3 ? "negative" : "neutral"} icon="warning" />
        <MetricCard label={t("metrics.insights.ticket")} value={format.money(data.health.avgTicket)} tone="neutral" icon="analytics" />
      </div>

      <AttentionStrip
        label={t("metrics.insights.risksAria")}
        tone={risksTotal === 0 ? "positive" : "warning"}
        icon={risksTotal === 0 ? CheckCircle2 : UserMinus}
        title={risksTotal === 0 ? t("metrics.insights.risksCalm") : t("metrics.insights.risksTitle", { count: risksTotal })}
        detail={risksTotal === 0 ? t("metrics.insights.risksCalmDetail") : t("metrics.insights.risksDetail")}
      >
        {RISKS.map((risk) => {
          const count = data.risks[risk.id];
          if (count === 0) return null;
          return (
            <AttentionAction
              key={risk.id}
              icon={risk.icon}
              label={t(risk.labelKey)}
              hint={t(risk.hintKey)}
              value={count}
              tone={risk.tone}
              onClick={() => navigate(RISK_LINKS[risk.id])}
            />
          );
        })}
      </AttentionStrip>

      <Card className="flex flex-col gap-stack p-card">
        <PanelHeading title={t("metrics.insights.capacity")} description={t("metrics.insights.capacityHint")} />
        <HeatmapMatrix rowHeaderLabel={t("metrics.insights.capacityDay")} columns={columns} rows={rows} legend />
      </Card>

      <section aria-labelledby="metrics-suggestions" className="flex flex-col gap-stack">
        <div className="flex flex-wrap items-center gap-inline">
          <ClipperIcon className="size-4 text-primary" aria-hidden />
          <h2 id="metrics-suggestions" className="text-base font-semibold text-text-primary">
            {t("metrics.insights.suggestions")}
          </h2>
          <p className="basis-full text-sm text-text-secondary">{t("metrics.insights.suggestionsHint")}</p>
        </div>
        {GROUPS.map((group) => {
          const items = data.suggestions.filter((item) => item.group === group.id);
          if (items.length === 0) return null;
          const Icon = group.icon;
          return (
            <div key={group.id} className="flex flex-col gap-stack">
              <h3 className="flex items-center gap-inline text-xs font-bold uppercase tracking-wider text-text-secondary">
                <Icon className="size-3.5" aria-hidden />
                {t(group.labelKey)}
                <span className="ml-auto tabular-nums text-text-muted">{items.length}</span>
              </h3>
              <div className="grid gap-stack lg:grid-cols-2">
                {items.map((item) => (
                  <AIInsightCard
                    key={item.id}
                    type={item.type}
                    title={item.title}
                    description={item.description}
                    evidence={item.evidence}
                    impact={item.tag}
                    // Son reglas sobre tus datos, no un modelo: sin confianza inventada. El botón solo
                    // aparece si lleva a la pantalla donde se hace eso.
                    confidence={null}
                    actionLabel={SUGGESTION_LINKS[item.id] ? item.action : undefined}
                    onAction={SUGGESTION_LINKS[item.id] ? () => navigate(SUGGESTION_LINKS[item.id]!) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
