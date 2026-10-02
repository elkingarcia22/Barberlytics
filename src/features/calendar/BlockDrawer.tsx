import * as React from "react";
import { format } from "date-fns";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { DrawerSection, DrawerShell } from "@/components/overlays";
import { Field } from "@/components/forms";
import { DatePicker } from "@/components/date";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonAvatar } from "./calendarShared";
import { halfHourOptions, useOpenKey } from "./calendarFormat";
import { useCreateBlock } from "./queries";
import { BLOCK_CATEGORY_KEYS, BLOCK_REPEAT_KEYS, blockCategorySchema, blockInputSchema, blockRepeatSchema, type Barber, type BlockCategory, type BlockRepeat } from "./types";

/**
 * Crear bloqueo: una franja del barbero que deja de estar disponible —
 * almuerzo, reunión, enfermedad, vacaciones— con su repetición, sus fechas
 * y sus horas.
 */

export interface BlockDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbers: readonly Barber[];
  initialBarberId: string | null;
  date: Date;
}

const HOURS = halfHourOptions(6, 24);

export function BlockDrawer(props: BlockDrawerProps) {
  return <BlockPanel key={useOpenKey(props.open)} {...props} />;
}

function BlockPanel({ open, onOpenChange, barbers, initialBarberId, date }: BlockDrawerProps) {
  const t = useAppT();
  const { current } = useLocale();
  const create = useCreateBlock();
  const [barberId, setBarberId] = React.useState(initialBarberId ?? barbers[0]?.id ?? "");
  const [category, setCategory] = React.useState<BlockCategory>("lunch");
  const [repeat, setRepeat] = React.useState<BlockRepeat>("none");
  const [startDate, setStartDate] = React.useState<Date | null>(date);
  const [endDate, setEndDate] = React.useState<Date | null>(date);
  const [startTime, setStartTime] = React.useState("13:00");
  const [endTime, setEndTime] = React.useState("14:00");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const submit = () => {
    const parsed = blockInputSchema.safeParse({
      barberId,
      category,
      repeat,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
      startTime,
      endTime,
      description: description.trim() || null,
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t("calendar.block.created"));
        onOpenChange(false);
      },
      onError: (error) => {
        if (isApiError(error) && error.fieldErrors) setErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]])));
        toast.error(describeError(error).title, { description: describeError(error).description });
      },
    });
  };

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("calendar.block.title")}
      description={t("calendar.block.hint")}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={create.isPending} data-testid="block-submit">
            {t("calendar.block.create")}
          </Button>
        </>
      }
    >
      <DrawerSection icon={Ban} tone="negative" title={t("calendar.block.title")} hint={t("calendar.block.hint")}>
        <div className="space-y-3" data-testid="block-drawer">
          <Field label={t("calendar.block.barber")} required error={errors.barberId}>
            <Select value={barberId} onValueChange={setBarberId}>
              <SelectTrigger>
                <SelectValue placeholder={t("calendar.create.pickBarber")} />
              </SelectTrigger>
              <SelectContent>
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
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("calendar.block.category")} required error={errors.category}>
              <Select value={category} onValueChange={(value) => setCategory(value as BlockCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {blockCategorySchema.options.map((option) => (
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
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker label={t("calendar.block.startDate")} value={startDate} onChange={(value) => setStartDate(value ?? null)} locale={current.intl} error={errors.startDate} />
            <DatePicker label={t("calendar.block.endDate")} value={endDate} onChange={(value) => setEndDate(value ?? null)} locale={current.intl} minDate={startDate ?? undefined} error={errors.endDate} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("calendar.block.startTime")} required error={errors.startTime}>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("calendar.block.endTime")} required error={errors.endTime}>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={t("calendar.block.description")}>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
          </Field>
        </div>
      </DrawerSection>
    </DrawerShell>
  );
}
