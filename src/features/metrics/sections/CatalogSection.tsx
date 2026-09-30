import { Package } from "lucide-react";
import { BarList } from "@/components/charts";
import { EmptyState } from "@/components/feedback";
import { useAppT } from "@/app/i18n";
import { useMetricsFormatters } from "../metricsFormat";
import type { CatalogRow, MetricsBusiness } from "../types";

interface CatalogSectionProps {
  data: MetricsBusiness;
}

const toItems = (rows: readonly CatalogRow[], money: (value: number) => string) =>
  rows.map((row) => ({ id: row.id, label: row.name, value: row.count, meta: money(row.amount) }));

/**
 * Qué se vendió: servicios y productos, por unidades y con su importe al lado.
 * Un producto sin ventas no es un cero en una barra: es un vacío que dice qué
 * hace falta para que aparezca.
 */
export function CatalogSection({ data }: CatalogSectionProps) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const servicesCount = data.services.reduce((sum, row) => sum + row.count, 0);
  const productsCount = data.products.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="grid gap-stack lg:grid-cols-2">
      <BarList
        title={t("metrics.services.title")}
        count={format.count(servicesCount)}
        items={toItems(data.services, format.money)}
        formatValue={format.count}
        tone="positive"
        emptyLabel={t("metrics.services.empty")}
      />
      {data.products.length === 0 ? (
        <EmptyState icon={Package} title={t("metrics.products.empty")} description={t("metrics.products.emptyHint")} className="p-card" />
      ) : (
        <BarList
          title={t("metrics.products.title")}
          count={format.count(productsCount)}
          items={toItems(data.products, format.money)}
          formatValue={format.count}
          tone="warning"
          emptyLabel={t("metrics.empty")}
        />
      )}
    </div>
  );
}
