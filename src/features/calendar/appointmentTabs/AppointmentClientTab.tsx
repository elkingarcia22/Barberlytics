import { addDays, format } from "date-fns";
import { Activity, CalendarCheck2, CircleCheck, ExternalLink, TriangleAlert } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { DrawerSection } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { DetailRow } from "../calendarShared";
import type { ModelContext } from "../calendarModel";
import type { Appointment, Client } from "../types";

/**
 * Cliente: su ritmo (cada cuánto vuelve y para cuándo agendarlo), su
 * cumplimiento, sus alertas y el enlace a la ficha completa.
 */

export interface AppointmentClientTabProps {
  client: Client | null;
  appointment: Appointment;
  ctx: ModelContext;
  onOpenClient: (clientId: string) => void;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AppointmentClientTab({ client, ctx, onOpenClient }: AppointmentClientTabProps) {
  const t = useAppT();
  const { locale, formatDate } = useLocale();
  void ctx;

  if (!client || client.type === "walkin") {
    return <Text variant="muted">{t("calendar.notes.walkIn")}</Text>;
  }

  const lastVisit = client.lastVisitAt ? new Date(client.lastVisitAt) : null;
  const suggested = lastVisit && client.visitEveryDays ? addDays(lastVisit, client.visitEveryDays) : null;
  const attended = Math.max(0, client.visits - client.noShows);
  const reliable = client.noShows === 0;

  return (
    <div className="space-y-3">
      <DrawerSection icon={Activity} tone="positive" title={t("calendar.client.rhythm")} hint={t("calendar.client.rhythmHint")}>
        <div className="space-y-3">
          <div>
            <Text size="lg" weight="semibold">
              {client.visitEveryDays ? t("calendar.client.every", { days: client.visitEveryDays }) : t("calendar.client.noRhythm")}
            </Text>
            <Text variant="muted">{t("calendar.client.over", { count: client.visits })}</Text>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-surface-subtle p-3">
            <CalendarCheck2 className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <Text variant="label" tone="muted" className="uppercase tracking-wide">
                {t("calendar.client.scheduleFor")}
              </Text>
              <Text weight="semibold">{suggested ? capitalize(format(suggested, "EEEE, dd/MMM", { locale: calendarLocale(locale) })) : "—"}</Text>
            </div>
          </div>
          {lastVisit && (
            <DetailRow label={t("calendar.client.lastVisit")}>{formatDate(lastVisit, { day: "numeric", month: "short", year: "numeric" })}</DetailRow>
          )}
        </div>
      </DrawerSection>

      <DrawerSection icon={CircleCheck} tone={reliable ? "positive" : "warning"} title={t("calendar.client.compliance")} hint={t("calendar.client.complianceHint")}>
        <div className="flex items-start gap-3 rounded-lg bg-surface-subtle p-3">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <Text weight="semibold">{t("calendar.client.came", { done: attended, total: client.visits })}</Text>
            <Text variant="muted">{reliable ? t("calendar.client.reliable") : t("calendar.client.missed", { count: client.noShows })}</Text>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection icon={TriangleAlert} tone={client.cancellations > 0 || client.noShows > 0 ? "negative" : "neutral"} title={t("calendar.client.alerts")} hint={t("calendar.client.complianceHint")}>
        <div>
          <DetailRow label={t("calendar.client.cancelled")} strong>
            {client.cancellations}
          </DetailRow>
          <DetailRow label={t("calendar.client.noShows")} strong>
            {client.noShows}
          </DetailRow>
        </div>
      </DrawerSection>

      <DrawerSection
        icon={ExternalLink}
        tone="brand"
        title={t("calendar.client.visits")}
        hint={t("calendar.client.visitsHint")}
        action={
          <Button size="xs" variant="outline" onClick={() => onOpenClient(client.id)}>
            {t("calendar.client.openProfile")}
          </Button>
        }
      >
        <Text variant="muted">{t("calendar.client.fullHistory")}</Text>
      </DrawerSection>
    </div>
  );
}
