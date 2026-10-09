import * as React from "react";
import { startOfDay } from "date-fns";
import { Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SegmentedControl } from "@/components/selection";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDragScroll } from "@/hooks/useDragScroll";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { personName } from "../../bookingState";
import { dayKeyOf, firstBookableDay, parseStart } from "../../bookingFormat";
import { BarberProfileDrawer } from "../../flow/BarberProfileDrawer";
import { useBookingFlow } from "../../flow/BookingContext";
import { AlternativeBarbers } from "../../flow/AlternativeBarbers";
import { EarliestSlot } from "../../flow/EarliestSlot";
import { PersonPicker } from "../../flow/PersonPicker";
import { WaitlistCard } from "../../flow/WaitlistCard";
import { useAvailabilityQuery, useEarliestQuery } from "../../queries";
import type { BookingBarber, WaitlistJoined } from "../../types";
import { itemDuration, itemPrice } from "../../useBookingTotals";
import { ableBarbers, barberTimes, timesByWindow } from "./agendaModel";
import { BarberLane, TimeWindows } from "./AgendaLanes";
import { AgendaBranchSelect } from "./AgendaBranchSelect";
import { AgendaSelectFields } from "./AgendaSelectFields";
import { DayStrip } from "./DayStrip";

/** Cómo se elige qué se va a hacer: la tira de chips (Agenda abierta) o el campo que abre la carta (Agenda con selector). */
export type ServicePickerMode = "chips" | "modal";

/** Lo de siempre ya está puesto: el atajo sobra. */
const sameServices = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((id) => b.includes(id));

/** Cuántos días se recorren en la tira. */
const DAYS_AHEAD = 21;
const SKELETON_LANES = 3;
type BoardView = "barber" | "time";

/**
 * El tablero de la agenda abierta: lo que se va a hacer arriba (chips, o en la
 * Agenda con selector sede y servicios como campos que abren su lista), el día en una
 * tira y, debajo, las horas libres de todos los barberos a la vez. Una hora se
 * aparta con un toque y cae en «Tu reserva»; quién es el cliente se pregunta
 * después, al confirmar.
 */
export function AgendaBoard({ onNeedSignIn, servicePicker = "chips" }: { onNeedSignIn: () => void; servicePicker?: ServicePickerMode }) {
  const t = useAppT();
  const { state, dispatch, shop, catalog, catalogLoading, fmt, layout, touch } = useBookingFlow();
  const branch = shop.branches.find((item) => item.id === state.branchId);
  const first = React.useMemo(() => (branch ? firstBookableDay(branch.closesAt, shop.minNoticeMinutes) : startOfDay(new Date())), [branch, shop.minNoticeMinutes]);
  const [day, setDay] = React.useState<Date>(first);
  const [view, setView] = React.useState<BoardView>("barber");
  const [profile, setProfile] = React.useState<BookingBarber | null>(null);
  const [waitlist, setWaitlist] = React.useState<Readonly<Record<string, WaitlistJoined>>>({});
  const servicesRow = useDragScroll<HTMLDivElement>();
  const draft = state.draft;
  const serviceIds = draft?.serviceIds ?? [];
  const dayKey = dayKeyOf(day);

  // Al cambiar una cita del carrito, la agenda salta a su día.
  const editingStart = state.editingIndex !== null ? state.items[state.editingIndex]?.start : null;
  const [editingSeen, setEditingSeen] = React.useState(editingStart);
  if (editingStart !== editingSeen) {
    setEditingSeen(editingStart);
    if (editingStart) setDay(startOfDay(parseStart(editingStart)));
  }

  const usualId = state.customer && !state.customer.isNew ? (state.customer.lastVisit?.barberId ?? null) : null;
  const barbers = ableBarbers(catalog?.barbers ?? [], serviceIds, usualId);
  const availability = useAvailabilityQuery({ branchId: state.branchId, date: dayKey, serviceIds, barberId: null });
  const allSlots = availability.data?.date === dayKey ? availability.data.slots : [];
  const isWaiting = availability.isLoading || (availability.isFetching && availability.data?.date !== dayKey);
  const marked = React.useMemo(() => new Set(state.items.map((item) => item.start?.slice(0, 10)).filter((key): key is string => Boolean(key))), [state.items]);
  const services = catalog?.services ?? [];
  const isSelect = servicePicker === "modal";
  // En la Agenda con selector el barbero se elige en su campo: las horas de abajo son solo las suyas.
  const chosenBarber = isSelect ? (barbers.find((barber) => barber.id === draft?.barberId) ?? null) : null;
  const editing = state.editingIndex !== null ? state.items[state.editingIndex] : null;
  const slots = chosenBarber ? allSlots.filter((slot) => slot.barberIds.includes(chosenBarber.id)).map((slot) => ({ ...slot, barberIds: [chosenBarber.id] })) : allSlots;
  const earliest = useEarliestQuery({ branchId: state.branchId, serviceIds, barberId: chosenBarber?.id ?? null });
  const timeLabel = (time: string) => fmt.clock(time);
  // «Lo de siempre»: lo de su última visita, si fue en esta sede y sigue en el catálogo.
  const lastVisit = state.customer && !state.customer.isNew ? state.customer.lastVisit : null;
  const usual = lastVisit && lastVisit.branchId === state.branchId && lastVisit.serviceIds.every((id) => services.some((service) => service.id === id)) ? lastVisit : null;

  const applyUsual = () => usual && dispatch({ type: "openDraft", person: draft?.person ?? { kind: "self" }, serviceIds: usual.serviceIds, barberId: null });

  const pick = (time: string, barberId: string | null) => {
    if (!draft) return;
    const start = `${dayKey}T${time}`;
    dispatch({ type: "chooseBarber", barberId });
    dispatch({ type: "chooseTime", start });
    // En la Agenda con selector la hora queda marcada a la vista (y la reserva, abajo): el aviso sobra.
    if (!isSelect) toast.success(t(editing ? "booking.agenda.moved" : "booking.agenda.added", { when: fmt.when(parseStart(start)) }));
  };

  // Quien tiene horas ese día va primero (el de siempre, delante de todos); los demás quedan al final, apagados.
  const lanes = barbers
    .map((barber) => ({ barber, times: barberTimes(slots, barber.id, dayKey, state.items, state.editingIndex) }))
    .sort((a, b) => Number(b.barber.id === usualId) - Number(a.barber.id === usualId) || Number(b.times.length > 0) - Number(a.times.length > 0));
  // Una sola cita: lo apartado no se descuenta de las horas, se marca (y tocar otra la reemplaza).
  const windows = isSelect ? timesByWindow(slots, dayKey, [], null) : timesByWindow(slots, dayKey, state.items, state.editingIndex);
  const pickedStart = isSelect ? (state.items[0]?.start ?? null) : null;
  const selectedTime = pickedStart?.startsWith(dayKey) ? pickedStart.slice(11, 16) : null;
  const hasSlots = slots.length > 0;
  const boardView: BoardView = isSelect ? "time" : view;
  const waitlistKey = `${dayKey}|any`;
  const nextSlot = earliest.data?.slot ?? null;

  return (
    <div className={cn("flex flex-col gap-6 px-5 pb-8 pt-6", layout === "wide" && "px-8 pt-8")}>
      <header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Heading level={layout === "wide" ? 2 : 3}>{t(isSelect ? "booking.agenda.selectTitle" : "booking.agenda.title")}</Heading>
          <Text tone="secondary">{t(isSelect ? "booking.agenda.selectLead" : "booking.agenda.lead")}</Text>
        </div>
        {servicePicker === "chips" && <AgendaBranchSelect />}
      </header>

      {editing && (
        <Alert variant="info">
          <ThemaIcon name="edit" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("booking.agenda.editing", { name: personName(editing.person, state.customer) || t("booking.person.self") })}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "discardDraft" })}>
              {t("booking.agenda.editingCancel")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isSelect ? (
        <>
          {/* Sin cuenta no hay a quién más elegir: el nombre de quien viene se pide al final, con sus datos. */}
          {state.customer && <PersonPicker />}
          <AgendaSelectFields barbers={barbers} usualId={usualId} onUsual={usual && !editing && !sameServices(usual.serviceIds, serviceIds) ? applyUsual : undefined} />
        </>
      ) : (
        <section aria-labelledby="agenda-what" className="flex flex-col gap-2.5">
          <Text id="agenda-what" size="sm" weight="medium">
            {t("booking.agenda.whatLabel")}
          </Text>
          <div ref={servicesRow} className="-mx-5 -my-1.5 flex gap-2 overflow-x-auto px-5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {usual && !editing && <Chip label={t("booking.agenda.usual")} icon="refresh" tone="primary" onClick={applyUsual} className="shrink-0" />}
            {catalogLoading
              ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-full" />)
              : services.map((service) => (
                  <Chip key={service.id} label={service.name} icon={serviceIds.includes(service.id) ? "check" : undefined} selected={serviceIds.includes(service.id)} onClick={() => dispatch({ type: "toggleService", serviceId: service.id })} className="shrink-0" />
                ))}
          </div>
          {serviceIds.length > 0 && (
            <Text size="xs" tone="muted" tabular>
              {t("booking.agenda.whatSummary", { minutes: itemDuration(serviceIds, catalog), price: fmt.money(itemPrice({ serviceIds, barberId: null }, catalog)) })}
            </Text>
          )}
        </section>
      )}

      {!isSelect && <PersonPicker />}

      {serviceIds.length === 0 ? (
        <EmptyState icon="scissors" title={t("booking.agenda.pickService")} />
      ) : (
        <>
          {!editing && !isSelect && <EarliestSlot />}

          <section aria-labelledby="agenda-when" className="flex flex-col gap-3">
            {isSelect ? (
              <div className="flex min-h-8 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <Text id="agenda-when" size="sm" weight="medium">
                  {t("booking.agenda.whenLabel")}
                </Text>
                <Text size="sm" tone="muted" className="first-letter:uppercase">
                  {fmt.dayLong(day)}
                </Text>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Text id="agenda-when" size="sm" weight="medium">
                  {fmt.dayLong(day)}
                </Text>
                <SegmentedControl
                  options={[
                    { value: "barber", label: t("booking.agenda.byBarber"), icon: Users },
                    { value: "time", label: t("booking.agenda.byTime"), icon: Clock },
                  ]}
                  value={view}
                  onChange={(value) => setView(value as BoardView)}
                  size="sm"
                  ariaLabel={t("booking.agenda.viewLabel")}
                />
              </div>
            )}
            {isSelect && !editing && <EarliestSlot />}
            <DayStrip first={first} count={DAYS_AHEAD} value={day} onChange={setDay} marked={marked} size={touch} />
          </section>

          {isWaiting ? (
            <div className={cn("grid grid-cols-1 gap-3", layout === "wide" && "grid-cols-2")}>
              {Array.from({ length: SKELETON_LANES }, (_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : !hasSlots ? (
            <EmptyState
              icon="calendar"
              title={chosenBarber ? t("booking.agenda.emptyBarberDay", { name: chosenBarber.name.split(" ")[0] ?? chosenBarber.name, day: fmt.dayLong(day) }) : t("booking.agenda.emptyDayTitle", { day: fmt.dayLong(day) })}
              description={chosenBarber ? t("booking.agenda.emptyBarberDayLead") : t("booking.agenda.emptyDayLead")}
              action={
                nextSlot && nextSlot.date !== dayKey ? (
                  <Button type="button" onClick={() => setDay(startOfDay(parseStart(`${nextSlot.date}T00:00`)))}>
                    {t("booking.agenda.jumpTo", { day: fmt.dayShort(parseStart(`${nextSlot.date}T00:00`)) })}
                    <ThemaIcon name="arrowRight" />
                  </Button>
                ) : undefined
              }
            />
          ) : boardView === "barber" ? (
            <div className={cn("grid grid-cols-1 gap-3", layout === "wide" && "grid-cols-2")}>
              {lanes.map(({ barber, times }) => (
                <BarberLane key={barber.id} barber={barber} times={times} isUsual={barber.id === usualId} timeLabel={timeLabel} onPick={(time) => pick(time, barber.id)} onProfile={() => setProfile(barber)} />
              ))}
            </div>
          ) : (
            <TimeWindows groups={windows} timeLabel={timeLabel} withName={chosenBarber?.name.split(" ")[0]} selectedTime={selectedTime} onPick={(time) => pick(time, chosenBarber?.id ?? null)} />
          )}

          {/* El barbero elegido no tiene horas ese día: otros parecidos que sí, con sus primeras horas. */}
          {!isWaiting && chosenBarber && !hasSlots && <AlternativeBarbers day={day} onDayChange={setDay} />}

          {!isWaiting &&
            (state.customer ? (
              <WaitlistCard
                key={waitlistKey}
                day={day}
                hasSlots={hasSlots}
                joined={waitlist[waitlistKey] ?? null}
                onJoinedChange={(joined) => setWaitlist((current) => (joined ? { ...current, [waitlistKey]: joined } : Object.fromEntries(Object.entries(current).filter(([key]) => key !== waitlistKey))))}
              />
            ) : (
              <Button type="button" variant="link" size="sm" className="self-start px-0" onClick={onNeedSignIn}>
                <ThemaIcon name="notification" />
                {t("booking.agenda.waitlistSignIn")}
              </Button>
            ))}
        </>
      )}

      <BarberProfileDrawer
        barber={profile}
        serviceIds={serviceIds}
        onOpenChange={(open) => !open && setProfile(null)}
        onChoose={() => {
          // En la agenda no se elige barbero antes que hora: el perfil vuelve al tablero con sus horas.
          setProfile(null);
          setView("barber");
        }}
      />
    </div>
  );
}
