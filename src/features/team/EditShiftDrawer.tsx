import * as React from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { DrawerSection, DrawerShell } from "@/components/overlays";
import { Field } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { formatClock, parseClock, type ShiftDay } from "@/components/scheduling";
import { useOpenKey } from "@/features/calendar/calendarFormat";
import { InfoRow } from "./teamShared";
import type { WeekRow, WorkingRange } from "./types";
import { halfHours } from "./teamUtils";

/**
 * Editar este día: la fecha, la persona y las dos horas del turno de ese
 * día concreto. No toca el horario fijo.
 */

export interface EditShiftDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: WeekRow | null;
  day: ShiftDay | null;
  saving: boolean;
  onSave: (range: WorkingRange) => void;
}

const HOURS = halfHours(5, 24);
const clock = (value: string, intl: string) => formatClock(new Date(2000, 0, 1, Math.floor(parseClock(value) / 60), parseClock(value) % 60), intl);
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function EditShiftDrawer(props: EditShiftDrawerProps) {
  return <EditShiftPanel key={`${useOpenKey(props.open)}-${props.row?.memberId ?? ""}`} {...props} />;
}

function EditShiftPanel({ open, onOpenChange, row, day, saving, onSave }: EditShiftDrawerProps) {
  const t = useAppT();
  const { locale, current } = useLocale();
  const [start, setStart] = React.useState(day?.range?.start ?? "09:00");
  const [end, setEnd] = React.useState(day?.range?.end ?? "18:00");
  const invalid = parseClock(end) <= parseClock(start);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("teamHours.editTitle")}
      description={t("teamHours.editHint")}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={invalid || saving} onClick={() => onSave({ start, end })} data-testid="shift-save">
            {t("common.save")}
          </Button>
        </>
      }
    >
      {row && day && (
        <DrawerSection icon={Clock} tone="brand" title={t("teamHours.editTitle")} hint={t("teamHours.editHint")}>
          <div className="space-y-3" data-testid="shift-drawer">
            <div>
              <InfoRow label={t("teamHours.date")}>{capitalize(format(day.date, "EEEE, d 'de' MMMM", { locale: calendarLocale(locale) }))}</InfoRow>
              <InfoRow label={t("teamHours.barber")}>{row.name}</InfoRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("teamHours.start")} required>
                <Select value={start} onValueChange={setStart}>
                  <SelectTrigger data-testid="shift-start">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {clock(hour, current.intl)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("teamHours.end")} required error={invalid ? t("teamMember.schedule.invalid") : undefined}>
                <Select value={end} onValueChange={setEnd}>
                  <SelectTrigger data-testid="shift-end">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {clock(hour, current.intl)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {day.overridden && <Text variant="caption">{t("teamHours.overridden")}</Text>}
          </div>
        </DrawerSection>
      )}
    </DrawerShell>
  );
}
