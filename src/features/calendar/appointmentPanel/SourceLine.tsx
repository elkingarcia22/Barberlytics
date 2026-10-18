import { formatDistanceToNowStrict } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import type { Appointment } from "../types";

/** De dónde salió la cita y cuándo: «Reservó en línea hace 2 días». */
export function SourceLine({ appointment }: { appointment: Appointment }) {
  const t = useAppT();
  const { locale } = useLocale();
  const when = formatDistanceToNowStrict(new Date(appointment.createdAt), { addSuffix: true, locale: calendarLocale(locale) });
  const text =
    appointment.source === "walkin" || appointment.walkIn
      ? t("calendar.panel.source.walkin")
      : appointment.source === "online"
        ? t("calendar.panel.source.online", { when })
        : t("calendar.panel.source.internal", { when });
  return (
    <Text size="xs" tone="muted" className="flex items-center gap-1.5" truncate>
      <ThemaIcon name={appointment.source === "online" ? "globe" : "building"} size="xs" decorative />
      {text}
    </Text>
  );
}
