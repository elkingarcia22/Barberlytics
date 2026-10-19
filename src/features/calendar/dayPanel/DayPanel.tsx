import * as React from "react";
import { format, isBefore, isSameDay, startOfDay } from "date-fns";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { SidePanelShell } from "@/components/overlays";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/typography";
import { ErrorState } from "@/lib/query";
import { cn } from "@/lib/utils";
import { useAbsences, type Absence } from "@/features/team/workforce";
import { PersonAvatar } from "../calendarShared";
import { appointmentTotal, applyDayHours, barberLoad, isActive, isUnpaid, isWorkingOn, type ModelContext } from "../calendarModel";
import { FULL_CALENDAR_ACCESS, scopeDay } from "../calendarAccess";
import { dayBrief, FULL_LOAD } from "../dayBrief";
import { dayWeightOf } from "../dayWeight";
import { DayWeightBadge } from "../DayWeightBadge";
import { useDayQuery, useRhythmQuery } from "../queries";
import { blockAppliesOn } from "../timeOff/timeOffModel";
import type { TimeOffFocus } from "../timeOff/TimeOffDrawer";
import type { Appointment, CalendarDay, TimeBlock } from "../types";
import { DayAbsences, DayAppointments, DayBlocks, DayClients } from "./DayPanelLists";
import { clientsOf } from "./dayPanelModel";

/**
 * El día de un vistazo, en el panel de la derecha, sin dejar la Semana o el
 * Mes: si suele ser pesado o suave, cuántas citas y cuánto lleva cobrado, cómo
 * va cada barbero, lo que pide atención, y las citas, los clientes, los
 * bloqueos y quién falta. «Abrir el día» lleva a la rejilla de ese día.
 */

export interface DayPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  branchId: string;
  ctx: ModelContext;
  /** Ir a la rejilla del día (de un barbero, si se tocó su fila). */
  onOpenDay: (date: Date, barberId: string | null) => void;
  onOpenAppointment: (date: Date, id: string) => void;
  onOpenClient: (clientId: string) => void;
  onOpenTimeOff: (focus: TimeOffFocus) => void;
  /** Agendar en ese día (sin hora: la elige quien agenda). */
  onBook?: (date: Date) => void;
}

type Tab = "appointments" | "clients" | "blocks" | "absences";

export function DayPanel({ open, onOpenChange, date, branchId, ctx, ...handlers }: DayPanelProps) {
  const { formatDate } = useLocale();
  const t = useAppT();
  const label = date ? formatDate(date, { weekday: "long", day: "numeric", month: "long" }) : "";
  const title = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={title}
      description={t("calendar.dayPanel.hint")}
      footer={
        date && (
          <div className="flex gap-2">
            {handlers.onBook && (
              <Button variant="outline" className="flex-1" onClick={() => handlers.onBook?.(date)} data-testid="day-panel-book">
                <CalendarPlus /> {t("calendar.dayPanel.book")}
              </Button>
            )}
            <Button className="flex-1" onClick={() => handlers.onOpenDay(date, null)} data-testid="day-panel-open-day">
              <CalendarDays /> {t("calendar.dayPanel.openDay")}
            </Button>
          </div>
        )
      }
    >
      {date && <DayPanelBody key={format(date, "yyyy-MM-dd")} date={date} branchId={branchId} ctx={ctx} {...handlers} />}
    </SidePanelShell>
  );
}

function DayPanelBody({ date, branchId, ctx, onOpenDay, onOpenAppointment, onOpenClient, onOpenTimeOff }: Omit<DayPanelProps, "open" | "onOpenChange" | "date" | "onBook"> & { date: Date }) {
  const t = useAppT();
  const key = format(date, "yyyy-MM-dd");
  const query = useDayQuery(branchId, key);
  const rhythm = useRhythmQuery(branchId);
  const absencesQuery = useAbsences(branchId);
  const [tab, setTab] = React.useState<Tab>("appointments");

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data || query.data.date !== key) return <Skeleton className="h-96 w-full" role="status" aria-busy="true" />;

  const access = ctx.access ?? FULL_CALENDAR_ACCESS;
  const day = scopeDay(query.data, access.ownBarberId);
  const appointments = [...day.appointments].sort((a, b) => a.start.localeCompare(b.start));
  const active = appointments.filter(isActive);
  const weight = dayWeightOf(rhythm.data, date);
  const absences = (absencesQuery.data?.items ?? []).filter((item) => item.status !== "rejected" && item.startDate <= key && key <= item.endDate && (!access.ownBarberId || item.memberId === access.ownBarberId));
  const blocks = day.blocks.filter((block) => blockAppliesOn(block, date) && !block.id.startsWith("blk_abs_"));
  const now = ctx.now ?? new Date();
  const isToday = isSameDay(date, now);
  const isPast = isBefore(startOfDay(date), startOfDay(now));

  const openAbsence = (absence: Absence) => onOpenTimeOff({ type: "absence", id: absence.id });
  const openBlock = (block: TimeBlock) => onOpenTimeOff({ type: "block", id: block.id });
  const rangeOf = (absence: Absence) => t("calendar.dayPanel.absenceRange", { from: absence.startDate.slice(5).split("-").reverse().join("/"), to: absence.endDate.slice(5).split("-").reverse().join("/") });

  return (
    <div className="space-y-5" data-testid="day-panel">
      <div className="flex flex-wrap items-center gap-1.5" data-testid="day-panel-tags">
        <DayWeightBadge weight={weight} booked={active.length} showNormal />
        {isToday && <Tag tone="primary">{t("calendar.dayPanel.tag.today")}</Tag>}
        {isPast && <Tag>{t("calendar.dayPanel.tag.past")}</Tag>}
        {absences.length > 0 && <Tag tone="warning">{t("calendar.dayPanel.tag.off", { count: absences.length })}</Tag>}
        {blocks.some((block) => block.status === "pending") && <Tag tone="warning">{t("calendar.dayPanel.tag.pendingBlocks")}</Tag>}
      </div>

      <DayStats day={day} active={active} ctx={ctx} expected={weight?.expected ?? null} showTotals={access.showTotals} isPast={isPast} />

      <DayTeam date={date} day={day} ctx={ctx} absences={absences} onOpenBarber={(barberId) => onOpenDay(date, access.ownBarberId ? null : barberId)} />

      <DayInsights day={day} ctx={ctx} date={date} />

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList variant="view" className="w-full">
          <TabsTrigger value="appointments">{t("calendar.dayPanel.tab.appointments", { count: appointments.length })}</TabsTrigger>
          <TabsTrigger value="clients">{t("calendar.dayPanel.tab.clients", { count: clientsOf(appointments).length })}</TabsTrigger>
          <TabsTrigger value="blocks">{t("calendar.dayPanel.tab.blocks", { count: blocks.length })}</TabsTrigger>
          <TabsTrigger value="absences">{t("calendar.dayPanel.tab.absences", { count: absences.length })}</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments" className="pt-3">
          <DayAppointments appointments={appointments} ctx={ctx} isToday={isToday} onOpen={(appointment: Appointment) => onOpenAppointment(date, appointment.id)} />
        </TabsContent>
        <TabsContent value="clients" className="pt-3">
          <DayClients appointments={appointments} ctx={ctx} onOpenClient={onOpenClient} />
        </TabsContent>
        <TabsContent value="blocks" className="pt-3">
          <DayBlocks blocks={blocks} ctx={ctx} date={date} onOpen={openBlock} />
        </TabsContent>
        <TabsContent value="absences" className="pt-3">
          <DayAbsences absences={absences} onOpen={openAbsence} formatRange={rangeOf} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "primary" | "warning" }) {
  const tones = { neutral: "border-border bg-surface-muted text-text-secondary", primary: "border-primary/30 bg-primary/10 text-primary", warning: "border-status-warning/30 bg-status-warning/10 text-status-warning" };
  return <span className={cn("inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium", tones[tone])}>{children}</span>;
}

function DayStats({ day, active, ctx, expected, showTotals, isPast }: { day: CalendarDay; active: readonly Appointment[]; ctx: ModelContext; expected: number | null; showTotals: boolean; isPast: boolean }) {
  const t = useAppT();
  const total = active.reduce((sum, item) => sum + (item.payment?.total ?? appointmentTotal(ctx.catalog, item)), 0);
  const collected = active.filter((item) => item.status === "paid").reduce((sum, item) => sum + (item.payment?.total ?? 0), 0);
  const open = active.filter(isUnpaid).length;
  const lost = day.appointments.length - active.length;
  return (
    <dl className={cn("grid gap-2", showTotals ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")} data-testid="day-panel-stats">
      <Stat label={t("calendar.dayPanel.stat.appointments")} value={String(active.length)} hint={expected !== null ? t("calendar.dayPanel.stat.usually", { count: expected }) : undefined} />
      <Stat label={t(isPast ? "calendar.dayPanel.stat.unpaid" : "calendar.dayPanel.stat.pending")} value={String(open)} tone={isPast && open > 0 ? "warning" : undefined} />
      <Stat label={t("calendar.dayPanel.stat.lost")} value={String(lost)} tone={lost > 0 ? "negative" : undefined} />
      {showTotals && <Stat label={t("calendar.dayPanel.stat.money")} value={ctx.formatMoney(total)} hint={t("calendar.dayPanel.stat.collected", { amount: ctx.formatMoney(collected) })} />}
    </dl>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warning" | "negative" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface px-3 py-2">
      <dd className={cn("text-base font-semibold tabular-nums text-text-primary", tone === "warning" && "text-status-warning", tone === "negative" && "text-status-negative")}>{value}</dd>
      <dt className="text-xs text-text-muted">{label}</dt>
      {hint && <dd className="text-xs text-text-muted/80">{hint}</dd>}
    </div>
  );
}

/** Cómo va cada barbero ese día: su carga, sus citas, y si falta. Tocarlo abre su día. */
function DayTeam({ date, day, ctx, absences, onOpenBarber }: { date: Date; day: CalendarDay; ctx: ModelContext; absences: readonly Absence[]; onOpenBarber: (barberId: string) => void }) {
  const t = useAppT();
  const own = ctx.access?.ownBarberId ?? null;
  const barbers = applyDayHours(
    ctx.catalog.barbers.filter((barber) => !own || barber.id === own),
    date,
    day.hours
  );
  const rows = barbers
    .map((barber) => {
      const off = absences.find((item) => item.memberId === barber.id);
      const works = isWorkingOn(barber, date);
      return { barber, off, works, load: works ? barberLoad(barber, date, day.appointments) : 0, count: day.appointments.filter((item) => item.barberId === barber.id && isActive(item)).length };
    })
    .filter((row) => row.works || row.off)
    .sort((a, b) => b.load - a.load);
  if (rows.length === 0) return null;
  const working = rows.filter((row) => row.works && !(row.off?.status === "approved")).length;
  return (
    <section aria-label={t("calendar.dayPanel.team")} className="space-y-2" data-testid="day-panel-team">
      <div className="flex items-baseline justify-between gap-2">
        <Text weight="semibold">{t("calendar.dayPanel.team")}</Text>
        <Text size="xs" tone="muted">
          {t("calendar.dayPanel.teamHint", { working, total: ctx.catalog.barbers.length })}
        </Text>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {rows.map(({ barber, off, load, count }) => {
          const percent = Math.round(load * 100);
          return (
            <li key={barber.id}>
              <button
                type="button"
                onClick={() => onOpenBarber(barber.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-fast hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={t("calendar.dayPanel.barberAria", { name: barber.name, percent, count })}
              >
                <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <Text as="span" size="sm" weight="medium" className="truncate">
                      {barber.name.split(" ")[0]}
                    </Text>
                    <Text as="span" size="xs" tone={off ? "warning" : "muted"} className="shrink-0 tabular-nums">
                      {off ? t(off.status === "pending" ? "calendar.dayPanel.offPending" : "calendar.dayPanel.off") : `${percent}% · ${count}`}
                    </Text>
                  </span>
                  <Progress value={off?.status === "approved" ? 0 : percent} color={load >= FULL_LOAD ? "warning" : "primary"} className="h-1" aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const BRIEF_TONE = { negative: "bg-status-negative", warning: "bg-status-warning", positive: "bg-status-positive", info: "bg-status-info" } as const;

/** Lo que el día pide mirar (los mismos avisos que el resumen del asistente). */
function DayInsights({ day, ctx, date }: { day: CalendarDay; ctx: ModelContext; date: Date }) {
  const t = useAppT();
  const lines = dayBrief(day, ctx.catalog, date, ctx.now);
  if (lines.length === 0) return null;
  return (
    <section aria-label={t("calendar.dayPanel.insights")} className="space-y-1.5 rounded-xl border border-border/60 bg-surface-subtle px-3 py-2.5" data-testid="day-panel-insights">
      <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
        {t("calendar.dayPanel.insights")}
      </Text>
      <ul className="space-y-1">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-2">
            <span className={cn("size-1.5 shrink-0 rounded-full", BRIEF_TONE[line.tone])} aria-hidden="true" />
            <Text as="span" size="sm">
              {t(line.textKey, line.params)}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
