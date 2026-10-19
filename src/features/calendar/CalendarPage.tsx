import * as React from "react";
import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from "date-fns";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot, useShellConfig } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { usePageHeaderExtras } from "@/components/utility";
import { Text } from "@/components/typography";
import { ConfirmDialog } from "@/components/overlays";
import { DataListActionRail, ScreenHeaderActions, useActionsPlacement } from "@/components/action-rail";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScheduleDrop, ScheduleEvent, ScheduleResourceAlert, ScheduleSlot } from "@/components/scheduling";
import { atMinutes, formatClock, formatClockRange, minutesOfDay } from "@/components/scheduling";
import { DEFAULT_BRANCH_ID } from "@/features/branches";
import { useAccess } from "@/features/access";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarAgendaView } from "./CalendarAgendaView";
import { CalendarMonthView } from "./CalendarMonthView";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CreateAppointmentDrawer, type CreateAppointmentDraft, type CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import { CalendarSearch } from "./CalendarSearch";
import { CalendarFilters, type ClientTypeFilterOption, type ResourceFilterOption, type ServiceFilterOption } from "./CalendarFilters";
import { CalendarViewOptions } from "./CalendarViewOptions";
import { useCalendarCardPrefs } from "./calendarCardPrefs";
import { appointmentContextActions, blockContextActions } from "./calendarContextActions";
import type { AppointmentActionId } from "./appointmentPlaybook";
import { GapsDrawer } from "./GapsDrawer";
import { dayGaps } from "./gapsModel";
import { dayPulse } from "./pulseModel";
import { CalendarAssistantDrawer } from "./CalendarAssistantDrawer";
import { dayBrief, type WaitlistMatch } from "./dayBrief";
import { CheckoutDrawer } from "./CheckoutDrawer";
import { BlockDrawer } from "./BlockDrawer";
import { CollectionsDrawer } from "./CollectionsDrawer";
import { WaitlistDrawer } from "./WaitlistDrawer";
import { WalkInQueueDrawer } from "@/features/frontDesk/WalkInQueueDrawer";
import { QuickSaleDrawer } from "./QuickSaleDrawer";
import { WalkInSaleDrawer } from "./WalkInSaleDrawer";
import { ReflowBanner } from "./ReflowBanner";
import { calendarRailActions } from "./calendarRailActions";
import { calendarAccess, canRemoveBlock, scopeCatalog, scopeDay, waitlistInScope } from "./calendarAccess";
import { clockLabel, useMoney } from "./calendarFormat";
import { useCalendarDensity } from "./calendarDensity";
import { useCalendarColumnWidths } from "./calendarColumnWidths";
import { useCalendarShortcuts } from "./useCalendarShortcuts";
import { useCalendarState } from "./useCalendarState";
import { useCatalogQuery, useDayQuery, useRemoveBlock, useRhythmQuery, useUpdateAppointment, useWaitlistQuery } from "./queries";
import { CalendarWeekView } from "./CalendarWeekView";
import { moveStart, reflowPlan, type ReflowPlan } from "./reflowModel";
import type { SlotSuggestion } from "./slotSuggestions";
import { BLOCK_CATEGORY_KEYS } from "./types";
import { TimeOffDrawer, type TimeOffFocus } from "./timeOff/TimeOffDrawer";
import { DayPanel } from "./dayPanel/DayPanel";
import { isAbsenceBlock } from "./timeOff/timeOffModel";
import { resourceConflict, resourceDay, resourceReason } from "./resourceModel";
import { useResourcesQuery } from "@/features/services/queries";
import { dayWeightOf } from "./dayWeight";
import { DayWeightBadge } from "./DayWeightBadge";
import { ABSENCE_KIND_KEYS, useAbsences } from "@/features/team/workforce";
import {
  appointmentEnd,
  appointmentStart,
  applyDayHours,
  appointmentClientType,
  CLIENT_TYPE_ORDER,
  durationLabel,
  visibleBarbers,
  workingHoursOn,
  isActive,
  serviceCategories,
  serviceColor,
  clashingAppointments,
  findBarber,
  findClient,
  nextStep,
  parseLocal,
  placementProblem,
  placementReason,
  toEvent,
  toLocalIso,
  type AgendaFilters,
  type ModelContext,
  appointmentGroups,
  linkedOf,
  newLinkId,
  isUnpaid,
} from "./calendarModel";
import { CLIENT_TYPE_KEYS, STATUS_KEYS, type Appointment, type AppointmentPatch, type AppointmentStatus, type Barber, type CalendarDay, type TimeBlock, type WaitlistEntry } from "./types";

/**
 * El calendario de la barbería: el día por barbero, la agenda como lista y
 * la ocupación del mes, con todo lo que se hace desde aquí —agendar, mover,
 * atender, cobrar, bloquear, vender— en drawers del sistema. La barra
 * flotante concentra las acciones de pantalla; cada cita abre su detalle.
 *
 * Lo que la agenda propone se ve antes de aplicarse: los huecos sugeridos
 * del alta, a dónde iría cada cita en un reacomodo y el hueco que deja una
 * cancelación se pintan sobre la rejilla y se aceptan o se descartan.
 * Cualquier cambio deja un «Deshacer» en el toast y el porqué en el historial.
 *
 * El estado que se comparte (día, vista, filtro, cita abierta) vive en la
 * URL; los paneles de trabajo (crear, cobrar, bloquear…) en memoria.
 */

type Panel =
  | { kind: "create"; initial: CreateAppointmentInitial | null }
  | { kind: "assistant" }
  | { kind: "checkout"; appointment: Appointment }
  | { kind: "block"; barberId: string | null }
  | { kind: "collections" }
  | { kind: "waitlist" }
  | { kind: "quickSale" }
  | { kind: "walkInSale" }
  | { kind: "walkInQueue" }
  | { kind: "gaps" }
  | { kind: "timeOff"; focus: TimeOffFocus }
  | { kind: "day"; date: Date }
  | { kind: "removeBlock"; block: TimeBlock }
  | { kind: "confirm"; action: "cancel" | "noShow"; appointment: Appointment };

/** Un plan de reacomodo en pantalla, y el cambio que lo provocó (alargar una cita) si lo hubo. */
interface PendingReflow {
  plan: ReflowPlan;
  anchorPatch: AppointmentPatch | null;
}

/** Un hueco que dejó una cancelación y a quién de la lista de espera le serviría. */
interface FreedSlot {
  id: string;
  dateKey: string;
  barberId: string;
  start: Date;
  end: Date;
  matches: WaitlistEntry[];
}

const EMPTY_CATALOG = { barbers: [], clients: [], services: [], products: [] };
const EMPTY_DRAFT: CreateAppointmentDraft = { serviceIds: [], walkIn: false, notes: "" };

const suggestionId = (suggestion: SlotSuggestion): string => `suggest-${suggestion.barber.id}-${suggestion.start.getTime()}`;
/** Las mismas sugerencias, aunque la lista sea otra: así no se repinta la agenda por nada. */
const sameSuggestions = (a: readonly SlotSuggestion[], b: readonly SlotSuggestion[]): boolean =>
  a.length === b.length && a.every((item, index) => suggestionId(item) === suggestionId(b[index]) && item.reasonKey === b[index].reasonKey);
const sameDraft = (a: CreateAppointmentDraft, b: CreateAppointmentDraft): boolean =>
  a.clientId === b.clientId && a.walkIn === b.walkIn && a.notes === b.notes && a.serviceIds.join() === b.serviceIds.join();
/** Al reacomodar por retraso, cuánto se supone que le queda a quien está en silla. */
const RUNNING_LATE_GRACE_MINUTES = 10;
/** El rato libre más corto que se marca al ver solo los huecos. */
const FREE_SLOT_MIN_MINUTES = 15;

export interface CalendarPageProps {
  /** El «ahora» de la línea roja y de la agenda de hoy. Inyectable para las pruebas. */
  now?: Date;
}

export function CalendarPage({ now }: CalendarPageProps = {}) {
  const t = useAppT();
  const navigate = useNavigate();
  const { current } = useLocale();
  const formatMoney = useMoney();
  const { activeCompanyId } = useShellConfig();
  // Lo que el rol deja ver y hacer aquí. Los barberos ven solo su columna y agendan con las
  // reglas de la casa; dueño, administrador y recepción pueden pisar citas y horarios.
  const access = useAccess();
  const can = React.useMemo(() => calendarAccess(access), [access]);
  const ownBarberId = can.ownBarberId;
  const enforceRules = !can.canForce;
  const branchId = activeCompanyId ?? DEFAULT_BRANCH_ID;
  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  // «Hoy» con identidad estable: de él cuelgan la fecha, el catálogo del día y
  // todo lo que se memoriza con ellos. Uno nuevo en cada render los recalcula sin fin.
  const today = React.useMemo(() => startOfDay(nowDate), [nowDate]);
  const state = useCalendarState(today);
  const catalog = useCatalogQuery(branchId);
  const dayQuery = useDayQuery(branchId, state.dateKey);
  const rhythm = useRhythmQuery(branchId);
  const waitlistQuery = useWaitlistQuery(branchId, null);
  // Con alcance propio, el día y la lista de espera llegan ya recortados a lo suyo: de ahí
  // salen la rejilla, el pulso, los contadores, la Agenda, los huecos y el asistente.
  const scopedDayData = React.useMemo(() => (dayQuery.data ? scopeDay(dayQuery.data, ownBarberId) : undefined), [dayQuery.data, ownBarberId]);
  const day = React.useMemo(() => ({ ...dayQuery, data: scopedDayData }) as typeof dayQuery, [dayQuery, scopedDayData]);
  const waitlistItems = React.useMemo(() => (waitlistQuery.data?.items ?? []).filter((entry) => waitlistInScope(entry, ownBarberId)), [waitlistQuery.data, ownBarberId]);
  // El filtro de equipo de la URL no aplica a un barbero: su columna y nada más.
  const team = ownBarberId ?? state.team;
  const update = useUpdateAppointment();
  const removeBlock = useRemoveBlock();
  const [searchParams] = useSearchParams();
  const [density, setDensity, slotHeight] = useCalendarDensity();
  const [columnWidths, setColumnWidth, resetColumnWidths] = useCalendarColumnWidths();
  const [cardPrefs, setCardPref, resetCardPrefs] = useCalendarCardPrefs();
  /* Llegar desde la ficha de un cliente («Crear cita») abre el alta con él ya elegido. */
  const [panel, setPanel] = React.useState<Panel | null>(() => {
    const clientId = searchParams.get("cliente");
    return clientId ? { kind: "create", initial: { clientId } } : null;
  });
  /** Sube cuando el alta debe remontarse con otros datos (una propuesta aceptada). */
  const [createNonce, setCreateNonce] = React.useState(0);
  const [reflow, setReflow] = React.useState<PendingReflow | null>(null);
  const [suggestions, setSuggestions] = React.useState<readonly SlotSuggestion[]>([]);
  const [draft, setDraft] = React.useState<CreateAppointmentDraft>(EMPTY_DRAFT);
  const [freed, setFreed] = React.useState<FreedSlot[]>([]);
  /** Lo último que se movió, para la tecla Z. */
  const undoRef = React.useRef<(() => void) | null>(null);
  const closePanel = () => setPanel(null);
  // Tocar un día en la Semana o el Mes no lleva a la rejilla: abre el panel del día al lado.
  const openDayPanel = React.useCallback(
    (date: Date) => {
      state.openAppointment(null);
      state.setDate(date);
      setPanel({ kind: "day", date });
    },
    [state]
  );
  const dayPanelDate = panel?.kind === "day" ? panel.date : null;

  // Un solo panel a la vez junto a la agenda: abrir una cita cierra lo que hubiera, y al revés.
  const openAppointment = React.useCallback(
    (appointment: Appointment) => {
      setPanel(null);
      state.openAppointment(appointment.id);
    },
    [state]
  );
  const openPanel = React.useCallback(
    (next: Panel) => {
      state.openAppointment(null);
      setPanel(next);
    },
    [state]
  );
  /**
   * Antes de cobrar, un aviso (no un freno): si el mismo barbero tiene otra cita que ya sentó antes que
   * esta y sigue sin cobrar —se le pasó cobrarla—, se dice cuál y se puede ir a cobrar esa primero.
   * Las de su misma visita (enlazadas) no cuentan: se cobran juntas.
   */
  const [checkoutWarning, setCheckoutWarning] = React.useState<{ appointment: Appointment; open: readonly Appointment[] } | null>(null);
  const startCheckout = React.useCallback(
    (appointment: Appointment) => {
      const open = (day.data?.appointments ?? []).filter(
        (item) => item.id !== appointment.id && item.barberId === appointment.barberId && item.status === "seated" && appointmentStart(item) < appointmentStart(appointment) && !(appointment.linkId && item.linkId === appointment.linkId)
      );
      if (open.length > 0) {
        setCheckoutWarning({ appointment, open });
        return;
      }
      openPanel({ kind: "checkout", appointment });
    },
    [day.data, openPanel]
  );
  const currentAppointment = React.useMemo(() => day.data?.appointments.find((item) => item.id === state.appointmentId) ?? null, [day.data, state.appointmentId]);
  // Al cobrar una cita enlazada, las otras sin cobrar de su grupo se ofrecen juntas.
  const checkoutAppointment = panel?.kind === "checkout" ? panel.appointment : null;
  const checkoutCompanions = React.useMemo(
    () => (checkoutAppointment && day.data ? linkedOf(day.data.appointments, checkoutAppointment).filter((item) => item.id !== checkoutAppointment.id && isUnpaid(item)) : []),
    [checkoutAppointment, day.data]
  );
  // Otras citas del día sin cobrar (ya en la barbería) que se pueden sumar al cobro: dos de la familia, un amigo que paga.
  const checkoutCandidates = React.useMemo(
    () =>
      checkoutAppointment && day.data
        ? day.data.appointments.filter((item) => item.id !== checkoutAppointment.id && (item.status === "arrived" || item.status === "seated") && !checkoutCompanions.some((companion) => companion.id === item.id))
        : [],
    [checkoutAppointment, checkoutCompanions, day.data]
  );
  // Si la cita está enlazada, el panel enseña todas las de su grupo.
  const currentLinked = React.useMemo(() => (currentAppointment && day.data ? linkedOf(day.data.appointments, currentAppointment) : []), [currentAppointment, day.data]);
  // «Ver en la agenda»: resalta las enlazadas y lleva la rejilla hasta la primera, que puede estar
  // fuera de la vista (la agenda abre en la mañana y el panel tapa la mitad).
  const showLinkedInAgenda = React.useCallback(() => {
    state.setShowLinked(true);
    const first = [...currentLinked].sort((a, b) => appointmentStart(a).getTime() - appointmentStart(b).getTime())[0];
    if (!first) return;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Dos cuadros: el primero pinta el resaltado, el segundo ya tiene la tarjeta en su sitio.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-schedule-event="${CSS.escape(first.id)}"]`)?.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" }))
    );
  }, [currentLinked, state]);
  // Con qué se puede enlazar: las demás citas vivas del día que no van ya con ella.
  const linkCandidates = React.useMemo(
    () => (currentAppointment && day.data ? day.data.appointments.filter((item) => isActive(item) && item.id !== currentAppointment.id && !(currentAppointment.linkId && item.linkId === currentAppointment.linkId)) : []),
    [currentAppointment, day.data]
  );

  const patch = React.useCallback(
    (appointment: Appointment, changes: AppointmentPatch, done?: (updated: Appointment) => void) => {
      update.mutate(
        { id: appointment.id, patch: changes },
        {
          onSuccess: (updated) => done?.(updated),
          onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
        }
      );
    },
    [update]
  );

  /** Un cambio que se puede deshacer: el toast lo ofrece y la tecla Z lo recuerda. */
  const patchWithUndo = React.useCallback(
    (appointment: Appointment, changes: AppointmentPatch, revert: AppointmentPatch, title: string, description: string) => {
      patch(appointment, changes, (updated) => {
        const undo = () => {
          undoRef.current = null;
          patch(updated, revert, () => toast.success(t("calendar.undone")));
        };
        undoRef.current = undo;
        toast.success(title, { description, action: { label: t("calendar.undo"), onClick: undo } });
      });
    },
    [patch, t]
  );

  /** Cambia el enlace de varias citas de una vez; el aviso y la tecla Z lo deshacen. */
  const relink = React.useCallback(
    (changes: readonly { item: Appointment; linkId: string | null }[], title: string, description: string) => {
      const real = changes.filter(({ item, linkId }) => (item.linkId ?? null) !== linkId);
      if (real.length === 0) return;
      real.forEach(({ item, linkId }) => patch(item, { linkId }));
      const undo = () => {
        undoRef.current = null;
        real.forEach(({ item }) => patch(item, { linkId: item.linkId ?? null }));
        toast.success(t("calendar.undone"));
      };
      undoRef.current = undo;
      toast.success(title, { description, action: { label: t("calendar.undo"), onClick: undo } });
    },
    [patch, t]
  );

  /** Sacar una cita de su grupo. Si solo quedaba otra, esa también queda suelta. */
  const unlinkAppointment = React.useCallback(
    (appointment: Appointment) => {
      const linked = day.data ? linkedOf(day.data.appointments, appointment) : [];
      const rest = linked.filter((item) => item.id !== appointment.id);
      const changes = [{ item: appointment, linkId: null }, ...(rest.length === 1 ? [{ item: rest[0], linkId: null }] : [])];
      relink(changes, t("calendar.link.unlinked"), t("calendar.link.unlinkedHint"));
    },
    [day.data, relink, t]
  );

  /** Enlazar una cita con otra: si alguna ya tenía grupo, los dos grupos quedan en uno. */
  const linkAppointments = React.useCallback(
    (appointment: Appointment, target: Appointment) => {
      const all = day.data?.appointments ?? [];
      const linkId = appointment.linkId ?? target.linkId ?? newLinkId(appointment);
      const members = [appointment, target, ...all.filter((item) => isActive(item) && item.linkId && (item.linkId === appointment.linkId || item.linkId === target.linkId))];
      const unique = [...new Map(members.map((item) => [item.id, item])).values()];
      relink(
        unique.map((item) => ({ item, linkId })),
        t("calendar.link.linked"),
        t("calendar.link.linkedHint", { count: unique.length })
      );
    },
    [day.data, relink, t]
  );

  const changeStatus = React.useCallback(
    (appointment: Appointment, status: AppointmentStatus) => {
      if (status === "paid") {
        startCheckout(appointment);
        return;
      }
      patch(appointment, { status }, (updated) => {
        const client = findClient(catalog.data ?? EMPTY_CATALOG, updated.clientId);
        toast.success(t("calendar.statusChanged"), {
          description: t("calendar.statusChangedHint", { client: client?.name ?? "", status: t(STATUS_KEYS[updated.status]) }),
        });
      });
    },
    [catalog.data, startCheckout, patch, t]
  );

  // Las franjas del día (con las excepciones de la semana) pisan el horario
  // fijo del catálogo: así el calendario enseña lo que de verdad se trabaja.
  const dayCatalog = React.useMemo(
    () => (catalog.data ? scopeCatalog({ ...catalog.data, barbers: applyDayHours(catalog.data.barbers, state.date, day.data?.hours) }, ownBarberId) : null),
    [catalog.data, day.data?.hours, state.date, ownBarberId]
  );
  const ctx = React.useMemo<ModelContext | null>(
    () =>
      dayCatalog
        ? {
            t,
            intl: current.intl,
            formatMoney,
            catalog: dayCatalog,
            now: nowDate,
            colorBy: state.colorBy,
            card: cardPrefs,
            access: can,
            onNextStep: (appointment) => {
              const step = nextStep(appointment.status);
              if (step) changeStatus(appointment, step.status);
            },
          }
        : null,
    [dayCatalog, changeStatus, current.intl, formatMoney, nowDate, state.colorBy, cardPrefs, can, t]
  );

  const barbers = React.useMemo(() => dayCatalog?.barbers ?? [], [dayCatalog]);
  const pulse = React.useMemo(() => (day.data && dayCatalog ? dayPulse(day.data.appointments, dayCatalog, nowDate) : null), [day.data, dayCatalog, nowDate]);
  const brief = React.useMemo(() => (day.data && dayCatalog ? dayBrief(day.data, dayCatalog, state.date, nowDate) : null), [day.data, dayCatalog, state.date, nowDate]);

  // Los servicios del catálogo con el color de sus tarjetas y cuántas citas vivas tienen hoy: filtro y leyenda a la vez.
  const serviceOptions = React.useMemo<ServiceFilterOption[]>(() => {
    if (!dayCatalog) return [];
    const active = (day.data?.appointments ?? []).filter(isActive);
    const order = serviceCategories(dayCatalog);
    return [...dayCatalog.services]
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name))
      .map((service) => ({ id: service.id, name: service.name, color: serviceColor(dayCatalog, service.id) ?? 1, count: active.filter((item) => item.serviceIds.includes(service.id)).length }));
  }, [dayCatalog, day.data]);
  // Los recursos especiales: cuántas citas de hoy los ocupan y si alguna vez se piden más de los que hay.
  const resourcesQuery = useResourcesQuery();
  const resourceOptions = React.useMemo<ResourceFilterOption[]>(() => {
    if (!dayCatalog) return [];
    const appointments = day.data?.appointments ?? [];
    return (resourcesQuery.data?.items ?? []).map((resource) => {
      const usage = resourceDay(resource, appointments, dayCatalog);
      const names = resource.serviceIds.map((id) => dayCatalog.services.find((service) => service.id === id)?.name).filter(Boolean);
      return { id: resource.id, name: resource.name, serviceIds: resource.serviceIds, servicesLabel: names.join(", "), count: new Set(usage.uses.map((use) => use.appointment.id)).size, clashes: usage.clashes.length };
    });
  }, [dayCatalog, day.data, resourcesQuery.data]);
  // Los tipos de cliente, en el orden de la escalera y con cuántas citas vivas tiene cada uno hoy.
  const clientTypeOptions = React.useMemo<ClientTypeFilterOption[]>(() => {
    if (!dayCatalog) return [];
    const active = (day.data?.appointments ?? []).filter(isActive);
    return CLIENT_TYPE_ORDER.map((type) => ({ id: type, label: t(CLIENT_TYPE_KEYS[type]), count: active.filter((item) => appointmentClientType(dayCatalog, item) === type).length }));
  }, [dayCatalog, day.data, t]);
  const filters = React.useMemo<AgendaFilters>(
    () => ({ stages: state.focuses, serviceIds: state.serviceIds, clientTypes: state.clientTypes }),
    [state.focuses, state.serviceIds, state.clientTypes]
  );

  // Barra flotante o cabecera: lo decide la persona en «Personalización».
  const [actionsPlacement] = useActionsPlacement();
  const railOwnsActions = actionsPlacement === "rail";
  // El buscador de la fila de arriba, junto a la vista: cerrado es solo la lupa.
  const [searchOpen, setSearchOpen] = React.useState(false);
  // Lo que el layout pone junto a las acciones de toda pantalla (el agente): sin PageHeader, lo pinta la barra.
  const headerExtras = usePageHeaderExtras();
  const isDayView = state.view === "day" || state.view === "agenda";

  // Lo que el rol no puede hacer no se ofrece: bloquear sin permiso, ir a los horarios sin ver Equipo.
  const hiddenRailActions = React.useMemo(() => new Set([...(can.canCreateBlock ? [] : ["block"]), ...(can.canViewTeam ? [] : ["work-hours"])]), [can.canCreateBlock, can.canViewTeam]);
  const railActions = React.useMemo(
    () =>
      calendarRailActions(t, {
        create: () => openPanel({ kind: "create", initial: null }),
        quickSale: () => openPanel({ kind: "quickSale" }),
        walkInSale: () => openPanel({ kind: "walkInSale" }),
        walkInQueue: () => openPanel({ kind: "walkInQueue" }),
        collections: () => openPanel({ kind: "collections" }),
        waitlist: () => openPanel({ kind: "waitlist" }),
        block: () => openPanel({ kind: "block", barberId: ownBarberId }),
        workHours: () => navigate("/usuarios"),
        assistant: () => openPanel({ kind: "assistant" }),
        gaps: () => openPanel({ kind: "gaps" }),
        timeOff: () => openPanel({ kind: "timeOff", focus: null }),
      }).filter((action) => !hiddenRailActions.has(action.id)),
    [hiddenRailActions, navigate, openPanel, ownBarberId, t]
  );

  useCalendarShortcuts({
    create: () => openPanel({ kind: "create", initial: null }),
    today: () => state.setDate(nowDate),
    agenda: () => state.setView("agenda"),
    day: () => state.setView("day"),
    week: () => state.setView("week"),
    month: () => state.setView("month"),
    previous: () => state.setDate(addDays(state.date, -1)),
    next: () => state.setDate(addDays(state.date, 1)),
    undo: () => undoRef.current?.(),
    assistant: () => openPanel({ kind: "assistant" }),
    gaps: () => openPanel({ kind: "gaps" }),
  });

  const onSlotClick = (slot: ScheduleSlot) => openPanel({ kind: "create", initial: { barberId: slot.resourceId, start: slot.start } });

  /* ------------------------------------------------------- mover y estirar */

  /** Si una tarjeta cabe donde se quiere soltar. Alargarla sobre citas que se pueden correr sí vale: se ofrece reacomodar. */
  // La cita como quedaría tras soltarla (otra hora, otro barbero u otra duración), contra los recursos especiales.
  const resources = resourcesQuery.data?.items;
  const dropConflict = React.useCallback(
    (id: string, drop: ScheduleDrop) => {
      const anchor = day.data?.appointments.find((item) => item.id === id);
      if (!anchor || !ctx || !day.data || !resources?.length) return null;
      const moved = { ...anchor, start: toLocalIso(drop.start), barberId: drop.resourceId, durationMin: differenceInMinutes(drop.end, drop.start) };
      return resourceConflict(resources, day.data.appointments, ctx.catalog, moved);
    },
    [ctx, day.data, resources]
  );

  const validateDrop = React.useCallback(
    (event: ScheduleEvent, drop: ScheduleDrop): string | null => {
      // Un barbero no pasa citas a la columna de otro, ni aunque la viera.
      if (ownBarberId && drop.resourceId !== ownBarberId) return t("calendar.clash.otherBarber");
      if (!enforceRules || !ctx || !day.data) return null;
      const barber = findBarber(ctx.catalog, drop.resourceId);
      if (!barber) return null;
      const from = minutesOfDay(drop.start);
      const to = minutesOfDay(drop.end);
      const problem = placementProblem(day.data, barber, state.date, from, to, event.id);
      const isResize = drop.resourceId === event.resourceId && drop.start.getTime() === event.start.getTime();
      if (isResize && problem?.kind === "appointment") {
        const anchor = day.data.appointments.find((item) => item.id === event.id);
        const plan = anchor ? reflowPlan(day.data, barber, state.date, { ...anchor, durationMin: to - from }, to) : null;
        // Si todo lo que pisa se puede correr, el plan lo resuelve; si no, no cabe.
        if (plan && clashingAppointments(day.data.appointments, barber.id, state.date, from, to, event.id).every((item) => plan.moves.some((move) => move.appointment.id === item.id))) return null;
      }
      return placementReason(problem, ctx, barber) ?? resourceReason(dropConflict(event.id, drop), ctx);
    },
    [ctx, day.data, dropConflict, enforceRules, ownBarberId, state.date, t]
  );

  /** Sin reglas el cambio entra igual, pero se avisa de sobre qué quedó. */
  const overlapNote = (barberId: string, from: number, to: number, excludeId: string): string | null => {
    if (enforceRules || !ctx || !day.data) return null;
    const barber = findBarber(ctx.catalog, barberId);
    const drop: ScheduleDrop = { resourceId: barberId, start: atMinutes(state.date, from), end: atMinutes(state.date, to) };
    return barber ? (placementReason(placementProblem(day.data, barber, state.date, from, to, excludeId), ctx, barber) ?? resourceReason(dropConflict(excludeId, drop), ctx)) : null;
  };

  const onDropRejected = (_event: ScheduleEvent, _drop: ScheduleDrop, reason: string) => toast.error(t("calendar.clash.title"), { description: reason });

  const onMove = (appointment: Appointment, drop: ScheduleDrop) => {
    if (!ctx) return;
    const barber = findBarber(ctx.catalog, drop.resourceId);
    const client = findClient(ctx.catalog, appointment.clientId);
    const note = overlapNote(drop.resourceId, minutesOfDay(drop.start), minutesOfDay(drop.end), appointment.id);
    const moved = t("calendar.movedHint", { client: client?.name ?? "", barber: barber?.name ?? "", time: formatClockRange(drop.start, drop.end, ctx.intl) });
    patchWithUndo(
      appointment,
      { start: toLocalIso(drop.start), barberId: drop.resourceId, force: !enforceRules },
      { start: appointment.start, barberId: appointment.barberId, force: true },
      t("calendar.moved"),
      note ? `${moved} ${note}.` : moved
    );
  };

  const onResize = (appointment: Appointment, drop: ScheduleDrop) => {
    if (!ctx || !day.data) return;
    const minutes = differenceInMinutes(drop.end, parseLocal(appointment.start));
    const barber = findBarber(ctx.catalog, appointment.barberId);
    const from = minutesOfDay(appointmentStart(appointment));
    const client = findClient(ctx.catalog, appointment.clientId);
    // Si al alargarse pisa a quien viene después, se propone correr la cola en vez de rechazar.
    const pisa = barber ? clashingAppointments(day.data.appointments, barber.id, state.date, from, from + minutes, appointment.id) : [];
    // Quien agenda sin reglas alarga y ya; a quien las sigue se le propone correr la cola.
    const plan = enforceRules && barber && pisa.length > 0 ? reflowPlan(day.data, barber, state.date, { ...appointment, durationMin: minutes }, from + minutes) : null;
    if (plan) {
      setReflow({ plan, anchorPatch: { durationMin: minutes } });
      return;
    }
    const note = overlapNote(appointment.barberId, from, from + minutes, appointment.id);
    const resized = t("calendar.resizedHint", { client: client?.name ?? "", minutes });
    patchWithUndo(appointment, { durationMin: minutes, force: !enforceRules }, { durationMin: appointment.durationMin, force: true }, t("calendar.resized"), note ? `${resized} ${note}.` : resized);
  };

  /* ------------------------------------------------------------ reacomodo */

  /** La cola de un barbero que va con retraso: lo que está en silla se alarga y empuja a los demás. */
  const planForBarber = (barber: Barber) => {
    if (!day.data) return;
    const seated = day.data.appointments
      .filter((item) => item.barberId === barber.id && item.status === "seated" && isSameDay(appointmentStart(item), state.date))
      .sort((a, b) => appointmentStart(b).getTime() - appointmentStart(a).getTime())[0];
    const anchor = seated ?? day.data.appointments.filter((item) => item.barberId === barber.id && item.status === "arrived").sort((a, b) => appointmentStart(a).getTime() - appointmentStart(b).getTime())[0];
    if (!anchor) {
      toast(t("calendar.reflow.nothing"));
      return;
    }
    const scheduledEnd = minutesOfDay(appointmentEnd(anchor));
    const nowMin = isSameDay(nowDate, state.date) ? minutesOfDay(nowDate) : null;
    // Quien ya está en silla termina, como pronto, en un rato; quien sigue esperando aún tiene todo su servicio por delante.
    const anchorEnd = nowMin === null ? scheduledEnd : anchor.status === "seated" ? Math.max(scheduledEnd, nowMin + RUNNING_LATE_GRACE_MINUTES) : Math.max(scheduledEnd, nowMin + anchor.durationMin);
    const plan = reflowPlan(day.data, barber, state.date, anchor, anchorEnd);
    if (!plan) {
      toast(t("calendar.reflow.nothing"));
      return;
    }
    setReflow({ plan, anchorPatch: null });
  };

  const applyReflow = async () => {
    if (!reflow || !ctx) return;
    const { plan, anchorPatch } = reflow;
    setReflow(null);
    const moved: { appointment: Appointment; previous: string }[] = [];
    try {
      // De la última a la primera: así ninguna pisa a la siguiente mientras se corren.
      for (const move of [...plan.moves].reverse()) {
        const updated = await update.mutateAsync({
          id: move.appointment.id,
          patch: { start: toLocalIso(moveStart(plan, move)), force: !enforceRules, reason: t("calendar.reflow.reason", { minutes: move.to - move.from }), actor: "assistant" },
        });
        moved.push({ appointment: updated, previous: move.appointment.start });
      }
      const anchorBefore = plan.anchor.durationMin;
      const anchorAfter = anchorPatch ? await update.mutateAsync({ id: plan.anchor.id, patch: anchorPatch }) : null;
      const undo = () => {
        undoRef.current = null;
        if (anchorAfter) patch(anchorAfter, { durationMin: anchorBefore, force: true });
        for (const item of [...moved].reverse()) patch(item.appointment, { start: item.previous, force: true });
        toast.success(t("calendar.undone"));
      };
      undoRef.current = undo;
      toast.success(t("calendar.reflow.applied"), { description: t("calendar.reflow.appliedHint", { count: moved.length }), action: { label: t("calendar.undo"), onClick: undo } });
    } catch (error) {
      toast.error(describeError(error).title, { description: describeError(error).description });
    }
  };

  /* -------------------------------------------- lo que se pinta encima */

  const reflowGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!reflow || !ctx || !isSameDay(reflow.plan.date, state.date)) return [];
    const { plan, anchorPatch } = reflow;
    const badge = { label: t("calendar.reflow.badge"), tone: "primary" as const };
    const asGhost = (appointment: Appointment, start: Date, end: Date, note: string): ScheduleEvent => ({
      ...toEvent(appointment, ctx),
      id: `ghost-${appointment.id}`,
      start,
      end,
      ghost: true,
      badge,
      note,
      action: undefined,
      urgent: undefined,
      warning: undefined,
      markers: [],
      faded: false,
      locked: true,
    });
    const anchorStart = appointmentStart(plan.anchor);
    const anchor = anchorPatch?.durationMin ? [asGhost(plan.anchor, anchorStart, atMinutes(plan.date, plan.anchorEnd), t("calendar.resizedHint", { client: findClient(ctx.catalog, plan.anchor.clientId)?.name ?? "", minutes: anchorPatch.durationMin }))] : [];
    return [
      ...anchor,
      ...plan.moves.map((move) => asGhost(move.appointment, moveStart(plan, move), atMinutes(plan.date, move.to + move.appointment.durationMin), t("calendar.reflow.reason", { minutes: move.to - move.from }))),
    ];
  }, [reflow, ctx, state.date, t]);

  const suggestionGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!ctx || panel?.kind !== "create") return [];
    const client = draft.clientId ? findClient(ctx.catalog, draft.clientId) : undefined;
    return suggestions.map((suggestion) => ({
      id: suggestionId(suggestion),
      resourceId: suggestion.barber.id,
      start: suggestion.start,
      end: suggestion.end,
      kind: "appointment",
      title: client?.name ?? t("calendar.suggest.slot"),
      note: t(suggestion.reasonKey, suggestion.reasonParams),
      tone: "primary",
      badge: { label: t("calendar.suggest.badge"), tone: "primary" },
      ghost: true,
      locked: true,
    }));
  }, [ctx, draft.clientId, panel?.kind, suggestions, t]);

  // «Solo huecos disponibles»: los ratos libres de quien se ve, como bloques que se tocan para agendar.
  const freeGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!ctx || !day.data || !state.freeOnly || state.view !== "day") return [];
    return dayGaps({ day: day.data, catalog: ctx.catalog, barbers: visibleBarbers(ctx.catalog.barbers, team, state.date), date: state.date, now: nowDate, minMinutes: FREE_SLOT_MIN_MINUTES }).map((gap) => ({
      id: `free-${gap.id}`,
      resourceId: gap.barber.id,
      start: gap.start,
      end: gap.end,
      kind: "appointment",
      title: t("calendar.free.title"),
      note: gap.fits[0] ? (gap.fits.length > 1 ? t("calendar.gaps.fitsMore", { name: gap.fits[0].name, count: gap.fits.length - 1 }) : t("calendar.gaps.fits", { name: gap.fits[0].name })) : undefined,
      badge: { label: durationLabel(gap.minutes), tone: "primary" },
      ghost: true,
      locked: true,
    }));
  }, [ctx, day.data, nowDate, state.date, state.freeOnly, team, state.view, t]);

  const linkGroups = React.useMemo(() => appointmentGroups(day.data?.appointments ?? []), [day.data]);
  const fadedIds = React.useMemo(
    () =>
      new Set([
        ...(reflow && isSameDay(reflow.plan.date, state.date) ? [...reflow.plan.moves.map((move) => move.appointment.id), ...(reflow.anchorPatch ? [reflow.plan.anchor.id] : [])] : []),
        // Mirando solo los huecos, todas las citas se apagan.
        ...(state.freeOnly ? (day.data?.appointments ?? []).map((item) => item.id) : []),
        // Mirando las enlazadas, las sueltas se apagan.
        ...(state.showLinked ? (day.data?.appointments ?? []).filter((item) => !linkGroups.has(item.id)).map((item) => item.id) : []),
      ]),
    [reflow, state.date, state.freeOnly, state.showLinked, day.data, linkGroups]
  );

  // Las ausencias que esperan aprobación se ven rayadas en la columna del barbero (tocarlas abre su revisión).
  const absences = useAbsences(branchId);
  const absenceGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!ctx || state.view !== "day") return [];
    const day = format(state.date, "yyyy-MM-dd");
    return (absences.data?.items ?? [])
      .filter((item) => item.status === "pending" && item.startDate <= day && day <= item.endDate)
      .flatMap((item) => {
        const barber = ctx.catalog.barbers.find((entry) => entry.id === item.memberId);
        const hours = barber ? workingHoursOn(barber, state.date) : [];
        if (!barber || hours.length === 0) return [];
        return [
          {
            id: `absence-${item.id}`,
            resourceId: barber.id,
            start: parseLocal(`${day}T${hours[0].start}:00`),
            end: parseLocal(`${day}T${hours[hours.length - 1].end}:00`),
            kind: "block" as const,
            title: t("calendar.timeOff.ghost", { kind: t(ABSENCE_KIND_KEYS[item.kind]) }),
            subtitle: item.note || undefined,
            tone: "warning" as const,
            ghost: true,
            locked: true,
          },
        ];
      });
  }, [absences.data, ctx, state.date, state.view, t]);

  // Ver u ocultar ausencias y bloqueos en la rejilla: solo se dejan de pintar; siguen ocupando su hueco.
  const { absences: hideAbsences, blocks: hideBlocks } = state.hidden;
  const hideBlock = React.useCallback((block: TimeBlock) => (isAbsenceBlock(block) ? hideAbsences : hideBlocks), [hideAbsences, hideBlocks]);
  const timeOffVisibility = React.useMemo(() => {
    const blocks = day.data?.blocks ?? [];
    return { showAbsences: !hideAbsences, showBlocks: !hideBlocks, absences: blocks.filter(isAbsenceBlock).length + absenceGhosts.length, blocks: blocks.filter((block) => !isAbsenceBlock(block)).length };
  }, [day.data, absenceGhosts.length, hideAbsences, hideBlocks]);

  const extraEvents = React.useMemo(() => [...freeGhosts, ...reflowGhosts, ...suggestionGhosts, ...(hideAbsences ? [] : absenceGhosts)], [freeGhosts, reflowGhosts, suggestionGhosts, absenceGhosts, hideAbsences]);

  const onSuggestions = React.useCallback((next: readonly SlotSuggestion[], nextDraft: CreateAppointmentDraft) => {
    setSuggestions((current) => (sameSuggestions(current, next) ? current : next));
    setDraft((current) => (sameDraft(current, nextDraft) ? current : nextDraft));
  }, []);

  const acceptProposal = (event: ScheduleEvent) => {
    if (event.id.startsWith("absence-")) {
      openPanel({ kind: "timeOff", focus: { type: "absence", id: event.id.slice("absence-".length) } });
      return;
    }
    if (event.id.startsWith("ghost-")) {
      void applyReflow();
      return;
    }
    if (event.id.startsWith("free-")) {
      openPanel({ kind: "create", initial: { barberId: event.resourceId, start: event.start } });
      return;
    }
    const suggestion = suggestions.find((item) => suggestionId(item) === event.id);
    if (!suggestion) return;
    setCreateNonce((value) => value + 1);
    setPanel({ kind: "create", initial: { ...draft, serviceId: draft.serviceIds[0], barberId: suggestion.barber.id, start: suggestion.start } });
  };

  /* ------------------------------------------------ huecos que se liberan */

  /** Al anular una cita, a quién de la lista de espera le serviría ese hueco. */
  const releaseSlot = (appointment: Appointment) => {
    if (!ctx) return;
    const start = appointmentStart(appointment);
    const end = appointmentEnd(appointment);
    const barber = findBarber(ctx.catalog, appointment.barberId);
    const matches = waitlistItems.filter((entry) => {
      const minutes = ctx.catalog.services.find((service) => service.id === entry.serviceId)?.durationMin ?? 30;
      const barberOk = entry.barberId === null || entry.barberId === appointment.barberId;
      const dayOk = entry.slots.some((slot) => slot.date === state.dateKey);
      return barberOk && dayOk && minutes <= appointment.durationMin;
    });
    const offer = (entry: WaitlistEntry) => openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: appointment.barberId, start } });
    toast(t("calendar.freed.title", { time: formatClockRange(start, end, ctx.intl), barber: barber?.name.split(" ")[0] ?? "" }), {
      description: matches.length > 0 ? t("calendar.freed.matches", { count: matches.length }) : t("calendar.freed.none"),
      action: matches[0] ? { label: t("calendar.freed.offer"), onClick: () => offer(matches[0]) } : undefined,
    });
    if (matches.length > 0) setFreed((current) => [...current, { id: appointment.id, dateKey: state.dateKey, barberId: appointment.barberId, start, end, matches }]);
  };

  const resourceAlerts = React.useMemo<Record<string, ScheduleResourceAlert>>(() => {
    if (!ctx || !day.data) return {};
    const alerts: Record<string, ScheduleResourceAlert> = {};
    for (const slot of freed) {
      // Solo mientras el hueco siga libre y se vea ese día.
      if (slot.dateKey !== state.dateKey || clashingAppointments(day.data.appointments, slot.barberId, state.date, minutesOfDay(slot.start), minutesOfDay(slot.end)).length > 0) continue;
      const entry = slot.matches[0];
      alerts[slot.barberId] = {
        label: t("calendar.freed.alert", { time: formatClock(slot.start, ctx.intl), count: slot.matches.length }),
        tone: "warning",
        onClick: () => openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: slot.barberId, start: slot.start } }),
      };
    }
    return alerts;
  }, [ctx, day.data, freed, openPanel, state.date, state.dateKey, t]);

  /* ------------------------------------------------------------ resto */

  // Lo mismo que hacen los botones del panel de la cita, para el clic derecho sobre la tarjeta.
  const runAppointmentAction = (action: AppointmentActionId, appointment: Appointment) => {
    if (action === "checkIn") changeStatus(appointment, "arrived");
    if (action === "seat") changeStatus(appointment, "seated");
    if (action === "pay") startCheckout(appointment);
    if (action === "ready") onBarberReady(appointment);
    if (action === "rebook") openPanel({ kind: "create", initial: { clientId: appointment.clientId, serviceId: appointment.serviceIds[0], barberId: appointment.barberId } });
    if (action === "noShow") openPanel({ kind: "confirm", action: "noShow", appointment });
    if (action === "cancel") openPanel({ kind: "confirm", action: "cancel", appointment });
  };
  const contextHandlers = { open: openAppointment, run: runAppointmentAction, openClient: (clientId: string) => navigate(`/clientes/${clientId}`) };

  const onBarberReady = (appointment: Appointment) =>
    patch(appointment, { barberReady: true }, (updated) => {
      const client = ctx ? findClient(ctx.catalog, updated.clientId) : undefined;
      const barber = ctx ? findBarber(ctx.catalog, updated.barberId) : undefined;
      toast.success(t("calendar.readyMarked"), { description: t("calendar.readyMarkedHint", { barber: barber?.name ?? "", client: client?.name ?? "" }) });
    });

  const scheduleFromWaitlist = (entry: WaitlistEntry, match?: WaitlistMatch) => {
    const first = entry.slots[0];
    // Con un hueco ya encontrado, el alta abre con ese barbero y esa hora.
    const start = match?.start ?? (first ? parseLocal(`${first.date}T${first.time}:00`) : undefined);
    openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: match?.barber.id ?? entry.barberId ?? undefined, start } });
  };

  /**
   * Cancelar la cita o marcar que no asistió, ya confirmado: el panel lo confirma en un popover junto
   * al botón (un modal sobre el panel queda mal); el clic derecho de la agenda, con el diálogo.
   */
  const closeAppointmentAs = (appointment: Appointment, action: "cancel" | "noShow", then?: () => void) => {
    const status: AppointmentStatus = action === "cancel" ? "cancelled" : "no_show";
    const client = ctx ? (findClient(ctx.catalog, appointment.clientId)?.name ?? "") : "";
    patch(appointment, { status }, (updated) => {
      then?.();
      toast.success(t("calendar.statusChanged"), { description: t("calendar.statusChangedHint", { client, status: t(STATUS_KEYS[status]) }) });
      // El hueco que deja se ofrece enseguida a la lista de espera.
      if (isSameDay(appointmentStart(updated), state.date) && appointmentEnd(updated) > nowDate) releaseSlot(updated);
    });
  };

  // Las confirmaciones son diálogos encima de lo que haya; lo demás ocupa el panel lateral.
  const sidePanelOpen = panel !== null && panel.kind !== "confirm" && panel.kind !== "removeBlock";
  const confirm = panel?.kind === "confirm" ? panel : null;
  const confirmClient = confirm && ctx ? (findClient(ctx.catalog, confirm.appointment.clientId)?.name ?? "") : "";
  const revenue = pulse ? { collected: formatMoney(pulse.collected), total: formatMoney(pulse.expected) } : null;
  const showReflow = reflow !== null && ctx !== null && state.view === "day" && isSameDay(reflow.plan.date, state.date);

  return (
    // Columna flex a todo el alto: en la vista Día la rejilla se queda con lo
    // que sobra y es lo único que se desplaza —la página no suma otra barra—.
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("calendar.title")]} />
      </ShellHeaderSlot>

      {/* Sin cabecera de página: el título solo para lectores de pantalla y lo
          demás —cobrado, acciones, agente— entra en la fila de la barra. */}
      <h1 className="sr-only">{t("calendar.title")}</h1>

      <CalendarToolbar
        date={state.date}
        isToday={state.isToday}
        view={state.view}
        team={team}
        barbers={barbers}
        onDateChange={state.setDate}
        onViewChange={state.setView}
        onTeamChange={state.setTeam}
        showTeam={!ownBarberId}
        dateBadge={isDayView ? <DayWeightBadge weight={dayWeightOf(rhythm.data, state.date)} booked={day.data?.appointments.filter(isActive).length} /> : undefined}
        search={
          ctx && (
            <CalendarSearch
              open={searchOpen}
              onOpenChange={setSearchOpen}
              branchId={branchId}
              ctx={ctx}
              ownBarberId={ownBarberId}
              onSelect={(appointment) => {
                // Ir a su día y abrirla: un panel a la vez, así que se cierra el que hubiera.
                closePanel();
                state.openAppointmentOn(appointmentStart(appointment), appointment.id);
              }}
            />
          )
        }
        summary={
          revenue && isDayView && can.showTotals ? (
            <Text
              as="span"
              variant="muted"
              className="whitespace-nowrap tabular-nums max-lg:hidden"
              title={t("calendar.pulse.revenueLine", revenue)}
              data-testid="calendar-pulse-collected"
            >
              {/* Corto a la vista para que la fila quepa; completo para lectores de pantalla y en el title. */}
              <span aria-hidden="true">{t("calendar.pulse.revenueShort", revenue)}</span>
              <span className="sr-only">{t("calendar.pulse.revenueLine", revenue)}</span>
            </Text>
          ) : undefined
        }
        actions={
          <>
            {!railOwnsActions && <ScreenHeaderActions actions={railActions} moreLabel={t("action.more")} compact />}
            {headerExtras}
          </>
        }
        status={
          pulse && isDayView ? (
            <CalendarFilters
              pulse={pulse}
              focuses={state.focuses}
              services={serviceOptions}
              serviceIds={state.serviceIds}
              resources={resourceOptions}
              clientTypeOptions={clientTypeOptions}
              clientTypes={state.clientTypes}
              onChange={state.setFilters}
              freeOnly={state.view === "day" ? state.freeOnly : undefined}
              onFreeOnlyChange={state.view === "day" ? state.setFreeOnly : undefined}
              showLinked={state.view === "day" ? state.showLinked : undefined}
              onShowLinkedChange={state.view === "day" ? state.setShowLinked : undefined}
              timeOff={state.view === "day" ? timeOffVisibility : undefined}
              onTimeOffChange={state.view === "day" ? (next) => state.setHidden({ absences: !next.showAbsences, blocks: !next.showBlocks }) : undefined}
            />
          ) : undefined
        }
        viewSettings={
          ctx && isDayView ? (
            <CalendarViewOptions
              colorBy={state.colorBy}
              onColorByChange={state.setColorBy}
              services={serviceOptions}
              clientTypes={clientTypeOptions}
              card={cardPrefs}
              onCardChange={setCardPref}
              onCardReset={resetCardPrefs}
              density={state.view === "day" ? density : undefined}
              onDensityChange={setDensity}
              hasColumnWidths={state.view === "day" ? Object.keys(columnWidths).length > 0 : undefined}
              onColumnWidthsReset={resetColumnWidths}
            />
          ) : undefined
        }
      />

      {/* En el celular la fila de la barra no cabe el cobrado: al barbero se le dice aparte cuánto lleva hoy. */}
      {revenue && isDayView && can.showTotals && ownBarberId && (
        <Text variant="muted" className="-mt-2 tabular-nums lg:hidden" data-testid="calendar-pulse-mine">
          {t("calendar.pulse.todayMine", revenue)}
        </Text>
      )}

      {showReflow && reflow && ctx && <ReflowBanner plan={reflow.plan} ctx={ctx} busy={update.isPending} onApply={() => void applyReflow()} onDiscard={() => setReflow(null)} />}

      <QueryBoundary query={catalog} loading={<GridSkeleton />}>
        {() =>
          ctx && (
            <>
              {state.view === "month" ? (
                <CalendarMonthView
                  branchId={branchId}
                  date={state.date}
                  team={team}
                  barbers={barbers}
                  onTeamChange={state.setTeam}
                  showTeam={!ownBarberId}
                  today={nowDate}
                  selectedDay={dayPanelDate}
                  rhythm={rhythm.data}
                  onSelectDay={openDayPanel}
                />
              ) : state.view === "week" ? (
                <CalendarWeekView branchId={branchId} date={state.date} team={team} ctx={ctx} today={nowDate} selectedDay={dayPanelDate} rhythm={rhythm.data} onSelectDay={openDayPanel} />
              ) : (
                <QueryBoundary query={day} loading={<GridSkeleton />}>
                  {(data: CalendarDay) =>
                    state.view === "agenda" ? (
                      <CalendarAgendaView
                        date={state.date}
                        team={team}
                        day={data}
                        ctx={ctx}
                        filters={filters}
                        onClearFocus={() => state.setFilters({ focuses: [], serviceIds: [] })}
                        onOpenAppointment={openAppointment}
                        onNextStep={(appointment) => ctx.onNextStep?.(appointment)}
                        appointmentActions={(appointment) => appointmentContextActions(appointment, ctx, contextHandlers)}
                      />
                    ) : (
                      <CalendarDayView
                        date={state.date}
                        team={team}
                        day={data}
                        ctx={ctx}
                        now={nowDate}
                        filters={filters}
                        slotHeight={slotHeight}
                        columnWidths={columnWidths}
                        onColumnResize={setColumnWidth}
                        extraEvents={extraEvents}
                        hideBlock={hideBlock}
                        fadedIds={fadedIds}
                        highlightLinks={state.showLinked}
                        alerts={resourceAlerts}
                        validateDrop={validateDrop}
                        onDropRejected={onDropRejected}
                        onSlotClick={onSlotClick}
                        onOpenAppointment={openAppointment}
                        onOpenBlock={(block) => (block.status === "pending" ? openPanel({ kind: "timeOff", focus: { type: "block", id: block.id } }) : canRemoveBlock(can, block) && setPanel({ kind: "removeBlock", block }))}
                        appointmentActions={(appointment) => appointmentContextActions(appointment, ctx, contextHandlers)}
                        blockActions={(block) => blockContextActions(block, ctx, (target) => setPanel({ kind: "removeBlock", block: target }))}
                        onAcceptProposal={acceptProposal}
                        onMove={onMove}
                        onResize={onResize}
                        onSeeAll={ownBarberId ? undefined : () => state.setTeam("all")}
                        onConfigureHours={can.canViewTeam ? () => navigate("/usuarios") : undefined}
                        onViewBarber={can.canViewTeam ? (barber: Barber) => navigate(`/usuarios/lista?search=${encodeURIComponent(barber.name)}`) : undefined}
                        onBlockBarber={can.canCreateBlock ? (barber: Barber) => openPanel({ kind: "block", barberId: barber.id }) : undefined}
                        onReflowBarber={planForBarber}
                        onTeamChange={ownBarberId ? undefined : state.setTeam}
                      />
                    )
                  }
                </QueryBoundary>
              )}

              <AppointmentDrawer
                appointment={currentAppointment}
                open={Boolean(currentAppointment) && !sidePanelOpen}
                onOpenChange={(open) => !open && state.openAppointment(null)}
                ctx={ctx}
                onStatus={changeStatus}
                onBarberReady={onBarberReady}
                // El cobro sustituye al detalle: dos paneles apilados tapan el que importa.
                onPay={startCheckout}
                onPatch={(appointment, changes) =>
                  patch(appointment, changes, (updated) => {
                    toast.success(t("calendar.detail.updated"));
                    // Si la cita se fue a otro día, la agenda la sigue.
                    if (changes.start && updated.start.slice(0, 10) !== state.dateKey) state.setDate(parseLocal(updated.start));
                  })
                }
                onRebook={(initial) => {
                  state.openAppointment(null);
                  setPanel({ kind: "create", initial });
                }}
                // El panel ya lo confirmó en su popover: aquí solo se hace.
                onCancel={(appointment) => closeAppointmentAs(appointment, "cancel")}
                onNoShow={(appointment) => closeAppointmentAs(appointment, "noShow")}
                onOpenClient={(clientId) => navigate(`/clientes/${clientId}`)}
                linked={currentLinked}
                linkCandidates={linkCandidates}
                onSelectAppointment={(appointment) => state.openAppointment(appointment.id)}
                onUnlink={unlinkAppointment}
                onLink={linkAppointments}
                onShowLinked={showLinkedInAgenda}
              />

              <CreateAppointmentDrawer
                key={createNonce}
                open={panel?.kind === "create"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                initial={panel?.kind === "create" ? panel.initial : null}
                now={nowDate}
                viewDate={state.date}
                day={day.data}
                onSuggestions={onSuggestions}
                enforceRules={enforceRules}
                resources={resources}
                onCreated={(appointment) => state.setDate(parseLocal(appointment.start))}
                onCreateClient={() => navigate("/clientes")}
              />

              <CalendarAssistantDrawer
                open={panel?.kind === "assistant"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                branchId={branchId}
                date={state.date}
                day={day.data}
                lines={brief ?? []}
                onFocus={(focus) => state.setFilters({ focuses: [focus] })}
                onBarber={state.setTeam}
                onSchedule={scheduleFromWaitlist}
                onBook={(initial) => openPanel({ kind: "create", initial })}
              />

              <CheckoutDrawer
                appointment={panel?.kind === "checkout" ? panel.appointment : null}
                companions={checkoutCompanions}
                candidates={checkoutCandidates}
                open={panel?.kind === "checkout"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                onPaid={(paid) => {
                  // Recién cobrado es el mejor momento para dejar agendada la siguiente.
                  const client = findClient(ctx.catalog, paid.clientId);
                  if (!client || client.type === "walkin") return;
                  toast(t("calendar.detail.rebook"), {
                    description: client.name,
                    action: {
                      label: t("calendar.insight.rebookAction"),
                      onClick: () => setPanel({ kind: "create", initial: { clientId: paid.clientId, serviceId: paid.serviceIds[0], barberId: paid.barberId } }),
                    },
                  });
                }}
              />

              <BlockDrawer
                open={panel?.kind === "block"}
                onOpenChange={(open) => !open && closePanel()}
                barbers={barbers}
                initialBarberId={panel?.kind === "block" ? panel.barberId : null}
                date={state.date}
                day={day.data}
                ownOnly={Boolean(ownBarberId)}
              />

              <CollectionsDrawer
                open={panel?.kind === "collections"}
                onOpenChange={(open) => !open && closePanel()}
                branchId={branchId}
                ctx={ctx}
                initialDate={state.date}
                onPay={startCheckout}
                onOpenAppointment={(appointment, date) => {
                  closePanel();
                  state.setDate(date);
                  state.openAppointment(appointment.id);
                }}
              />

              <WalkInQueueDrawer open={panel?.kind === "walkInQueue"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} canManage={!access.isBarber} />
              <WaitlistDrawer open={panel?.kind === "waitlist"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} date={state.date} day={day.data} onSchedule={scheduleFromWaitlist} />

              <DayPanel
                open={panel?.kind === "day"}
                onOpenChange={(open) => !open && closePanel()}
                date={dayPanelDate}
                branchId={branchId}
                ctx={ctx}
                onOpenDay={(date, barberId) => {
                  closePanel();
                  state.openDay(date, ownBarberId ? null : barberId);
                }}
                onOpenAppointment={(date, id) => {
                  // La cita se abre junto a la semana o el mes, sin cambiar de vista.
                  closePanel();
                  state.openAppointmentKeepingView(date, id);
                }}
                onOpenClient={(clientId) => navigate(`/clientes/${clientId}`)}
                onOpenTimeOff={(focus) => openPanel({ kind: "timeOff", focus })}
                onBook={(date) => openPanel({ kind: "create", initial: { start: date } })}
              />

              <TimeOffDrawer
                open={panel?.kind === "timeOff"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                branchId={branchId}
                focus={panel?.kind === "timeOff" ? panel.focus : null}
                onOpenAppointment={(date, id) => {
                  closePanel();
                  state.openAppointmentOn(date, id);
                }}
              />

              <GapsDrawer
                open={panel?.kind === "gaps"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                date={state.date}
                day={day.data}
                waitlist={waitlistItems}
                onBook={(gap) => openPanel({ kind: "create", initial: { barberId: gap.barber.id, start: gap.start } })}
                onOffer={(gap, entry) => openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: gap.barber.id, start: gap.start } })}
              />

              <QuickSaleDrawer open={panel?.kind === "quickSale"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} />

              <WalkInSaleDrawer
                open={panel?.kind === "walkInSale"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                date={state.date}
                now={nowDate}
                day={day.data}
                onCreated={(appointment) => {
                  state.setDate(parseLocal(appointment.start));
                  setPanel({ kind: "checkout", appointment });
                }}
              />

              <ConfirmDialog
                open={checkoutWarning !== null}
                onOpenChange={(open) => !open && setCheckoutWarning(null)}
                variant="warning"
                title={checkoutWarning ? t("calendar.checkout.openTitle", { barber: findBarber(ctx.catalog, checkoutWarning.appointment.barberId)?.name.split(" ")[0] ?? "", count: checkoutWarning.open.length }) : ""}
                description={
                  checkoutWarning
                    ? t("calendar.checkout.openHint", {
                        list: checkoutWarning.open.map((item) => `${findClient(ctx.catalog, item.clientId)?.name ?? t("calendar.clientType.walkin")} (${clockLabel(item.start.slice(11, 16), ctx.intl)})`).join(", "),
                      })
                    : undefined
                }
                confirmLabel={t("calendar.checkout.openContinue")}
                cancelLabel={checkoutWarning ? t("calendar.checkout.openFirst", { name: (findClient(ctx.catalog, checkoutWarning.open[0].clientId)?.name ?? "").split(" ")[0] }) : undefined}
                onConfirm={() => {
                  if (!checkoutWarning) return;
                  openPanel({ kind: "checkout", appointment: checkoutWarning.appointment });
                  setCheckoutWarning(null);
                }}
                onCancel={() => {
                  if (!checkoutWarning) return;
                  openPanel({ kind: "checkout", appointment: checkoutWarning.open[0] });
                  setCheckoutWarning(null);
                }}
              />

              <ConfirmDialog
                open={panel?.kind === "removeBlock"}
                onOpenChange={(open) => !open && closePanel()}
                variant="destructive"
                title={panel?.kind === "removeBlock" ? t("calendar.block.removeTitle", { name: t(BLOCK_CATEGORY_KEYS[panel.block.category]) }) : ""}
                description={
                  panel?.kind === "removeBlock"
                    ? t("calendar.block.removeHint", {
                        barber: findBarber(ctx.catalog, panel.block.barberId)?.name ?? "",
                        range: `${clockLabel(panel.block.startTime, ctx.intl)} – ${clockLabel(panel.block.endTime, ctx.intl)}`,
                      })
                    : undefined
                }
                confirmLabel={t("calendar.block.remove")}
                loading={removeBlock.isPending}
                onConfirm={() => {
                  if (panel?.kind !== "removeBlock") return;
                  removeBlock.mutate(panel.block.id, {
                    onSuccess: () => {
                      toast.success(t("calendar.block.removed"));
                      closePanel();
                    },
                    onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
                  });
                }}
              />

              <ConfirmDialog
                open={Boolean(confirm)}
                onOpenChange={(open) => !open && closePanel()}
                variant={confirm?.action === "cancel" ? "destructive" : "warning"}
                title={confirm?.action === "cancel" ? t("calendar.cancel.title", { name: confirmClient }) : t("calendar.noShow.title", { name: confirmClient })}
                description={confirm?.action === "cancel" ? t("calendar.cancel.hint") : t("calendar.noShow.hint")}
                confirmLabel={confirm?.action === "cancel" ? t("calendar.cancel.confirm") : t("calendar.noShow.confirm")}
                cancelLabel={t("calendar.cancel.keep")}
                loading={update.isPending}
                onConfirm={() => {
                  if (!confirm) return;
                  closeAppointmentAs(confirm.appointment, confirm.action, () => {
                    closePanel();
                    state.openAppointment(null);
                  });
                }}
              />
            </>
          )
        }
      </QueryBoundary>

      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail actions={railActions} selectedCount={0} onClearSelection={() => undefined} isBlocked={panel?.kind === "confirm" || panel?.kind === "removeBlock"} />
        </ShellRailSlot>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-[28rem] w-full" />
    </div>
  );
}
