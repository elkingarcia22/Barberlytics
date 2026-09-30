import { Copy } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { formatClock, parseClock } from "@/components/scheduling";
import { InfoCard } from "../teamShared";
import type { WeekSchedule, WorkingRange } from "../types";
import { WEEKDAYS, halfHours, orderedWeekdays, weekdayLabel, weeklyHours } from "../teamUtils";

/**
 * La pestaña Calendario de la ficha: el horario fijo de la semana, una fila
 * por día con su casilla y sus horas. Es el de todas las semanas; un cambio
 * de un día concreto se hace en Horas de trabajo.
 */

export interface ScheduleFormProps {
  value: WeekSchedule;
  onChange: (value: WeekSchedule) => void;
  error?: string;
}

const HOURS = halfHours(5, 24);
const DEFAULT_RANGE: WorkingRange = { start: "09:00", end: "18:00" };


const clock = (value: string, intl: string) => formatClock(new Date(2000, 0, 1, Math.floor(parseClock(value) / 60), parseClock(value) % 60), intl);

export function ScheduleForm({ value, onChange, error }: ScheduleFormProps) {
  const t = useAppT();
  const { locale, current, formatNumber } = useLocale();
  const dateLocale = calendarLocale(locale);
  const setDay = (day: string, range: WorkingRange | null) => onChange({ ...value, [day]: range });
  const firstRange = orderedWeekdays().map((day) => value[day]).find((range): range is WorkingRange => Boolean(range));

  return (
    <InfoCard
      title={t("teamMember.schedule.title")}
      description={t("teamMember.schedule.hint")}
      actions={
        <span className="flex items-center gap-2">
          <Text variant="small" tone="secondary">
            {t("teamMember.schedule.weekHours", { hours: formatNumber(weeklyHours(value)) })}
          </Text>
          <Button type="button" variant="outline" size="sm" disabled={!firstRange} onClick={() => firstRange && onChange(Object.fromEntries(WEEKDAYS.map((day) => [day, value[day] ? { ...firstRange } : null])))}>
            <Copy /> {t("teamMember.schedule.copyToAll")}
          </Button>
        </span>
      }
    >
      <div className="space-y-2" data-testid="schedule-form">
        {orderedWeekdays().map((day) => {
          const range = value[day];
          const invalid = range ? parseClock(range.end) <= parseClock(range.start) : false;
          return (
            <div key={day} className="grid grid-cols-[auto_9rem_1fr_1fr] items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
              <Checkbox aria-label={weekdayLabel(day, dateLocale)} checked={Boolean(range)} onCheckedChange={(checked) => setDay(day, checked === true ? { ...(firstRange ?? DEFAULT_RANGE) } : null)} />
              <span className={range ? "text-sm font-medium text-text-primary" : "text-sm text-text-muted"}>{weekdayLabel(day, dateLocale)}</span>
              {range ? (
                <>
                  <Select value={range.start} onValueChange={(start) => setDay(day, { ...range, start })}>
                    <SelectTrigger size="sm" aria-label={`${weekdayLabel(day, dateLocale)} · ${t("teamMember.schedule.start")}`}>
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
                  <Select value={range.end} onValueChange={(end) => setDay(day, { ...range, end })}>
                    <SelectTrigger size="sm" aria-label={`${weekdayLabel(day, dateLocale)} · ${t("teamMember.schedule.end")}`} aria-invalid={invalid}>
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
                </>
              ) : (
                <span className="col-span-2 text-sm text-text-muted">{t("teamMember.schedule.off")}</span>
              )}
            </div>
          );
        })}
        {error && <Text tone="negative">{error}</Text>}
      </div>
    </InfoCard>
  );
}

export function ScheduleView({ value }: { value: WeekSchedule }) {
  const t = useAppT();
  const { locale, current, formatNumber } = useLocale();
  const dateLocale = calendarLocale(locale);
  return (
    <InfoCard title={t("teamMember.schedule.title")} description={t("teamMember.schedule.hint")} actions={<Text variant="small" tone="secondary">{t("teamMember.schedule.weekHours", { hours: formatNumber(weeklyHours(value)) })}</Text>}>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {orderedWeekdays().map((day) => {
          const range = value[day];
          return (
            <li key={day} className={range ? "rounded-lg border border-border/60 p-3" : "rounded-lg border border-dashed border-border/60 p-3 text-text-muted"}>
              <p className="text-xs font-semibold uppercase tracking-wide">{weekdayLabel(day, dateLocale)}</p>
              <p className="text-sm tabular-nums">{range ? `${clock(range.start, current.intl)} – ${clock(range.end, current.intl)}` : t("teamMember.schedule.off")}</p>
            </li>
          );
        })}
      </ul>
    </InfoCard>
  );
}
