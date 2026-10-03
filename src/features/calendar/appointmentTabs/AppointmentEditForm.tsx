import * as React from "react";
import { format, startOfDay } from "date-fns";
import { useAppT } from "@/app/i18n";
import { DatePicker } from "@/components/date";
import { Field, MultiSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import {
  atMinutes,
  formatClock,
  minutesOfDay,
  parseClock,
} from "@/components/scheduling";
import { PersonAvatar } from "../calendarShared";
import {
  appointmentStart,
  findBarber,
  servicesMinutes,
  servicesOf,
  servicesPrice,
  toLocalIso,
  workingHoursOn,
  type ModelContext,
} from "../calendarModel";
import type { Appointment, AppointmentPatch } from "../types";

/**
 * Cambiar una cita sin salir del detalle: servicios, barbero, fecha, hora,
 * duración y la nota para el barbero. Cada cambio se guarda al momento.
 */

export interface AppointmentEditFormProps {
  appointment: Appointment;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180];
const TIME_STEP_MINUTES = 15;
const FALLBACK_HOURS = [{ start: "06:00", end: "23:00" }];

const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export function AppointmentEditForm({
  appointment,
  ctx,
  onPatch,
}: AppointmentEditFormProps) {
  const t = useAppT();
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const services = servicesOf(ctx.catalog, appointment);
  const price = servicesPrice(services);
  const start = appointmentStart(appointment);
  const startMinute = minutesOfDay(start);
  const [note, setNote] = React.useState(appointment.notes ?? "");
  const noteDirty = note.trim() !== (appointment.notes ?? "");

  // Las horas que se ofrecen son las de la jornada del barbero ese día, más la que ya tiene.
  const hours = barber ? workingHoursOn(barber, start) : [];
  const slots = new Set<number>([startMinute]);
  for (const range of hours.length > 0 ? hours : FALLBACK_HOURS) {
    for (
      let minute = parseClock(range.start);
      minute < parseClock(range.end);
      minute += TIME_STEP_MINUTES
    )
      slots.add(minute);
  }
  const times = [...slots].sort((a, b) => a - b);

  return (
    <div className="space-y-4" data-testid="appointment-edit">
      <Field label={t("calendar.detail.edit.services")}>
        <MultiSelect
          value={appointment.serviceIds}
          onValueChange={(serviceIds) =>
            serviceIds.length > 0 && onPatch(appointment, { serviceIds })
          }
          placeholder={t("calendar.create.pickService")}
          searchPlaceholder={t("calendar.create.searchServices")}
          options={ctx.catalog.services.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      </Field>
      <Field label={t("calendar.field.barber")}>
        <Select
          value={appointment.barberId}
          onValueChange={(barberId) => onPatch(appointment, { barberId })}
        >
          <SelectTrigger
            aria-label={t("calendar.field.barber")}
            data-testid="appointment-barber"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ctx.catalog.barbers.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <span className="flex items-center gap-2">
                  <PersonAvatar
                    name={item.name}
                    avatarUrl={item.avatarUrl}
                    size="sm"
                  />
                  {item.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <DatePicker
          label={t("calendar.detail.edit.date")}
          value={start}
          minDate={ctx.now ? startOfDay(ctx.now) : undefined}
          onChange={(date) =>
            date &&
            onPatch(appointment, {
              start: `${format(date, "yyyy-MM-dd")}T${clock(startMinute)}`,
            })
          }
        />
        <Field label={t("calendar.detail.edit.time")}>
          <Select
            value={String(startMinute)}
            onValueChange={(value) =>
              onPatch(appointment, {
                start: toLocalIso(atMinutes(start, Number(value))),
              })
            }
          >
            <SelectTrigger
              aria-label={t("calendar.detail.edit.time")}
              data-testid="appointment-time"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {times.map((minute) => (
                <SelectItem key={minute} value={String(minute)}>
                  {formatClock(atMinutes(start, minute), ctx.intl)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("calendar.field.duration")}>
          <Select
            value={String(appointment.durationMin)}
            onValueChange={(value) =>
              onPatch(appointment, { durationMin: Number(value) })
            }
          >
            <SelectTrigger
              aria-label={t("calendar.detail.changeDuration")}
              data-testid="appointment-duration"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([...DURATIONS, appointment.durationMin])]
                .sort((a, b) => a - b)
                .map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {t("calendar.field.minutes", { count: minutes })}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label={t("calendar.create.notes")}>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          data-testid="appointment-note"
        />
      </Field>
      {noteDirty && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPatch(appointment, { notes: note.trim() || null })}
          data-testid="appointment-note-save"
        >
          {t("calendar.detail.edit.saveNote")}
        </Button>
      )}
      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <Text variant="muted">
          {t("calendar.field.total", {
            count: services.length,
            minutes: servicesMinutes(services),
          })}
        </Text>
        <Text weight="semibold" tabular>
          {ctx.formatMoney(price)}
        </Text>
      </div>
    </div>
  );
}
