import * as React from "react";
import { differenceInMinutes, startOfDay } from "date-fns";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot, useShellConfig } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { ConfirmDialog } from "@/components/overlays";
import { DataListActionRail } from "@/components/action-rail";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScheduleDrop, ScheduleSlot } from "@/components/scheduling";
import { formatClockRange } from "@/components/scheduling";
import { DEFAULT_BRANCH_ID } from "@/features/branches";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarAgendaView } from "./CalendarAgendaView";
import { CalendarMonthView } from "./CalendarMonthView";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CreateAppointmentDrawer, type CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import { CheckoutDrawer } from "./CheckoutDrawer";
import { BlockDrawer } from "./BlockDrawer";
import { CollectionsDrawer } from "./CollectionsDrawer";
import { WaitlistDrawer } from "./WaitlistDrawer";
import { QuickSaleDrawer } from "./QuickSaleDrawer";
import { WalkInSaleDrawer } from "./WalkInSaleDrawer";
import { calendarRailActions } from "./calendarRailActions";
import { useMoney } from "./calendarFormat";
import { useCalendarState } from "./useCalendarState";
import { useCatalogQuery, useDayQuery, useUpdateAppointment } from "./queries";
import { applyDayHours, findBarber, findClient, isActive, isUnpaid, isWorkingOn, nextStep, parseLocal, toLocalIso, type ModelContext } from "./calendarModel";
import { STATUS_KEYS, type Appointment, type AppointmentStatus, type Barber, type CalendarDay, type WaitlistEntry } from "./types";

/**
 * El calendario de la barbería: el día por barbero, la agenda como lista y
 * la ocupación del mes, con todo lo que se hace desde aquí —agendar, mover,
 * atender, cobrar, bloquear, vender— en drawers del sistema. La barra
 * flotante concentra las acciones de pantalla; cada cita abre su detalle.
 *
 * El estado que se comparte (día, vista, filtro, cita abierta) vive en la
 * URL; los paneles de trabajo (crear, cobrar, bloquear…) en memoria.
 */

type Panel =
  | { kind: "create"; initial: CreateAppointmentInitial | null }
  | { kind: "checkout"; appointment: Appointment }
  | { kind: "block"; barberId: string | null }
  | { kind: "collections" }
  | { kind: "waitlist" }
  | { kind: "quickSale" }
  | { kind: "walkInSale" }
  | { kind: "confirm"; action: "cancel" | "noShow"; appointment: Appointment };

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
  const branchId = activeCompanyId ?? DEFAULT_BRANCH_ID;
  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  const state = useCalendarState(startOfDay(nowDate));
  const catalog = useCatalogQuery(branchId);
  const day = useDayQuery(branchId, state.dateKey);
  const update = useUpdateAppointment();
  const [panel, setPanel] = React.useState<Panel | null>(null);
  const closePanel = () => setPanel(null);

  const openAppointment = React.useCallback((appointment: Appointment) => state.openAppointment(appointment.id), [state]);
  const currentAppointment = React.useMemo(() => day.data?.appointments.find((item) => item.id === state.appointmentId) ?? null, [day.data, state.appointmentId]);

  const patch = React.useCallback(
    (appointment: Appointment, changes: Parameters<typeof update.mutate>[0]["patch"], done?: (updated: Appointment) => void) => {
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

  const changeStatus = React.useCallback(
    (appointment: Appointment, status: AppointmentStatus) => {
      if (status === "paid") {
        setPanel({ kind: "checkout", appointment });
        return;
      }
      patch(appointment, { status }, (updated) => {
        const client = findClient(catalog.data ?? { barbers: [], clients: [], services: [], products: [] }, updated.clientId);
        toast.success(t("calendar.statusChanged"), { description: t("calendar.statusChangedHint", { client: client?.name ?? "", status: t(STATUS_KEYS[updated.status]) }) });
      });
    },
    [catalog.data, patch, t]
  );

  // Las franjas del día (con las excepciones de la semana) pisan el horario
  // fijo del catálogo: así el calendario enseña lo que de verdad se trabaja.
  const dayCatalog = React.useMemo(
    () => (catalog.data ? { ...catalog.data, barbers: applyDayHours(catalog.data.barbers, state.date, day.data?.hours) } : null),
    [catalog.data, day.data?.hours, state.date]
  );
  const ctx = React.useMemo<ModelContext | null>(
    () =>
      dayCatalog
        ? {
            t,
            intl: current.intl,
            formatMoney,
            catalog: dayCatalog,
            onNextStep: (appointment) => {
              const step = nextStep(appointment.status);
              if (step) changeStatus(appointment, step.status);
            },
          }
        : null,
    [dayCatalog, changeStatus, current.intl, formatMoney, t]
  );

  const barbers = React.useMemo(() => dayCatalog?.barbers ?? [], [dayCatalog]);
  const working = React.useMemo(() => barbers.filter((barber) => isWorkingOn(barber, state.date)), [barbers, state.date]);
  const activeAppointments = (day.data?.appointments ?? []).filter(isActive);
  const unpaidCount = activeAppointments.filter(isUnpaid).length;

  const railActions = React.useMemo(
    () =>
      calendarRailActions(t, {
        create: () => setPanel({ kind: "create", initial: null }),
        quickSale: () => setPanel({ kind: "quickSale" }),
        walkInSale: () => setPanel({ kind: "walkInSale" }),
        collections: () => setPanel({ kind: "collections" }),
        waitlist: () => setPanel({ kind: "waitlist" }),
        block: () => setPanel({ kind: "block", barberId: null }),
        workHours: () => navigate("/usuarios"),
      }),
    [navigate, t]
  );

  const onSlotClick = (slot: ScheduleSlot) => setPanel({ kind: "create", initial: { barberId: slot.resourceId, start: slot.start } });

  const onMove = (appointment: Appointment, drop: ScheduleDrop) => {
    if (!ctx) return;
    const barber = findBarber(ctx.catalog, drop.resourceId);
    patch(appointment, { start: toLocalIso(drop.start), barberId: drop.resourceId }, (updated) => {
      const client = findClient(ctx.catalog, updated.clientId);
      toast.success(t("calendar.moved"), { description: t("calendar.movedHint", { client: client?.name ?? "", barber: barber?.name ?? "", time: formatClockRange(drop.start, drop.end, ctx.intl) }) });
    });
  };

  const onResize = (appointment: Appointment, drop: ScheduleDrop) => {
    const minutes = differenceInMinutes(drop.end, parseLocal(appointment.start));
    patch(appointment, { durationMin: minutes }, (updated) => {
      const client = ctx ? findClient(ctx.catalog, updated.clientId) : undefined;
      toast.success(t("calendar.resized"), { description: t("calendar.resizedHint", { client: client?.name ?? "", minutes }) });
    });
  };

  const onBarberReady = (appointment: Appointment) =>
    patch(appointment, { barberReady: true }, (updated) => {
      const client = ctx ? findClient(ctx.catalog, updated.clientId) : undefined;
      const barber = ctx ? findBarber(ctx.catalog, updated.barberId) : undefined;
      toast.success(t("calendar.readyMarked"), { description: t("calendar.readyMarkedHint", { barber: barber?.name ?? "", client: client?.name ?? "" }) });
    });

  const scheduleFromWaitlist = (entry: WaitlistEntry) => {
    const first = entry.slots[0];
    setPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: entry.barberId ?? undefined, start: first ? parseLocal(`${first.date}T${first.time}:00`) : undefined } });
  };

  const confirm = panel?.kind === "confirm" ? panel : null;
  const confirmClient = confirm && ctx ? findClient(ctx.catalog, confirm.appointment.clientId)?.name ?? "" : "";

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/dashboard") }, t("calendar.title")]} />
      </ShellHeaderSlot>

      <PageHeader
        title={t("calendar.title")}
        description={t("calendar.description")}
        meta={
          day.data ? (
            <>
              <span>{t("calendar.meta.working", { count: working.length })}</span>
              <span>{t("calendar.meta.appointments", { count: activeAppointments.length })}</span>
              <span>{t("calendar.meta.toCollect", { count: unpaidCount })}</span>
            </>
          ) : undefined
        }
      />

      <CalendarToolbar
        date={state.date}
        isToday={state.isToday}
        view={state.view}
        team={state.team}
        barbers={barbers}
        onDateChange={state.setDate}
        onViewChange={state.setView}
        onTeamChange={state.setTeam}
        onOpenWaitlist={() => setPanel({ kind: "waitlist" })}
        onOpenWorkHours={() => navigate("/usuarios")}
      />

      <QueryBoundary query={catalog} loading={<GridSkeleton />}>
        {() =>
          ctx && (
            <>
              {state.view === "month" ? (
                <CalendarMonthView
                  branchId={branchId}
                  date={state.date}
                  team={state.team}
                  barbers={barbers}
                  onTeamChange={state.setTeam}
                  today={nowDate}
                  onSelectDay={(date) => {
                    state.setDate(date);
                    state.setView("day");
                  }}
                />
              ) : (
                <QueryBoundary query={day} loading={<GridSkeleton />}>
                  {(data: CalendarDay) =>
                    state.view === "agenda" ? (
                      <CalendarAgendaView date={state.date} team={state.team} day={data} ctx={ctx} onOpenAppointment={openAppointment} onNextStep={(appointment) => ctx.onNextStep?.(appointment)} />
                    ) : (
                      <CalendarDayView
                        date={state.date}
                        team={state.team}
                        day={data}
                        ctx={ctx}
                        now={nowDate}
                        onSlotClick={onSlotClick}
                        onOpenAppointment={openAppointment}
                        onMove={onMove}
                        onResize={onResize}
                        onSeeAll={() => state.setTeam("all")}
                        onConfigureHours={() => navigate("/usuarios")}
                        onViewBarber={(barber: Barber) => navigate(`/usuarios/lista?search=${encodeURIComponent(barber.name)}`)}
                        onBlockBarber={(barber: Barber) => setPanel({ kind: "block", barberId: barber.id })}
                      />
                    )
                  }
                </QueryBoundary>
              )}

              <AppointmentDrawer
                appointment={currentAppointment}
                open={Boolean(currentAppointment)}
                onOpenChange={(open) => !open && state.openAppointment(null)}
                ctx={ctx}
                branchId={branchId}
                onStatus={changeStatus}
                onBarberReady={onBarberReady}
                onPay={(appointment) => setPanel({ kind: "checkout", appointment })}
                onDuration={(appointment, minutes) => patch(appointment, { durationMin: minutes })}
                onCancel={(appointment) => setPanel({ kind: "confirm", action: "cancel", appointment })}
                onNoShow={(appointment) => setPanel({ kind: "confirm", action: "noShow", appointment })}
                onOpenClient={() => navigate("/clientes")}
              />

              <CreateAppointmentDrawer
                open={panel?.kind === "create"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                initial={panel?.kind === "create" ? panel.initial : null}
                now={nowDate}
                onCreated={(appointment) => state.setDate(parseLocal(appointment.start))}
                onCreateClient={() => navigate("/clientes")}
              />

              <CheckoutDrawer
                appointment={panel?.kind === "checkout" ? panel.appointment : null}
                open={panel?.kind === "checkout"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                onPaid={() => undefined}
              />

              <BlockDrawer open={panel?.kind === "block"} onOpenChange={(open) => !open && closePanel()} barbers={barbers} initialBarberId={panel?.kind === "block" ? panel.barberId : null} date={state.date} />

              <CollectionsDrawer
                open={panel?.kind === "collections"}
                onOpenChange={(open) => !open && closePanel()}
                branchId={branchId}
                ctx={ctx}
                initialDate={state.date}
                onOpenAppointment={(appointment, date) => {
                  closePanel();
                  state.setDate(date);
                  state.openAppointment(appointment.id);
                }}
              />

              <WaitlistDrawer open={panel?.kind === "waitlist"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} date={state.date} onSchedule={scheduleFromWaitlist} />

              <QuickSaleDrawer open={panel?.kind === "quickSale"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} />

              <WalkInSaleDrawer
                open={panel?.kind === "walkInSale"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                date={state.date}
                now={nowDate}
                onCreated={(appointment) => {
                  state.setDate(parseLocal(appointment.start));
                  setPanel({ kind: "checkout", appointment });
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
                  patch(confirm.appointment, { status: confirm.action === "cancel" ? "cancelled" : "no_show" }, () => {
                    closePanel();
                    state.openAppointment(null);
                    toast.success(t("calendar.statusChanged"), { description: t("calendar.statusChangedHint", { client: confirmClient, status: t(STATUS_KEYS[confirm.action === "cancel" ? "cancelled" : "no_show"]) }) });
                  });
                }}
              />
            </>
          )
        }
      </QueryBoundary>

      <ShellRailSlot>
        <DataListActionRail actions={railActions} selectedCount={0} onClearSelection={() => undefined} isBlocked={panel !== null || Boolean(currentAppointment)} />
      </ShellRailSlot>
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
