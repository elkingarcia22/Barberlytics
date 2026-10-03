import { History } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { DrawerSection } from "@/components/overlays";
import { Timeline, TimelineItem } from "@/components/data-display/Timeline";
import { historyLabel, type ModelContext } from "../calendarModel";
import type { Appointment } from "../types";

/**
 * Historial: la actividad de la cita, quién hizo qué y cuándo, del más
 * reciente al más antiguo. Solo lectura.
 */

export interface AppointmentHistoryTabProps {
  appointment: Appointment;
  ctx: ModelContext;
}

const TONE_BY_EVENT: Record<
  string,
  "default" | "primary" | "positive" | "negative" | "warning"
> = {
  created: "primary",
  walkin: "primary",
  "status:paid": "positive",
  paid: "positive",
  "status:cancelled": "negative",
  "status:no_show": "negative",
  "status:seated": "warning",
};

export function AppointmentHistoryTab({
  appointment,
  ctx,
}: AppointmentHistoryTabProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const entries = [...appointment.history].reverse();
  const origin =
    appointment.source === "online"
      ? t("calendar.history.online")
      : t("calendar.history.inShop");

  return (
    <DrawerSection
      icon={History}
      tone="neutral"
      title={t("calendar.history.title")}
      hint={t("calendar.history.hint")}
    >
      <Timeline>
        {entries.map((entry) => {
          const kind = entry.event.split(":")[0];
          const tone =
            TONE_BY_EVENT[entry.event] ?? TONE_BY_EVENT[kind] ?? "default";
          return (
            <TimelineItem
              key={entry.id}
              tone={tone}
              title={historyLabel(entry.event, ctx)}
              time={formatDate(new Date(entry.at), {
                day: "2-digit",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
              description={`${origin} · ${entry.actor}`}
            />
          );
        })}
      </Timeline>
    </DrawerSection>
  );
}
