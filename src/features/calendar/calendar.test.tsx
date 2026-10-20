import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, within, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { RequireAuth } from "@/features/auth";
import { CalendarPage } from "./CalendarPage";
import { CheckoutDrawer } from "./CheckoutDrawer";
import { weekCell, weekStartOf } from "./weekModel";
import { DEFAULT_CARD_PREFS, resetCalendarCardPrefs } from "./calendarCardPrefs";
import { appointmentContextActions } from "./calendarContextActions";
import { appointmentGroups, linkedOf, serviceSlots, visitContinuations, appointmentMarkers, appointmentTotal, barberLoad, blockClashes, followsAgendaRules, isFlexible, lateMinutes, matchesFilters, nextFreeMinute, placementProblem, serviceColor, teamIds, toEvent, visibleBarbers, nextStep, type ModelContext } from "./calendarModel";
import { suggestSlots } from "./slotSuggestions";
import { reflowPlan } from "./reflowModel";
import { dayGaps, gapsSummary } from "./gapsModel";
import { dayPulse } from "./pulseModel";
import { setActionsPlacement } from "@/components/action-rail";
import { appointmentInsights } from "./appointmentInsights";
import { dayBrief, waitlistMatch } from "./dayBrief";
import { parseBookingText } from "./bookingText";
import { appointmentPlaybook } from "./appointmentPlaybook";
import { changeDue, surchargeAmount, tipAmount } from "./checkoutMath";
import { calendarAccess, canRemoveBlock, scopeDay, waitlistInScope } from "./calendarAccess";
import { blockContextActions } from "./calendarContextActions";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import type { Appointment, Barber, CalendarCatalog, TimeBlock } from "./types";

/** Viernes 25 de septiembre de 2026, a media mañana. Fecha fija: la agenda no depende del reloj. */
const NOW = new Date(2026, 8, 25, 10, 20);

/** Sin rol, el calendario se mira como el dueño (sin `AccessProvider`); con rol, como esa persona. */
function mount(route = "/calendario", role?: TeamRole) {
  db.sessions.set("mock-acc_admin-test", "acc_admin");
  const page = <CalendarPage now={NOW} />;
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/calendario" element={role ? <AccessProvider value={buildAccess({ role })}>{page}</AccessProvider> : page} />
      </Route>
    </Routes>,
    { route, token: "mock-acc_admin-test" }
  );
}

const BARBER: Barber = {
  id: "b1",
  branchId: "ma",
  name: "Andrés Beltrán",
  avatarUrl: null,
  level: "master",
  workingHours: { "5": [{ start: "09:00", end: "19:00" }] },
  acceptsWalkIns: true,
};

const CATALOG: CalendarCatalog = {
  barbers: [BARBER, { ...BARBER, id: "b2", name: "Tomás Peña", workingHours: {} }],
  clients: [{ id: "c1", name: "Marcela Gómez", phone: "+57 300", type: "vip", visits: 31, cancellations: 8, noShows: 0, lastVisitAt: null, preferredBarberId: "b1", visitEveryDays: 7, notes: [] }],
  services: [{ id: "s1", name: "Corte clásico", category: "Cortes", durationMin: 30, price: 35 }],
  products: [],
};

const APPOINTMENT: Appointment = {
  id: "a1",
  branchId: "ma",
  clientId: "c1",
  barberId: "b1",
  requestedBarberId: "b1",
  serviceIds: ["s1"],
  products: [],
  start: "2026-09-25T10:30:00",
  durationMin: 30,
  status: "scheduled",
  barberReady: false,
  walkIn: false,
  source: "internal",
  repeat: "none",
  seriesId: null,
  notes: null,
  createdAt: "2026-09-20T10:00:00.000Z",
  createdBy: "Lucía",
  history: [],
  payment: null,
};

const ctx: ModelContext = { t: (key) => key, intl: "es-CO", formatMoney: (value) => `$${value}`, catalog: CATALOG };

describe("modelo del calendario", () => {
  test("las citas enlazadas forman un grupo con su color, sea cual sea el barbero o la hora", () => {
    const second = { ...APPOINTMENT, id: "a2", start: "2026-09-25T11:00:00", linkId: "L1" };
    const family = { ...APPOINTMENT, id: "a3", barberId: "b2", start: "2026-09-25T10:30:00", linkId: "L1" };
    const other = [{ ...APPOINTMENT, id: "b1", start: "2026-09-25T14:00:00", linkId: "L2" }, { ...APPOINTMENT, id: "b2", start: "2026-09-25T15:00:00", linkId: "L2" }];
    // Pegada a la anterior del mismo cliente, pero sin enlace: va suelta.
    const neighbour = { ...APPOINTMENT, id: "a4", start: "2026-09-25T11:30:00" };
    const groups = appointmentGroups([{ ...APPOINTMENT, linkId: "L1" }, second, family, neighbour, ...other]);
    expect(groups.get("a1")).toEqual({ id: "L1", index: 1, size: 3, color: 1 });
    expect(groups.get("a3")).toMatchObject({ id: "L1", index: 2 });
    expect(groups.get("a2")).toMatchObject({ id: "L1", index: 3 });
    // Cada grupo con su color: así se distinguen en la agenda.
    expect(groups.get("b1")).toMatchObject({ id: "L2", color: 2 });
    expect(groups.has("a4")).toBe(false);
  });

  test("la segunda parte de una visita enlazada no pide «Ingresar»; otra persona del grupo sí", () => {
    const first = { ...APPOINTMENT, linkId: "L1" };
    const second = { ...APPOINTMENT, id: "a2", start: "2026-09-25T11:00:00", linkId: "L1" };
    const family = { ...APPOINTMENT, id: "a3", clientId: "c2", barberId: "b2", start: "2026-09-25T10:30:00", linkId: "L1" };
    const continuations = visitContinuations([first, second, family]);
    expect([...continuations]).toEqual(["a2"]);
    const stepCtx = { ...ctx, onNextStep: () => {} };
    expect(toEvent(first, stepCtx, { continuesVisit: continuations.has("a1") }).action).toBeDefined();
    expect(toEvent(second, stepCtx, { continuesVisit: continuations.has("a2") }).action).toBeUndefined();
    expect(toEvent({ ...second, status: "seated" }, stepCtx, { continuesVisit: true }).action).toBeDefined();
    expect(toEvent(family, stepCtx, { continuesVisit: continuations.has("a3") }).action).toBeDefined();
  });

  test("una cita con varios servicios se parte en tramos por dentro, sin ser un grupo", () => {
    const catalog: CalendarCatalog = { ...CATALOG, services: [...CATALOG.services, { id: "s2", name: "Arreglo de barba", category: "Barba", durationMin: 30, price: 30 }] };
    const combo = { ...APPOINTMENT, serviceIds: ["s1", "s2"], durationMin: 60 };
    const slots = serviceSlots(catalog, combo);
    expect(slots.map((slot) => [slot.service.id, slot.minutes, slot.start.getHours(), slot.start.getMinutes()])).toEqual([
      ["s1", 30, 10, 30],
      ["s2", 30, 11, 0],
    ]);
    // Estirada a mano a 90 minutos, cada tramo crece en proporción.
    expect(serviceSlots(catalog, { ...combo, durationMin: 90 }).map((slot) => slot.minutes)).toEqual([45, 45]);
    const event = toEvent(combo, { ...ctx, catalog });
    expect(event.segments?.map((segment) => segment.minutes)).toEqual([30, 30]);
    expect(event.meta).toBe("$65");
    expect(event.group).toBeUndefined();
    // Con un solo servicio no hay tramos.
    expect(toEvent(APPOINTMENT, ctx).segments).toBeUndefined();
    expect(appointmentGroups([combo]).size).toBe(0);
    // Cada tramo lleva el color de su servicio.
    expect(event.segments?.every((segment) => segment.color !== undefined)).toBe(true);
  });

  test("linkedOf trae el grupo en orden; desenlazada o anulada, la cita va suelta", () => {
    const second = { ...APPOINTMENT, id: "a2", start: "2026-09-25T11:00:00", linkId: "L1" };
    const third = { ...APPOINTMENT, id: "a3", start: "2026-09-25T11:30:00", linkId: "L1" };
    const first = { ...APPOINTMENT, linkId: "L1" };
    expect(linkedOf([third, first, second], second).map((item) => item.id)).toEqual(["a1", "a2", "a3"]);
    expect(linkedOf([first, { ...second, linkId: null }], first)).toEqual([]);
    expect(appointmentGroups([first, { ...second, status: "cancelled" }]).size).toBe(0);
  });

  test("el filtro de equipo deja a los que trabajan, a todos o a uno", () => {
    const date = new Date(2026, 8, 25);
    expect(visibleBarbers(CATALOG.barbers, "working", date).map((barber) => barber.id)).toEqual(["b1"]);
    expect(visibleBarbers(CATALOG.barbers, "all", date)).toHaveLength(2);
    expect(visibleBarbers(CATALOG.barbers, "b2", date).map((barber) => barber.id)).toEqual(["b2"]);
    // Varios barberos a la vez viajan separados por comas.
    expect(teamIds("b2,b1")).toEqual(["b2", "b1"]);
    expect(teamIds("working")).toEqual([]);
    expect(visibleBarbers(CATALOG.barbers, "b1,b2", date).map((barber) => barber.id)).toEqual(["b1", "b2"]);
  });

  test("una cita se traduce a un evento con el cliente, el servicio y el siguiente paso", () => {
    const event = toEvent(APPOINTMENT, { ...ctx, onNextStep: () => undefined });
    expect(event.title).toBe("Marcela Gómez");
    expect(event.subtitle).toBe("Corte clásico · $35");
    expect(event.badge?.label).toBe("calendar.clientType.vip");
    expect(event.action?.label).toBe("calendar.step.checkIn");
    expect(event.end.getHours()).toBe(11);
    expect(toEvent({ ...APPOINTMENT, status: "cancelled" }, ctx).muted).toBe(true);
  });

  test("la vista decide de qué se tiñe la tarjeta: nada, su servicio o su estado", () => {
    const neutral = toEvent(APPOINTMENT, ctx);
    expect(neutral.fill).toBe("neutral");
    expect(neutral.tone).toBe("neutral");

    const byService = toEvent(APPOINTMENT, { ...ctx, colorBy: "service" });
    expect(byService.fill).toBe("category");
    expect(byService.color).toBe(neutral.color);

    const late = toEvent(APPOINTMENT, { ...ctx, colorBy: "status", now: new Date(2026, 8, 25, 10, 42) });
    expect(late.fill).toBe("tone");
    expect(late.tone).toBe("negative");
    expect(toEvent({ ...APPOINTMENT, status: "paid" }, { ...ctx, colorBy: "status" }).tone).toBe("positive");

    const byClient = toEvent(APPOINTMENT, { ...ctx, colorBy: "client" });
    expect(byClient.fill).toBe("tone");
    expect(byClient.tone).toBe("primary");
  });

  test("los ajustes de la vista deciden qué cuenta la tarjeta y qué iconos lleva", () => {
    const card = { ...DEFAULT_CARD_PREFS, price: false, time: false, clientType: false, nextStep: false };
    const event = toEvent(APPOINTMENT, { ...ctx, card, onNextStep: () => undefined });
    expect(event.subtitle).toBe("Corte clásico");
    expect(event.hideTime).toBe(true);
    expect(event.badge).toBeUndefined();
    expect(event.action).toBeUndefined();

    // Una nota en la ficha sale con su icono si está encendido; la alergia no cuenta, ya avisa sola.
    const noted: CalendarCatalog = { ...CATALOG, clients: [{ ...CATALOG.clients[0], notes: [{ id: "n1", kind: "note", text: "Prefiere tijera", createdAt: "2026-01-01" }] }] };
    expect(toEvent(APPOINTMENT, { ...ctx, catalog: noted, card: DEFAULT_CARD_PREFS }).markers?.map((marker) => marker.label)).toContain("calendar.marker.clientNote");
    expect(toEvent(APPOINTMENT, { ...ctx, catalog: noted, card: { ...DEFAULT_CARD_PREFS, notes: false } }).markers?.some((marker) => marker.id === "note")).toBe(false);
    // Sin ajustes (otras pantallas) la tarjeta no lleva iconos.
    expect(toEvent(APPOINTMENT, { ...ctx, catalog: noted }).markers).toEqual([]);
  });

  test("los avisos que no pueden ser ciertos a la vez no salen juntos", () => {
    const newcomer = { ...CATALOG.clients[0], type: "new" as const, visits: 1 };
    const icons = (appointment: Appointment, client = CATALOG.clients[0]) => appointmentMarkers(appointment, client, ctx).map((marker) => marker.id);
    // La primera visita de alguien no es una cita que se repite.
    expect(icons({ ...APPOINTMENT, repeat: "weekly" }, newcomer)).toContain("new");
    expect(icons({ ...APPOINTMENT, repeat: "weekly" }, newcomer)).not.toContain("repeat");
    // Un nuevo con historia ya no es primera visita.
    expect(icons(APPOINTMENT, { ...newcomer, visits: 2 })).not.toContain("new");
    // Quien llega sin cita no reservó online ni tiene serie.
    const walkIn = icons({ ...APPOINTMENT, walkIn: true, source: "online", repeat: "weekly" });
    expect(walkIn).toContain("walkIn");
    expect(walkIn).not.toContain("online");
    expect(walkIn).not.toContain("repeat");
    // Un cliente con historia que reservó sí puede repetir.
    expect(icons({ ...APPOINTMENT, repeat: "weekly" })).toContain("repeat");
  });

  test("el clic derecho de una cita ofrece lo que toca según en qué va, con lo irreversible al final", () => {
    const handlers = { open: vi.fn(), run: vi.fn(), openClient: vi.fn() };
    const upcoming = appointmentContextActions(APPOINTMENT, { ...ctx, now: new Date(2026, 8, 25, 10, 0) }, handlers);
    const ids = upcoming.map((action) => action.id);
    expect(ids[0]).toBe("open");
    expect(ids).toContain("checkIn");
    expect(ids).toContain("client");
    expect(ids).not.toContain("edit");
    expect(upcoming.slice(-2).map((action) => action.tone)).toEqual(["danger", "danger"]);
    upcoming.find((action) => action.id === "checkIn")?.onSelect?.();
    expect(handlers.run).toHaveBeenCalledWith("checkIn", APPOINTMENT);

    const seated = appointmentContextActions({ ...APPOINTMENT, status: "seated" }, { ...ctx, now: new Date(2026, 8, 25, 10, 40) }, handlers).map((action) => action.id);
    expect(seated).toContain("pay");
    expect(seated).not.toContain("checkIn");
  });

  test("el tipo de cliente filtra la agenda junto con estado y servicio", () => {
    const at = new Date(2026, 8, 25, 10, 0);
    expect(matchesFilters(APPOINTMENT, { stages: [], serviceIds: [], clientTypes: ["vip"] }, at, CATALOG)).toBe(true);
    expect(matchesFilters(APPOINTMENT, { stages: [], serviceIds: [], clientTypes: ["new", "frequent"] }, at, CATALOG)).toBe(false);
    // Sin catálogo el tipo no se puede saber y ese filtro no se aplica.
    expect(matchesFilters(APPOINTMENT, { stages: [], serviceIds: [], clientTypes: ["new"] }, at)).toBe(true);
  });

  test("una cita sin ingresar va tarde a partir de cinco minutos, y solo el mismo día", () => {
    expect(lateMinutes(APPOINTMENT, new Date(2026, 8, 25, 10, 33))).toBeNull();
    expect(lateMinutes(APPOINTMENT, new Date(2026, 8, 25, 10, 42))).toBe(12);
    expect(lateMinutes({ ...APPOINTMENT, status: "arrived" }, new Date(2026, 8, 25, 10, 42))).toBeNull();
    expect(lateMinutes(APPOINTMENT, new Date(2026, 8, 26, 10, 42))).toBeNull();
    expect(toEvent(APPOINTMENT, { ...ctx, now: new Date(2026, 8, 25, 10, 42) }).status).toEqual({ label: "calendar.card.late", tone: "negative" });
  });

  test("la alerta de la tarjeta queda para lo que cambia el servicio", () => {
    const fresh: CalendarCatalog = { ...CATALOG, clients: [{ ...CATALOG.clients[0], type: "new" }] };
    expect(toEvent({ ...APPOINTMENT, requestedBarberId: null }, { ...ctx, catalog: fresh }).warning).toBeUndefined();
    const allergic: CalendarCatalog = { ...CATALOG, clients: [{ ...CATALOG.clients[0], notes: [{ id: "n1", kind: "allergy", text: "Látex", createdAt: "2026-01-01" }] }] };
    expect(toEvent(APPOINTMENT, { ...ctx, catalog: allergic }).warning).toBe("calendar.card.warning.allergy");
  });

  test("el próximo hueco salta lo ocupado y la carga mide la jornada reservada", () => {
    const date = new Date(2026, 8, 25);
    expect(nextFreeMinute(BARBER, date, [APPOINTMENT], [], 10 * 60 + 20)).toBe(11 * 60);
    expect(nextFreeMinute(BARBER, date, [], [], 10 * 60 + 20)).toBe(10 * 60 + 30);
    expect(nextFreeMinute(BARBER, date, [], [], 19 * 60)).toBeNull();
    expect(barberLoad(BARBER, date, [APPOINTMENT])).toBeCloseTo(0.05);
  });

  test("el pulso reparte las citas por estado y suma lo cobrado y lo previsto", () => {
    const now = new Date(2026, 8, 25, 10, 42);
    const paid: Appointment = { ...APPOINTMENT, id: "a2", status: "paid", payment: { method: "cash", tip: 5, tax: 0, total: 40, paidAt: "2026-09-25T09:30:00" } };
    const later: Appointment = { ...APPOINTMENT, id: "a3", start: "2026-09-25T15:00:00" };
    const gone: Appointment = { ...APPOINTMENT, id: "a4", status: "cancelled" };
    const pulse = dayPulse([APPOINTMENT, paid, later, gone], CATALOG, now);
    expect(pulse.counts).toEqual({ late: 1, toCollect: 0, waiting: 0, seated: 0, upcoming: 1, paid: 1 });
    // En silla con el servicio ya terminado: lista para cobrar.
    expect(dayPulse([{ ...APPOINTMENT, status: "seated" }], CATALOG, new Date(2026, 8, 25, 11, 30)).counts.toCollect).toBe(1);
    expect(dayPulse([{ ...APPOINTMENT, status: "seated" }], CATALOG, new Date(2026, 8, 25, 10, 45)).counts.seated).toBe(1);
    expect(pulse.collected).toBe(40);
    expect(pulse.expected).toBe(110);
  });

  test("las sugerencias salen del historial: riesgo de falta, complemento y próxima visita", () => {
    const services = [...CATALOG.services, { id: "s2", name: "Cejas", category: "Extras", durationMin: 15, price: 12 }];
    const flaky = { ...CATALOG.clients[0], type: "retained" as const, visits: 6, noShows: 2, cancellations: 1, visitEveryDays: 21 };
    const insights = appointmentInsights(APPOINTMENT, flaky, { ...CATALOG, services });
    expect(insights.map((item) => item.id)).toEqual(["noShowRisk", "upsell", "rebook"]);
    expect(insights[0].params).toEqual({ count: 3, total: 9 });
    expect(insights[1].action).toEqual({ kind: "addService", serviceId: "s2" });
    expect(insights[2].date?.getDate()).toBe(16);
    // Cobrada ya no se le ofrece nada que atender, solo la próxima visita.
    expect(appointmentInsights({ ...APPOINTMENT, status: "paid" }, flaky, { ...CATALOG, services }).map((item) => item.id)).toEqual(["rebook"]);
    // A alguien de paso no se le conoce historial.
    expect(appointmentInsights(APPOINTMENT, undefined, CATALOG)).toEqual([]);
  });

  test("el cobro calcula propina, recargo por tarjeta y vuelto", () => {
    expect(tipAmount({ id: "a", type: "percent", value: 15 }, 57)).toBe(8.55);
    expect(tipAmount({ id: "b", type: "amount", value: 5 }, 57)).toBe(5);
    const fee = { enabled: true, name: "Recargo", rate: 3, type: "percent" as const };
    expect(surchargeAmount(fee, "card", 100)).toBe(3);
    expect(surchargeAmount(fee, "cash", 100)).toBe(0);
    expect(surchargeAmount({ ...fee, enabled: false }, "card", 100)).toBe(0);
    expect(changeDue(null, 57)).toBeNull();
    expect(changeDue(60, 57)).toBe(3);
    expect(changeDue(50, 57)).toBe(-7);
  });

  test("el resumen del día avisa de lo tarde, de quien le sobra agenda y de los VIP", () => {
    const date = new Date(2026, 8, 25);
    const lines = dayBrief({ date: "2026-09-25", appointments: [APPOINTMENT], blocks: [] }, CATALOG, date, new Date(2026, 8, 25, 10, 42));
    expect(lines.map((line) => line.id)).toEqual(["late", "idle", "vip"]);
    expect(lines[1].params).toEqual({ name: "Andrés", hours: 9.5 });
    expect(dayBrief({ date: "2026-09-25", appointments: [], blocks: [] }, { ...CATALOG, barbers: [] }, date, undefined)).toEqual([]);
  });

  test("a quien espera se le ofrece el primer hueco en que cabe su servicio desde la hora que pidió", () => {
    const date = new Date(2026, 8, 25);
    const entry = { id: "w1", branchId: "ma", clientId: "c1", serviceId: "s1", barberId: null, slots: [{ date: "2026-09-25", time: "10:30" }], createdAt: "" };
    const match = waitlistMatch(entry, { appointments: [APPOINTMENT], blocks: [] }, CATALOG, date, new Date(2026, 8, 25, 9, 0));
    expect(match?.barber.id).toBe("b1");
    expect(match?.start.getHours()).toBe(11);
    // Si no pidió este día, no hay nada que ofrecerle hoy.
    expect(waitlistMatch({ ...entry, slots: [{ date: "2026-09-26", time: "10:30" }] }, { appointments: [], blocks: [] }, CATALOG, date, undefined)).toBeNull();
  });

  test("la semana empieza en lunes y cada celda dice cuánto tiene reservado el barbero", () => {
    const friday = new Date(2026, 8, 25);
    expect(weekStartOf(friday).getDate()).toBe(21);
    expect(weekCell(BARBER, friday, { date: "2026-09-25", appointments: [APPOINTMENT], blocks: [] })).toEqual({ load: 0.05, count: 1 });
    // El sábado no tiene horario: la celda es «no trabaja», salvo que la semana traiga una excepción.
    const saturday = new Date(2026, 8, 26);
    expect(weekCell(BARBER, saturday, { date: "2026-09-26", appointments: [], blocks: [] }).load).toBeNull();
    expect(weekCell(BARBER, saturday, { date: "2026-09-26", appointments: [], blocks: [], hours: { b1: [{ start: "10:00", end: "14:00" }] } }).load).toBe(0);
  });

  test("un bloqueo avisa de las citas vivas que pisa", () => {
    expect(blockClashes([APPOINTMENT], "b1", 10 * 60, 11 * 60)).toBe(1);
    expect(blockClashes([APPOINTMENT], "b1", 11 * 60, 12 * 60)).toBe(0);
    expect(blockClashes([APPOINTMENT], "b2", 10 * 60, 11 * 60)).toBe(0);
    expect(blockClashes([{ ...APPOINTMENT, status: "paid" }], "b1", 10 * 60, 11 * 60)).toBe(0);
  });

  test("una cita escrita se entiende: cliente, servicio, barbero, día y hora", () => {
    const now = new Date(2026, 8, 25, 10, 20); // viernes
    const full = parseBookingText("Corte para Marcela mañana a las 4 con Andrés", CATALOG, now);
    expect(full.initial).toMatchObject({ clientId: "c1", serviceId: "s1", barberId: "b1" });
    expect(full.when).toEqual(new Date(2026, 8, 26, 16, 0));
    // Con «a. m.», minutos y día de la semana.
    expect(parseBookingText("marcela gómez el lunes a las 9:30 am", CATALOG, now).when).toEqual(new Date(2026, 8, 28, 9, 30));
    expect(parseBookingText("corte clásico hoy a las 11 y media", CATALOG, now).when).toEqual(new Date(2026, 8, 25, 11, 30));
    // «Por la mañana» no es «mañana»; sin hora no hay fecha que proponer.
    expect(parseBookingText("corte para Marcela por la mañana", CATALOG, now).when).toBeUndefined();
    // El nombre que va después de «con» es el barbero, no el cliente.
    const onlyBarber = parseBookingText("algo con Andrés", CATALOG, now);
    expect(onlyBarber.initial.barberId).toBe("b1");
    expect(onlyBarber.initial.clientId).toBeUndefined();
    expect(parseBookingText("xyz", CATALOG, now).initial).toEqual({ clientId: undefined, serviceId: undefined, barberId: undefined, start: undefined });
  });

  test("la acción principal de una cita cambia con su estado", () => {
    const at = (h: number, m: number) => new Date(2026, 8, 25, h, m);
    const phone = { hasPhone: true };
    // Tarde: primero saber si viene.
    expect(appointmentPlaybook(APPOINTMENT, at(10, 45), phone)).toMatchObject({ stage: "late", primary: ["call", "message", "checkIn"] });
    expect(appointmentPlaybook(APPOINTMENT, at(10, 45), { hasPhone: false }).primary).toEqual(["checkIn"]);
    expect(appointmentPlaybook(APPOINTMENT, at(10, 0), phone)).toMatchObject({ stage: "upcoming", primary: ["checkIn"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "arrived" }, at(10, 35), phone)).toMatchObject({ stage: "waiting", primary: ["seat"], secondary: ["ready", "pay", "edit"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "arrived", barberReady: true }, at(10, 35), phone).secondary).toEqual(["pay", "edit"]);
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "seated" }, at(10, 40), phone)).toMatchObject({ stage: "seated", primary: ["pay"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "seated" }, at(11, 10), phone).stage).toBe("toCollect");
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "paid" }, at(12, 0), phone)).toMatchObject({ stage: "paid", primary: ["rebook"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "no_show" }, at(12, 0), phone)).toMatchObject({ stage: "noShow", primary: ["rebook"], secondary: ["call", "message"] });
  });

  test("una cita no cabe si pisa a otra, a un bloqueo o cae fuera de horario", () => {
    const date = new Date(2026, 8, 25);
    const lunch = { id: "k1", branchId: "ma", barberId: "b1", category: "lunch" as const, repeat: "none" as const, startDate: "2026-09-25", endDate: "2026-09-25", startTime: "13:00", endTime: "14:00", description: null };
    const day = { appointments: [APPOINTMENT], blocks: [lunch] };
    expect(placementProblem(day, BARBER, date, 10 * 60 + 45, 11 * 60 + 15)).toMatchObject({ kind: "appointment" });
    expect(placementProblem(day, BARBER, date, 13 * 60 + 30, 14 * 60 + 30)).toMatchObject({ kind: "block" });
    expect(placementProblem(day, BARBER, date, 18 * 60 + 45, 19 * 60 + 15)).toEqual({ kind: "offHours" });
    expect(placementProblem(day, BARBER, date, 11 * 60, 11 * 60 + 30)).toBeNull();
    // La propia cita no se pisa a sí misma al moverse, y una anulada no ocupa sitio.
    expect(placementProblem(day, BARBER, date, 10 * 60 + 45, 11 * 60 + 15, "a1")).toBeNull();
    expect(placementProblem({ appointments: [{ ...APPOINTMENT, status: "cancelled" }], blocks: [] }, BARBER, date, 10 * 60 + 30, 11 * 60)).toBeNull();
  });

  test("la tarjeta lleva el color del servicio y dice en qué va la cita", () => {
    const services = [...CATALOG.services, { id: "s2", name: "Arreglo de barba", category: "Barba", durationMin: 30, price: 30 }];
    const catalog = { ...CATALOG, services };
    const at = (h: number, m: number) => new Date(2026, 8, 25, h, m);
    const live = (appointment: Appointment, now: Date) => toEvent(appointment, { ...ctx, catalog, now, onNextStep: () => undefined });
    // Cada servicio tiene su color, y no cambia cuando la cita avanza.
    expect(serviceColor(catalog, "s1")).toBe(1);
    expect(serviceColor(catalog, "s2")).toBe(2);
    expect(live(APPOINTMENT, at(10, 0)).color).toBe(1);
    expect(live({ ...APPOINTMENT, status: "seated" }, at(10, 40)).color).toBe(1);
    expect(live({ ...APPOINTMENT, serviceIds: ["s2"] }, at(10, 0)).color).toBe(2);
    expect(live({ ...APPOINTMENT, status: "cancelled" }, at(10, 0)).color).toBeUndefined();
    // Agendada no lleva píldora —su botón («Ingresar») ya lo dice—; la que terminó sin cobrar sí, en ámbar.
    expect(live(APPOINTMENT, at(10, 0)).status).toBeUndefined();
    expect(live(APPOINTMENT, at(10, 0)).action?.label).toBe("calendar.step.checkIn");
    expect(live({ ...APPOINTMENT, status: "seated" }, at(11, 10)).status).toEqual({ label: "calendar.card.unpaidSince", tone: "warning" });
    expect(live({ ...APPOINTMENT, status: "seated" }, at(11, 10)).action?.label).toBe("calendar.step.pay");
    expect(live(APPOINTMENT, at(10, 45)).status).toEqual({ label: "calendar.card.late", tone: "negative" });
    expect(live({ ...APPOINTMENT, status: "arrived" }, at(10, 35)).status?.label).toBe("calendar.live.waiting");
    expect(live({ ...APPOINTMENT, status: "seated" }, at(10, 40)).status?.label).toBe("calendar.live.seated");
    expect(live({ ...APPOINTMENT, status: "paid" }, at(12, 0)).status).toEqual({ label: "calendar.live.paidAmount", tone: "positive" });
    // Una cita con venta de productos lo cuenta y suma su precio.
    const withProduct = { ...catalog, products: [{ id: "p1", name: "Cera mate", category: "Styling", price: 18 }] };
    expect(toEvent({ ...APPOINTMENT, products: [{ productId: "p1", qty: 2 }] }, { ...ctx, catalog: withProduct }).subtitle).toBe("Corte clásico · calendar.card.products · $71");
    expect(appointmentTotal(withProduct, { ...APPOINTMENT, products: [{ productId: "p1", qty: 2 }] })).toBe(71);
    // Los filtros se suman: varios estados y varios servicios a la vez; sin marcas pasa todo.
    expect(matchesFilters(APPOINTMENT, { stages: [], serviceIds: [] }, at(10, 0))).toBe(true);
    expect(matchesFilters(APPOINTMENT, { stages: ["paid", "upcoming"], serviceIds: ["s1", "s2"] }, at(10, 0))).toBe(true);
    expect(matchesFilters(APPOINTMENT, { stages: ["paid"], serviceIds: [] }, at(10, 0))).toBe(false);
    expect(matchesFilters(APPOINTMENT, { stages: [], serviceIds: ["s2"] }, at(10, 0))).toBe(false);
    // Quién es va en la etiqueta; los iconos de detalle solo viajan si los ajustes de la vista los piden.
    expect(live(APPOINTMENT, at(10, 0)).badge?.label).toBe("calendar.clientType.vip");
    expect(live(APPOINTMENT, at(10, 0)).markers).toEqual([]);
    expect(appointmentMarkers({ ...APPOINTMENT, source: "online", notes: "Trae foto" }, CATALOG.clients[0], ctx).map((marker) => marker.icon)).toEqual(["online", "requested", "note"]);
    expect(isFlexible({ ...APPOINTMENT, requestedBarberId: null })).toBe(true);
    expect(isFlexible({ ...APPOINTMENT, requestedBarberId: null, status: "arrived" })).toBe(false);
  });

  test("los barberos (comisión y renta) agendan con reglas; dueño, administrador y recepción pueden forzar", () => {
    for (const role of ["barbero-comision", "barbero-renta"] as const) {
      expect(followsAgendaRules(buildAccess({ role }))).toBe(true);
      expect(calendarAccess(buildAccess({ role })).canForce).toBe(false);
    }
    for (const role of ["owner", "admin", "recepcion"] as const) {
      expect(followsAgendaRules(buildAccess({ role }))).toBe(false);
      expect(calendarAccess(buildAccess({ role })).canForce).toBe(true);
    }
    // Sin marco (la doc, piezas sueltas) no se inventan restricciones.
    expect(ctx.access).toBeUndefined();
  });

  test("solo el barbero de comisión ve candados tras ingresar y no restringe clientes", () => {
    const comision = calendarAccess(buildAccess({ role: "barbero-comision" }));
    expect(comision.locksAfterCheckIn).toBe(true);
    expect(comision.canRestrictClients).toBe(false);
    for (const role of ["owner", "admin", "recepcion", "barbero-renta"] as const) {
      const access = calendarAccess(buildAccess({ role }));
      expect(access.locksAfterCheckIn).toBe(false);
      expect(access.canRestrictClients).toBe(true);
    }
  });

  test("cada rol ve lo suyo: columna, bloqueos, cifras y contacto del cliente", () => {
    const comision = calendarAccess(buildAccess({ role: "barbero-comision" }));
    const renta = calendarAccess(buildAccess({ role: "barbero-renta" }));
    const recepcion = calendarAccess(buildAccess({ role: "recepcion" }));
    const owner = calendarAccess(buildAccess({ role: "owner" }));
    expect(comision.ownBarberId).toBe("team-04");
    expect(renta.ownBarberId).toBe("team-30");
    expect(recepcion.ownBarberId).toBeNull();
    // El de comisión solo ve los bloqueos; el de renta bloquea su agenda y solo la suya.
    expect(comision.canCreateBlock).toBe(false);
    expect(renta.canCreateBlock).toBe(true);
    const own: TimeBlock = { id: "blk", branchId: "ma", barberId: "team-30", category: "lunch", repeat: "none", startDate: "2026-09-25", endDate: "2026-09-25", startTime: "13:00", endTime: "14:00", description: null };
    expect(canRemoveBlock(renta, own)).toBe(true);
    expect(canRemoveBlock(renta, { ...own, barberId: "team-05" })).toBe(false);
    expect(canRemoveBlock(comision, { ...own, barberId: "team-04" })).toBe(false);
    expect(blockContextActions({ ...own, barberId: "team-04" }, { ...ctx, access: comision }, () => undefined)).toEqual([]);
    expect(blockContextActions(own, { ...ctx, access: recepcion }, () => undefined)).toHaveLength(1);
    // Recepción cobra pero sin cifras del día; los barberos ven las suyas.
    expect(recepcion.showTotals).toBe(false);
    expect(comision.showTotals && renta.showTotals && owner.showTotals).toBe(true);
    // Sin «Información del cliente» no se ofrece llamar ni escribir.
    expect(comision.canContact).toBe(false);
    expect(recepcion.canContact).toBe(true);
    const late = { ...APPOINTMENT, start: "2026-09-25T09:30:00" };
    const lateCtx = { ...ctx, now: NOW };
    const ids = (access: typeof owner) => appointmentContextActions(late, { ...lateCtx, access }, { open: () => undefined, run: () => undefined, openClient: () => undefined }).map((action) => action.id);
    expect(ids(recepcion)).toEqual(expect.arrayContaining(["call", "message"]));
    expect(ids(comision)).not.toEqual(expect.arrayContaining(["call"]));
    expect(ids(comision)).not.toContain("message");
  });

  test("con alcance propio el día y la lista de espera se recortan a lo suyo", () => {
    const day = { date: "2026-09-25", appointments: [APPOINTMENT, { ...APPOINTMENT, id: "a2", barberId: "b2" }], blocks: [] };
    expect(scopeDay(day, "b1").appointments.map((item) => item.id)).toEqual(["a1"]);
    expect(scopeDay(day, null)).toBe(day);
    expect(waitlistInScope({ barberId: null }, "b1")).toBe(true);
    expect(waitlistInScope({ barberId: "b2" }, "b1")).toBe(false);
    expect(waitlistInScope({ barberId: "b2" }, null)).toBe(true);
  });

  test("los huecos del día dicen qué cabe, cuánto suman y a quién de la lista de espera ofrecerlos", () => {
    const date = new Date(2026, 8, 25);
    const lunch = { id: "k1", branchId: "ma", barberId: "b1", category: "lunch" as const, repeat: "none" as const, startDate: "2026-09-25", endDate: "2026-09-25", startTime: "13:00", endTime: "14:00", description: null };
    const entry = { id: "w1", branchId: "ma", clientId: "c1", serviceId: "s1", barberId: null, slots: [{ date: "2026-09-25", time: "11:00" }], createdAt: "" };
    const gaps = dayGaps({ day: { appointments: [APPOINTMENT], blocks: [lunch] }, catalog: CATALOG, barbers: CATALOG.barbers, date, now: new Date(2026, 8, 25, 10, 20), waitlist: [entry], minMinutes: 30 });
    // Andrés: de 11:00 a 13:00 y de 14:00 a 19:00. Lo de antes de las 10:30 no llega a media hora; Tomás no trabaja.
    expect(gaps.map((gap) => [gap.barber.id, gap.start.getHours(), gap.minutes])).toEqual([["b1", 11, 120], ["b1", 14, 300]]);
    expect(gaps[0].fits[0].id).toBe("s1");
    expect(gaps[0].waitlist.map((item) => item.id)).toEqual(["w1"]);
    expect(gapsSummary(gaps)).toEqual({ count: 2, minutes: 420, potential: 70, withWaitlist: 2 });
    // Otro día no hay «ahora»: la jornada entera cuenta, y quien pidió el 25 no espera el 26.
    expect(dayGaps({ day: { appointments: [], blocks: [] }, catalog: CATALOG, barbers: [{ ...BARBER, workingHours: { "6": [{ start: "09:00", end: "12:00" }] } }], date: new Date(2026, 8, 26), waitlist: [entry] })[0]).toMatchObject({ minutes: 180, waitlist: [] });
  });

  test("los huecos sugeridos prefieren al barbero pedido y lo que no deja ratos muertos", () => {
    const date = new Date(2026, 8, 25);
    const other: Barber = { ...BARBER, id: "b3", name: "Lorena Lemos" };
    const options = { day: { appointments: [APPOINTMENT], blocks: [] }, barbers: [BARBER, other], date, durationMin: 30, now: new Date(2026, 8, 25, 10, 20) };
    const preferred = suggestSlots({ ...options, preferredBarberId: "b3" });
    expect(preferred).toHaveLength(3);
    expect(preferred.filter((slot) => slot.barber.id === "b3").length).toBeGreaterThanOrEqual(2);
    expect(preferred.find((slot) => slot.barber.id === "b3")?.reasonKey).toBe("calendar.suggest.why.preferred");
    // Sin preferencia, el primero queda pegado a la cita de las 10:30: justo después, a las 11.
    const tight = suggestSlots({ ...options, barbers: [BARBER], limit: 1 });
    expect(tight[0].start).toEqual(new Date(2026, 8, 25, 11, 0));
    expect(tight[0].reasonKey).toBe("calendar.suggest.why.tight");
    // Nunca sobre una cita ni antes de ahora.
    expect(suggestSlots({ ...options, barbers: [BARBER], limit: 3 }).every((slot) => slot.start >= new Date(2026, 8, 25, 10, 30) && slot.start.getTime() !== new Date(2026, 8, 25, 10, 30).getTime())).toBe(true);
    expect(suggestSlots({ ...options, barbers: [] })).toEqual([]);
    // Un hueco que choca con un recurso especial completo no se propone.
    expect(suggestSlots({ ...options, isTaken: () => true })).toEqual([]);
    expect(suggestSlots({ ...options, isTaken: (barberId) => barberId === preferred[0].barber.id, preferredBarberId: "b3" }).every((slot) => slot.barber.id !== preferred[0].barber.id)).toBe(true);
  });

  test("el reacomodo corre solo lo necesario, conserva el orden y avisa de lo que pasa del cierre", () => {
    const date = new Date(2026, 8, 25);
    const at = (id: string, start: string, durationMin: number, status: Appointment["status"] = "scheduled"): Appointment => ({ ...APPOINTMENT, id, start: `2026-09-25T${start}:00`, durationMin, status });
    const anchor = at("a1", "10:30", 30, "seated");
    const day = { appointments: [anchor, at("a2", "11:00", 30), at("a3", "11:30", 30), at("a4", "13:00", 30), at("a5", "11:15", 30, "paid")] };
    // La de las 10:30 termina a las 11:20: las dos siguientes se corren 20 min; la de la 1 ya tenía hueco.
    const plan = reflowPlan(day, BARBER, date, anchor, 11 * 60 + 20);
    expect(plan?.moves.map((move) => [move.appointment.id, move.from, move.to])).toEqual([["a2", 660, 680], ["a3", 690, 710]]);
    expect(plan?.moves.every((move) => !move.overflow)).toBe(true);
    // Si no pisa a nadie, no hay plan.
    expect(reflowPlan(day, BARBER, date, anchor, 11 * 60)).toBeNull();
    // Un almuerzo en medio: la cita que caería encima salta a cuando termina.
    const lunch = { id: "k1", branchId: "ma", barberId: "b1", category: "lunch" as const, repeat: "none" as const, startDate: "2026-09-25", endDate: "2026-09-25", startTime: "11:30", endTime: "12:00", description: null };
    expect(reflowPlan({ ...day, blocks: [lunch] }, BARBER, date, anchor, 11 * 60 + 20)?.moves.map((move) => move.to)).toEqual([720, 750]);
    // Lo que acabaría después de las 19:00 se marca.
    const late = { appointments: [at("z1", "18:00", 30, "seated"), at("z2", "18:30", 30)] };
    expect(reflowPlan(late, BARBER, date, late.appointments[0], 18 * 60 + 45)?.moves[0].overflow).toBe(true);
  });

  test("el camino de una cita va de agendada a cobrada", () => {
    expect(nextStep("scheduled")?.status).toBe("arrived");
    expect(nextStep("arrived")?.status).toBe("seated");
    expect(nextStep("seated")?.status).toBe("paid");
    expect(nextStep("paid")).toBeNull();
    expect(nextStep("cancelled")).toBeNull();
  });
});

describe("Calendario", () => {
  // El mock siembra con el reloj real: se fija a NOW para que la agenda del 25 no quede en el pasado.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    db.reset();
  });
  afterEach(() => {
    vi.useRealTimers();
    setActionsPlacement("rail");
  });

  test("abre en el día de hoy con una columna por barbero que trabaja", async () => {
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    // El viernes trabajan diez de los once barberos de la sucursal —más de los que caben a lo
    // ancho: la rejilla se desplaza—; Julián no tiene horario.
    expect(within(grid).getByText("Andrés Beltrán")).toBeInTheDocument();
    expect(within(grid).getByText("Lorena Lemos")).toBeInTheDocument();
    expect(grid.querySelectorAll("[data-resource-id]")).toHaveLength(10);
    expect(within(grid).getByText("Nicolás Duarte")).toBeInTheDocument();
    expect(within(grid).queryByText("Julián Cifuentes")).toBeNull();
    expect(screen.getByTestId("calendar-date")).toHaveTextContent("Viernes 25 sep");
    expect(screen.queryByTestId("calendar-today")).toBeNull();
  });

  test("un día en que nadie trabaja avisa y ofrece ver a todo el equipo", async () => {
    const user = userEvent.setup();
    // La barbería cierra los domingos: el 27 nadie tiene horario.
    mount("/calendario?fecha=2026-09-27");
    expect(await screen.findByTestId("calendar-nobody")).toHaveTextContent("Nadie trabaja este día");
    await user.click(screen.getByTestId("calendar-see-all"));
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    expect(within(grid).getByText("Julián Cifuentes")).toBeInTheDocument();
  });

  test("la vista Agenda lista las citas del día y la vista Mes la ocupación", async () => {
    mount("/calendario?vista=agenda");
    const agenda = await screen.findByTestId("calendar-agenda");
    expect(within(agenda).getAllByRole("listitem").length).toBeGreaterThan(3);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("calendar-view"));
    await user.click(await screen.findByRole("menuitemradio", { name: /Mes/ }));
    const month = await screen.findByRole("grid", { name: "Ocupación del mes" });
    await waitFor(() => expect(within(month).getAllByRole("button", { name: /Ocupación \d+%/ }).length).toBeGreaterThan(10));
  });

  test("los ajustes de las tarjetas también cambian las filas de la Agenda", async () => {
    const user = userEvent.setup();
    try {
      mount("/calendario?vista=agenda");
      const agenda = await screen.findByTestId("calendar-agenda");
      const rows = () => within(screen.getByTestId("calendar-agenda")).getAllByRole("listitem");
      expect(rows().some((row) => /US\$/.test(row.textContent ?? ""))).toBe(true);
      expect(agenda.querySelector(".schedule-pastel")).toBeNull();

      await user.click(screen.getByTestId("calendar-view-options"));
      const panel = await screen.findByTestId("calendar-view-panel");
      // Sin precio en la tarjeta, la lista tampoco lo dice.
      await user.click(within(panel).getByTestId("calendar-card-price"));
      await waitFor(() => expect(rows().some((row) => /US\$/.test(row.textContent ?? ""))).toBe(false));
      // Teñir por estado tiñe también las filas.
      await user.click(within(panel).getByRole("radio", { name: "Estado" }));
      await waitFor(() => expect(screen.getByTestId("calendar-agenda").querySelector(".schedule-pastel")).not.toBeNull());
    } finally {
      resetCalendarCardPrefs();
    }
  });

  test("tocar un hueco abre Crear cita con el barbero y la hora puestos, y la cita aparece", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.click(screen.getByRole("button", { name: "Crear a las 3:00 p. m. con Andrés Beltrán" }));

    const drawer = await screen.findByTestId("create-appointment");
    expect(within(drawer).getByTestId("create-appointment-barber")).toHaveTextContent("Andrés Beltrán");
    expect(within(drawer).getByTestId("create-field-when")).toHaveTextContent("3:00 p. m.");

    // «Arma la cita»: arranca abierto lo que falta (el cliente) y al elegir se abre lo siguiente.
    await user.type(within(drawer).getByTestId("create-client-search"), "Marcela");
    await user.click(within(drawer).getAllByRole("radio", { name: /Marcela Gómez/ })[0]);
    await user.click(await within(drawer).findByRole("checkbox", { name: /Corte clásico/ }));
    await user.click(within(drawer).getByTestId("create-services-done"));
    await user.click(screen.getByTestId("create-appointment-submit"));

    await waitFor(() => expect(screen.queryByTestId("create-appointment")).toBeNull());
    const grid = screen.getByRole("region", { name: "Agenda del día por barbero" });
    expect(await within(grid).findByRole("button", { name: /Abrir Marcela Gómez, 3:00 p. m. – 3:30 p. m./ })).toBeInTheDocument();
  }, 15_000);

  test("en Crear cita el cliente se busca por nombre, celular o correo, y la agenda marca dónde va", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.click(screen.getByRole("button", { name: "Crear a las 3:00 p. m. con Andrés Beltrán" }));
    const drawer = await screen.findByTestId("create-appointment");
    // Mientras se crea, la cita se ve en la agenda en su sitio.
    expect(document.querySelector('[data-schedule-event="create-preview"]')).toHaveAttribute("data-active", "true");

    const marcela = db.calendar.clients.find((client) => client.name === "Marcela Gómez");
    const search = within(drawer).getByTestId("create-client-search");
    for (const query of [marcela?.email ?? "", (marcela?.phone ?? "").slice(-7), "gomez marce"]) {
      await user.clear(search);
      await user.type(search, query);
      expect(within(drawer).getAllByRole("radio", { name: /Marcela Gómez/ }).length).toBeGreaterThan(0);
    }
  }, 15_000);

  test("reacomodar retrasos enseña el plan sobre la agenda y solo mueve las citas al aplicarlo", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    // Andrés tiene a alguien esperando desde las 9:45 y son las 10:20: lo que sigue ya no cabe a su hora.
    await user.click(within(grid).getByRole("button", { name: "Opciones de Andrés Beltrán" }));
    await user.click(await screen.findByRole("menuitem", { name: "Reacomodar retrasos" }));

    const banner = await screen.findByTestId("calendar-reflow");
    expect(banner).toHaveTextContent(/se corren? \d+ min con Andrés/);
    const proposals = within(grid).getAllByRole("button", { name: /Aceptar la propuesta/ });
    expect(proposals.length).toBeGreaterThan(0);
    // Nada se ha movido todavía: descartar deja la agenda como estaba.
    const before = db.calendar.appointments.filter((item) => item.barberId === "team-04").map((item) => item.start).join();
    await user.click(within(banner).getByTestId("calendar-reflow-discard"));
    expect(screen.queryByTestId("calendar-reflow")).toBeNull();
    expect(db.calendar.appointments.filter((item) => item.barberId === "team-04").map((item) => item.start).join()).toBe(before);

    await user.click(within(grid).getByRole("button", { name: "Opciones de Andrés Beltrán" }));
    await user.click(await screen.findByRole("menuitem", { name: "Reacomodar retrasos" }));
    await user.click(within(await screen.findByTestId("calendar-reflow")).getByTestId("calendar-reflow-apply"));
    await waitFor(() => expect(db.calendar.appointments.filter((item) => item.history.some((entry) => entry.event.startsWith("reason:")))).toHaveLength(proposals.length), { timeout: 5000 });
    const moved = db.calendar.appointments.filter((item) => item.history.some((entry) => entry.event.startsWith("reason:")));
    expect(screen.queryByTestId("calendar-reflow")).toBeNull();
    expect(moved.every((item) => item.history.some((entry) => entry.actor === "Asistente"))).toBe(true);
  }, 15_000);

  test("un solo control filtra la agenda por varios estados y varios servicios a la vez", async () => {
    const user = userEvent.setup();
    mount("/calendario?vista=agenda");
    const agenda = await screen.findByTestId("calendar-agenda");
    // Solo las filas de cita: los iconos de cada fila son otra lista dentro.
    const rows = () => screen.getByTestId("calendar-agenda").querySelectorAll('[data-slot="list-item"]').length;
    const all = agenda.querySelectorAll('[data-slot="list-item"]').length;
    // Sin filtros puestos, el botón no lleva número: el número es solo de filtros aplicados.
    expect(screen.getByTestId("calendar-filters")).toHaveTextContent(/^Filtros$/);
    expect(screen.queryByTestId("calendar-filters-count")).toBeNull();
    // Estados y servicios viven en el mismo panel, cada grupo como un campo de varias opciones con su cuenta.
    await user.click(screen.getByTestId("calendar-filters"));
    const panel = await screen.findByTestId("calendar-filters-panel");
    const open = async (field: string) => {
      await user.click(within(panel).getByTestId(`calendar-filter-${field}`));
      return screen.findByRole("listbox");
    };
    const option = (list: HTMLElement, name: RegExp) => within(list).getByRole("option", { name });
    const countOf = (element: HTMLElement) => Number(within(element).getByText(/^\d+$/).textContent);

    let list = await open("status");
    const paid = countOf(option(list, /^Cobrada/));
    const upcoming = countOf(option(list, /^Agendada/));
    expect(paid).toBeGreaterThan(0);
    expect(upcoming).toBeGreaterThan(0);

    // Dos estados a la vez suman sus citas.
    await user.click(option(list, /^Cobrada/));
    await waitFor(() => expect(rows()).toBe(paid));
    await user.click(option(list, /^Agendada/));
    await waitFor(() => expect(rows()).toBe(paid + upcoming));
    expect(screen.getByTestId("calendar-filters-count")).toHaveTextContent("2");
    await user.keyboard("{Escape}");

    // Quitar los filtros devuelve el día entero, de una sola vez.
    await user.click(within(panel).getByTestId("calendar-filters-clear"));
    await waitFor(() => expect(rows()).toBe(all));

    // Los servicios son los del catálogo, combos incluidos; se marcan varios.
    list = await open("service");
    const ritual = countOf(option(list, /^Ritual premium/));
    const fade = countOf(option(list, /^Fade/));
    await user.click(option(list, /^Ritual premium/));
    await waitFor(() => expect(rows()).toBe(ritual));
    await user.click(option(list, /^Fade/));
    await waitFor(() => expect(rows()).toBe(ritual + fade));
  }, 15_000);

  test("tocar un bloqueo ofrece agendar encima, editarlo o quitarlo a quien agenda sin reglas", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const lunch = await waitFor(() => within(grid).getAllByRole("button", { name: /^Abrir Almuerzo/ })[0]);
    await user.click(lunch);
    const options = await screen.findByTestId("block-options");
    expect(within(options).getByText("Agendar una cita aquí")).toBeInTheDocument();
    expect(within(options).getByText("Quitar el bloqueo")).toBeInTheDocument();
    await user.click(within(options).getByTestId("block-options-edit"));
    expect(await screen.findByTestId("block-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("block-submit")).toHaveTextContent("Guardar");
  }, 15_000);

  test("«Ausencias y bloqueos» deja a la vista solo lo elegido, como «solo huecos»", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const lunches = () => within(grid).queryAllByRole("button", { name: /^Abrir Almuerzo/ }).length;
    await waitFor(() => expect(lunches()).toBeGreaterThan(0));
    await user.click(screen.getByTestId("calendar-filters"));
    const panel = await screen.findByTestId("calendar-filters-panel");
    await user.click(within(panel).getByTestId("calendar-filter-timeoff"));
    const list = await screen.findByRole("listbox");

    // Con «Bloqueos» quedan los almuerzos y las citas se apagan.
    await user.click(within(list).getByRole("option", { name: /^Bloqueos/ }));
    await waitFor(() => expect(grid.querySelectorAll(".opacity-30").length).toBeGreaterThan(0));
    expect(lunches()).toBeGreaterThan(0);
    // Con solo «Vacaciones y ausencias», los almuerzos dejan de pintarse.
    await user.click(within(list).getByRole("option", { name: /^Vacaciones y ausencias/ }));
    await user.click(within(list).getByRole("option", { name: /^Bloqueos/ }));
    await waitFor(() => expect(lunches()).toBe(0));
    expect(screen.getByTestId("calendar-filters-count")).toHaveTextContent("1");
    await user.keyboard("{Escape}");

    // «Quitar filtros» vuelve a mostrar todo.
    await user.click(within(panel).getByTestId("calendar-filters-clear"));
    await waitFor(() => expect(lunches()).toBeGreaterThan(0));
  }, 15_000);

  test("se eligen varios barberos a la vez y «solo huecos» marca lo libre para agendar", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.click(screen.getByTestId("calendar-team"));
    const team = await screen.findByTestId("calendar-team-panel");
    await user.click(within(within(team).getByTestId("calendar-team-team-04")).getByRole("checkbox"));
    await user.click(within(within(team).getByTestId("calendar-team-team-05")).getByRole("checkbox"));
    await waitFor(() => expect(grid.querySelectorAll("[data-resource-id]")).toHaveLength(2));
    expect(screen.getByTestId("calendar-team")).toHaveTextContent("2 barberos");
    await user.keyboard("{Escape}");

    // Con «solo huecos disponibles» las citas se apagan y cada rato libre es un bloque que agenda.
    expect(within(grid).queryAllByRole("button", { name: /Aceptar la propuesta: Libre/ })).toHaveLength(0);
    await user.click(screen.getByTestId("calendar-filters"));
    await user.click(await screen.findByTestId("calendar-filter-free"));
    const free = await within(grid).findAllByRole("button", { name: /Aceptar la propuesta: Libre/ });
    expect(free.length).toBeGreaterThan(0);
    await user.keyboard("{Escape}");
    await user.click(free[0]);
    expect(await screen.findByTestId("create-appointment")).toBeInTheDocument();
  }, 15_000);

  test("el panel de huecos lista los ratos libres y agenda en uno con el barbero y la hora puestos", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.keyboard("h");
    const gaps = await screen.findByTestId("calendar-gaps");
    expect(within(gaps).getByTestId("calendar-gaps-summary")).toHaveTextContent("Huecos");
    const book = within(gaps).getAllByRole("button", { name: /^Agendar: Andrés Beltrán/ });
    expect(book.length).toBeGreaterThan(0);
    await user.click(book[0]);
    const drawer = await screen.findByTestId("create-appointment");
    expect(within(drawer).getByTestId("create-appointment-barber")).toHaveTextContent("Andrés Beltrán");
    expect(screen.queryByTestId("calendar-gaps")).toBeNull();
  });

  test("desde la cita una nota del cliente se corrige y se borra", async () => {
    const user = userEvent.setup();
    // Las citas se generan al pedir el día: la nota se le pone a todos y se abre la primera cita con ficha.
    db.calendar.clients = db.calendar.clients.map((item) => ({ ...item, notes: [{ id: `note_test_${item.id}`, kind: "note" as const, text: "Prefiere tijera arriba", createdAt: "2026-09-01T10:00:00.000Z" }, ...item.notes] }));
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const cards = await within(grid).findAllByRole("button", { name: /^Abrir / });
    await user.click(cards.find((card) => !/Sin cita|Cliente de paso/i.test(card.getAttribute("aria-label") ?? "")) as HTMLElement);
    const drawer = await screen.findByTestId("appointment-drawer");
    // El cliente es una tarjeta de la cita; abierta («¿Quién viene?») lleva a su página, donde viven las notas.
    await user.click(within(drawer).getByTestId("panel-field-client"));
    await user.click(await within(drawer).findByRole("button", { name: /Cliente ·/ }));

    await user.click(await within(drawer).findByRole("button", { name: "Acciones de Prefiere tijera arriba" }));
    await user.click(await screen.findByRole("menuitem", { name: "Editar" }));
    const field = await screen.findByTestId("client-note-edit-text");
    await user.clear(field);
    await user.type(field, "Trae su propia cera");
    await user.click(screen.getByTestId("client-note-save"));
    await waitFor(() => expect(within(drawer).queryByTestId("client-note-editing")).toBeNull());
    expect(within(drawer).getByText("Trae su propia cera")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: "Acciones de Trae su propia cera" }));
    await user.click(await screen.findByRole("menuitem", { name: "Eliminar" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(within(drawer).queryByText("Trae su propia cera")).toBeNull());
    // En el servidor: corregida en un cliente y luego borrada de su ficha.
    expect(db.calendar.clients.some((item) => item.notes.some((entry) => entry.text === "Trae su propia cera"))).toBe(false);
    expect(db.calendar.clients.filter((item) => item.notes.some((entry) => entry.text === "Prefiere tijera arriba"))).toHaveLength(db.calendar.clients.length - 1);
  });

  test("el panel de la cita pone a la vista el siguiente paso y cobrar lo sustituye por el cobro", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const cards = await within(grid).findAllByRole("button", { name: /^Abrir / });
    // Una cita todavía pendiente: su tarjeta ofrece «Ingresar».
    const pending = cards.find((card) => within(card.parentElement as HTMLElement).queryByRole("button", { name: "Ingresar" }));
    await user.click(pending as HTMLElement);

    const drawer = await screen.findByTestId("appointment-drawer");
    expect(within(drawer).getByRole("list", { name: "Avance de la cita" })).toBeInTheDocument();
    expect(within(drawer).getByTestId("appointment-headline")).toBeInTheDocument();
    // La cita en tarjetas, como la reserva: el servicio se cambia en su sitio, sin abrir un formulario.
    expect(within(drawer).getByTestId("panel-field-services")).toBeInTheDocument();
    expect(screen.getByTestId("appointment-next-step")).toHaveTextContent("Ingresar");

    await user.click(screen.getByTestId("appointment-next-step"));
    await waitFor(() => expect(screen.getByTestId("appointment-next-step")).toHaveTextContent("Sentar"));
    // Ya en la barbería no hay atajos: la acción es la del pie.
    expect(within(screen.getByTestId("appointment-drawer")).queryByTestId("panel-quick")).toBeNull();

    await user.click(screen.getByTestId("appointment-next-step"));
    await user.click(await screen.findByTestId("appointment-pay"));
    // Si el barbero tiene otra cita sentada sin cobrar, primero sale el aviso (no frena): se sigue con esta.
    await waitFor(() => expect(screen.queryByTestId("checkout-drawer") ?? screen.queryByRole("alertdialog")).not.toBeNull());
    const warning = screen.queryByRole("alertdialog");
    if (warning) await user.click(within(warning).getByRole("button", { name: "Seguir con esta" }));
    expect(await screen.findByTestId("checkout-drawer")).toBeInTheDocument();
    expect(screen.queryByTestId("appointment-drawer")).toBeNull();
    // Una sola pantalla; la propina (las de Configuración, no una lista fija) se pregunta al pulsar «Cobrar».
    expect(screen.getByTestId("checkout-pay")).toHaveTextContent(/Cobrar US\$/);
    await user.click(screen.getByTestId("checkout-pay"));
    expect(await screen.findByRole("radio", { name: /^25%/ })).toBeInTheDocument();
    expect(screen.getByTestId("checkout-tip-pay")).toHaveTextContent(/Sin propina · cobrar US\$/);
  });

  test("una cita pagada en línea solo cobra en caja lo que falta, con el impuesto de la sucursal", async () => {
    // El corte paga el 10 % de la sucursal: 35 + 3,5. Al reservar dejó 10 de anticipo.
    const taxed: ModelContext = { ...ctx, catalog: { ...CATALOG, services: [{ ...CATALOG.services[0], taxPercent: 10 }] } };
    const online = { reservation: "BL-1001", method: "shop", paid: 10, tip: 0, discount: 0 };
    renderWithProviders(<CheckoutDrawer open appointment={{ ...APPOINTMENT, status: "seated", online }} onOpenChange={() => {}} ctx={taxed} onPaid={() => {}} />);
    expect(await screen.findByTestId("checkout-prepaid")).toHaveTextContent("BL-1001");
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("$28.5");
  });

  test("el descuento y la tarjeta de regalo que se vende cambian lo que se cobra", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckoutDrawer open appointment={{ ...APPOINTMENT, status: "seated" }} onOpenChange={() => {}} ctx={ctx} onPaid={() => {}} />);
    expect(await screen.findByTestId("checkout-total")).toHaveTextContent("$35");
    await user.click(screen.getByTestId("checkout-discount-add"));
    await user.type(within(screen.getByTestId("checkout-discount")).getByRole("spinbutton"), "10");
    // 10 % de 35.
    await waitFor(() => expect(screen.getByTestId("checkout-total")).toHaveTextContent("$31.5"));
    await user.click(screen.getByTestId("checkout-gift-sale-add"));
    // La tarjeta de regalo arranca en 50 y se suma a lo que se cobra.
    await waitFor(() => expect(screen.getByTestId("checkout-total")).toHaveTextContent("$81.5"));
  });

  test("al cobrar una visita, las demás citas vienen marcadas y se pueden dejar fuera", async () => {
    const user = userEvent.setup();
    const second = { ...APPOINTMENT, id: "a2", start: "2026-09-25T11:00:00", status: "seated" as const };
    renderWithProviders(<CheckoutDrawer open appointment={{ ...APPOINTMENT, status: "seated" }} companions={[second]} onOpenChange={() => {}} ctx={ctx} onPaid={() => {}} />);
    const visit = await screen.findByTestId("checkout-visit");
    const items = within(visit).getAllByTestId("checkout-visit-item");
    expect(items).toHaveLength(2);
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("$70");
    await user.click(within(items[1]).getByRole("button"));
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("$35");
    await user.click(within(items[1]).getByRole("button"));
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("$70");
  });

  test("la vista Semana cruza barberos y días; un día abre su panel al lado y desde ahí el día de un barbero", async () => {
    const user = userEvent.setup();
    mount("/calendario?vista=week");
    // Siete días de once barberos: la semana tarda algo más que un día en llegar.
    const week = await screen.findByRole("table", { name: "Ocupación de la semana por barbero" }, { timeout: 5000 });
    expect(screen.getByTestId("calendar-date")).toHaveTextContent("21 sep – 27 sep");
    expect(within(week).getAllByRole("columnheader")).toHaveLength(8);
    expect(within(week).getByRole("rowheader", { name: /Andrés Beltrán/ })).toBeInTheDocument();
    // El domingo la barbería cierra.
    expect(within(week).getAllByText("No trabaja").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("calendar-filters")).toBeNull();

    await user.click(within(week).getByRole("button", { name: /^Andrés Beltrán, miércoles 23/ }));
    // No deja la semana: el día se resume en el panel de la derecha.
    const panel = await screen.findByTestId("day-panel", {}, { timeout: 5000 });
    expect(screen.getByTestId("calendar-week")).toBeInTheDocument();
    expect(within(panel).getByTestId("day-panel-stats")).toHaveTextContent("Citas");
    expect(within(panel).getByRole("tab", { name: /^Citas/ })).toHaveAttribute("aria-selected", "true");
    await user.click(within(panel).getByRole("button", { name: /^Andrés Beltrán: .*Abrir su día/ }));
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    expect(screen.getByTestId("calendar-date")).toHaveTextContent("Miércoles 23 sep");
    expect(within(grid).getByText("Andrés Beltrán")).toBeInTheDocument();
    expect(within(grid).queryByText("Nicolás Duarte")).toBeNull();
  });

  test("el asistente agenda desde una frase y abre el alta con lo entendido", async () => {
    const user = userEvent.setup();
    setActionsPlacement("inline");
    mount();
    await screen.findByRole("region", { name: "Agenda del día por barbero" });
    // El resumen del día está con las demás acciones de la pantalla, plegado en «Más acciones».
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Resumen del día con Clipper" }));
    const assistant = await screen.findByTestId("calendar-assistant");
    expect(within(assistant).getByText("Hoy conviene mirar")).toBeInTheDocument();

    await user.type(within(assistant).getByTestId("calendar-assistant-text"), "Corte clásico para Marcela Gómez hoy a las 6:30 pm con Andrés");
    expect(within(assistant).getByText(/^Entendí: Marcela Gómez · Corte clásico · Andrés Beltrán/)).toBeInTheDocument();
    await user.click(within(screen.getByTestId("calendar-assistant-book")).getByRole("button"));

    const drawer = await screen.findByTestId("create-appointment");
    expect(within(drawer).getByTestId("create-appointment-barber")).toHaveTextContent("Andrés Beltrán");
    expect(within(drawer).getByTestId("create-field-when")).toHaveTextContent("6:30 p. m.");
  });

  test("desde la tarjeta se marca la llegada y el detalle muestra el estado nuevo", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const checkIns = await within(grid).findAllByRole("button", { name: "Ingresar" });
    expect(checkIns.length).toBeGreaterThan(0);
    await user.click(checkIns[0]);
    await waitFor(() => expect(within(grid).getAllByRole("button", { name: "Ingresar" }).length).toBe(checkIns.length - 1));
  });
  test("el barbero de comisión ve solo su columna, sin elegir equipo ni crear bloqueos", async () => {
    const user = userEvent.setup();
    // Aunque el enlace pida a todo el equipo, el barbero ve su agenda.
    mount("/calendario?equipo=all", "barbero-comision");
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    expect(grid.querySelectorAll("[data-resource-id]")).toHaveLength(1);
    expect(within(grid).getByText("Andrés Beltrán")).toBeInTheDocument();
    expect(within(grid).queryByText("Lorena Lemos")).toBeNull();
    expect(screen.queryByTestId("calendar-team")).toBeNull();
    // Ve lo que lleva cobrado él, no la sucursal.
    expect(screen.getByTestId("calendar-pulse-collected")).toBeInTheDocument();
    // Su menú de columna no ofrece bloquear (comisión solo ve los bloqueos).
    await user.click(within(grid).getByRole("button", { name: "Opciones de Andrés Beltrán" }));
    expect(await screen.findByRole("menuitem", { name: "Reacomodar retrasos" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Crear bloque de tiempo" })).toBeNull();
  });

  test("al crear cita el barbero viene fijo en él y agenda sin forzar", async () => {
    const user = userEvent.setup();
    mount(undefined, "barbero-comision");
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.click(within(grid).getByRole("button", { name: "Crear a las 3:00 p. m. con Andrés Beltrán" }));
    const drawer = await screen.findByTestId("create-appointment");
    const barber = within(drawer).getByTestId("create-appointment-barber");
    expect(barber).toHaveTextContent("Andrés Beltrán");
    expect(barber).toHaveAttribute("data-locked", "true");
  });

  test("recepción opera el día sin ver las cifras", async () => {
    mount(undefined, "recepcion");
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    // Ve a todo el equipo que trabaja...
    expect(grid.querySelectorAll("[data-resource-id]")).toHaveLength(10);
    expect(screen.getByTestId("calendar-team")).toBeInTheDocument();
    // ...pero no «cobrados de» del día.
    expect(screen.queryByTestId("calendar-pulse-collected")).toBeNull();
  });
});
