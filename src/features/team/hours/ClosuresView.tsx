import * as React from "react";
import { format } from "date-fns";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { DatePicker } from "@/components/date";
import { Field } from "@/components/forms";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { InfoCard } from "../teamShared";
import { useAddClosure, useClosureImpact, useClosuresQuery, useRemoveClosure, useSetHoliday } from "../queries";
import type { ClosureInput } from "../types";
import { clockOptions, minutesOf } from "./shiftEditing";

/**
 * La pestaña «Festivos y cierres» (docs/WORK_HOURS_RESEARCH.md, P1): los festivos del país de la sede
 * con un interruptor «Cerramos» (por defecto se trabaja) y los cierres propios —el día entero o con
 * horario reducido—, con las citas que quedarían fuera antes de guardar. Un cierre recorta el turno
 * de todo el equipo de la sede y le avisa a cada uno.
 */

export interface ClosuresViewProps {
  branchId: string;
  /** Dueño o administrador: los demás lo ven. */
  manages: boolean;
  today: Date;
}

const OPTIONS = clockOptions(5 * 60, 24 * 60);

export function ClosuresView({ branchId, manages, today }: ClosuresViewProps) {
  const t = useAppT();
  const { locale, current } = useLocale();
  const dateLocale = calendarLocale(locale);
  const [year, setYear] = React.useState(today.getFullYear());
  const closures = useClosuresQuery(branchId, year);
  const setHoliday = useSetHoliday();
  const removeClosure = useRemoveClosure();
  const [adding, setAdding] = React.useState(false);
  const todayKey = format(today, "yyyy-MM-dd");
  const longDate = (date: string) => format(new Date(`${date}T00:00:00`), "EEE d 'de' MMM", { locale: dateLocale });
  const clock = (value: string) => formatClock(new Date(2000, 0, 1, Math.floor(minutesOf(value) / 60), minutesOf(value) % 60), current.intl);
  const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const data = closures.data;

  const yearPicker = (
    <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
      <SelectTrigger size="sm" className="w-auto" aria-label={t("hours.closures.year")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[today.getFullYear(), today.getFullYear() + 1].map((option) => (
          <SelectItem key={option} value={String(option)}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-section" data-testid="schedule-closures">
      <InfoCard title={data ? t("hours.closures.holidays", { country: data.country }) : t("hours.tab.closures")} description={t("hours.closures.holidaysHint")} actions={yearPicker}>
        {closures.isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : data.holidays.length === 0 ? (
          <Text size="sm" tone="muted">
            {t("hours.closures.noCountry", { country: data.country })}
          </Text>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.holidays.map((holiday) => (
              <li key={holiday.date} className={cn("flex items-center justify-between gap-3 py-2.5", holiday.date < todayKey && "opacity-60")}>
                <span className="flex min-w-0 flex-col">
                  <Text as="span" size="sm" weight="medium">
                    {holiday.name}
                  </Text>
                  <Text as="span" size="xs" tone="muted" className="first-letter:uppercase">
                    {longDate(holiday.date)}
                  </Text>
                </span>
                <label className="flex shrink-0 items-center gap-2">
                  <Text as="span" size="xs" tone="secondary">
                    {t("hours.closures.closes")}
                  </Text>
                  <Switch
                    checked={holiday.closed}
                    disabled={!manages || setHoliday.isPending}
                    aria-label={`${t("hours.closures.closes")}: ${holiday.name}`}
                    onCheckedChange={(closed) =>
                      setHoliday.mutate(
                        { branchId, date: holiday.date, closed },
                        { onSuccess: () => toast.success(t(closed ? "hours.closures.closedDone" : "hours.closures.openDone", { name: holiday.name })), onError: fail }
                      )
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </InfoCard>

      <InfoCard
        title={t("hours.closures.own")}
        description={t("hours.closures.ownHint")}
        actions={
          manages &&
          !adding && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)} data-testid="closure-add">
              <Plus /> {t("hours.closures.add")}
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {adding && <ClosureForm branchId={branchId} today={today} clock={clock} onDone={() => setAdding(false)} />}
          {(data?.closures ?? []).length === 0 ? (
            !adding && (
              <Text size="sm" tone="muted">
                {t("hours.closures.emptyOwn")}
              </Text>
            )
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {(data?.closures ?? []).map((closure) => (
                <li key={closure.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 flex-col">
                    <Text as="span" size="sm" weight="medium">
                      {closure.name}
                    </Text>
                    <Text as="span" size="xs" tone="muted" className="first-letter:uppercase">
                      {`${longDate(closure.date)} · ${closure.open ? t("hours.closures.reducedLabel", { from: clock(closure.open.start), to: clock(closure.open.end) }) : t("hours.closures.fullLabel")}`}
                    </Text>
                  </span>
                  {manages && (
                    <Button variant="ghost" size="icon-sm" aria-label={t("hours.closures.remove", { date: longDate(closure.date) })} onClick={() => removeClosure.mutate(closure.id, { onSuccess: () => toast.success(t("hours.closures.removed")), onError: fail })}>
                      <Trash2 />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </InfoCard>
    </div>
  );
}

/** Agregar un cierre: el día, el motivo y si cierra todo el día o abre menos horas; antes de guardar, las citas que quedarían fuera. */
function ClosureForm({ branchId, today, clock, onDone }: { branchId: string; today: Date; clock: (value: string) => string; onDone: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const add = useAddClosure();
  const [date, setDate] = React.useState<Date | null>(null);
  const [name, setName] = React.useState("");
  const [fullDay, setFullDay] = React.useState(true);
  const [open, setOpen] = React.useState({ start: "09:00", end: "13:00" });
  const reducedInvalid = !fullDay && minutesOf(open.end) <= minutesOf(open.start);
  const input: ClosureInput | null = date && !reducedInvalid ? { branchId, date: format(date, "yyyy-MM-dd"), name: name.trim() || t("hours.closures.own"), open: fullDay ? null : open } : null;
  const deferred = React.useDeferredValue(input);
  const impact = useClosureImpact(deferred);
  const affected = impact.data?.items ?? [];

  const save = () => {
    if (!input) return;
    add.mutate(input, {
      onSuccess: () => {
        toast.success(t("hours.closures.saved"));
        onDone();
      },
      onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-subtle p-4" data-testid="closure-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker label={t("hours.closures.date")} value={date} onChange={(next) => setDate(next ?? null)} minDate={today} locale={locale} />
        <Field label={t("hours.closures.name")}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("hours.closures.namePlaceholder")} data-testid="closure-name" />
        </Field>
      </div>
      <label className="flex items-center justify-between gap-3">
        <Text as="span" size="sm">
          {t("hours.closures.fullDay")}
        </Text>
        <Switch checked={fullDay} onCheckedChange={setFullDay} data-testid="closure-full-day" />
      </label>
      {!fullDay && (
        <div className="grid grid-cols-2 gap-3">
          {(["start", "end"] as const).map((edge) => (
            <Field key={edge} label={t(edge === "start" ? "hours.closures.opens" : "hours.closures.closesAt")} error={edge === "end" && reducedInvalid ? t("hours.editor.problem.endBeforeStart") : undefined}>
              <Select value={open[edge]} onValueChange={(value) => setOpen((current) => ({ ...current, [edge]: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {clock(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>
      )}
      {affected.length > 0 && (
        <Alert variant="warning" data-testid="closure-impact">
          <TriangleAlert />
          <AlertTitle>{t("hours.closures.impactTitle", { count: affected.length })}</AlertTitle>
          <AlertDescription>
            <span className="block">{t("hours.editor.impactHint")}</span>
            <ul className="mt-2 flex flex-col gap-1">
              {affected.slice(0, 8).map((item) => (
                <li key={item.id} className="text-text-primary">
                  {`${clock(item.start.slice(11, 16))} · ${item.clientName} · ${item.barberName ?? ""}`}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button disabled={!input || add.isPending} onClick={save} data-testid="closure-save">
          {affected.length > 0 ? t("hours.editor.saveAnyway") : t("hours.closures.save")}
        </Button>
      </div>
    </div>
  );
}
