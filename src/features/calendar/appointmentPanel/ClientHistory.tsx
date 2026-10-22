import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CustomerAppointment } from "@/features/customers/types";
import type { ModelContext } from "../calendarModel";
import { barberLoyalty, visitGaps } from "./clientVisits";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Lo que la página del cliente saca de su historial (la ficha de Clientes):
 * los días entre sus últimas visitas, su fidelidad con el barbero de esta cita
 * y todas sus visitas con lo que se hizo, quién lo atendió y cuánto pagó.
 * Si la ficha no se puede leer (un barbero con un cliente ajeno), lo dice.
 */

/** Cuántas visitas se ven antes de «Ver las N visitas». */
const VISITS_SHOWN = 8;
const DAY: Intl.DateTimeFormatOptions = { day: "2-digit" };
const MONTH: Intl.DateTimeFormatOptions = { month: "short" };

/** Los saltos entre visitas como en producción: puntos unidos y los días encima; el último, el de hoy. */
export function VisitGaps({ appointments }: { appointments: readonly CustomerAppointment[] }) {
  const t = useAppT();
  const gaps = visitGaps(appointments);
  if (gaps.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3" data-testid="client-visit-gaps">
      <Text size="xs" tone="muted">
        {t("calendar.panel.client.gaps")}
      </Text>
      <ol className="flex items-end" aria-label={t("calendar.panel.client.gaps")}>
        {gaps.map((days, index) => (
          <li key={index} className="flex flex-1 items-end">
            <span className="size-2 shrink-0 rounded-full bg-border-strong" aria-hidden />
            <span className="flex flex-1 flex-col items-center gap-1">
              <Text as="span" size="xs" tone="secondary" tabular>
                {t("calendar.panel.client.gapDays", { days })}
              </Text>
              <span className="mb-[3px] h-px w-full bg-border" aria-hidden />
            </span>
          </li>
        ))}
        <li className="flex items-end" aria-hidden>
          <span className="size-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
        </li>
      </ol>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text size="sm" weight="medium" tabular className="text-right">
        {value}
      </Text>
    </div>
  );
}

/** Con quién se atiende: lo que pidió, su barbero de siempre y cómo le va con el de esta cita. */
export function LoyaltyFacts({ model, ctx, appointments }: { model: AppointmentModel; ctx: ModelContext; appointments: readonly CustomerAppointment[] }) {
  const t = useAppT();
  const known = model.known;
  if (!known) return null;
  const preferred = known.preferredBarberId ? ctx.catalog.barbers.find((barber) => barber.id === known.preferredBarberId) : undefined;
  const barber = model.barber;
  const loyalty = barberLoyalty(appointments, barber?.id ?? null);
  const barberName = barber?.name.split(" ")[0] ?? "—";
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-2" data-testid="client-loyalty">
      <Row label={t("calendar.loyalty.requested")} value={model.requested?.name ?? t("calendar.loyalty.noPreference")} />
      <Row label={t("calendar.panel.client.usualBarberLabel")} value={preferred?.name ?? t("calendar.loyalty.noPreference")} />
      {barber && loyalty.total > 0 && (
        <>
          <Row label={t("calendar.loyalty.withBarber", { name: barberName })} value={t("calendar.loyalty.visitsWith", { count: loyalty.withBarber, total: loyalty.total })} />
          <Row label={t("calendar.loyalty.otherBarbers")} value={String(loyalty.otherBarbers)} />
          <Row label={t("calendar.panel.client.streakLabel", { name: barberName })} value={t("calendar.panel.client.streakValue", { count: loyalty.streak })} />
        </>
      )}
    </div>
  );
}

/** Todas sus visitas pasadas: fecha, servicio, quién lo atendió y lo pagado; las primeras y «Ver todas». */
export function VisitList({ ctx, appointments, isLoading, isError }: { ctx: ModelContext; appointments: readonly CustomerAppointment[]; isLoading: boolean; isError: boolean }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const [expanded, setExpanded] = React.useState(false);
  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (isError) {
    return (
      <Text size="sm" tone="muted">
        {t("calendar.panel.client.visitsError")}
      </Text>
    );
  }
  const past = appointments.filter((item) => item.status !== "scheduled").sort((a, b) => b.start.localeCompare(a.start));
  if (past.length === 0) {
    return (
      <Text size="sm" tone="muted">
        {t("calendar.panel.client.visitsEmpty")}
      </Text>
    );
  }
  const shown = expanded ? past : past.slice(0, VISITS_SHOWN);
  // «29/sept», como en producción: corto y en una sola línea.
  const dayMonth = (iso: string) => `${formatDate(new Date(iso), DAY)}/${formatDate(new Date(iso), MONTH).replace(".", "")}`;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface" data-testid="client-visits">
        {shown.map((visit) => {
          const missed = visit.status === "cancelled" || visit.status === "no_show";
          return (
            <li key={visit.id} className="flex items-start gap-3 px-4 py-2.5">
              <Text as="span" size="xs" weight="semibold" tone="secondary" tabular className="w-14 shrink-0 whitespace-nowrap pt-0.5 uppercase">
                {dayMonth(visit.start)}
              </Text>
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium" truncate className={cn(missed && "text-text-muted line-through")}>
                  {visit.service}
                </Text>
                <Text as="span" size="xs" tone="muted" truncate>
                  {[visit.barber ?? t("calendar.panel.client.counterSale"), visit.status === "cancelled" ? t("calendar.panel.client.visitCancelled") : visit.status === "no_show" ? t("calendar.panel.client.visitNoShow") : null].filter(Boolean).join(" · ")}
                </Text>
              </span>
              <Text as="span" size="sm" weight="semibold" tabular className={cn("shrink-0", missed && "text-text-muted")}>
                {missed ? "—" : ctx.formatMoney(visit.total)}
              </Text>
            </li>
          );
        })}
      </ul>
      {past.length > VISITS_SHOWN && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setExpanded((current) => !current)}>
          {expanded ? t("calendar.panel.client.visitsLess") : t("calendar.panel.client.visitsAll", { count: past.length })}
        </Button>
      )}
    </div>
  );
}
