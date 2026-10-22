import * as React from "react";
import { format } from "date-fns";
import { CalendarClock, Coffee, Plus, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Chip } from "@/components/ai-interaction";
import { PanelFooter } from "@/components/overlays";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MAX_BREAKS, rangesOf } from "../shiftRanges";
import { useClearOverride, useScheduleImpact, useSetOverride, useSetWeekday } from "../queries";
import type { ScheduleImpact, ShiftScope, WorkingRange } from "../types";
import { DEFAULT_SHIFT, SHIFT_PRESETS, applyPreset, clockOptions, minutesOf, newBreak, sameShift, shiftHours, shiftProblem, type HoursAccess, type ShiftPreset } from "./shiftEditing";

/**
 * El turno de una persona un día, como lo cambia el mostrador (docs/WORK_HOURS_RESEARCH.md): atajos
 * (entra tarde, sale antes, almuerzo, día libre), entrada y salida con sus descansos, para cuándo es
 * el cambio («solo este día» o «este y los siguientes») y, antes de guardar, las citas que quedarían
 * fuera del turno nuevo para abrirlas. Un solo botón para guardar. Lo usan el drawer del calendario y
 * la semana de Equipo.
 */

export interface ShiftEditorProps {
  memberId: string;
  memberName: string;
  date: Date;
  /** El turno que rige ese día (la excepción o el fijo). */
  current: WorkingRange | null;
  /** El horario fijo de ese día de la semana. */
  fixed: WorkingRange | null;
  /** Ese día ya tiene su propio cambio. */
  overridden: boolean;
  access: HoursAccess;
  onDone: () => void;
  /** Abrir una cita que quedaría fuera (en el calendario). */
  onOpenAppointment?: (item: ScheduleImpact) => void;
}

const OPTIONS = clockOptions();
const LONG_DATE = "EEEE d 'de' MMMM";
const PRESET_KEYS = { late: "hours.editor.preset.late", early: "hours.editor.preset.early", lunch: "hours.editor.preset.lunch", off: "hours.editor.preset.off" } as const;

export function ShiftEditor({ memberId, memberName, date, current, fixed, overridden, access, onDone, onOpenAppointment }: ShiftEditorProps) {
  const t = useAppT();
  const { locale, current: lang, formatNumber } = useLocale();
  const dateLocale = calendarLocale(locale);
  const [draft, setDraft] = React.useState<WorkingRange | null>(current);
  const canPattern = access.canEditPattern(memberId);
  const [scope, setScope] = React.useState<ShiftScope>("day");
  const dateKey = format(date, "yyyy-MM-dd");
  const firstName = memberName.split(" ")[0];
  const weekday = format(date, "EEEE", { locale: dateLocale });
  const clock = (value: string) => formatClock(new Date(2000, 0, 1, Math.floor(minutesOf(value) / 60), minutesOf(value) % 60), lang.intl);
  const rangeText = (range: WorkingRange) => rangesOf(range).map((piece) => `${clock(piece.start)} – ${clock(piece.end)}`).join(" · ");
  const problem = shiftProblem(draft);

  // Las citas que quedarían fuera: se piden de nuevo cuando el turno deja de cambiar.
  const deferred = React.useDeferredValue({ draft, scope });
  const impact = useScheduleImpact(problem ? null : { memberId, date: dateKey, range: deferred.draft, scope: deferred.scope });
  const affected = impact.data?.items ?? [];

  const setOverride = useSetOverride();
  const setWeekday = useSetWeekday();
  const clearOverride = useClearOverride();
  const saving = setOverride.isPending || setWeekday.isPending || clearOverride.isPending;
  const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const longDate = format(date, LONG_DATE, { locale: dateLocale });
  const finish = (message: string) => ({
    onSuccess: () => {
      toast.success(message);
      onDone();
    },
    onError: fail,
  });

  const save = () => {
    if (problem) return;
    if (scope === "following") {
      setWeekday.mutate({ memberId, from: dateKey, range: draft }, finish(t("hours.editor.savedFollowing", { name: firstName, date: longDate })));
      return;
    }
    // Igual al horario fijo: no hace falta guardar una excepción (y si la había, se quita).
    if (sameShift(draft, fixed)) {
      if (!overridden) return onDone();
      clearOverride.mutate({ memberId, date: dateKey }, finish(t("hours.editor.saved", { name: firstName })));
      return;
    }
    setOverride.mutate({ memberId, date: dateKey, range: draft }, finish(t("hours.editor.saved", { name: firstName })));
  };
  const restore = () => clearOverride.mutate({ memberId, date: dateKey }, finish(t("hours.editor.restored", { name: firstName })));

  const preset = (id: ShiftPreset) => {
    const next = applyPreset(draft, id);
    if (next !== undefined) setDraft(next);
  };
  const breaks = draft?.breaks ?? [];
  const setBreak = (index: number, next: { start: string; end: string } | null) =>
    draft && setDraft({ ...draft, breaks: next ? breaks.map((item, position) => (position === index ? next : item)) : breaks.filter((_, position) => position !== index) });

  return (
    <div className="flex flex-col gap-5" data-testid="shift-editor">
      <Text size="sm" tone="secondary">
        {fixed ? t("hours.editor.fixedIs", { weekday, range: rangeText(fixed) }) : t("hours.editor.fixedOff", { weekday })}
      </Text>

      <div role="group" aria-label={t("hours.editor.presets")} className="flex flex-wrap gap-2" data-testid="shift-presets">
        {SHIFT_PRESETS.map((id) => (
          <Chip key={id} size="sm" label={t(PRESET_KEYS[id])} disabled={applyPreset(draft, id) === undefined} onClick={() => preset(id)} />
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <label className="flex items-center justify-between gap-3">
          <Text as="span" size="sm" weight="medium">
            {t("hours.editor.works")}
          </Text>
          <Switch checked={draft !== null} onCheckedChange={(checked) => setDraft(checked ? (current ?? fixed ?? DEFAULT_SHIFT) : null)} data-testid="shift-works" />
        </label>
        {draft ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <ClockField label={t("hours.editor.start")} value={draft.start} onChange={(start) => setDraft({ ...draft, start })} format={clock} testId="shift-start" />
              <ClockField label={t("hours.editor.end")} value={draft.end} onChange={(end) => setDraft({ ...draft, end })} format={clock} invalid={problem === "endBeforeStart"} testId="shift-end" />
            </div>
            {breaks.map((pause, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2">
                <Coffee className="mb-2.5 size-4 text-text-muted" aria-hidden />
                <ClockField label={t("hours.editor.breakStart")} value={pause.start} onChange={(start) => setBreak(index, { ...pause, start })} format={clock} />
                <ClockField label={t("hours.editor.breakEnd")} value={pause.end} onChange={(end) => setBreak(index, { ...pause, end })} format={clock} />
                <Button type="button" variant="ghost" size="icon-sm" className="mb-1" onClick={() => setBreak(index, null)} aria-label={t("hours.editor.removeBreak")}>
                  <X />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" className="-ml-2" disabled={breaks.length >= MAX_BREAKS} onClick={() => setDraft({ ...draft, breaks: [...breaks, newBreak(draft)] })} data-testid="shift-add-break">
                <Plus /> {t("hours.editor.addBreak")}
              </Button>
              <Text size="sm" tone="secondary" tabular>
                {t("hours.editor.worked", { hours: formatNumber(shiftHours(draft), { maximumFractionDigits: 2 }) })}
              </Text>
            </div>
            {problem && (
              <Text size="sm" tone="negative" role="alert">
                {t(problem === "endBeforeStart" ? "hours.editor.problem.endBeforeStart" : "hours.editor.problem.breaks")}
              </Text>
            )}
          </>
        ) : (
          <Text size="sm" tone="muted">
            {t("hours.drawer.off")}
          </Text>
        )}
      </section>

      {canPattern && (
        <fieldset className="flex flex-col gap-2" data-testid="shift-scope">
          <legend className="mb-2 text-sm font-medium text-text-primary">{t("hours.editor.scope")}</legend>
          <RadioGroup value={scope} onValueChange={(value) => setScope(value as ShiftScope)} className="gap-2">
            {(
              [
                { value: "day", label: t("hours.editor.scope.day"), hint: t("hours.editor.scope.dayHint", { date: longDate }) },
                { value: "following", label: t("hours.editor.scope.following", { weekday }), hint: t("hours.editor.scope.followingHint", { date: longDate }) },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 transition-colors duration-fast has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <Text as="span" size="sm" weight="medium">
                    {option.label}
                  </Text>
                  <Text as="span" size="xs" tone="muted">
                    {option.hint}
                  </Text>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      )}

      {!problem && <ImpactList items={affected} following={scope === "following"} clock={(iso) => clock(iso.slice(11, 16))} dateOf={(day) => format(new Date(`${day}T00:00:00`), "EEE d MMM", { locale: dateLocale })} onOpen={onOpenAppointment} />}

      {overridden && scope === "day" && (
        <Button type="button" variant="ghost" size="sm" className="self-start" disabled={saving} onClick={restore} data-testid="shift-restore">
          {t("hours.editor.restore")}
        </Button>
      )}

      <PanelFooter>
        <Button size="lg" className="w-full" disabled={Boolean(problem) || saving} onClick={save} data-testid="shift-save">
          {affected.length > 0 ? t("hours.editor.saveAnyway") : t("hours.editor.save")}
        </Button>
      </PanelFooter>
    </div>
  );
}

/** Las citas por atender que quedarían fuera: avisa, no bloquea; cada una se abre para moverla. */
function ImpactList({ items, following, clock, dateOf, onOpen }: { items: readonly ScheduleImpact[]; following: boolean; clock: (iso: string) => string; dateOf: (day: string) => string; onOpen?: (item: ScheduleImpact) => void }) {
  const t = useAppT();
  if (items.length === 0) {
    return (
      <Text size="sm" tone="muted" className="flex items-center gap-2" data-testid="shift-impact-none">
        <CalendarClock className="size-4" aria-hidden />
        {t("hours.editor.impactNone")}
      </Text>
    );
  }
  return (
    <Alert variant="warning" data-testid="shift-impact">
      <TriangleAlert />
      <AlertTitle>{t("hours.editor.impactTitle", { count: items.length })}</AlertTitle>
      <AlertDescription>
        <span className="block">{t("hours.editor.impactHint")}</span>
        <ul className="mt-2 flex flex-col divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium" className="text-text-primary" truncate>
                  {[following ? dateOf(item.date) : null, clock(item.start)].filter(Boolean).join(" · ")} · {item.clientName}
                </Text>
                <Text as="span" size="xs" tone="muted" truncate>
                  {item.serviceName}
                </Text>
              </span>
              {onOpen && (
                <Button type="button" variant="outline" size="xs" onClick={() => onOpen(item)}>
                  {t("hours.editor.impactOpen")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

function ClockField({ label, value, onChange, format: show, invalid = false, testId }: { label: string; value: string; onChange: (value: string) => void; format: (value: string) => string; invalid?: boolean; testId?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Text as="span" size="xs" tone="secondary">
        {label}
      </Text>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} aria-invalid={invalid} data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* La hora guardada puede no estar en la lista (un turno de otro paso): se ofrece igual. */}
          {(OPTIONS.includes(value) ? OPTIONS : [...OPTIONS, value].sort()).map((option) => (
            <SelectItem key={option} value={option}>
              {show(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
