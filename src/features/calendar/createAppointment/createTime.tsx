import * as React from "react";
import { isSameDay, startOfDay } from "date-fns";
import { Armchair } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Chip } from "@/components/ai-interaction";
import { EmptyState } from "@/components/feedback/EmptyState";
import { DayStrip, TimeSlotGroups, formatClock, minutesOfDay } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvatarGroup } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemaIcon } from "@/icons";
import { PersonAvatar } from "../calendarShared";
import type { Barber } from "../types";
import { useDaySlots, type FreeTime } from "./useDaySlots";
import { groupTimes } from "./createModel";
import type { CreateDraft } from "./useCreateDraft";

/**
 * El día y la hora como en la reserva en línea: la tira de días y debajo las
 * horas libres por franja (mañana, tarde, noche). Con un barbero elegido, sus
 * horas; sin él, las de todos con las caras de quienes pueden. También los
 * huecos que propone Clipper para el día que se ve, como chips de IA.
 */

/** Cuántos días se ofrecen en la tira. */
const DAYS_AHEAD = 45;
/** Cuántas caras se ven junto a una hora antes del «+N». */
const FACES = 3;

export interface TimeChooserProps {
  draft: CreateDraft;
  branchId: string;
  /** Sin barbero: las horas de todos, con sus caras, y al tocar una se le asigna el primero que puede. */
  anyBarber?: boolean;
  /** Al tocar una hora (con los barberos que pueden a esa hora). */
  onPick?: (time: FreeTime) => void;
  /** Sin el título «¿Qué día y a qué hora?» (ya lo pone quien lo usa). */
  bare?: boolean;
}

export function TimeChooser({ draft, branchId, anyBarber = false, onPick, bare = false }: TimeChooserProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const [day, setDay] = React.useState(() => draft.firstDay);
  const barbers = React.useMemo<readonly Barber[]>(() => (anyBarber || !draft.barber ? draft.ctx.catalog.barbers : [draft.barber]), [anyBarber, draft.barber, draft.ctx.catalog.barbers]);
  const slots = useDaySlots({ branchId, day, barbers, durationMin: draft.durationMin, now: draft.now });
  const byId = new Map(draft.ctx.catalog.barbers.map((barber) => [barber.id, barber]));
  const faces = (time: FreeTime) =>
    anyBarber ? (
      <AvatarGroup className="ml-0.5 -space-x-1.5">
        {time.barberIds.slice(0, FACES).map((id) => {
          const barber = byId.get(id);
          return barber ? <PersonAvatar key={id} name={barber.name} avatarUrl={barber.avatarUrl} size="sm" /> : null;
        })}
      </AvatarGroup>
    ) : undefined;
  // La hora del hueco que se tocó siempre está, aunque la agenda aún no haya llegado.
  const times = draft.start && isSameDay(draft.start, day) && !slots.times.some((time) => time.start.getTime() === draft.start?.getTime()) && draft.barberId ? [...slots.times, { minute: minutesOfDay(draft.start), start: draft.start, barberIds: [draft.barberId] }].sort((a, b) => a.minute - b.minute) : slots.times;
  const groups = groupTimes(times, (time) => formatClock(time.start, draft.ctx.intl), draft.start, faces, (id) => t(`schedule.${id}` as "schedule.morning"));
  const pick = (minute: string) => {
    const time = times.find((item) => String(item.minute) === minute);
    if (!time) return;
    if (onPick) return onPick(time);
    const keep = draft.barberId && time.barberIds.includes(draft.barberId) ? draft.barberId : time.barberIds[0];
    draft.place(keep, time.start);
  };

  return (
    <div className="flex flex-col gap-4" data-testid="create-time">
      {!bare && (
        <div className="flex min-h-8 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <Text size="sm" weight="medium">
            {t("calendar.createV.whenTitle")}
          </Text>
          <Text size="sm" tone="muted" className="first-letter:uppercase">
            {formatDate(day, { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </div>
      )}
      <DayStrip first={startOfDay(draft.now)} count={DAYS_AHEAD} value={day} onChange={(next) => {
          setDay(startOfDay(next));
          draft.showDay(startOfDay(next));
        }} />
      {slots.loading ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : groups.length === 0 ? (
        <EmptyState icon="calendar" title={draft.barber && !anyBarber ? t("calendar.createV.noTimesBarber", { name: draft.barber.name.split(" ")[0] }) : t("calendar.createV.noTimes")} description={t("calendar.createV.noTimesHint")} />
      ) : (
        <TimeSlotGroups groups={groups} onPick={pick} />
      )}
      <TimeProblems draft={draft} />
    </div>
  );
}

/** Por qué no se puede a esa hora (pisa otra cita o un recurso completo), justo debajo de las horas. */
export function TimeProblems({ draft }: { draft: CreateDraft }) {
  const t = useAppT();
  return (
    <>
      {draft.errors.start && (
        <Text role="alert" size="sm" tone="negative" weight="medium" className="flex items-center gap-1.5">
          <ThemaIcon name="error" size="sm" tone="negative" />
          {draft.errors.start}
        </Text>
      )}
      {draft.resourceWarning && !draft.errors.start && (
        <Alert variant="warning" data-testid="create-appointment-resource">
          <Armchair />
          <AlertDescription>{draft.enforceRules ? draft.resourceWarning : t("calendar.create.resourceForce", { reason: draft.resourceWarning })}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

/** Los huecos que Clipper propone en el día que se ve (también pintados en la agenda), como chips de IA. */
export function SuggestedSlots({ draft }: { draft: CreateDraft }) {
  const t = useAppT();
  if (draft.services.length === 0 || draft.suggestions.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5" data-testid="create-appointment-suggestions">
      <Text as="span" size="xs" weight="semibold" tone="muted" className="flex items-center gap-1.5 uppercase tracking-wide">
        <ThemaIcon name="sparkles" size="xs" />
        {t("calendar.suggest.title")}
      </Text>
      <div className="flex flex-wrap gap-2">
        {draft.suggestions.map((suggestion) => {
          const selected = draft.start?.getTime() === suggestion.start.getTime() && draft.barberId === suggestion.barber.id;
          return (
            <Chip
              key={`${suggestion.barber.id}-${suggestion.start.getTime()}`}
              size="sm"
              tone={selected ? "primary" : "ai"}
              selected={selected}
              label={`${formatClock(suggestion.start, draft.ctx.intl)} · ${suggestion.barber.name.split(" ")[0]} — ${t(suggestion.reasonKey, suggestion.reasonParams)}`}
              onClick={() => draft.place(suggestion.barber.id, suggestion.start)}
            />
          );
        })}
      </div>
    </div>
  );
}
