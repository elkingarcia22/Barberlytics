import * as React from "react";
import { addDays, addMonths, format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, ClockIcon, ListOrderedIcon, SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/i18n";
import { useAppT } from "@/app/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SegmentedControl } from "@/components/selection";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { PersonAvatar } from "./calendarShared";
import type { Barber, CalendarView, TeamFilter } from "./types";

/**
 * La barra del calendario, de izquierda a derecha como en producción: el
 * filtro Equipo, la fecha con sus flechas y el salto a otra fecha, «Hoy»
 * cuando no se está en hoy, los ajustes y la vista.
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
  onOpenWaitlist: () => void;
  onOpenWorkHours: () => void;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function CalendarToolbar({ date, isToday, view, team, barbers, onDateChange, onViewChange, onTeamChange, onOpenWaitlist, onOpenWorkHours }: CalendarToolbarProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const dateLocale = calendarLocale(locale);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const byMonth = view === "month";
  const step = (direction: 1 | -1) => onDateChange(byMonth ? addMonths(date, direction) : addDays(date, direction));
  const label = capitalize(byMonth ? format(date, "LLLL yyyy", { locale: dateLocale }) : format(date, "EEEE d MMM", { locale: dateLocale }));

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="calendar-toolbar">
      <Select value={team} onValueChange={onTeamChange}>
        <SelectTrigger className="w-[200px]" aria-label={t("calendar.team")} data-testid="calendar-team">
          <ThemaIcon name="users" size="sm" decorative />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="working">{t("calendar.team.working")}</SelectItem>
          <SelectItem value="all">{t("calendar.team.all")}</SelectItem>
          <SelectSeparator />
          {barbers.map((barber) => (
            <SelectItem key={barber.id} value={barber.id}>
              <span className="flex items-center gap-2">
                <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
                {barber.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label={byMonth ? t("calendar.prevMonth") : t("calendar.prevDay")} onClick={() => step(-1)}>
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
        <Button variant="outline" size="icon" aria-label={byMonth ? t("calendar.nextMonth") : t("calendar.nextDay")} onClick={() => step(1)}>
          <ChevronRight />
        </Button>
        {!isToday && (
          <Button variant="outline" onClick={() => onDateChange(new Date())} data-testid="calendar-today">
            {t("date.today")}
          </Button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t("calendar.settings")}>
              <SlidersHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpenWorkHours}>
              <ClockIcon className="size-4" /> {t("calendar.action.workHours")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onOpenWaitlist}>
              <ListOrderedIcon className="size-4" /> {t("calendar.action.waitlist")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SegmentedControl
          className="w-auto"
          size="sm"
          ariaLabel={t("date.changeView")}
          options={[
            { value: "agenda", label: t("calendar.view.agenda") },
            { value: "day", label: t("calendar.view.day") },
            { value: "month", label: t("calendar.view.month") },
          ]}
          value={view}
          onChange={(value) => onViewChange(value as CalendarView)}
        />
      </div>
    </div>
  );
}
