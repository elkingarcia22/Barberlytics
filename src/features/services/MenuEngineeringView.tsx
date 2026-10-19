import * as React from "react";
import { Link } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/charts";
import { TableShell } from "@/components/data-display/TableShell";
import { SegmentedControl } from "@/components/selection";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { InfoCard } from "@/features/team/teamShared";
import { QUADRANTS, QUADRANT_KEYS, useMenuEngineering, type MenuEngineering, type MenuItem, type Quadrant } from "./menu";

const PERIODS = ["30", "90", "180"] as const;
const QUADRANT_BADGE: Readonly<Record<Quadrant, "positive" | "warning" | "info" | "negative">> = { star: "positive", plowhorse: "warning", puzzle: "info", dog: "negative" };

/**
 * Qué servicio deja más por cada hora de silla, con la agenda real: precio cobrado menos insumos y
 * comisión, dividido por el tiempo que ocupa (duración más preparación). Y la matriz que ordena el
 * catálogo como un restaurante su carta: estrellas, caballos de tiro, enigmas y perros, cada uno con
 * lo que conviene hacer. Lo cobrado por barberos de renta no cuenta: es de ellos.
 */
export function MenuEngineeringView({ branchId }: { branchId: string }) {
  const t = useAppT();
  const [days, setDays] = React.useState<(typeof PERIODS)[number]>("90");
  const query = useMenuEngineering(branchId, Number(days));

  return (
    <div className="space-y-section" data-testid="menu-engineering">
      <div className="flex flex-wrap items-center justify-between gap-stack">
        <Text variant="muted" className="max-w-2xl">
          {t("services.menu.intro")}
        </Text>
        <SegmentedControl options={PERIODS.map((value) => ({ value, label: t("services.menu.days", { count: Number(value) }) }))} value={days} onChange={(value) => setDays(value as (typeof PERIODS)[number])} ariaLabel={t("services.menu.period")} />
      </div>
      <QueryBoundary query={query} loading={<Skeleton className="h-96 w-full rounded-2xl" />}>
        {(data) => <MenuBody data={data} />}
      </QueryBoundary>
    </div>
  );
}

function MenuBody({ data }: { data: MenuEngineering }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const formatMoney = useMoney();
  const byQuadrant = (quadrant: Quadrant) => data.items.filter((item) => item.quadrant === quadrant);

  if (data.items.length === 0) return <Text variant="muted">{t("services.menu.empty")}</Text>;
  return (
    <>
      <section aria-label={t("services.menu.summaryAria")} className="grid gap-stack lg:grid-cols-3">
        <MetricCard label={t("services.menu.perHour")} value={formatMoney(data.avgMarginPerHour)} caption={t("services.menu.perHourCaption")} hint={t("services.menu.perHourHint")} tone="brand" icon="chart" />
        <MetricCard label={t("services.menu.hours")} value={formatNumber(data.chairHours, { maximumFractionDigits: 0 })} caption={t("services.menu.hoursCaption", { count: data.units, margin: formatMoney(data.margin) })} tone="positive" icon="clock" />
        <MetricCard
          label={t("services.menu.coverage")}
          value={`${data.costCoverage.withCost}/${data.costCoverage.total}`}
          caption={t(data.costCoverage.withCost < data.costCoverage.total ? "services.menu.coverageMissing" : "services.menu.coverageFull")}
          tone={data.costCoverage.withCost < data.costCoverage.total ? "warning" : "positive"}
          icon="file"
        />
      </section>

      <section aria-label={t("services.menu.matrix")} className="grid gap-stack md:grid-cols-2" data-testid="menu-matrix">
        {QUADRANTS.map((quadrant) => (
          <InfoCard key={quadrant} title={t(QUADRANT_KEYS[quadrant].label)} description={t(QUADRANT_KEYS[quadrant].hint)}>
            <div className="space-y-2">
              {byQuadrant(quadrant).length === 0 ? (
                <Text variant="muted">{t("services.menu.none")}</Text>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {byQuadrant(quadrant).map((item) => (
                    <li key={item.serviceId}>
                      <Badge variant={QUADRANT_BADGE[quadrant]}>
                        {item.name} · {formatMoney(item.marginPerHour)}/h
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              <Text variant="muted" className="text-xs">
                {t(QUADRANT_KEYS[quadrant].action)}
              </Text>
            </div>
          </InfoCard>
        ))}
      </section>

      <TableShell title={t("services.menu.tableTitle")} description={t("services.menu.tableHint", { average: formatMoney(data.avgMarginPerHour) })}>
        <Table data-testid="menu-table">
          <TableHeader>
            <TableRow>
              <TableHead>{t("services.menu.col.service")}</TableHead>
              <TableHead className="text-right">{t("services.menu.col.units")}</TableHead>
              <TableHead className="text-right">{t("services.menu.col.price")}</TableHead>
              <TableHead className="text-right">{t("services.menu.col.cost")}</TableHead>
              <TableHead className="text-right">{t("services.menu.col.commission")}</TableHead>
              <TableHead className="text-right">{t("services.menu.col.minutes")}</TableHead>
              <TableHead className="text-right">{t("services.menu.col.perHour")}</TableHead>
              <TableHead>{t("services.menu.col.suggestion")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <MenuRow key={item.serviceId} item={item} average={data.avgMarginPerHour} formatMoney={formatMoney} />
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </>
  );
}

function MenuRow({ item, average, formatMoney }: { item: MenuItem; average: number; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const suggestion =
    item.targetPrice !== null
      ? t(item.quadrant === "dog" ? "services.menu.suggest.dog" : "services.menu.suggest.price", { price: formatMoney(item.targetPrice), percent: formatNumber(((item.targetPrice - item.avgPrice) / item.avgPrice) * 100, { maximumFractionDigits: 0 }) })
      : t(item.quadrant === "puzzle" ? "services.menu.suggest.promote" : "services.menu.suggest.keep");
  return (
    <TableRow>
      <TableCell>
        <span className="flex flex-col">
          <Link to={`/servicios/${item.serviceId}`} className="font-semibold text-text-primary hover:underline">
            {item.name}
          </Link>
          <Badge variant={QUADRANT_BADGE[item.quadrant]} className="mt-1 w-fit">
            {t(QUADRANT_KEYS[item.quadrant].label)}
          </Badge>
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {item.units}
        <span className="block text-xs text-text-muted">{formatNumber(item.popularity, { maximumFractionDigits: 1 })} %</span>
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(item.avgPrice)}</TableCell>
      <TableCell className="text-right tabular-nums">{item.hasCost ? formatMoney(item.unitCost) : <span className="text-status-warning">{t("services.menu.noCost")}</span>}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(item.unitCommission)}</TableCell>
      <TableCell className="text-right tabular-nums">{item.minutesPerUnit}</TableCell>
      <TableCell className={cn("text-right font-semibold tabular-nums", item.marginPerHour >= average ? "text-status-positive" : "text-text-primary")}>{formatMoney(item.marginPerHour)}</TableCell>
      <TableCell className="min-w-56 text-sm text-text-secondary">{suggestion}</TableCell>
    </TableRow>
  );
}
