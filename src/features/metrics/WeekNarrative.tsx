import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { api } from "@/lib/api";
import { useMoney } from "@/features/calendar/calendarFormat";
import { NarrativeCard } from "@/features/narrative/NarrativeCard";
import type { Facts } from "@/features/narrative/narrative";

const weekSchema = z.object({
  from: z.string(),
  to: z.string(),
  revenue: z.number(),
  revenuePrev: z.number(),
  services: z.number(),
  servicesPrev: z.number(),
  occupancy: z.number(),
  noShows: z.number(),
  products: z.number(),
  topBarber: z.object({ name: z.string(), revenue: z.number() }).nullable(),
  bestDay: z.object({ day: z.string(), revenue: z.number() }).nullable(),
  atRisk: z.number(),
});

const DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };

/**
 * «Cómo te fue»: los últimos 7 días contados en palabras para el dueño, con las cifras a la vista.
 * Las calcula el sistema; la IA (si hay clave) solo las redacta.
 */
export function WeekNarrative({ branchId }: { branchId: string }) {
  const t = useAppT();
  const { formatNumber, formatDate } = useLocale();
  const formatMoney = useMoney();
  const query = useQuery({ queryKey: ["reports", "week", branchId], queryFn: ({ signal }) => api.get("/reports/week", { query: { branchId }, schema: weekSchema, signal }) });
  const data = query.data;

  const facts = React.useMemo<Facts | null>(() => {
    if (!data) return null;
    const change = data.revenuePrev > 0 ? Math.round(((data.revenue - data.revenuePrev) / data.revenuePrev) * 1000) / 10 : null;
    const out: Facts = {
      revenue: { label: t("narrative.week.revenue"), value: formatMoney(data.revenue) },
      services: { label: t("narrative.week.services"), value: formatNumber(data.services) },
      occupancy: { label: t("narrative.week.occupancy"), value: `${formatNumber(data.occupancy, { maximumFractionDigits: 0 })} %` },
      noShows: { label: t("narrative.week.noShows"), value: formatNumber(data.noShows) },
      products: { label: t("narrative.week.products"), value: formatNumber(data.products) },
      atRisk: { label: t("narrative.week.atRisk"), value: formatNumber(data.atRisk) },
    };
    if (change !== null) out.change = { label: t("narrative.week.change"), value: `${change > 0 ? "+" : ""}${formatNumber(change, { maximumFractionDigits: 1 })} %` };
    if (data.topBarber) {
      out.topBarber = { label: t("narrative.week.topBarber"), value: data.topBarber.name };
      out.topBarberRevenue = { label: t("narrative.week.topBarberRevenue"), value: formatMoney(data.topBarber.revenue) };
    }
    if (data.bestDay) out.bestDay = { label: t("narrative.week.bestDay"), value: formatDate(new Date(`${data.bestDay.day}T12:00:00`), DAY) };
    return out;
  }, [data, t, formatMoney, formatNumber, formatDate]);

  // El resumen automático: frases fijas con las mismas cifras, por si no hay IA.
  const fallback = React.useMemo(() => {
    if (!facts || !data) return "";
    const values = Object.fromEntries(Object.entries(facts).map(([key, fact]) => [key, fact.value]));
    const parts = [t(facts.change ? "narrative.week.auto.revenueChange" : "narrative.week.auto.revenue", values)];
    if (facts.topBarber) parts.push(t("narrative.week.auto.topBarber", values));
    if (facts.bestDay) parts.push(t("narrative.week.auto.bestDay", values));
    parts.push(t(data.noShows > 0 ? "narrative.week.auto.noShows" : data.atRisk > 0 ? "narrative.week.auto.atRisk" : "narrative.week.auto.occupancy", values));
    return parts.join(" ");
  }, [facts, data, t]);

  return <NarrativeCard title={t("narrative.week.title")} kind="week" facts={facts} fallback={fallback} className="mb-section" data-testid="week-narrative" />;
}
