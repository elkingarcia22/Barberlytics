import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarSearch, CalendarX2, Flame, Palmtree, Stethoscope, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { useLocale } from "@/i18n";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility/IconTile";
import { ABSENCE_KIND_KEYS, useDecideAbsence, type Absence } from "@/features/team/workforce";
import { PersonAvatar } from "../calendarShared";
import { findBarber, type ModelContext } from "../calendarModel";
import { PanelQuestion } from "../appointmentPanel/bookingStyle";
import { useApproveBlock, useRemoveBlock, useRhythmQuery } from "../queries";
import { dayWeightOf } from "../dayWeight";
import { DayWeightBadge } from "../DayWeightBadge";
import { BLOCK_CATEGORY_KEYS, type TimeBlock } from "../types";
import { coverageFor, daysOf, isShortHanded } from "./timeOffModel";
import { PanelFooter } from "@/components/overlays";

/**
 * Revisar una solicitud antes de aprobarla, con lo que hay que saber en ese
 * momento: quién, qué y cuándo (cuántos días, cuántos trabaja), las citas que
 * ya tiene esos días —hay que moverlas—, y cómo queda el equipo cada día (quién
 * más falta, si el día queda corto). Aprobar o rechazar (con motivo) aquí mismo.
 */

const KIND_ICON = { vacation: Palmtree, sick: Stethoscope, personal: UserRound } as const;
/** Cuántas citas afectadas se ven por día; el resto se cuenta. */
const PER_DAY = 3;

export function AbsenceReview({ absence, absences, ctx, canDecide, onOpenAppointment, onShowInCalendar, onDone }: { absence: Absence; absences: readonly Absence[]; ctx: ModelContext; canDecide: boolean; onOpenAppointment: (date: Date, id: string) => void; /** Ponerla sola en la rejilla, en el primer día que el barbero trabaja. */ onShowInCalendar?: (on: Date) => void; onDone: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const decide = useDecideAbsence();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const dateLocale = calendarLocale(locale);
  const barber = findBarber(ctx.catalog, absence.memberId);
  const days = daysOf(absence.startDate, absence.endDate);
  const coverage = coverageFor(absence, ctx.catalog.barbers, absences);
  const workDays = coverage.filter((day) => day.works).length;
  const short = coverage.filter((day) => day.works && isShortHanded(day));
  // Si los días que pide suelen ser pesados (por el historial de la barbería): pesa en la decisión.
  const rhythm = useRhythmQuery(absence.branchId);
  const heavy = coverage.filter((day) => day.works && dayWeightOf(rhythm.data, day.date)?.level === "heavy");
  const Icon = KIND_ICON[absence.kind];
  const range = days.length === 1 ? format(days[0], "EEEE d 'de' MMMM", { locale: dateLocale }) : t("calendar.timeOff.range", { from: format(days[0], "EEE d MMM", { locale: dateLocale }), to: format(days[days.length - 1], "EEE d MMM", { locale: dateLocale }) });
  const byDay = new Map<string, Absence["affected"]>();
  for (const item of absence.affected) byDay.set(item.start.slice(0, 10), [...(byDay.get(item.start.slice(0, 10)) ?? []), item]);

  const run = (decision: "approve" | "reject") =>
    decide.mutate(
      { id: absence.id, decision, reason: decision === "reject" ? reason.trim() : undefined },
      {
        onSuccess: () => {
          toast.success(t(decision === "approve" ? "calendar.timeOff.approved" : "calendar.timeOff.rejected"), { description: absence.memberName });
          onDone();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );

  return (
    <div className="flex flex-col gap-6" data-testid="time-off-review">
      <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          <PersonAvatar name={absence.memberName} avatarUrl={barber?.avatarUrl} size="lg" />
          <span className="flex min-w-0 flex-1 flex-col">
            <Heading level={3} className="truncate">
              {t("calendar.timeOff.whose", { kind: t(ABSENCE_KIND_KEYS[absence.kind]), name: absence.memberName.split(" ")[0] })}
            </Heading>
            <Text size="sm" tone="secondary" className="first-letter:uppercase">
              {range}
            </Text>
          </span>
          <StatusBadge status={absence.status === "pending" ? "pending" : absence.status === "approved" ? "completed" : "error"} label={t(absence.status === "pending" ? "calendar.timeOff.pending" : absence.status === "approved" ? "calendar.timeOff.approvedShort" : "calendar.timeOff.rejectedShort")} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<Icon />} value={String(days.length)} label={t("calendar.timeOff.days")} />
          <Stat icon={<CalendarX2 />} value={String(absence.affected.length)} label={t("calendar.timeOff.booked")} tone={absence.affected.length > 0 ? "warning" : undefined} />
          <Stat icon={<Users />} value={String(workDays)} label={t("calendar.timeOff.workDays")} />
        </div>
        {absence.note && <Text className="border-l-2 border-primary/60 pl-3 italic">«{absence.note}»</Text>}
        <Text size="xs" tone="muted">
          {t("calendar.timeOff.requested", { name: absence.requestedBy, when: format(parseISO(absence.requestedAt), "d MMM, h:mm a", { locale: dateLocale }) })}
        </Text>
        {onShowInCalendar && <ShowInCalendar onClick={() => onShowInCalendar(coverage.find((day) => day.works)?.date ?? days[0])} />}
      </section>

      {heavy.length > 0 && (
        <Alert variant="warning" data-testid="time-off-heavy">
          <Flame />
          <AlertDescription>{t("calendar.timeOff.heavyDays", { count: heavy.length, days: heavy.map((day) => format(day.date, "EEE d", { locale: dateLocale })).join(", ") })}</AlertDescription>
        </Alert>
      )}

      {short.length > 0 && (
        <Alert variant="warning">
          <Users />
          <AlertDescription>{t("calendar.timeOff.shortHanded", { days: short.map((day) => format(day.date, "EEE d", { locale: dateLocale })).join(", ") })}</AlertDescription>
        </Alert>
      )}

      <PanelQuestion title={t("calendar.timeOff.bookedTitle", { count: absence.affected.length })}>
        {absence.affected.length === 0 ? (
          <Text size="sm" tone="muted">
            {t("calendar.timeOff.bookedNone")}
          </Text>
        ) : (
          <div className="flex flex-col gap-3">
            {[...byDay.entries()].map(([day, items]) => (
              <div key={day} className="flex flex-col gap-1.5">
                <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
                  {format(parseISO(day), "EEEE d 'de' MMMM", { locale: dateLocale })}
                </Text>
                <ListItemGroup>
                  {items.slice(0, PER_DAY).map((item) => (
                    <ListItem key={item.id} size="sm" title={item.client || "—"} description={format(parseISO(item.start), "h:mm a", { locale: dateLocale })} onClick={() => onOpenAppointment(parseISO(item.start), item.id)} data-testid="time-off-affected" />
                  ))}
                </ListItemGroup>
                {items.length > PER_DAY && (
                  <Text size="xs" tone="muted">
                    {t("calendar.timeOff.moreThatDay", { count: items.length - PER_DAY })}
                  </Text>
                )}
              </div>
            ))}
            <Text size="xs" tone="muted">
              {t("calendar.timeOff.bookedHint")}
            </Text>
          </div>
        )}
      </PanelQuestion>

      <PanelQuestion title={t("calendar.timeOff.teamTitle")}>
        <ListItemGroup data-testid="time-off-coverage">
          {coverage.map((day) => (
            <ListItem
              key={day.date.getTime()}
              size="sm"
              title={
                <span className="flex items-center gap-1.5">
                  <span className="first-letter:uppercase">{format(day.date, "EEEE d", { locale: dateLocale })}</span>
                  {day.works && <DayWeightBadge weight={dayWeightOf(rhythm.data, day.date)} showNormal />}
                </span>
              }
              description={!day.works ? t("calendar.timeOff.notWorking") : day.alsoOff.length > 0 ? t("calendar.timeOff.alsoOff", { names: day.alsoOff.map((item) => (item.pending ? `${item.name} (${t("calendar.timeOff.pendingLower")})` : item.name)).join(", ") }) : t("calendar.timeOff.nobodyElse")}
              meta={day.works ? t("calendar.timeOff.available", { count: day.available, total: day.scheduled }) : "—"}
              className={day.works && isShortHanded(day) ? "text-warning" : undefined}
            />
          ))}
        </ListItemGroup>
      </PanelQuestion>

      {canDecide && absence.status === "pending" && (
        <PanelFooter className="gap-2">
          {rejecting && <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("calendar.timeOff.rejectReason")} aria-label={t("calendar.timeOff.rejectReason")} autoFocus data-testid="time-off-reason" />}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={decide.isPending || (rejecting && reason.trim().length < 3)} onClick={() => (rejecting ? run("reject") : setRejecting(true))} data-testid="time-off-reject">
              {t("calendar.timeOff.reject")}
            </Button>
            <Button className="flex-1" disabled={decide.isPending} onClick={() => run("approve")} data-testid="time-off-approve">
              {t("calendar.timeOff.approve")}
            </Button>
          </div>
        </PanelFooter>
      )}
    </div>
  );
}

/** Un bloqueo que puso un barbero y espera aprobación: qué, cuándo y quién lo pidió. */
export function BlockReview({ block, ctx, canDecide, onShowInCalendar, onDone }: { block: TimeBlock; ctx: ModelContext; canDecide: boolean; onShowInCalendar?: () => void; onDone: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const approve = useApproveBlock();
  const remove = useRemoveBlock();
  const barber = findBarber(ctx.catalog, block.barberId);
  const dateLocale = calendarLocale(locale);
  const days = daysOf(block.startDate, block.endDate);
  const when = days.length === 1 ? format(days[0], "EEEE d 'de' MMMM", { locale: dateLocale }) : t("calendar.timeOff.range", { from: format(days[0], "EEE d MMM", { locale: dateLocale }), to: format(days[days.length - 1], "EEE d MMM", { locale: dateLocale }) });
  const done = (key: "calendar.timeOff.approved" | "calendar.timeOff.rejected") => ({
    onSuccess: () => {
      toast.success(t(key), { description: barber?.name });
      onDone();
    },
    onError: (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description }),
  });
  return (
    <div className="flex flex-col gap-6" data-testid="block-review">
      <section className="flex items-center gap-3 rounded-2xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-4">
        <IconTile size="lg" shape="circle" tone="neutral" icon={<CalendarX2 />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Heading level={3}>{t(BLOCK_CATEGORY_KEYS[block.category])}</Heading>
          <Text size="sm" tone="secondary" className="first-letter:uppercase">
            {`${barber?.name ?? ""} · ${when} · ${block.startTime}–${block.endTime}`}
          </Text>
          {block.requestedBy && (
            <Text size="xs" tone="muted">
              {t("calendar.timeOff.blockRequested", { name: block.requestedBy })}
            </Text>
          )}
        </span>
      </section>
      {onShowInCalendar && <ShowInCalendar onClick={onShowInCalendar} />}
      {block.description && <Text className="border-l-2 border-primary/60 pl-3 italic">«{block.description}»</Text>}
      {canDecide && block.status === "pending" && (
        <PanelFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" disabled={remove.isPending} onClick={() => remove.mutate(block.id, done("calendar.timeOff.rejected"))}>
            {t("calendar.timeOff.reject")}
          </Button>
          <Button className="flex-1" disabled={approve.isPending} onClick={() => approve.mutate(block.id, done("calendar.timeOff.approved"))} data-testid="block-approve">
            {t("calendar.timeOff.approve")}
          </Button>
        </PanelFooter>
      )}
    </div>
  );
}

/** Verla sola en la rejilla, como un filtro: las citas se apagan y queda ella. */
function ShowInCalendar({ onClick }: { onClick: () => void }) {
  const t = useAppT();
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" onClick={onClick} data-testid="time-off-show">
      <CalendarSearch /> {t("calendar.timeOff.showInCalendar")}
    </Button>
  );
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone?: "warning" }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface/70 px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-text-muted [&_svg]:size-3.5">
        {icon}
        <Text as="span" size="xs" tone="muted">
          {label}
        </Text>
      </span>
      <Text size="lg" weight="semibold" tabular tone={tone}>
        {value}
      </Text>
    </div>
  );
}
