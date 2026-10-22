import * as React from "react";
import { addDays, addWeeks, format, startOfWeek, type Locale } from "date-fns";
import { CalendarRange, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { useAccess } from "@/features/access";
import { calendarLocale } from "@/components/date/calendarLocale";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { DayStrip, formatClock } from "@/components/scheduling";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWeekQuery } from "@/features/team/queries";
import { useBranchId } from "@/features/team/teamUtils";
import { rangesOf } from "@/features/team/shiftRanges";
import { ClosureNotice, ShiftEditor } from "@/features/team/hours/ShiftEditor";
import { hoursAccess, minutesOf, shiftHours, type HoursAccess } from "@/features/team/hours/shiftEditing";
import type { DayClosure, ScheduleDay, ScheduleImpact, WeekRow, WorkingRange } from "@/features/team/types";
import { PersonAvatar } from "./calendarShared";
import { PanelQuestion, PanelSubpage } from "./appointmentPanel/bookingStyle";
import { SaleCard, SaleCardHead } from "./saleParts";

/**
 * «Horario de trabajo» sin salir del calendario (docs/WORK_HOURS_RESEARCH.md), con la cara de los
 * demás paneles (Huecos, Crear cita): la tarjeta teñida con el resumen y tres maneras de verlo —el
 * **día** (quién trabaja y quién está libre), la **semana** del equipo (una fila por barbero, un
 * cuadro por día) y **por barbero** (su semana día a día)—. Tocar un turno abre el editor
 * (`ShiftEditor`) como página del panel. El barbero de comisión lo ve, no lo cambia: se le lleva a
 * pedir una ausencia.
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

type View = "day" | "week" | "barber";

interface Editing {
  memberId: string;
  date: Date;
}

const ONLY_TODAY = "rounded-sm bg-primary/15 px-1 text-xs font-semibold text-primary";

export function WorkHoursDrawer(props: WorkHoursDrawerProps) {
  const t = useAppT();
  return (
    <SidePanelShell open={props.open} onOpenChange={props.onOpenChange} size="lg" title={t("hours.drawer.title")}>
      {/* Se monta de nuevo al abrir: el día y el turno abierto salen de lo que pide la agenda. */}
      {props.open && <WorkHoursBody key={`${format(props.date, "yyyy-MM-dd")}-${props.focusBarberId ?? ""}`} {...props} />}
    </SidePanelShell>
  );
}

function WorkHoursBody({ date, ownBarberId, focusBarberId, onOpenAppointment, onOpenTimeOff }: WorkHoursDrawerProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const { current, formatNumber, locale } = useLocale();
  const dateLocale = calendarLocale(locale);
  const access = useAccess();
  const can = hoursAccess(access);
  const branchId = useBranchId();
  // El barbero ve lo suyo: su semana, sin elegir a nadie más.
  const [view, setView] = React.useState<View>(ownBarberId ? "barber" : "day");
  const [day, setDay] = React.useState(date);
  const [barberId, setBarberId] = React.useState<string | null>(ownBarberId ?? focusBarberId ?? null);
  const [editing, setEditing] = React.useState<Editing | null>(focusBarberId ? { memberId: focusBarberId, date } : null);
  const weekStart = startOfWeek(day, { weekStartsOn: 1 });
  const weekKey = format(weekStart, "yyyy-MM-dd");
  const dayKey = format(day, "yyyy-MM-dd");
  const week = useWeekQuery(branchId, weekKey);
  const rows = (week.data?.rows ?? []).filter((row) => !ownBarberId || row.memberId === ownBarberId);
  const closures = week.data?.closures ?? [];
  const closureOf = (key: string): DayClosure | null => closures.find((item) => item.date === key) ?? null;
  const clock = (value: string) => formatClock(new Date(2000, 0, 1, Math.floor(minutesOf(value) / 60), minutesOf(value) % 60), current.intl);
  const rangeText = (range: WorkingRange) => rangesOf(range).map((piece) => `${clock(piece.start)} – ${clock(piece.end)}`).join(" · ");
  const hours = (value: number) => formatNumber(value, { maximumFractionDigits: 1 });
  const dayOf = (row: WeekRow, key = dayKey) => row.days.find((item) => item.date === key);
  /** Abrir un turno: el día pasa a ser ese (la semana que se pide es la suya). */
  const edit = (memberId: string, at: Date) => {
    setDay(at);
    setEditing({ memberId, date: at });
  };

  const editingRow = editing ? rows.find((row) => row.memberId === editing.memberId) : undefined;
  const editingKey = editing ? format(editing.date, "yyyy-MM-dd") : "";
  const editingDay = editingRow ? dayOf(editingRow, editingKey) : undefined;
  if (editing && editingRow && editingDay) {
    return (
      <PanelSubpage title={t("hours.editor.title", { name: editingRow.name.split(" ")[0] })} onBack={() => setEditing(null)}>
        <DayStrip first={weekStart} count={7} value={editing.date} onChange={(next) => edit(editing.memberId, next)} ariaLabel={t("hours.drawer.dayLabel")} />
        <ShiftEditor
          key={`${editing.memberId}-${editingKey}`}
          memberId={editingRow.memberId}
          memberName={editingRow.name}
          date={editing.date}
          current={editingDay.range}
          fixed={editingDay.fixed ?? null}
          overridden={editingDay.overridden}
          access={can}
          onDone={() => setEditing(null)}
          onOpenAppointment={(item: ScheduleImpact) => onOpenAppointment(new Date(`${item.date}T00:00:00`), item.id)}
          closure={closureOf(editingKey)}
        />
      </PanelSubpage>
    );
  }

  const readOnly = rows.length > 0 && rows.every((row) => !can.canEditDay(row.memberId));
  const working = rows.filter((row) => dayOf(row)?.range);
  const dayTotal = working.reduce((sum, row) => sum + shiftHours(dayOf(row)?.range ?? null), 0);
  const weekTotal = rows.reduce((sum, row) => sum + row.days.reduce((total, item) => total + shiftHours(item.range), 0), 0);
  const barber = rows.find((row) => row.memberId === barberId) ?? rows[0];
  const barberTotal = barber ? barber.days.reduce((sum, item) => sum + shiftHours(item.range), 0) : 0;
  const weekLabel = `${format(weekStart, "d MMM", { locale: dateLocale })} – ${format(addDays(weekStart, 6), "d MMM", { locale: dateLocale })}`;
  const planText = (row: WeekRow) => {
    if (!row.plan) return null;
    return row.plan.cycleWeeks > 1 ? t("hours.drawer.cycleWeek", { week: row.plan.cycleWeek, count: row.plan.cycleWeeks }) : t("hours.plans.since", { date: format(new Date(`${row.plan.from}T00:00:00`), "d MMM", { locale: dateLocale }) });
  };
  const head = {
    day: { title: t("hours.drawer.working", { count: working.length }), lead: `${format(day, "EEEE d 'de' MMMM", { locale: dateLocale })} · ${t("hours.drawer.total", { hours: hours(dayTotal) })}` },
    week: { title: t("hours.drawer.total", { hours: hours(weekTotal) }), lead: `${weekLabel} · ${t("hours.drawer.people", { count: rows.length })}` },
    barber: { title: barber?.name ?? "—", lead: barber ? [weekLabel, t("hours.drawer.weekHours", { hours: hours(barberTotal) }), planText(barber)].filter(Boolean).join(" · ") : "" },
  }[view];

  const weekNav = (
    <div className="flex items-center justify-between gap-2" data-testid="work-hours-week-nav">
      <Button variant="ghost" size="icon-sm" aria-label={t("teamHours.prevWeek")} onClick={() => setDay(addWeeks(day, -1))}>
        <ChevronLeft />
      </Button>
      <Text size="sm" weight="medium" className="first-letter:uppercase">
        {weekLabel}
      </Text>
      <Button variant="ghost" size="icon-sm" aria-label={t("teamHours.nextWeek")} onClick={() => setDay(addWeeks(day, 1))}>
        <ChevronRight />
      </Button>
    </div>
  );

  return (
    <div data-testid="work-hours-drawer">
      <SaleCard testId="work-hours-cards">
        <SaleCardHead eyebrow={t("hours.drawer.title")} title={head.title} lead={head.lead} />

        <PanelQuestion title={t("hours.view.question")}>
          <SegmentedControl
            size="sm"
            fullWidth
            ariaLabel={t("hours.view.question")}
            value={view}
            onChange={(value) => setView(value as View)}
            options={[...(ownBarberId ? [] : [{ value: "day", label: t("hours.view.day") }, { value: "week", label: t("hours.view.week") }]), { value: "barber", label: ownBarberId ? t("hours.view.mine") : t("hours.view.barber") }]}
          />
        </PanelQuestion>

        {week.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : rows.length === 0 ? (
          <EmptyState icon="users" title={t("hours.drawer.empty")} />
        ) : view === "day" ? (
          <>
            <DayStrip first={weekStart} count={7} value={day} onChange={setDay} marked={new Set(closures.map((item) => item.date))} ariaLabel={t("hours.drawer.dayLabel")} />
            {closureOf(dayKey) && <ClosureNotice closure={closureOf(dayKey)!} clock={clock} />}
            <DayGroups rows={rows} dayKey={dayKey} can={can} rangeText={rangeText} hours={hours} onEdit={(memberId) => edit(memberId, day)} />
          </>
        ) : view === "week" ? (
          <>
            {weekNav}
            <PanelQuestion title={t("hours.drawer.weekTitle")}>
              <WeekGrid rows={rows} weekStart={weekStart} closures={closures} can={can} hours={hours} onEdit={edit} dateLocale={dateLocale} />
            </PanelQuestion>
          </>
        ) : (
          barber && (
            <>
              {!ownBarberId && (
                <Select value={barber.memberId} onValueChange={setBarberId}>
                  <SelectTrigger aria-label={t("hours.view.barber")} data-testid="work-hours-barber">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rows.map((row) => (
                      <SelectItem key={row.memberId} value={row.memberId}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {weekNav}
              <PanelQuestion title={t("hours.drawer.barberWeek", { name: barber.name.split(" ")[0] })}>
                <ListItemGroup aria-label={t("hours.drawer.barberWeek", { name: barber.name.split(" ")[0] })}>
                  {barber.days.map((item) => {
                    const at = new Date(`${item.date}T00:00:00`);
                    return (
                      <ListItem
                        key={item.date}
                        size="sm"
                        title={
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="first-letter:uppercase">{format(at, "EEEE d", { locale: dateLocale })}</span>
                            <ShiftBadges day={item} closure={closureOf(item.date)} />
                          </span>
                        }
                        description={<span className="tabular-nums">{item.range ? rangeText(item.range) : t("hours.drawer.off")}</span>}
                        meta={item.range ? <HoursChip value={hours(shiftHours(item.range))} /> : undefined}
                        onClick={can.canEditDay(barber.memberId) ? () => edit(barber.memberId, at) : undefined}
                        data-testid={`work-hours-day-${item.date}`}
                      />
                    );
                  })}
                </ListItemGroup>
              </PanelQuestion>
            </>
          )
        )}

        {readOnly && (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
            <Text size="sm" tone="secondary">
              {t("hours.drawer.readOnly")}
            </Text>
            <Button variant="outline" size="sm" className="self-start" onClick={onOpenTimeOff}>
              <Clock /> {t("hours.drawer.askTimeOff")}
            </Button>
          </div>
        )}

        {access.can("team") && (
          <PanelFooter>
            <Button size="lg" variant="outline" className="w-full" onClick={() => navigate(`/usuarios/horarios?semana=${weekKey}`)} data-testid="work-hours-week">
              <CalendarRange /> {t("hours.drawer.seeWeek")}
            </Button>
          </PanelFooter>
        )}
      </SaleCard>
    </div>
  );
}

/** Las horas de un turno, en la pastilla que usan los demás paneles para las duraciones. */
function HoursChip({ value }: { value: string }) {
  const t = useAppT();
  return <span className="rounded-sm bg-muted px-1 text-xs font-semibold tabular-nums text-text-secondary">{t("hours.drawer.hoursShort", { hours: value })}</span>;
}

/** «Solo este día» si el turno es un cambio de esa fecha; el festivo o cierre, si lo hay. */
function ShiftBadges({ day, closure }: { day: ScheduleDay; closure: DayClosure | null }) {
  const t = useAppT();
  return (
    <>
      {day.overridden && <span className={ONLY_TODAY}>{t("hours.drawer.onlyToday")}</span>}
      {closure && <span className={cn("rounded-sm px-1 text-xs font-semibold", closure.closed || closure.open ? "bg-warning/20 text-warning" : "bg-muted text-text-secondary")}>{closure.name}</span>}
    </>
  );
}

interface DayGroupsProps {
  rows: readonly WeekRow[];
  dayKey: string;
  can: HoursAccess;
  rangeText: (range: WorkingRange) => string;
  hours: (value: number) => string;
  onEdit: (memberId: string) => void;
}

/** El día: quién trabaja (con sus franjas y horas) y, aparte, quién está libre. */
function DayGroups({ rows, dayKey, can, rangeText, hours, onEdit }: DayGroupsProps) {
  const t = useAppT();
  const dayOf = (row: WeekRow) => row.days.find((item) => item.date === dayKey);
  const groups = [
    { id: "working", title: t("hours.drawer.whoWorks"), items: rows.filter((row) => dayOf(row)?.range) },
    { id: "off", title: t("hours.drawer.whoOff"), items: rows.filter((row) => !dayOf(row)?.range) },
  ].filter((group) => group.items.length > 0);
  return (
    <>
      {groups.map((group) => (
        <PanelQuestion key={group.id} title={`${group.title} · ${group.items.length}`}>
          <ListItemGroup aria-label={group.title}>
            {group.items.map((row) => {
              const shift = dayOf(row);
              return (
                <ListItem
                  key={row.memberId}
                  size="sm"
                  leading={<PersonAvatar name={row.name} avatarUrl={row.avatarUrl} size="sm" />}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {row.name}
                      {shift?.overridden && <span className={ONLY_TODAY}>{t("hours.drawer.onlyToday")}</span>}
                    </span>
                  }
                  description={<span className="tabular-nums">{shift?.range ? rangeText(shift.range) : t("hours.drawer.off")}</span>}
                  meta={shift?.range ? <HoursChip value={hours(shiftHours(shift.range))} /> : undefined}
                  onClick={can.canEditDay(row.memberId) ? () => onEdit(row.memberId) : undefined}
                  data-testid={`work-hours-row-${row.memberId}`}
                />
              );
            })}
          </ListItemGroup>
        </PanelQuestion>
      ))}
    </>
  );
}

interface WeekGridProps {
  rows: readonly WeekRow[];
  weekStart: Date;
  closures: readonly DayClosure[];
  can: HoursAccess;
  hours: (value: number) => string;
  onEdit: (memberId: string, at: Date) => void;
  dateLocale: Locale;
}

const WEEK_COLUMNS = "grid grid-cols-[minmax(0,6rem)_repeat(7,minmax(0,1fr))] items-center gap-1 px-2";

/** La semana del equipo: una fila por barbero y un cuadro por día con sus horas; tocar un cuadro abre ese turno. */
function WeekGrid({ rows, weekStart, closures, can, hours, onEdit, dateLocale }: WeekGridProps) {
  const t = useAppT();
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const todayKey = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface" data-testid="work-hours-week-grid">
      <div className={cn(WEEK_COLUMNS, "border-b border-border py-2")}>
        <span />
        {days.map((at) => {
          const key = format(at, "yyyy-MM-dd");
          const closure = closures.find((item) => item.date === key);
          return (
            <span key={key} className={cn("flex flex-col items-center text-xs leading-tight", key === todayKey ? "font-semibold text-primary" : "text-text-muted", closure?.closed && "text-warning")} title={closure?.name}>
              <span className="uppercase">{format(at, "EEEEE", { locale: dateLocale })}</span>
              <span className="tabular-nums">{format(at, "d")}</span>
            </span>
          );
        })}
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {rows.map((row) => (
          <li key={row.memberId} className={cn(WEEK_COLUMNS, "py-1.5")}>
            <span className="flex min-w-0 items-center gap-1.5">
              <PersonAvatar name={row.name} avatarUrl={row.avatarUrl} size="sm" />
              <Text as="span" size="xs" weight="medium" truncate>
                {row.name.split(" ")[0]}
              </Text>
            </span>
            {days.map((at) => {
              const key = format(at, "yyyy-MM-dd");
              const item = row.days.find((entry) => entry.date === key);
              const value = item?.range ? hours(shiftHours(item.range)) : null;
              const label = `${row.name}, ${format(at, "EEEE d", { locale: dateLocale })}: ${value ? t("hours.drawer.hoursShort", { hours: value }) : t("hours.drawer.off")}`;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!can.canEditDay(row.memberId)}
                  onClick={() => onEdit(row.memberId, at)}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "relative flex h-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default",
                    value ? "bg-primary/15 text-primary enabled:hover:bg-primary/25" : "bg-surface-subtle text-text-muted enabled:hover:bg-muted"
                  )}
                  data-testid={`work-hours-cell-${row.memberId}-${key}`}
                >
                  {value ?? "—"}
                  {item?.overridden && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary" aria-hidden />}
                </button>
              );
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}
