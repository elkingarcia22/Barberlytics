import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, within, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { RequireAuth } from "@/features/auth";
import { CalendarPage } from "./CalendarPage";
import { weekCell, weekStartOf } from "./weekModel";
import { appointmentMarkers, appointmentTotal, barberLoad, blockClashes, followsAgendaRules, isFlexible, lateMinutes, matchesFilters, nextFreeMinute, placementProblem, serviceColor, teamIds, toEvent, visibleBarbers, nextStep, type ModelContext } from "./calendarModel";
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
import type { Appointment, Barber, CalendarCatalog } from "./types";

/** Viernes 25 de septiembre de 2026, a media mañana. Fecha fija: la agenda no depende del reloj. */
const NOW = new Date(2026, 8, 25, 10, 20);

function mount(route = "/calendario") {
  db.sessions.set("mock-acc_admin-test", "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/calendario" element={<CalendarPage now={NOW} />} />
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
    expect(appointmentPlaybook(APPOINTMENT, at(10, 45), phone)).toMatchObject({ stage: "late", primary: ["call", "whatsapp", "checkIn"] });
    expect(appointmentPlaybook(APPOINTMENT, at(10, 45), { hasPhone: false }).primary).toEqual(["checkIn"]);
    expect(appointmentPlaybook(APPOINTMENT, at(10, 0), phone)).toMatchObject({ stage: "upcoming", primary: ["checkIn"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "arrived" }, at(10, 35), phone)).toMatchObject({ stage: "waiting", primary: ["seat"], secondary: ["ready", "pay", "edit"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "arrived", barberReady: true }, at(10, 35), phone).secondary).toEqual(["pay", "edit"]);
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "seated" }, at(10, 40), phone)).toMatchObject({ stage: "seated", primary: ["pay"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "seated" }, at(11, 10), phone).stage).toBe("toCollect");
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "paid" }, at(12, 0), phone)).toMatchObject({ stage: "paid", primary: ["rebook"] });
    expect(appointmentPlaybook({ ...APPOINTMENT, status: "no_show" }, at(12, 0), phone)).toMatchObject({ stage: "noShow", primary: ["rebook"], secondary: ["call", "whatsapp"] });
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
    // Un solo indicador: agendada y por cobrar no llevan píldora —su botón («Check-in», «Cobrar») ya lo dice—.
    expect(live(APPOINTMENT, at(10, 0)).status).toBeUndefined();
    expect(live(APPOINTMENT, at(10, 0)).action?.label).toBe("calendar.step.checkIn");
    expect(live({ ...APPOINTMENT, status: "seated" }, at(11, 10)).status).toBeUndefined();
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
    // Quién es va en la etiqueta; los iconos de detalle ya no viajan en la tarjeta.
    expect(live(APPOINTMENT, at(10, 0)).badge?.label).toBe("calendar.clientType.vip");
    expect(live(APPOINTMENT, at(10, 0)).markers).toBeUndefined();
    expect(appointmentMarkers({ ...APPOINTMENT, source: "online", notes: "Trae foto" }, CATALOG.clients[0], ctx).map((marker) => marker.icon)).toEqual(["online", "requested", "note"]);
    expect(isFlexible({ ...APPOINTMENT, requestedBarberId: null })).toBe(true);
    expect(isFlexible({ ...APPOINTMENT, requestedBarberId: null, status: "arrived" })).toBe(false);
  });

  test("solo el barbero de comisión agenda con reglas", () => {
    expect(followsAgendaRules("barbero-comision")).toBe(true);
    for (const role of ["owner", "admin", "recepcion", "barbero-renta"]) expect(followsAgendaRules(role)).toBe(false);
    // Sin rol conocido (una pantalla sin marco) no se inventan restricciones.
    expect(followsAgendaRules(undefined)).toBe(false);
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
    await user.click(screen.getByRole("radio", { name: "Mes" }));
    const month = await screen.findByRole("grid", { name: "Ocupación del mes" });
    await waitFor(() => expect(within(month).getAllByRole("button", { name: /Ocupación \d+%/ }).length).toBeGreaterThan(10));
  });

  test("tocar un hueco abre Crear cita con el barbero y la hora puestos, y la cita aparece", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.click(screen.getByRole("button", { name: "Crear a las 3:00 p. m. con Andrés Beltrán" }));

    const drawer = await screen.findByTestId("create-appointment");
    expect(within(drawer).getByTestId("create-appointment-barber")).toHaveTextContent("Andrés Beltrán");
    expect(within(drawer).getByRole("radio", { name: "3:00 p. m." })).toBeChecked();

    const trigger = (text: string) => within(drawer).getAllByText(text).find((node) => node.closest('[role="combobox"]')) as HTMLElement;
    await user.click(trigger("Elige el cliente"));
    await user.click((await screen.findAllByRole("option", { name: /Marcela Gómez/ }))[0]);
    await user.click(trigger("Elige el servicio"));
    await user.click(await screen.findByRole("option", { name: /Corte clásico/ }));
    await user.click(screen.getByTestId("create-appointment-submit"));

    await waitFor(() => expect(screen.queryByTestId("create-appointment")).toBeNull());
    const grid = screen.getByRole("region", { name: "Agenda del día por barbero" });
    expect(await within(grid).findByRole("button", { name: /Abrir Marcela Gómez, 3:00 p. m. – 3:30 p. m./ })).toBeInTheDocument();
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
    const all = within(agenda).getAllByRole("listitem").length;
    const rows = () => within(screen.getByTestId("calendar-agenda")).getAllByRole("listitem").length;
    // Estados y servicios viven en el mismo panel, como listas de casillas con su cuenta.
    await user.click(screen.getByTestId("calendar-filters"));
    const panel = await screen.findByTestId("calendar-filters-panel");
    const countOf = (testId: string) => Number(within(panel).getByTestId(testId).querySelector("[data-count]")?.textContent);
    const paid = countOf("calendar-filter-status-paid");
    const upcoming = countOf("calendar-filter-status-upcoming");
    expect(paid).toBeGreaterThan(0);
    expect(upcoming).toBeGreaterThan(0);

    // Dos estados a la vez suman sus citas.
    await user.click(within(within(panel).getByTestId("calendar-filter-status-paid")).getByRole("checkbox"));
    await waitFor(() => expect(rows()).toBe(paid));
    await user.click(within(within(panel).getByTestId("calendar-filter-status-upcoming")).getByRole("checkbox"));
    await waitFor(() => expect(rows()).toBe(paid + upcoming));
    expect(screen.getByTestId("calendar-filters-count")).toHaveTextContent("2");

    // Quitar los filtros devuelve el día entero, de una sola vez.
    await user.click(within(panel).getByTestId("calendar-filters-clear"));
    await waitFor(() => expect(rows()).toBe(all));

    // Los servicios son los del catálogo, combos incluidos; se marcan varios.
    expect(within(panel).getByTestId("calendar-filter-service-svc_premium")).toHaveTextContent("Ritual premium");
    const ritual = countOf("calendar-filter-service-svc_premium");
    const fade = countOf("calendar-filter-service-svc_fade");
    await user.click(within(within(panel).getByTestId("calendar-filter-service-svc_premium")).getByRole("checkbox"));
    await waitFor(() => expect(rows()).toBe(ritual));
    await user.click(within(within(panel).getByTestId("calendar-filter-service-svc_fade")).getByRole("checkbox"));
    await waitFor(() => expect(rows()).toBe(ritual + fade));
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

  test("el detalle de la cita pone a la vista el siguiente paso y cobrar lo sustituye por el cobro", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const cards = await within(grid).findAllByRole("button", { name: /^Abrir / });
    // Una cita todavía pendiente: su tarjeta ofrece «Check-in».
    const pending = cards.find((card) => within(card.parentElement as HTMLElement).queryByRole("button", { name: "Check-in" }));
    await user.click(pending as HTMLElement);

    const drawer = await screen.findByTestId("appointment-drawer");
    expect(within(drawer).getByRole("list", { name: "Avance de la cita" })).toBeInTheDocument();
    expect(within(drawer).getByTestId("appointment-headline")).toBeInTheDocument();
    // La cita se lee primero; el formulario aparece al pedir editarla.
    expect(within(drawer).queryByTestId("appointment-edit")).toBeNull();
    await user.click(within(drawer).getByTestId("appointment-edit-toggle"));
    expect(within(drawer).getByTestId("appointment-edit")).toBeInTheDocument();
    expect(screen.getByTestId("appointment-next-step")).toHaveTextContent("Check-in");

    await user.click(screen.getByTestId("appointment-next-step"));
    await waitFor(() => expect(screen.getByTestId("appointment-next-step")).toHaveTextContent("Sentado"));

    await user.click(screen.getByTestId("appointment-pay"));
    expect(await screen.findByTestId("checkout-drawer")).toBeInTheDocument();
    expect(screen.queryByTestId("appointment-drawer")).toBeNull();
    // Las propinas son las de Configuración, no una lista fija.
    expect(await within(screen.getByTestId("checkout-drawer")).findByRole("button", { name: /^25%/ })).toBeInTheDocument();
    expect(screen.getByTestId("checkout-pay")).toHaveTextContent(/Cobrar US\$/);
  });

  test("la vista Semana cruza barberos y días, y una celda abre ese día con ese barbero", async () => {
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
    await user.click(await screen.findByRole("menuitem", { name: "Resumen del día con IA" }));
    const assistant = await screen.findByTestId("calendar-assistant");
    expect(within(assistant).getByText("Hoy conviene mirar")).toBeInTheDocument();

    await user.type(within(assistant).getByTestId("calendar-assistant-text"), "Corte clásico para Marcela Gómez hoy a las 6:30 pm con Andrés");
    expect(within(assistant).getByText(/^Entendí: Marcela Gómez · Corte clásico · Andrés Beltrán/)).toBeInTheDocument();
    await user.click(within(screen.getByTestId("calendar-assistant-book")).getByRole("button"));

    const drawer = await screen.findByTestId("create-appointment");
    expect(within(drawer).getByTestId("create-appointment-barber")).toHaveTextContent("Andrés Beltrán");
    expect(within(drawer).getByRole("radio", { name: "6:30 p. m." })).toBeChecked();
  });

  test("desde la tarjeta se marca la llegada y el detalle muestra el estado nuevo", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const checkIns = await within(grid).findAllByRole("button", { name: "Check-in" });
    expect(checkIns.length).toBeGreaterThan(0);
    await user.click(checkIns[0]);
    await waitFor(() => expect(within(grid).getAllByRole("button", { name: "Check-in" }).length).toBe(checkIns.length - 1));
  });
});
