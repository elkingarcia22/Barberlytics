import * as React from "react";
import { addDays, addMonths, format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n";
import { useAppT } from "@/app/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AppMessageKey } from "@/app/i18n/types";
import { TeamPicker } from "./TeamPicker";
import { WEEK_DAYS, weekStartOf } from "./weekModel";
import type { Barber, CalendarView, TeamFilter } from "./types";

/**
 * La barra del calendario y, a la vez, su cabecera: no hay título encima —las
 * migas ya dicen dónde estás— para que la agenda gane alto. De izquierda a
 * derecha: el filtro Equipo, la fecha con sus flechas y el salto a otra
 * fecha, «Hoy» cuando no se está en hoy, los filtros, lo cobrado, la vista y
 * las acciones de la pantalla.
 */

export interface CalendarToolbarProps {
  date: Date;
  isToday: boolean;
  view: CalendarView;
  team: TeamFilter;
  barbers: readonly Barber[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onTeamChange: (team: TeamFilter) => void;
  /** Elegir a quién se ve. Un barbero solo ve su columna: para él no hay equipo que elegir. */
  showTeam?: boolean;
  /** El control de filtros (estado, servicio, densidad), cuando la vista lo admite: va en la misma fila, tras la fecha. */
  status?: React.ReactNode;
  /** Un dato corto del día (lo cobrado), tras los filtros; se pliega cuando falta ancho. */
  summary?: React.ReactNode;
  /** Los ajustes de cómo se ve (color, qué cuenta la tarjeta, densidad): a la derecha, tras el cambio de vista. */
  viewSettings?: React.ReactNode;
  /** Las acciones de la pantalla, al final de la fila. */
  actions?: React.ReactNode;
}

/** Las vistas con su atajo de una letra (`useCalendarShortcuts`): el menú los enseña para que se aprendan. */
const VIEWS: readonly { value: CalendarView; label: AppMessageKey; shortcut: string }[] = [
  { value: "agenda", label: "calendar.view.agenda", shortcut: "A" },
  { value: "day", label: "calendar.view.day", shortcut: "D" },
  { value: "week", label: "calendar.view.week", shortcut: "W" },
  { value: "month", label: "calendar.view.month", shortcut: "M" },
];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function CalendarToolbar({ date, isToday, view, team, barbers, onDateChange, onViewChange, onTeamChange, showTeam = true, status, summary, viewSettings, actions }: CalendarToolbarProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const dateLocale = calendarLocale(locale);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const byMonth = view === "month";
  const byWeek = view === "week";
  const step = (direction: 1 | -1) => onDateChange(byMonth ? addMonths(date, direction) : addDays(date, byWeek ? direction * WEEK_DAYS : direction));
  const weekStart = weekStartOf(date);
  const label = byMonth
    ? capitalize(format(date, "LLLL yyyy", { locale: dateLocale }))
    : byWeek
      ? `${format(weekStart, "d MMM", { locale: dateLocale })} – ${format(addDays(weekStart, WEEK_DAYS - 1), "d MMM", { locale: dateLocale })}`
      : capitalize(format(date, "EEEE d MMM", { locale: dateLocale }));
  const viewLabel = t(VIEWS.find((option) => option.value === view)?.label ?? "calendar.view.day");
  const prevLabel = byMonth ? t("calendar.prevMonth") : byWeek ? t("calendar.prevWeek") : t("calendar.prevDay");
  const nextLabel = byMonth ? t("calendar.nextMonth") : byWeek ? t("calendar.nextWeek") : t("calendar.nextDay");

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="calendar-toolbar">
      {showTeam && <TeamPicker team={team} barbers={barbers} onTeamChange={onTeamChange} />}

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label={prevLabel} onClick={() => step(-1)}>
          <ChevronLeft />
        </Button>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[10.5rem] justify-between" aria-label={t("calendar.jumpToDate")} data-testid="calendar-date">
              <span className="font-semibold">{label}</span>
              <CalendarIcon className="text-text-muted" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              locale={dateLocale}
              selected={date}
              onSelect={(next) => {
                if (!next) return;
                onDateChange(next);
                setPickerOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" aria-label={nextLabel} onClick={() => step(1)}>
          <ChevronRight />
        </Button>
        {!isToday && (
          <Button variant="outline" onClick={() => onDateChange(new Date())} data-testid="calendar-today">
            {t("date.today")}
          </Button>
        )}
      </div>

      {status}
      {summary}

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
        {/* La vista en un menú y no en cuatro segmentos: la fila tiene que caber
            en una línea con la lateral abierta, y cambiar de vista tiene atajo. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label={`${t("date.changeView")}: ${viewLabel}`} data-testid="calendar-view">
              {viewLabel}
              <ChevronDown className="text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup value={view} onValueChange={(value) => onViewChange(value as CalendarView)}>
              {VIEWS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {t(option.label)}
                  <DropdownMenuShortcut>{option.shortcut}</DropdownMenuShortcut>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {viewSettings}
        {actions}
      </div>
    </div>
  );
}
