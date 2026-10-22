import * as React from "react";
import { format, startOfWeek } from "date-fns";
import { CalendarRange, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { useAccess } from "@/features/access";
import { SidePanelShell } from "@/components/overlays";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { DayStrip, formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeekQuery } from "@/features/team/queries";
import { useBranchId } from "@/features/team/teamUtils";
import { rangesOf } from "@/features/team/shiftRanges";
import { ClosureNotice, ShiftEditor } from "@/features/team/hours/ShiftEditor";
import { hoursAccess, minutesOf, shiftHours } from "@/features/team/hours/shiftEditing";
import type { ScheduleImpact, WeekRow, WorkingRange } from "@/features/team/types";
import { PersonAvatar } from "./calendarShared";
import { PanelSubpage } from "./appointmentPanel/bookingStyle";

/**
 * «Horario de trabajo» sin salir del calendario (docs/WORK_HOURS_RESEARCH.md): el día de la
 * agenda —con su semana arriba para saltar de día— y quién trabaja, en qué horas y si es su horario
 * fijo o un cambio de ese día. Tocar a alguien abre su turno (`ShiftEditor`) como página del panel:
 * atajos, «solo este día» o «este y los siguientes» y las citas que quedarían fuera. El barbero de
 * comisión lo ve, no lo cambia: se le lleva a pedir una ausencia.
 */

export interface WorkHoursDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** El día que muestra la agenda. */
  date: Date;
  /** Con alcance propio (los barberos), solo su fila. */
  ownBarberId: string | null;
  /** Abrir directo el turno de un barbero (desde el menú de su columna). */
  focusBarberId?: string | null;
  onOpenAppointment: (date: Date, id: string) => void;
  onOpenTimeOff: () => void;
}

export function WorkHoursDrawer(props: WorkHoursDrawerProps) {
  const t = useAppT();
  return (
    <SidePanelShell open={props.open} onOpenChange={props.onOpenChange} size="lg" title={t("hours.drawer.title")} description={t("hours.drawer.hint")}>
      {/* Se monta de nuevo al abrir: el día y el turno abierto salen de lo que pide la agenda. */}
      {props.open && <WorkHoursBody key={`${format(props.date, "yyyy-MM-dd")}-${props.focusBarberId ?? ""}`} {...props} />}
    </SidePanelShell>
  );
}

function WorkHoursBody({ date, ownBarberId, focusBarberId, onOpenAppointment, onOpenTimeOff }: WorkHoursDrawerProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const { current, formatNumber } = useLocale();
  const access = useAccess();
  const can = hoursAccess(access);
  const branchId = useBranchId();
  const [day, setDay] = React.useState(date);
  const [editing, setEditing] = React.useState<string | null>(focusBarberId ?? null);
  const weekStart = startOfWeek(day, { weekStartsOn: 1 });
  const weekKey = format(weekStart, "yyyy-MM-dd");
  const dayKey = format(day, "yyyy-MM-dd");
  const week = useWeekQuery(branchId, weekKey);
  const rows = (week.data?.rows ?? []).filter((row) => !ownBarberId || row.memberId === ownBarberId);
  const dayOf = (row: WeekRow) => row.days.find((item) => item.date === dayKey);
  const closure = week.data?.closures?.find((item) => item.date === dayKey) ?? null;
  const clock = (value: string) => formatClock(new Date(2000, 0, 1, Math.floor(minutesOf(value) / 60), minutesOf(value) % 60), current.intl);
  const rangeText = (range: WorkingRange) => rangesOf(range).map((piece) => `${clock(piece.start)} – ${clock(piece.end)}`).join(" · ");
  const hours = (value: number) => formatNumber(value, { maximumFractionDigits: 1 });

  const editingRow = editing ? rows.find((row) => row.memberId === editing) : undefined;
  const editingDay = editingRow ? dayOf(editingRow) : undefined;
  if (editingRow && editingDay) {
    return (
      <PanelSubpage title={t("hours.editor.title", { name: editingRow.name.split(" ")[0] })} onBack={() => setEditing(null)}>
        <DayStrip first={weekStart} count={7} value={day} onChange={setDay} ariaLabel={t("hours.drawer.dayLabel")} />
        <ShiftEditor
          key={dayKey}
          memberId={editingRow.memberId}
          memberName={editingRow.name}
          date={day}
          current={editingDay.range}
          fixed={editingDay.fixed ?? null}
          overridden={editingDay.overridden}
          access={can}
          onDone={() => setEditing(null)}
          onOpenAppointment={(item: ScheduleImpact) => onOpenAppointment(new Date(`${item.date}T00:00:00`), item.id)}
          closure={closure}
        />
      </PanelSubpage>
    );
  }

  const working = rows.filter((row) => dayOf(row)?.range);
  const total = working.reduce((sum, row) => sum + shiftHours(dayOf(row)?.range ?? null), 0);
  const readOnly = rows.length > 0 && rows.every((row) => !can.canEditDay(row.memberId));

  return (
    <div className="flex flex-col gap-4" data-testid="work-hours-drawer">
      <DayStrip first={weekStart} count={7} value={day} onChange={setDay} marked={new Set((week.data?.closures ?? []).map((item) => item.date))} ariaLabel={t("hours.drawer.dayLabel")} />
      {closure && <ClosureNotice closure={closure} clock={clock} />}
      {week.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState icon="users" title={t("hours.drawer.empty")} />
      ) : (
        <>
          <Text size="sm" tone="secondary" tabular data-testid="work-hours-summary">
            {`${t("hours.drawer.working", { count: working.length })} · ${t("hours.drawer.total", { hours: hours(total) })}`}
          </Text>
          <ListItemGroup>
            {rows.map((row) => {
              const shift = dayOf(row);
              const editable = can.canEditDay(row.memberId);
              const weekTotal = row.days.reduce((sum, item) => sum + shiftHours(item.range), 0);
              return (
                <ListItem
                  key={row.memberId}
                  leading={<PersonAvatar name={row.name} avatarUrl={row.avatarUrl} size="sm" />}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {row.name}
                      {shift?.overridden && <span className="rounded-sm bg-primary/15 px-1 text-xs font-semibold text-primary">{t("hours.drawer.onlyToday")}</span>}
                    </span>
                  }
                  description={<span className="tabular-nums">{shift?.range ? rangeText(shift.range) : t("hours.drawer.off")}</span>}
                  meta={<span className="tabular-nums">{t("hours.drawer.weekHours", { hours: hours(weekTotal) })}</span>}
                  onClick={editable ? () => setEditing(row.memberId) : undefined}
                  data-testid={`work-hours-row-${row.memberId}`}
                />
              );
            })}
          </ListItemGroup>
        </>
      )}

      {readOnly && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-subtle p-4">
          <Text size="sm" tone="secondary">
            {t("hours.drawer.readOnly")}
          </Text>
          <Button variant="outline" size="sm" className="self-start" onClick={onOpenTimeOff}>
            <Clock /> {t("hours.drawer.askTimeOff")}
          </Button>
        </div>
      )}

      {access.can("team") && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => navigate(`/usuarios/horarios?semana=${weekKey}`)} data-testid="work-hours-week">
          <CalendarRange /> {t("hours.drawer.seeWeek")}
        </Button>
      )}
    </div>
  );
}
