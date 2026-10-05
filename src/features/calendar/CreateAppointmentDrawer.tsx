import * as React from "react";
import { isBefore, isSameDay, startOfDay } from "date-fns";
import { CalendarClock, Scissors, SlidersHorizontal, UserRound, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { DrawerSection, SidePanelShell } from "@/components/overlays";
import { Field, MultiSelect, SearchableSelect } from "@/components/forms";
import { AiGeneratedBadge, Chip } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { TimeSlotPicker, formatClock, formatClockRange, isWorkingAt, minutesOfDay } from "@/components/scheduling";
import { ClientAvatar, PersonAvatar, ServiceThumb } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { appointmentInputSchema, CLIENT_TYPE_KEYS, REPEAT_KEYS, repeatRuleSchema, type Appointment, type CalendarDay, type RepeatRule } from "./types";
import { findBarber, placementProblem, placementReason, servicesMinutes, toLocalIso, workingHoursOn, type ModelContext } from "./calendarModel";
import { suggestSlots, type SlotSuggestion } from "./slotSuggestions";
import { useCreateAppointment } from "./queries";

/**
 * Crear cita: cliente, servicio (uno o varios), barbero y fecha & hora, el
 * interruptor de «cliente sin cita previa» y la repetición. Tocar una franja
 * vacía del calendario abre este panel con el barbero y la hora ya puestos.
 *
 * Con el servicio elegido el panel propone tres huecos del día que se ve —el
 * barbero pedido primero, luego los que no dejan ratos muertos— y se los
 * cuenta a la agenda (`onSuggestions`) para que los pinte como propuestas.
 * Antes de crear, comprueba que el tramo no pise a nadie ni caiga fuera de
 * horario: mejor un aviso aquí que un 409 después.
 */

export interface CreateAppointmentInitial {
  barberId?: string;
  start?: Date;
  clientId?: string;
  serviceId?: string;
  /** Varios servicios ya elegidos (una propuesta aceptada trae de vuelta lo que había). */
  serviceIds?: string[];
  walkIn?: boolean;
  notes?: string;
}

/** Lo que el panel sabe de la cita a medias: viaja con cada sugerencia para poder retomarla. */
export interface CreateAppointmentDraft {
  clientId?: string;
  serviceIds: string[];
  walkIn: boolean;
  notes: string;
}

export interface CreateAppointmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  initial: CreateAppointmentInitial | null;
  now?: Date;
  /** El día que se ve en la agenda y sus citas: de ahí salen los huecos sugeridos. */
  viewDate?: Date;
  day?: CalendarDay;
  /** Los huecos que el panel propone ahora mismo, para pintarlos en la agenda. Vacío al cerrar. */
  onSuggestions?: (suggestions: readonly SlotSuggestion[], draft: CreateAppointmentDraft) => void;
  /** Si quien agenda sigue las reglas de la casa. Sin ellas puede pisar otra cita o salirse del horario. */
  enforceRules?: boolean;
  onCreated: (appointment: Appointment) => void;
  onCreateClient: () => void;
}

type LevelFilter = string;

/** Cada apertura arranca del hueco que se tocó (o en blanco): el panel se remonta con una llave nueva. */
export function CreateAppointmentDrawer(props: CreateAppointmentDrawerProps) {
  return <CreateAppointmentPanel key={useOpenKey(props.open)} {...props} />;
}

const EMPTY_SUGGESTIONS: readonly SlotSuggestion[] = [];

function CreateAppointmentPanel({ open, onOpenChange, ctx, initial, now, viewDate, day, onSuggestions, enforceRules = true, onCreated, onCreateClient }: CreateAppointmentDrawerProps) {
  const t = useAppT();
  const create = useCreateAppointment();
  const [clientId, setClientId] = React.useState(initial?.clientId ?? "");
  const [serviceId, setServiceId] = React.useState(initial?.serviceIds?.[0] ?? initial?.serviceId ?? "");
  const [extraServiceIds, setExtraServiceIds] = React.useState<string[]>(initial?.serviceIds?.slice(1) ?? []);
  // Un barbero agenda en su columna: viene fijo en él, venga de donde venga el alta.
  const fixedBarberId = ctx.access?.ownBarberId ?? null;
  const [barberId, setBarberId] = React.useState(fixedBarberId ?? initial?.barberId ?? "");
  const [level, setLevel] = React.useState<LevelFilter>("all");
  const [start, setStart] = React.useState<Date | null>(initial?.start ?? null);
  const [walkIn, setWalkIn] = React.useState(initial?.walkIn ?? false);
  const [repeat, setRepeat] = React.useState<RepeatRule>("none");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const walkInId = React.useId();

  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  const barber = findBarber(ctx.catalog, barberId || null);
  const service = ctx.catalog.services.find((item) => item.id === serviceId);
  const serviceIds = React.useMemo(() => (serviceId ? [serviceId, ...extraServiceIds.filter((id) => id !== serviceId)] : []), [serviceId, extraServiceIds]);
  const services = React.useMemo(() => serviceIds.map((id) => ctx.catalog.services.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item)), [ctx.catalog.services, serviceIds]);
  const durationMin = services.length > 0 ? servicesMinutes(services) : 30;
  const levels = [...new Set(ctx.catalog.barbers.map((item) => item.level).filter((item): item is string => Boolean(item)))];
  const barbers = ctx.catalog.barbers.filter((item) => level === "all" || item.level === level);

  // Los huecos que conviene ofrecer, solo del día que se ve: la agenda los pinta a la vez.
  const suggestions = React.useMemo(() => {
    if (!open || !day || !viewDate || services.length === 0) return EMPTY_SUGGESTIONS;
    return suggestSlots({
      day,
      barbers: ctx.catalog.barbers,
      date: viewDate,
      durationMin,
      preferredBarberId: barberId || null,
      wantedMinute: start && isSameDay(start, viewDate) ? minutesOfDay(start) : null,
      now: nowDate,
    });
  }, [open, day, viewDate, services.length, ctx.catalog.barbers, durationMin, barberId, start, nowDate]);

  const draft = React.useMemo<CreateAppointmentDraft>(() => ({ clientId: clientId || undefined, serviceIds, walkIn, notes }), [clientId, serviceIds, walkIn, notes]);
  React.useEffect(() => {
    onSuggestions?.(suggestions, draft);
  }, [onSuggestions, suggestions, draft]);
  React.useEffect(() => () => onSuggestions?.(EMPTY_SUGGESTIONS, { serviceIds: [], walkIn: false, notes: "" }), [onSuggestions]);

  const isSlotDisabled = React.useCallback(
    (date: Date) => {
      if (isBefore(date, nowDate) && isSameDay(date, nowDate)) return true;
      if (isBefore(startOfDay(date), startOfDay(nowDate))) return true;
      if (!barber) return false;
      // Sin reglas se puede agendar fuera de la jornada: la tira solo apaga el pasado.
      return enforceRules && !isWorkingAt(workingHoursOn(barber, date), minutesOfDay(date));
    },
    [barber, enforceRules, nowDate]
  );

  const pickSuggestion = (suggestion: SlotSuggestion) => {
    setBarberId(suggestion.barber.id);
    setStart(suggestion.start);
    setErrors((current) => ({ ...current, start: "", barberId: "" }));
  };

  const submit = () => {
    // Que no pise a nadie ni caiga fuera de horario, si se ve ese día en la agenda.
    if (enforceRules && barber && start && day && viewDate && isSameDay(start, viewDate)) {
      const from = minutesOfDay(start);
      const reason = placementReason(placementProblem(day, barber, viewDate, from, from + durationMin), ctx, barber);
      if (reason) {
        setErrors((current) => ({ ...current, start: reason }));
        return;
      }
    }
    const parsed = appointmentInputSchema.safeParse({
      clientId,
      barberId,
      serviceIds,
      start: start ? toLocalIso(start) : "",
      walkIn,
      repeat,
      requestedBarberId: walkIn ? null : barberId || null,
      notes: notes.trim() || null,
      force: !enforceRules,
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
    <SidePanelShell
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
              options={ctx.catalog.clients.map((client) => ({ value: client.id, label: client.name, description: `${client.phone} · ${t(CLIENT_TYPE_KEYS[client.type])}`, leading: <ClientAvatar client={client} size="sm" /> }))}
            />
          </Field>
        </DrawerSection>

        <DrawerSection
          icon={Scissors}
          tone="positive"
          title={t("calendar.field.service")}
          hint={t("calendar.create.pickService")}
          badge={service ? t("calendar.create.durationPrice", { minutes: durationMin, price: ctx.formatMoney(services.reduce((sum, item) => sum + item.price, 0)) }) : undefined}
        >
          <div className="space-y-3">
            <Field error={errors.serviceIds}>
              <SearchableSelect
                value={serviceId}
                onValueChange={setServiceId}
                placeholder={t("calendar.create.pickService")}
                searchPlaceholder={t("calendar.create.searchServices")}
                options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: `${item.category} · ${t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) })}`, leading: <ServiceThumb service={item} /> }))}
              />
            </Field>
            {service && (
              <Field label={t("calendar.create.moreServices")}>
                <MultiSelect
                  value={extraServiceIds}
                  onValueChange={setExtraServiceIds}
                  placeholder={t("calendar.create.moreServicesHint")}
                  searchPlaceholder={t("calendar.create.searchServices")}
                  options={ctx.catalog.services.filter((item) => item.id !== serviceId).map((item) => ({ value: item.id, label: `${item.name} · ${item.durationMin} min`, leading: <ServiceThumb service={item} /> }))}
                />
              </Field>
            )}
          </div>
        </DrawerSection>

        <DrawerSection icon={UserRound} tone="warning" title={t("calendar.field.barber")} hint={t("calendar.create.pickBarber")}>
          <div className="space-y-3">
            {/* Chips que se parten en varias líneas: una fila fija de niveles se salía del panel. */}
            {!fixedBarberId && (
              <div role="group" aria-label={t("calendar.create.allLevels")} className="flex flex-wrap gap-2">
                {["all", ...levels].map((option) => (
                  <Chip key={option} size="sm" label={option === "all" ? t("calendar.create.allLevels") : option} selected={level === option} tone={level === option ? "primary" : "default"} onClick={() => setLevel(option)} />
                ))}
              </div>
            )}
            <Field error={errors.barberId}>
              <Select value={barberId} onValueChange={setBarberId} disabled={Boolean(fixedBarberId)}>
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

        <DrawerSection icon={CalendarClock} tone="neutral" title={t("calendar.create.pickDateTime")} hint={barber ? t("calendar.create.offHours", { name: barber.name.split(" ")[0] }) : t("calendar.create.pickBarber")} badge={start ? formatClockRange(start, new Date(start.getTime() + durationMin * 60_000), ctx.intl) : undefined}>
          <div className="space-y-3">
            {services.length > 0 && day && (
              <div className="space-y-1.5" data-testid="create-appointment-suggestions">
                <div className="flex items-center gap-2">
                  <Text as="span" variant="label">
                    {t("calendar.suggest.title")}
                  </Text>
                  <AiGeneratedBadge />
                </div>
                {suggestions.length === 0 ? (
                  <Text variant="caption">{t("calendar.suggest.none")}</Text>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => {
                      const selected = start?.getTime() === suggestion.start.getTime() && barberId === suggestion.barber.id;
                      return (
                        <Chip
                          key={`${suggestion.barber.id}-${suggestion.start.getTime()}`}
                          size="sm"
                          tone={selected ? "primary" : "ai"}
                          selected={selected}
                          label={`${formatClock(suggestion.start, ctx.intl)} · ${suggestion.barber.name.split(" ")[0]} — ${t(suggestion.reasonKey, suggestion.reasonParams)}`}
                          onClick={() => pickSuggestion(suggestion)}
                        />
                      );
                    })}
                  </div>
                )}
                <Text variant="caption">{t("calendar.suggest.hint")}</Text>
              </div>
            )}
            <Field error={errors.start}>
              <TimeSlotPicker value={start} onChange={setStart} startDate={nowDate} isSlotDisabled={isSlotDisabled} />
            </Field>
          </div>
        </DrawerSection>

        {/* Lo que casi nunca se toca, en su propia tarjeta y plegado: tres ajustes
            distintos, cada uno con su rótulo, separados por una línea. */}
        <DrawerSection icon={SlidersHorizontal} tone="neutral" title={t("calendar.create.more")} hint={t("calendar.create.moreHint")} collapsible defaultOpen={walkIn}>
          <div className="divide-y divide-border/60">
            <div className="flex items-start justify-between gap-4 pb-4">
              <label htmlFor={walkInId} className="min-w-0 space-y-0.5">
                <Text as="span" variant="label" className="block">
                  {t("calendar.create.walkInSwitch")}
                </Text>
                <Text as="span" variant="caption" className="block">
                  {t("calendar.create.walkInHint")}
                </Text>
              </label>
              <Switch id={walkInId} checked={walkIn} onCheckedChange={setWalkIn} data-testid="create-appointment-walkin" />
            </div>
            <div className="py-4">
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
            </div>
            <div className="pt-4">
              <Field label={t("calendar.create.notes")}>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
              </Field>
            </div>
          </div>
        </DrawerSection>
      </div>
    </SidePanelShell>
  );
}
