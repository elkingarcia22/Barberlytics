import * as React from "react";
import { isBefore, isSameDay, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { atMinutes, formatClockRange, isWorkingAt, minutesOfDay } from "@/components/scheduling";
import { appointmentInputSchema, type Appointment, type Barber, type CalendarDay, type Client, type RepeatRule, type Service } from "../types";
import { findBarber, placementProblem, placementReason, servicesMinutes, servicesPrice, toLocalIso, workingHoursOn, type ModelContext } from "../calendarModel";
import { suggestSlots, type SlotSuggestion } from "../slotSuggestions";
import { resourceConflict, resourceReason, type AgendaResource } from "../resourceModel";
import { useCreateAppointment } from "../queries";

/**
 * El motor de «Crear cita», el mismo para todas las propuestas: lo que se ha
 * elegido (cliente, servicios, barbero, hora, sin cita previa, repetición y
 * nota), lo que se deriva (duración, precio, huecos sugeridos, un recurso
 * completo) y el alta con sus comprobaciones. Cada propuesta solo decide cómo
 * se pregunta; la regla de qué cabe y qué no vive aquí.
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

/** Dónde va a quedar la cita que se arma: la agenda la marca y se va a ese día. */
export interface CreatePreview {
  barberId: string;
  start: Date;
  end: Date;
  clientId?: string;
  serviceIds: readonly string[];
}

/** Lo que el panel sabe de la cita a medias: viaja con cada sugerencia para poder retomarla. */
export interface CreateAppointmentDraft {
  clientId?: string;
  serviceIds: string[];
  walkIn: boolean;
  notes: string;
}

export interface CreateDraftOptions {
  open: boolean;
  ctx: ModelContext;
  initial: CreateAppointmentInitial | null;
  now?: Date;
  viewDate?: Date;
  day?: CalendarDay;
  onSuggestions?: (suggestions: readonly SlotSuggestion[], draft: CreateAppointmentDraft) => void;
  /** El hueco elegido, mientras se arma la cita (`null` sin barbero u hora, y al cerrar). */
  onPreview?: (preview: CreatePreview | null) => void;
  /** Se miró otro día en el panel: la agenda se va a ese día. */
  onShowDay?: (day: Date) => void;
  enforceRules?: boolean;
  resources?: readonly AgendaResource[];
  onCreated: (appointment: Appointment) => void;
  onClose: () => void;
}

export interface CreateDraft {
  ctx: ModelContext;
  now: Date;
  /** El día desde el que se ofrecen horas: el de la hora elegida, el que se ve en la agenda o hoy. */
  firstDay: Date;
  clientId: string;
  serviceIds: readonly string[];
  barberId: string;
  start: Date | null;
  walkIn: boolean;
  repeat: RepeatRule;
  notes: string;
  errors: Readonly<Record<string, string>>;
  client: Client | undefined;
  barber: Barber | undefined;
  services: readonly Service[];
  durationMin: number;
  price: number;
  /** El barbero que agenda en su columna: viene fijo y no se cambia. */
  fixedBarberId: string | null;
  suggestions: readonly SlotSuggestion[];
  resourceWarning: string | null;
  enforceRules: boolean;
  pending: boolean;
  /** Lo que falta para poder agendar, en orden: lo primero es lo que se pregunta. */
  missing: readonly ("client" | "services" | "barber" | "start")[];
  isSlotDisabled: (date: Date) => boolean;
  /** Se está mirando otro día en el panel: que la agenda lo enseñe. */
  showDay: (day: Date) => void;
  setClientId: (id: string) => void;
  setServiceIds: (ids: readonly string[]) => void;
  toggleService: (id: string) => void;
  setBarberId: (id: string) => void;
  setStart: (start: Date | null) => void;
  /** Barbero y hora a la vez (un hueco sugerido, una hora con su barbero). */
  place: (barberId: string, start: Date) => void;
  setWalkIn: (walkIn: boolean) => void;
  setRepeat: (repeat: RepeatRule) => void;
  setNotes: (notes: string) => void;
  /** Rellena de una vez lo que vino escrito («corte para Marcela mañana a las 4»). */
  apply: (initial: CreateAppointmentInitial) => void;
  submit: () => void;
}

const EMPTY_SUGGESTIONS: readonly SlotSuggestion[] = [];
const EMPTY_RESOURCES: readonly AgendaResource[] = [];
const EMPTY_DRAFT: CreateAppointmentDraft = { serviceIds: [], walkIn: false, notes: "" };

const initialServices = (initial: CreateAppointmentInitial | null): string[] => initial?.serviceIds ?? (initial?.serviceId ? [initial.serviceId] : []);

export function useCreateDraft({ open, ctx, initial, now, viewDate, day, onSuggestions, onPreview, onShowDay, enforceRules = true, resources = EMPTY_RESOURCES, onCreated, onClose }: CreateDraftOptions): CreateDraft {
  const t = useAppT();
  const create = useCreateAppointment();
  const fixedBarberId = ctx.access?.ownBarberId ?? null;
  const [clientId, setClientId] = React.useState(initial?.clientId ?? "");
  const [serviceIds, setServiceIdsState] = React.useState<string[]>(() => initialServices(initial));
  const [barberId, setBarberIdState] = React.useState(fixedBarberId ?? initial?.barberId ?? "");
  const [start, setStartState] = React.useState<Date | null>(initial?.start ?? null);
  const [walkIn, setWalkIn] = React.useState(initial?.walkIn ?? false);
  const [repeat, setRepeat] = React.useState<RepeatRule>("none");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  const barber = findBarber(ctx.catalog, barberId || null);
  const client = ctx.catalog.clients.find((item) => item.id === clientId);
  const services = React.useMemo(() => serviceIds.map((id) => ctx.catalog.services.find((item) => item.id === id)).filter((item): item is Service => Boolean(item)), [ctx.catalog.services, serviceIds]);
  const durationMin = services.length > 0 ? servicesMinutes(services) : 30;
  const clearError = (...keys: string[]) => setErrors((current) => (keys.some((key) => current[key]) ? { ...current, ...Object.fromEntries(keys.map((key) => [key, ""])) } : current));

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
      // No se propone un hueco que choca con un recurso especial ya completo.
      isTaken: resources.length > 0 ? (slotBarberId, minute) => resourceConflict(resources, day.appointments, ctx.catalog, { id: "", serviceIds, barberId: slotBarberId, durationMin, start: toLocalIso(atMinutes(viewDate, minute)), status: "scheduled" }) !== null : undefined,
    });
  }, [open, day, viewDate, services.length, ctx.catalog, durationMin, barberId, start, nowDate, resources, serviceIds]);

  // La agenda pinta los huecos que el panel propone; al cerrar, se borran.
  const draft = React.useMemo<CreateAppointmentDraft>(() => ({ clientId: clientId || undefined, serviceIds, walkIn, notes }), [clientId, serviceIds, walkIn, notes]);
  React.useEffect(() => {
    onSuggestions?.(suggestions, draft);
  }, [onSuggestions, suggestions, draft]);
  React.useEffect(() => () => onSuggestions?.(EMPTY_SUGGESTIONS, EMPTY_DRAFT), [onSuggestions]);

  // El hueco elegido se marca en la agenda (y la agenda se va a ese día) mientras el panel está abierto.
  const startTime = start?.getTime() ?? null;
  React.useEffect(() => {
    if (!open || startTime === null || !barberId) return onPreview?.(null);
    onPreview?.({ barberId, start: new Date(startTime), end: new Date(startTime + durationMin * 60_000), clientId: clientId || undefined, serviceIds });
  }, [open, onPreview, barberId, startTime, durationMin, clientId, serviceIds]);
  React.useEffect(() => () => onPreview?.(null), [onPreview]);

  // Un recurso especial completo a esa hora (solo se sabe del día que se ve en la agenda).
  const resourceWarning = React.useMemo(() => {
    if (!barberId || !start || !day || !viewDate || !isSameDay(start, viewDate) || serviceIds.length === 0) return null;
    const candidate = { id: "", serviceIds, barberId, durationMin, start: toLocalIso(start), status: "scheduled" as const };
    return resourceReason(resourceConflict(resources, day.appointments, ctx.catalog, candidate), ctx);
  }, [barberId, start, day, viewDate, serviceIds, durationMin, resources, ctx]);

  const isSlotDisabled = React.useCallback(
    (date: Date) => {
      if (isBefore(date, nowDate) && isSameDay(date, nowDate)) return true;
      if (isBefore(startOfDay(date), startOfDay(nowDate))) return true;
      if (!barber) return false;
      // Sin reglas se puede agendar fuera de la jornada: solo se apaga el pasado.
      return enforceRules && !isWorkingAt(workingHoursOn(barber, date), minutesOfDay(date));
    },
    [barber, enforceRules, nowDate]
  );

  const missing = [!clientId && "client", serviceIds.length === 0 && "services", !barberId && "barber", !start && "start"].filter((item): item is "client" | "services" | "barber" | "start" => Boolean(item));

  const setServiceIds = (ids: readonly string[]) => {
    setServiceIdsState([...ids]);
    clearError("serviceIds");
  };
  const toggleService = (id: string) => setServiceIds(serviceIds.includes(id) ? serviceIds.filter((item) => item !== id) : [...serviceIds, id]);
  const setBarberId = (id: string) => {
    if (fixedBarberId) return;
    setBarberIdState(id);
    clearError("barberId", "start");
  };
  const setStart = (value: Date | null) => {
    setStartState(value);
    clearError("start");
  };
  const place = (nextBarberId: string, value: Date) => {
    if (!fixedBarberId) setBarberIdState(nextBarberId);
    setStartState(value);
    clearError("barberId", "start");
  };
  const apply = (next: CreateAppointmentInitial) => {
    if (next.clientId) setClientId(next.clientId);
    const nextServices = initialServices(next);
    if (nextServices.length > 0) setServiceIdsState(nextServices);
    if (next.barberId && !fixedBarberId) setBarberIdState(next.barberId);
    if (next.start) setStartState(next.start);
    setErrors({});
  };

  const submit = () => {
    // Que no pise a nadie ni caiga fuera de horario, si se ve ese día en la agenda.
    if (enforceRules && barber && start && day && viewDate && isSameDay(start, viewDate)) {
      const from = minutesOfDay(start);
      const reason = placementReason(placementProblem(day, barber, viewDate, from, from + durationMin), ctx, barber) ?? resourceWarning;
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
        const created = ctx.catalog.clients.find((item) => item.id === appointment.clientId);
        toast.success(t("calendar.create.created"), {
          description: t("calendar.create.createdHint", { client: created?.name ?? "", barber: barber?.name ?? "", time: start ? formatClockRange(start, new Date(start.getTime() + appointment.durationMin * 60_000), ctx.intl) : "" }),
        });
        onClose();
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

  return {
    ctx,
    now: nowDate,
    firstDay: startOfDay(start ?? (viewDate && !isBefore(startOfDay(viewDate), startOfDay(nowDate)) ? viewDate : nowDate)),
    clientId,
    serviceIds,
    barberId,
    start,
    walkIn,
    repeat,
    notes,
    errors,
    client,
    barber,
    services,
    durationMin,
    price: barberPrice(barber, services),
    fixedBarberId,
    suggestions,
    resourceWarning,
    enforceRules,
    pending: create.isPending,
    missing,
    isSlotDisabled,
    showDay: (value) => onShowDay?.(value),
    setClientId: (id) => {
      setClientId(id);
      clearError("clientId");
    },
    setServiceIds,
    toggleService,
    setBarberId,
    setStart,
    place,
    setWalkIn,
    setRepeat,
    setNotes,
    apply,
    submit,
  };
}

/** Lo que cobra un barbero por lo elegido: su precio en Equipo o, sin él, el de la carta. */
export function barberPrice(barber: Barber | undefined, services: readonly Service[]): number {
  if (!barber?.prices) return servicesPrice(services);
  return services.reduce((sum, service) => sum + (barber.prices?.[service.id] ?? service.price), 0);
}
