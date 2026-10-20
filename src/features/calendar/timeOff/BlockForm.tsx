import * as React from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Field } from "@/components/forms";
import { DatePicker } from "@/components/date";
import { parseClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemaIcon } from "@/icons";
import { clockLabel, halfHourOptions } from "../calendarFormat";
import { blockClashes, workingHoursOn } from "../calendarModel";
import { PanelQuestion } from "../appointmentPanel/bookingStyle";
import { useCreateBlock, useUpdateBlock } from "../queries";
import { BLOCK_CATEGORY_KEYS, BLOCK_REPEAT_KEYS, blockCategorySchema, blockInputSchema, blockRepeatSchema, type Barber, type BlockCategory, type BlockRepeat, type CalendarDay, type TimeBlock } from "../types";
import { BarberField } from "./BarberField";
import type { TimeOffPreview } from "./timeOffModel";

/**
 * Crear o editar un bloqueo: una franja del barbero que deja de estar
 * disponible —almuerzo, reunión, capacitación— con su repetición, sus fechas
 * y sus horas. Se usa sola (desde el menú de la columna) y como página de
 * «Agregar» en Ausencias y bloqueos. Mientras se arma, se marca en la agenda
 * (`onPreview`); al final, un solo botón principal.
 */

export interface BlockFormProps {
  barbers: readonly Barber[];
  initialBarberId: string | null;
  /** El día que se mira en la agenda: de él salen la fecha inicial, la jornada y los choques. */
  date: Date;
  day?: CalendarDay;
  /** Un barbero bloquea su propia agenda: el barbero viene fijo y no hay «cierre del negocio». */
  ownOnly?: boolean;
  block?: TimeBlock | null;
  onDone: () => void;
  onPreview?: (preview: TimeOffPreview | null) => void;
}

const HOURS = halfHourOptions(6, 24);

export function BlockForm({ barbers, initialBarberId, date, day, ownOnly = false, block = null, onDone, onPreview }: BlockFormProps) {
  const t = useAppT();
  const { current } = useLocale();
  const create = useCreateBlock();
  const update = useUpdateBlock();
  const saving = create.isPending || update.isPending;
  const [barberId, setBarberId] = React.useState(block?.barberId ?? initialBarberId ?? barbers[0]?.id ?? "");
  const [category, setCategory] = React.useState<BlockCategory>(block?.category ?? "lunch");
  const [repeat, setRepeat] = React.useState<BlockRepeat>(block?.repeat ?? "none");
  const [startDate, setStartDate] = React.useState<Date | null>(block ? parseISO(block.startDate) : date);
  const [endDate, setEndDate] = React.useState<Date | null>(block ? parseISO(block.endDate) : date);
  const [startTime, setStartTime] = React.useState(block?.startTime ?? "13:00");
  const [endTime, setEndTime] = React.useState(block?.endTime ?? "14:00");
  const [description, setDescription] = React.useState(block?.description ?? "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const barber = barbers.find((item) => item.id === barberId);
  const hours = barber ? workingHoursOn(barber, startDate ?? date) : [];
  const fullDay = () => {
    if (hours.length === 0) return;
    setStartTime(hours[0].start);
    setEndTime(hours[hours.length - 1].end);
  };
  const sameDay = startDate !== null && isSameDay(startDate, date);
  const clashes = day && sameDay && !block ? blockClashes(day.appointments, barberId, parseClock(startTime), parseClock(endTime)) : 0;

  // Mientras se arma, la agenda lo marca en su sitio y se va a su primer día.
  const startKey = startDate ? format(startDate, "yyyy-MM-dd") : "";
  const endKey = endDate ? format(endDate, "yyyy-MM-dd") : startKey;
  const label = t(BLOCK_CATEGORY_KEYS[category]);
  React.useEffect(() => {
    if (!onPreview) return;
    onPreview(barberId && startKey ? { barberId, label, startDate: startKey, endDate: endKey < startKey ? startKey : endKey, repeat, startTime, endTime } : null);
  }, [onPreview, barberId, label, startKey, endKey, repeat, startTime, endTime]);
  React.useEffect(() => () => onPreview?.(null), [onPreview]);

  const submit = () => {
    const parsed = blockInputSchema.safeParse({ barberId, category, repeat, startDate: startKey, endDate: endKey, startTime, endTime, description: description.trim() || null });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    const handlers = {
      onSuccess: () => {
        toast.success(t(block ? "calendar.block.saved" : "calendar.block.created"));
        onDone();
      },
      onError: (error: unknown) => {
        if (isApiError(error) && error.fieldErrors) setErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]])));
        toast.error(describeError(error).title, { description: describeError(error).description });
      },
    };
    if (block) update.mutate({ id: block.id, input: parsed.data }, handlers);
    else create.mutate(parsed.data, handlers);
  };

  const hourSelect = (value: string, onChange: (value: string) => void) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((hour) => (
          <SelectItem key={hour} value={hour}>
            {clockLabel(hour, current.intl)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-5" data-testid="block-drawer">
      <PanelQuestion title={t("calendar.timeOff.who")}>
        <BarberField barbers={barbers} value={barberId} onChange={setBarberId} locked={ownOnly} lockedHint={t("calendar.createV.ownColumn")} testId="block-barber" />
        {errors.barberId && <Text size="xs" tone="negative">{errors.barberId}</Text>}
      </PanelQuestion>

      <PanelQuestion title={t("calendar.timeOff.what")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("calendar.block.category")} required error={errors.category}>
            <Select value={category} onValueChange={(value) => setCategory(value as BlockCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blockCategorySchema.options.filter((option) => !ownOnly || option !== "business").map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(BLOCK_CATEGORY_KEYS[option])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("calendar.block.repeat")} required error={errors.repeat}>
            <Select value={repeat} onValueChange={(value) => setRepeat(value as BlockRepeat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blockRepeatSchema.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(BLOCK_REPEAT_KEYS[option])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </PanelQuestion>

      <PanelQuestion title={t("calendar.timeOff.when")}>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker label={t("calendar.block.startDate")} value={startDate} onChange={(value) => setStartDate(value ?? null)} locale={current.intl} error={errors.startDate} />
            <DatePicker label={t("calendar.block.endDate")} value={endDate} onChange={(value) => setEndDate(value ?? null)} locale={current.intl} minDate={startDate ?? undefined} error={errors.endDate} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("calendar.block.startTime")} required error={errors.startTime}>
              {hourSelect(startTime, setStartTime)}
            </Field>
            <Field label={t("calendar.block.endTime")} required error={errors.endTime}>
              {hourSelect(endTime, setEndTime)}
            </Field>
          </div>
          {hours.length > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={fullDay} className="self-start" data-testid="block-full-day">
              {t("calendar.block.fullDay", { range: `${clockLabel(hours[0].start, current.intl)} – ${clockLabel(hours[hours.length - 1].end, current.intl)}` })}
            </Button>
          )}
          {clashes > 0 && (
            <Text size="sm" tone="warning" role="alert" data-testid="block-clashes">
              {t("calendar.block.clashes", { count: clashes })}
            </Text>
          )}
        </div>
      </PanelQuestion>

      <Field label={t("calendar.block.description")}>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
      </Field>

      <Button size="lg" className="w-full" onClick={submit} disabled={saving} data-testid="block-submit">
        <ThemaIcon name={block ? "check" : "lock"} />
        {t(block ? "calendar.block.save" : "calendar.block.createFull")}
      </Button>
    </div>
  );
}
