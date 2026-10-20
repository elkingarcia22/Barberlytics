import { Coffee, Copy, X } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { formatClock, parseClock } from "@/components/scheduling";
import { InfoCard } from "../teamShared";
import { MAX_BREAKS, rangesOf, validBreaks } from "../shiftRanges";
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
/** Un descanso nuevo: una hora a mitad de la franja (el almuerzo). */
function newBreak(range: WorkingRange): { start: string; end: string } {
  const middle = Math.floor((parseClock(range.start) + parseClock(range.end)) / 2 / 30) * 30;
  const at = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  return { start: at(middle), end: at(middle + 60) };
}


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
          const invalid = range ? parseClock(range.end) <= parseClock(range.start) || !validBreaks(range) : false;
          const label = weekdayLabel(day, dateLocale);
          const breaks = range?.breaks ?? [];
          const setBreak = (index: number, next: { start: string; end: string } | null) => range && setDay(day, { ...range, breaks: next ? breaks.map((item, i) => (i === index ? next : item)) : breaks.filter((_, i) => i !== index) });
          return (
            <div key={day} className="space-y-2 rounded-lg border border-border/60 px-3 py-2">
              <div className="grid grid-cols-[auto_minmax(5rem,9rem)_1fr_1fr_auto] items-center gap-3">
                <Checkbox aria-label={label} checked={Boolean(range)} onCheckedChange={(checked) => setDay(day, checked === true ? { ...(firstRange ?? DEFAULT_RANGE) } : null)} />
                <span className={range ? "text-sm font-medium text-text-primary" : "text-sm text-text-muted"}>{label}</span>
                {range ? (
                  <>
                    <ClockSelect value={range.start} onChange={(start) => setDay(day, { ...range, start })} label={`${label} · ${t("teamMember.schedule.start")}`} intl={current.intl} />
                    <ClockSelect value={range.end} onChange={(end) => setDay(day, { ...range, end })} label={`${label} · ${t("teamMember.schedule.end")}`} intl={current.intl} invalid={invalid} />
                    <Button type="button" variant="ghost" size="icon-sm" disabled={breaks.length >= MAX_BREAKS} onClick={() => setDay(day, { ...range, breaks: [...breaks, newBreak(range)] })} aria-label={t("teamMember.schedule.addBreak", { day: label })} title={t("teamMember.schedule.addBreak", { day: label })} data-testid={`schedule-add-break-${day}`}>
                      <Coffee />
                    </Button>
                  </>
                ) : (
                  <span className="col-span-3 text-sm text-text-muted">{t("teamMember.schedule.off")}</span>
                )}
              </div>
              {range &&
                breaks.map((pause, index) => (
                  <div key={index} className="grid grid-cols-[auto_minmax(5rem,9rem)_1fr_1fr_auto] items-center gap-3 pl-1">
                    <Coffee className="size-4 text-text-muted" aria-hidden />
                    <span className="text-xs text-text-muted">{t("teamMember.schedule.break")}</span>
                    <ClockSelect value={pause.start} onChange={(start) => setBreak(index, { ...pause, start })} label={`${label} · ${t("teamMember.schedule.breakStart")}`} intl={current.intl} />
                    <ClockSelect value={pause.end} onChange={(end) => setBreak(index, { ...pause, end })} label={`${label} · ${t("teamMember.schedule.breakEnd")}`} intl={current.intl} />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setBreak(index, null)} aria-label={t("teamMember.schedule.removeBreak")}>
                      <X />
                    </Button>
                  </div>
                ))}
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
              <p className="text-sm tabular-nums">{range ? rangesOf(range).map((piece) => `${clock(piece.start, current.intl)} – ${clock(piece.end, current.intl)}`).join(" · ") : t("teamMember.schedule.off")}</p>
            </li>
          );
        })}
      </ul>
    </InfoCard>
  );
}

function ClockSelect({ value, onChange, label, intl, invalid = false }: { value: string; onChange: (value: string) => void; label: string; intl: string; invalid?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} aria-invalid={invalid}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((hour) => (
          <SelectItem key={hour} value={hour}>
            {clock(hour, intl)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
