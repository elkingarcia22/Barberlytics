import * as React from "react";
import { isBefore, isSameDay, startOfDay } from "date-fns";
import { CalendarClock, Scissors, UserRound, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { DrawerSection, DrawerShell } from "@/components/overlays";
import { Field, SearchableSelect } from "@/components/forms";
import { SegmentedControl } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { TimeSlotPicker, formatClockRange, isWorkingAt, minutesOfDay } from "@/components/scheduling";
import { PersonAvatar } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { appointmentInputSchema, CLIENT_TYPE_KEYS, REPEAT_KEYS, repeatRuleSchema, type Appointment, type RepeatRule } from "./types";
import { findBarber, toLocalIso, workingHoursOn, type ModelContext } from "./calendarModel";
import { useCreateAppointment } from "./queries";

/**
 * Crear cita: cliente, servicio, barbero y fecha & hora, el interruptor de
 * «cliente sin cita previa» y la repetición. Tocar una franja vacía del
 * calendario abre este panel con el barbero y la hora ya puestos.
 */

export interface CreateAppointmentInitial {
  barberId?: string;
  start?: Date;
  clientId?: string;
  serviceId?: string;
  walkIn?: boolean;
}

export interface CreateAppointmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  initial: CreateAppointmentInitial | null;
  now?: Date;
  onCreated: (appointment: Appointment) => void;
  onCreateClient: () => void;
}

type LevelFilter = string;

/** Cada apertura arranca del hueco que se tocó (o en blanco): el panel se remonta con una llave nueva. */
export function CreateAppointmentDrawer(props: CreateAppointmentDrawerProps) {
  return <CreateAppointmentPanel key={useOpenKey(props.open)} {...props} />;
}

function CreateAppointmentPanel({ open, onOpenChange, ctx, initial, now, onCreated, onCreateClient }: CreateAppointmentDrawerProps) {
  const t = useAppT();
  const create = useCreateAppointment();
  const [clientId, setClientId] = React.useState(initial?.clientId ?? "");
  const [serviceId, setServiceId] = React.useState(initial?.serviceId ?? "");
  const [barberId, setBarberId] = React.useState(initial?.barberId ?? "");
  const [level, setLevel] = React.useState<LevelFilter>("all");
  const [start, setStart] = React.useState<Date | null>(initial?.start ?? null);
  const [walkIn, setWalkIn] = React.useState(initial?.walkIn ?? false);
  const [repeat, setRepeat] = React.useState<RepeatRule>("none");
  const [notes, setNotes] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  const barber = findBarber(ctx.catalog, barberId || null);
  const service = ctx.catalog.services.find((item) => item.id === serviceId);
  const levels = [...new Set(ctx.catalog.barbers.map((item) => item.level).filter((item): item is string => Boolean(item)))];
  const barbers = ctx.catalog.barbers.filter((item) => level === "all" || item.level === level);

  const isSlotDisabled = React.useCallback(
    (date: Date) => {
      if (isBefore(date, nowDate) && isSameDay(date, nowDate)) return true;
      if (isBefore(startOfDay(date), startOfDay(nowDate))) return true;
      if (!barber) return false;
      return !isWorkingAt(workingHoursOn(barber, date), minutesOfDay(date));
    },
    [barber, nowDate]
  );

  const submit = () => {
    const parsed = appointmentInputSchema.safeParse({
      clientId,
      barberId,
      serviceIds: serviceId ? [serviceId] : [],
      start: start ? toLocalIso(start) : "",
      walkIn,
      repeat,
      requestedBarberId: walkIn ? null : barberId || null,
      notes: notes.trim() || null,
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: (appointment) => {
        const client = ctx.catalog.clients.find((item) => item.id === appointment.clientId);
        toast.success(t("calendar.create.created"), {
          description: t("calendar.create.createdHint", { client: client?.name ?? "", barber: barber?.name ?? "", time: start ? formatClockRange(start, new Date(start.getTime() + appointment.durationMin * 60_000), ctx.intl) : "" }),
        });
        onOpenChange(false);
        onCreated(appointment);
      },
      onError: (error) => {
        if (isApiError(error) && error.fieldErrors) {
          setErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]])));
        }
        toast.error(describeError(error).title, { description: describeError(error).description });
      },
    });
  };

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t("calendar.create.title")}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={create.isPending} data-testid="create-appointment-submit">
            {t("calendar.create.submit")}
          </Button>
        </>
      }
    >
      <div className="space-y-3" data-testid="create-appointment">
        <DrawerSection icon={UserRound} tone="brand" title={t("calendar.field.client")} hint={t("calendar.create.pickClient")} action={<Button size="xs" variant="outline" onClick={onCreateClient}><UserRoundPlus /> {t("calendar.create.createClient")}</Button>}>
          <Field error={errors.clientId}>
            <SearchableSelect
              value={clientId}
              onValueChange={setClientId}
              placeholder={t("calendar.create.pickClient")}
              searchPlaceholder={t("calendar.create.searchClients", { count: ctx.catalog.clients.length - 1 })}
              options={ctx.catalog.clients.map((client) => ({ value: client.id, label: client.name, description: `${client.phone} · ${t(CLIENT_TYPE_KEYS[client.type])}` }))}
            />
          </Field>
        </DrawerSection>

        <DrawerSection icon={Scissors} tone="positive" title={t("calendar.field.service")} hint={t("calendar.create.pickService")} badge={service ? t("calendar.create.durationPrice", { minutes: service.durationMin, price: ctx.formatMoney(service.price) }) : undefined}>
          <Field error={errors.serviceIds}>
            <SearchableSelect
              value={serviceId}
              onValueChange={setServiceId}
              placeholder={t("calendar.create.pickService")}
              searchPlaceholder={t("calendar.create.searchServices")}
              options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: `${item.category} · ${t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) })}` }))}
            />
          </Field>
        </DrawerSection>

        <DrawerSection icon={UserRound} tone="warning" title={t("calendar.field.barber")} hint={t("calendar.create.pickBarber")}>
          <div className="space-y-3">
            <SegmentedControl
              size="sm"
              variant="outline"
              ariaLabel={t("calendar.create.allLevels")}
              options={[{ value: "all", label: t("calendar.create.allLevels") }, ...levels.map((option) => ({ value: option, label: option }))]}
              value={level}
              onChange={(value) => setLevel(value as LevelFilter)}
            />
            <Field error={errors.barberId}>
              <Select value={barberId} onValueChange={setBarberId}>
                <SelectTrigger data-testid="create-appointment-barber">
                  <SelectValue placeholder={t("calendar.create.pickBarber")} />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2">
                        <PersonAvatar name={item.name} avatarUrl={item.avatarUrl} size="sm" />
                        {item.name}
                        {item.level && <span className="text-text-muted">· {item.level}</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </DrawerSection>

        <DrawerSection icon={CalendarClock} tone="neutral" title={t("calendar.create.pickDateTime")} hint={barber ? t("calendar.create.offHours", { name: barber.name.split(" ")[0] }) : t("calendar.create.pickBarber")} badge={start ? formatClockRange(start, new Date(start.getTime() + (service?.durationMin ?? 30) * 60_000), ctx.intl) : undefined}>
          <Field error={errors.start}>
            <TimeSlotPicker value={start} onChange={setStart} startDate={nowDate} isSlotDisabled={isSlotDisabled} />
          </Field>
        </DrawerSection>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-surface p-3.5 shadow-card">
          <label className="flex items-center gap-3">
            <Switch checked={walkIn} onCheckedChange={setWalkIn} data-testid="create-appointment-walkin" />
            <Text weight="medium">{t("calendar.create.walkInSwitch")}</Text>
          </label>
          <Text variant="muted">{t("calendar.create.walkInHint")}</Text>
          <Field label={t("calendar.create.repeat")}>
            <Select value={repeat} onValueChange={(value) => setRepeat(value as RepeatRule)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatRuleSchema.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(REPEAT_KEYS[option])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("calendar.create.notes")}>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </Field>
        </div>
      </div>
    </DrawerShell>
  );
}
