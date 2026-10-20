import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarX2, Palmtree, Plus, Stethoscope, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { DateRangePicker } from "@/components/date";
import { SidePanelShell } from "@/components/overlays";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { EmptyState } from "@/components/feedback";
import { Chip } from "@/components/ai-interaction";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility/IconTile";
import { ABSENCE_KIND_KEYS, useAbsences, useRequestAbsence, type Absence, type AbsenceKind } from "@/features/team/workforce";
import { PersonAvatar } from "../calendarShared";
import { findBarber, type ModelContext } from "../calendarModel";
import { PanelQuestion, PanelSubpage } from "../appointmentPanel/bookingStyle";
import { useBlocksQuery } from "../queries";
import { BLOCK_CATEGORY_KEYS, type CalendarDay, type TimeBlock } from "../types";
import { daysOf, type TimeOffPreview } from "./timeOffModel";
import { BarberField } from "./BarberField";
import { BlockForm } from "./BlockForm";
import { AbsenceReview, BlockReview } from "./TimeOffReview";

/**
 * Las ausencias y los bloqueos del equipo en un panel junto a la agenda, como
 * los huecos: arriba lo que falta aprobar; filtros por tipo y por estado; cada
 * fila abre su revisión (días, citas afectadas, el equipo esos días) con
 * aprobar o rechazar. Desde aquí también se agregan vacaciones, una incapacidad
 * o un permiso o se bloquea una franja, en una página propia del panel (la
 * lista se queda atrás); lo que se arma se marca en la agenda.
 */

type AddKind = AbsenceKind | "block";

/** Abrir «Agregar» ya puesto: el tipo, de quién, o el bloqueo que se edita (desde la columna del barbero o la agenda). */
export interface TimeOffAdd {
  type: "add";
  kind?: AddKind;
  barberId?: string | null;
  block?: TimeBlock;
}

/** Con qué se abre el panel: la revisión de una ausencia o un bloqueo, o la página «Agregar». */
export type TimeOffFocus = { type: "absence" | "block"; id: string } | TimeOffAdd | null;
type ReviewFocus = { type: "absence" | "block"; id: string } | null;

export interface TimeOffDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  branchId: string;
  /** Abrir directamente la revisión de una (desde la agenda). */
  focus?: TimeOffFocus;
  /** Ir a una cita afectada (a moverla). */
  onOpenAppointment: (date: Date, id: string) => void;
  /** Ponerla sola en la rejilla, en su primer día («Ver en el calendario»). */
  onShowInCalendar?: (focus: { type: "absence" | "block"; id: string }, on: Date) => void;
  /** Al aprobar o rechazar: la agenda deja de mostrar solo esa y vuelve a la normalidad. */
  onDecided?: () => void;
  /** El día que se mira en la agenda y su agenda: de ahí salen la fecha de un bloqueo nuevo y sus choques. */
  date: Date;
  day?: CalendarDay;
  /** Si quien mira puede crear bloqueos (el barbero de comisión, no). */
  canBlock?: boolean;
  /** Lo que se está agregando, para marcarlo en la agenda e ir a su día. */
  onPreview?: (preview: TimeOffPreview | null) => void;
}

type Kind = "all" | AbsenceKind | "block";
type Status = "pending" | "approved" | "all";
const KIND_ICON = { vacation: Palmtree, sick: Stethoscope, personal: UserRound } as const;
const KINDS: readonly Kind[] = ["all", "vacation", "sick", "personal", "block"];

export function TimeOffDrawer({ open, onOpenChange, ctx, branchId, focus = null, onOpenAppointment, onShowInCalendar, onDecided, date, day, canBlock = true, onPreview }: TimeOffDrawerProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const dateLocale = calendarLocale(locale);
  const absencesQuery = useAbsences(branchId);
  const blocksQuery = useBlocksQuery(branchId, open);
  const [kind, setKind] = React.useState<Kind>("all");
  const [status, setStatus] = React.useState<Status>("pending");
  const reviewOf = (value: TimeOffFocus): ReviewFocus => (value && value.type !== "add" ? value : null);
  const [selected, setSelected] = React.useState<ReviewFocus>(reviewOf(focus));
  // «Agregar» es una página del panel: la lista y sus filtros se quedan atrás, con «Volver».
  const [adding, setAdding] = React.useState<TimeOffAdd | null>(focus?.type === "add" ? focus : null);
  const canDecide = ctx.access?.canDecideTimeOff ?? true;
  // Lo que pidieron desde la agenda manda al abrir.
  const [lastFocus, setLastFocus] = React.useState(focus);
  if (focus !== lastFocus) {
    setLastFocus(focus);
    setSelected(reviewOf(focus));
    setAdding(focus?.type === "add" ? focus : null);
  }

  const today = format(ctx.now ?? new Date(), "yyyy-MM-dd");
  const absences = (absencesQuery.data?.items ?? []).filter((item) => item.status !== "rejected" && item.endDate >= today);
  const pendingBlocks = (blocksQuery.data?.items ?? []).filter((block) => block.endDate >= today && (status === "all" || (status === "pending") === (block.status === "pending")));
  const shownAbsences = absences.filter((item) => (kind === "all" || kind === item.kind) && (status === "all" || item.status === status));
  const shownBlocks = kind === "all" || kind === "block" ? pendingBlocks.filter((block) => !block.id.startsWith("blk_abs_")) : [];
  const pendingCount = absences.filter((item) => item.status === "pending").length + (blocksQuery.data?.items ?? []).filter((block) => block.status === "pending").length;

  const range = (startDate: string, endDate: string) => {
    const days = daysOf(startDate, endDate);
    return days.length === 1 ? format(days[0], "EEE d MMM", { locale: dateLocale }) : `${format(days[0], "EEE d MMM", { locale: dateLocale })} – ${format(days[days.length - 1], "EEE d MMM", { locale: dateLocale })} · ${t("calendar.timeOff.daysCount", { count: days.length })}`;
  };

  const body = () => {
    if (adding) {
      return (
        <PanelSubpage title={t(adding.block ? "calendar.block.editTitle" : "calendar.timeOff.addTitle")} onBack={() => setAdding(null)}>
          <AddTimeOff key={adding.block?.id ?? `${adding.kind ?? ""}-${adding.barberId ?? ""}`} preset={adding} ctx={ctx} branchId={branchId} date={date} day={day} canBlock={canBlock} onDone={() => setAdding(null)} onPreview={onPreview} />
        </PanelSubpage>
      );
    }
    if (selected?.type === "absence") {
      const absence = (absencesQuery.data?.items ?? []).find((item) => item.id === selected.id);
      if (absence)
        return (
          <PanelSubpage title={t("calendar.timeOff.review")} onBack={() => setSelected(null)}>
            <AbsenceReview absence={absence} absences={absencesQuery.data?.items ?? []} ctx={ctx} canDecide={canDecide} onOpenAppointment={onOpenAppointment} onShowInCalendar={onShowInCalendar && ((on) => onShowInCalendar({ type: "absence", id: absence.id }, on))} onDone={() => { setSelected(null); onDecided?.(); }} />
          </PanelSubpage>
        );
    }
    if (selected?.type === "block") {
      const block = (blocksQuery.data?.items ?? []).find((item) => item.id === selected.id);
      if (block)
        return (
          <PanelSubpage title={t("calendar.timeOff.review")} onBack={() => setSelected(null)}>
            <BlockReview block={block} ctx={ctx} canDecide={canDecide} onShowInCalendar={onShowInCalendar && (() => onShowInCalendar({ type: "block", id: block.id }, parseISO(block.startDate)))} onDone={() => { setSelected(null); onDecided?.(); }} />
          </PanelSubpage>
        );
    }
    return (
      <div className="flex flex-col gap-4" data-testid="time-off">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            size="sm"
            value={status}
            onChange={(value) => setStatus(value as Status)}
            options={[
              { value: "pending", label: pendingCount > 0 ? `${t("calendar.timeOff.pending")} · ${pendingCount}` : t("calendar.timeOff.pending") },
              { value: "approved", label: t("calendar.timeOff.approvedShort") },
              { value: "all", label: t("calendar.timeOff.all") },
            ]}
          />
          <Button size="sm" variant="outline" onClick={() => setAdding({ type: "add" })} data-testid="time-off-add">
            <Plus /> {t("calendar.timeOff.add")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((item) => (
            <Chip key={item} size="sm" label={item === "all" ? t("calendar.timeOff.all") : item === "block" ? t("calendar.timeOff.blocks") : t(ABSENCE_KIND_KEYS[item])} selected={kind === item} onClick={() => setKind(item)} />
          ))}
        </div>
        {shownAbsences.length === 0 && shownBlocks.length === 0 ? (
          <EmptyState icon="calendar" title={t(status === "pending" ? "calendar.timeOff.emptyPending" : "calendar.timeOff.empty")} description={t("calendar.timeOff.emptyHint")} />
        ) : (
          <ListItemGroup>
            {shownAbsences.map((item) => (
              <AbsenceRow key={item.id} absence={item} ctx={ctx} range={range(item.startDate, item.endDate)} onOpen={() => setSelected({ type: "absence", id: item.id })} />
            ))}
            {shownBlocks.map((block) => (
              <BlockRow key={block.id} block={block} ctx={ctx} range={range(block.startDate, block.endDate)} onOpen={() => setSelected({ type: "block", id: block.id })} />
            ))}
          </ListItemGroup>
        )}
      </div>
    );
  };

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.timeOff.title")} description={t("calendar.timeOff.hint")}>
      {body()}
    </SidePanelShell>
  );
}

function AbsenceRow({ absence, ctx, range, onOpen }: { absence: Absence; ctx: ModelContext; range: string; onOpen: () => void }) {
  const t = useAppT();
  const Icon = KIND_ICON[absence.kind];
  const barber = findBarber(ctx.catalog, absence.memberId);
  return (
    <ListItem
      size="sm"
      onClick={onOpen}
      leading={<PersonAvatar name={absence.memberName} avatarUrl={barber?.avatarUrl} />}
      title={`${absence.memberName} · ${t(ABSENCE_KIND_KEYS[absence.kind])}`}
      description={
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden />
          <span className="first-letter:uppercase">{range}</span>
          {absence.affected.length > 0 && <span className="text-warning">· {t("calendar.timeOff.bookedShort", { count: absence.affected.length })}</span>}
        </span>
      }
      meta={<StatusBadge status={absence.status === "pending" ? "pending" : "completed"} label={t(absence.status === "pending" ? "calendar.timeOff.pending" : "calendar.timeOff.approvedShort")} />}
      data-testid="time-off-row"
    />
  );
}

function BlockRow({ block, ctx, range, onOpen }: { block: TimeBlock; ctx: ModelContext; range: string; onOpen: () => void }) {
  const t = useAppT();
  const barber = findBarber(ctx.catalog, block.barberId);
  return (
    <ListItem
      size="sm"
      onClick={onOpen}
      leading={<IconTile size="sm" shape="circle" tone="neutral" icon={<CalendarX2 />} />}
      title={`${barber?.name ?? ""} · ${t(BLOCK_CATEGORY_KEYS[block.category])}`}
      description={<span className="first-letter:uppercase">{`${range} · ${block.startTime}–${block.endTime}`}</span>}
      meta={<StatusBadge status={block.status === "pending" ? "pending" : "completed"} label={t(block.status === "pending" ? "calendar.timeOff.pending" : "calendar.timeOff.approvedShort")} />}
      data-testid="time-off-block-row"
    />
  );
}

/**
 * La página «Agregar»: qué es (vacaciones, incapacidad, permiso o bloqueo) y
 * su formulario. Lo que se arma se marca en la agenda (`onPreview`).
 */
function AddTimeOff({ preset, ctx, branchId, date, day, canBlock, onDone, onPreview }: { preset: TimeOffAdd; ctx: ModelContext; branchId: string; date: Date; day?: CalendarDay; canBlock: boolean; onDone: () => void; onPreview?: (preview: TimeOffPreview | null) => void }) {
  const t = useAppT();
  const [kind, setKind] = React.useState<AddKind>(preset.block ? "block" : (preset.kind ?? "vacation"));
  const kinds: AddKind[] = ["vacation", "sick", "personal", ...(canBlock ? (["block"] as const) : [])];
  const ownId = ctx.access?.ownBarberId ?? null;
  const barberId = ownId ?? preset.barberId ?? null;
  return (
    <div className="flex flex-col gap-5" data-testid="time-off-add-page">
      {/* Editando un bloqueo ya no se cambia de tipo. */}
      {!preset.block && <SegmentedControl fullWidth size="sm" value={kind} onChange={(value) => setKind(value as AddKind)} options={kinds.map((item) => ({ value: item, label: item === "block" ? t("calendar.timeOff.kindBlock") : t(ABSENCE_KIND_KEYS[item]) }))} ariaLabel={t("calendar.timeOff.what")} />}
      {kind === "block" ? (
        <BlockForm barbers={ctx.catalog.barbers} initialBarberId={barberId} date={date} day={day} ownOnly={Boolean(ownId)} block={preset.block ?? null} onDone={onDone} onPreview={onPreview} />
      ) : (
        <AbsenceForm ctx={ctx} branchId={branchId} kind={kind} initialMemberId={barberId} date={date} onDone={onDone} onPreview={onPreview} />
      )}
    </div>
  );
}

/** Vacaciones, una incapacidad o un permiso: de quién (quien gestiona elige), desde y hasta, y una nota. */
function AbsenceForm({ ctx, branchId, kind, initialMemberId, date, onDone, onPreview }: { ctx: ModelContext; branchId: string; kind: AbsenceKind; initialMemberId: string | null; date: Date; onDone: () => void; onPreview?: (preview: TimeOffPreview | null) => void }) {
  const t = useAppT();
  const request = useRequestAbsence();
  const manages = ctx.access?.canManageTimeOff ?? true;
  const ownId = ctx.access?.ownBarberId ?? null;
  const [memberId, setMemberId] = React.useState(ownId ?? initialMemberId ?? ctx.catalog.barbers[0]?.id ?? "");
  const [range, setRange] = React.useState<{ from?: Date; to?: Date } | undefined>(() => ({ from: date, to: date }));
  const [note, setNote] = React.useState("");
  const ready = Boolean(range?.from) && Boolean(memberId);
  const startKey = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const endKey = range?.from ? format(range.to ?? range.from, "yyyy-MM-dd") : "";
  const label = t(ABSENCE_KIND_KEYS[kind]);

  // Mientras se arma, la agenda la marca en su sitio y se va a su primer día.
  React.useEffect(() => {
    if (!onPreview) return;
    onPreview(memberId && startKey ? { barberId: memberId, label, startDate: startKey, endDate: endKey } : null);
  }, [onPreview, memberId, label, startKey, endKey]);
  React.useEffect(() => () => onPreview?.(null), [onPreview]);

  const submit = () => {
    if (!startKey) return;
    request.mutate(
      { branchId, kind, startDate: startKey, endDate: endKey, note: note.trim(), ...(manages ? { memberId } : {}) },
      {
        onSuccess: () => {
          toast.success(t(manages ? "calendar.timeOff.addedApproved" : "calendar.timeOff.addedPending"));
          onDone();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };
  const days = startKey ? daysOf(startKey, endKey).length : 0;
  return (
    <div className="flex flex-col gap-5" data-testid="time-off-absence-form">
      <PanelQuestion title={t("calendar.timeOff.who")}>
        <BarberField barbers={ctx.catalog.barbers} value={memberId} onChange={setMemberId} locked={!manages || Boolean(ownId)} lockedHint={t("calendar.timeOff.ownOnly")} testId="time-off-who" />
      </PanelQuestion>
      <PanelQuestion title={t("calendar.timeOff.when")} aside={days > 0 ? <Text size="xs" tone="muted" tabular>{t("calendar.timeOff.daysCount", { count: days })}</Text> : undefined}>
        <DateRangePicker value={range ?? null} onChange={setRange} placeholder={t("calendar.timeOff.whenPlaceholder")} />
      </PanelQuestion>
      <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("calendar.timeOff.note")} aria-label={t("calendar.timeOff.note")} />
      <Text size="xs" tone="muted">
        {t(manages ? "calendar.timeOff.addHintManager" : "calendar.timeOff.addHint")}
      </Text>
      <Button size="lg" className="w-full" disabled={!ready || request.isPending} onClick={submit} data-testid="time-off-save">
        {t("calendar.timeOff.saveKind", { kind: label.toLowerCase() })}
      </Button>
    </div>
  );
}
