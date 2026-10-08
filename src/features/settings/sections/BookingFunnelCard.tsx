import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingFunnelQuery } from "@/features/booking/queries";
import { SettingsCard } from "../SettingsFormParts";

const STEP_KEYS: Record<string, AppMessageKey> = {
  phone: "cfg.booking.funnel.phone",
  verify: "cfg.booking.funnel.verify",
  services: "cfg.booking.funnel.services",
  barber: "cfg.booking.funnel.barber",
  time: "cfg.booking.funnel.time",
  review: "cfg.booking.funnel.review",
  payment: "cfg.booking.funnel.payment",
  confirmed: "cfg.booking.funnel.confirmed",
};

/**
 * Cómo convierte la reserva en línea: de cuántos que abren el enlace, cuántos llegan a cada paso y
 * reservan, dónde se van más y qué canal (UTM) trae reservas. Junto a los enlaces, que es donde se
 * decide qué compartir.
 */
export function BookingFunnelCard() {
  const t = useAppT();
  const { formatNumber } = useLocale();
  // «29,4 %» en español, «29.4%» en inglés: el porcentaje lo formatea el idioma.
  const pct = (value: number) => formatNumber(value / 100, { style: "percent", maximumFractionDigits: 1 });
  const query = useBookingFunnelQuery(30);
  const data = query.data;
  // El paso donde más gente se va: lo primero que vale la pena mejorar.
  const worst = data?.steps.slice(1).reduce<{ step: string; drop: number } | null>((acc, item, index) => {
    const drop = (data.steps[index]?.rate ?? 0) - item.rate;
    return !acc || drop > acc.drop ? { step: item.step, drop } : acc;
  }, null);

  return (
    <SettingsCard title={t("cfg.booking.funnel.title")} description={t("cfg.booking.funnel.hint")} actions={data?.demo ? <Badge variant="neutral">{t("cfg.booking.funnel.demo")}</Badge> : undefined}>
      {query.isLoading || !data ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <div className="flex flex-col gap-5" data-testid="booking-funnel">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("cfg.booking.funnel.started"), value: String(data.started) },
              { label: t("cfg.booking.funnel.booked"), value: String(data.bookings) },
              { label: t("cfg.booking.funnel.conversion"), value: pct(data.conversion) },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5 rounded-xl bg-surface-subtle p-3">
                <Text size="xs" tone="muted">
                  {item.label}
                </Text>
                <Text size="lg" weight="semibold" tabular>
                  {item.value}
                </Text>
              </div>
            ))}
          </div>
          <ol className="flex flex-col gap-2.5">
            {data.steps.map((item) => (
              <li key={item.step} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
                <Text size="sm" truncate>
                  {t(STEP_KEYS[item.step] ?? "cfg.booking.funnel.phone")}
                </Text>
                <Progress value={item.rate} aria-label={pct(item.rate)} />
                <Text size="sm" tone="secondary" tabular className="w-20 text-right">
                  {item.sessions} · {pct(item.rate)}
                </Text>
              </li>
            ))}
          </ol>
          {worst && worst.drop > 0 && (
            <Text size="sm" tone="secondary">
              {t("cfg.booking.funnel.worst", { step: t(STEP_KEYS[worst.step] ?? "cfg.booking.funnel.phone"), drop: Math.round(worst.drop) })}
            </Text>
          )}
          {data.sources.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text variant="label">{t("cfg.booking.funnel.sources")}</Text>
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {data.sources.map((source) => (
                  <li key={source.source} className="flex items-center justify-between gap-3 px-3 py-2">
                    <Text size="sm" className="capitalize">
                      {source.source}
                    </Text>
                    <Text size="sm" tone="secondary" tabular>
                      {t("cfg.booking.funnel.sourceLine", { sessions: source.sessions, bookings: source.bookings })}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SettingsCard>
  );
}
