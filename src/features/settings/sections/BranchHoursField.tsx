import { Copy } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { formatClock, parseClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEEK_ORDER, applyToOpenDays, type DayHours, type WeekHours, type WeekdayKey } from "@/features/branches/branchHours";
import { halfHours, weekdayLabel } from "@/features/team/teamUtils";

const HOURS = halfHours(5, 24);
const FALLBACK: DayHours = { open: "09:00", close: "19:00" };

const clock = (value: string, intl: string) => formatClock(new Date(2000, 0, 1, Math.floor(parseClock(value) / 60), parseClock(value) % 60), intl);

export interface BranchHoursFieldProps {
  value: WeekHours;
  onChange: (value: WeekHours) => void;
  error?: string;
}

/**
 * Cuándo abre la sede cada día: una fila por día con su casilla (abre o no) y sus horas. La reserva no ofrece
 * horas fuera de aquí y la ocupación se mide contra esto; el horario de cada barbero va dentro.
 */
export function BranchHoursField({ value, onChange, error }: BranchHoursFieldProps) {
  const t = useAppT();
  const { locale, current } = useLocale();
  const dateLocale = calendarLocale(locale);
  const setDay = (day: WeekdayKey, hours: DayHours | null) => onChange({ ...value, [day]: hours });
  const first = WEEK_ORDER.map((day) => value[day]).find((hours): hours is DayHours => hours !== null);

  const timeSelect = (day: WeekdayKey, hours: DayHours, edge: "open" | "close") => (
    <Select value={hours[edge]} onValueChange={(next) => setDay(day, { ...hours, [edge]: next })}>
      <SelectTrigger size="sm" className="w-full sm:w-32" aria-label={`${weekdayLabel(day, dateLocale)} · ${t(edge === "open" ? "cfg.branches.hoursOpen" : "cfg.branches.hoursClose")}`} aria-invalid={edge === "close" && parseClock(hours.close) <= parseClock(hours.open)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((hour) => (
          <SelectItem key={hour} value={hour}>
            {clock(hour, current.intl)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <section className="space-y-2" aria-labelledby="branch-hours-title" data-testid="branch-hours">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Text id="branch-hours-title" variant="label">
            {t("cfg.branches.hours")}
          </Text>
          <Text variant="muted">{t("cfg.branches.hoursHint")}</Text>
        </div>
        <Button type="button" variant="outline" size="xs" disabled={!first} onClick={() => first && onChange(applyToOpenDays(value, first))}>
          <Copy /> {t("cfg.branches.hoursCopy")}
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-lg border border-border">
        {WEEK_ORDER.map((day) => {
          const hours = value[day];
          return (
            <li key={day} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2" data-testid={`branch-hours-${day}`}>
              <label className="flex min-w-28 flex-1 items-center gap-2.5 text-sm">
                <Checkbox checked={hours !== null} onCheckedChange={(checked) => setDay(day, checked === true ? { ...(first ?? FALLBACK) } : null)} />
                <span className={hours ? "font-medium text-text-primary" : "text-text-muted"}>{weekdayLabel(day, dateLocale)}</span>
              </label>
              {hours ? (
                <span className="flex w-full items-center gap-2 sm:w-auto">
                  {timeSelect(day, hours, "open")}
                  <span aria-hidden className="text-text-muted">
                    –
                  </span>
                  {timeSelect(day, hours, "close")}
                </span>
              ) : (
                <span className="text-sm text-text-muted">{t("cfg.branches.hoursClosed")}</span>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <Text size="sm" tone="negative" role="alert">
          {error}
        </Text>
      )}
    </section>
  );
}
