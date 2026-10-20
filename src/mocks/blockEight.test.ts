import { beforeEach, describe, expect, test } from "vitest";
import { defaultWeekHours, type WeekHours } from "@/features/branches/branchHours";
import { db } from "./db";
import { barberFree, branchDetail, isClosed } from "./booking/logic";
import { appointmentsOn } from "./calendar/handlers";
import { buildBarbersMetrics } from "./metricsTabs";

const OWNER = "mock-acc_admin-eight";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

/** El próximo día de la semana pedido (0 domingo … 6 sábado) a partir de mañana, como «AAAA-MM-DD». */
function next(weekday: number): string {
  const day = new Date();
  day.setDate(day.getDate() + 1);
  while (day.getDay() !== weekday) day.setDate(day.getDate() + 1);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

const setHours = (branchId: string, hours: WeekHours) => {
  db.settings.lists.branches = db.settings.lists.branches.map((item) => (item.id === branchId ? { ...item, hours } : item));
};

/** Una cita por venir de la sede (la agenda se genera al pedir el día). */
const futureAppointment = () => appointmentsOn("ma", next(2)).find((item) => item.status === "scheduled" && !item.walkIn && db.calendar.clients.find((client) => client.id === item.clientId)?.phone);

describe("horario por sucursal, anticipo desde la cita, recargo como línea y cierre por turno", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
  });

  test("la reserva no ofrece horas fuera del horario de la sede ni los días que cierra", () => {
    const monday = next(1);
    const minutes = Array.from({ length: 18 }, (_, index) => 9 * 60 + index * 30);
    // Con el horario de la demo, Andrés (lunes a sábado de 9 a 7) tiene algún hueco el lunes.
    expect(minutes.some((minute) => barberFree("ma", "team-04", monday, minute, 30))).toBe(true);
    expect(isClosed("ma", next(0))).toBe(true);
    // La sede abre el lunes solo de 10 a 12: a las 9 y a la 1 no hay, aunque el barbero trabaje.
    setHours("ma", { ...defaultWeekHours("08:00", "22:00"), "1": { open: "10:00", close: "12:00" } });
    expect(barberFree("ma", "team-04", monday, 9 * 60, 30)).toBe(false);
    expect(barberFree("ma", "team-04", monday, 13 * 60, 30)).toBe(false);
    expect(branchDetail("ma")?.hours.find((day) => day.day === 1)).toMatchObject({ opensAt: "10:00", closesAt: "12:00" });
    // Cerrada el lunes: el día entero sale cerrado.
    setHours("ma", { ...defaultWeekHours("08:00", "22:00"), "1": null });
    expect(isClosed("ma", monday)).toBe(true);
  });

  test("el horario se valida y se guarda por día; sin días abiertos la ocupación es 0", async () => {
    const branch = db.settings.lists.branches.find((item) => item.id === "ma")!;
    const bad = await call(OWNER, "/settings/lists/branches/ma", { method: "PATCH", body: JSON.stringify({ ...branch, hours: { ...defaultWeekHours(), "2": { open: "18:00", close: "09:00" } } }) });
    expect(bad.status).toBe(422);
    expect((await bad.json()).fields.hours).toBeDefined();
    const ok = await call(OWNER, "/settings/lists/branches/ma", { method: "PATCH", body: JSON.stringify({ ...branch, hours: { ...defaultWeekHours(), "6": null } }) });
    expect(ok.ok).toBe(true);
    expect((await ok.json()).items.find((item: { id: string }) => item.id === "ma").hours["6"]).toBeNull();
    setHours("ma", { "0": null, "1": null, "2": null, "3": null, "4": null, "5": null, "6": null });
    const metrics = buildBarbersMetrics({ granularity: "month", date: "2026-09-15", barberId: "all", branchId: "ma" });
    expect(metrics.barbers.every((row) => row.occupancy === 0)).toBe(true);
  });

  test("pedir un anticipo manda el enlace; pagarlo lo deja como pagado en línea", async () => {
    const appointment = futureAppointment()!;
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId)!;
    const tooMuch = await call(OWNER, `/appointments/${appointment.id}/deposit`, post({ amount: 100_000, channels: [{ channel: "sms", to: client.phone }] }));
    expect(tooMuch.status).toBe(422);
    const sent = await call(OWNER, `/appointments/${appointment.id}/deposit`, post({ amount: 10, channels: [{ channel: "sms", to: client.phone }] }));
    expect(sent.status).toBe(201);
    const { depositRequest } = await sent.json();
    expect(depositRequest.link).toMatch(/\/reservar\/anticipo\?token=\w+/);
    const message = db.booking.outbox?.find((item) => item.kind === "depositLink");
    expect(message?.body).toContain(depositRequest.link);
    const token = new URL(depositRequest.link).searchParams.get("token");
    const page = await (await call(null, `/booking/deposit?token=${token}`)).json();
    expect(page).toMatchObject({ status: "requested", amount: 10, currency: "USD", client: client.name.split(" ")[0] });
    expect((await call(null, "/booking/deposit/pay", post({ token }))).ok).toBe(true);
    const paid = db.calendar.appointments.find((item) => item.id === appointment.id)!;
    expect(paid.depositRequest?.status).toBe("paid");
    expect(paid.online?.paid).toBe((appointment.online?.paid ?? 0) + 10);
    // Pagado, ya no se vuelve a pedir.
    expect((await call(OWNER, `/appointments/${appointment.id}/deposit`, post({ amount: 5, channels: [{ channel: "sms", to: client.phone }] }))).status).toBe(409);
  });

  test("sin pasarela conectada en la sede no se pide anticipo", async () => {
    const appointment = futureAppointment()!;
    db.settings.lists.branches = db.settings.lists.branches.map((item) => (item.id === "ma" ? { ...item, gatewayId: null } : item));
    const response = await call(OWNER, `/appointments/${appointment.id}/deposit`, post({ amount: 10, channels: [{ channel: "email", to: "cliente@correo.com" }] }));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("no_gateway");
  });

  test("el recargo por tarjeta queda como línea de la cuenta y suma al total", async () => {
    const appointment = futureAppointment()!;
    const charged = await call(OWNER, `/appointments/${appointment.id}/checkout`, post({ method: "card", tip: 0, surcharge: 1.5 }));
    expect(charged.ok).toBe(true);
    const payment = (await charged.json()).payment;
    expect(payment).toMatchObject({ surcharge: 1.5, surchargeName: "Recargo por tarjeta" });
    const date = appointment.start.slice(0, 10);
    const list = await (await call(OWNER, `/transactions?branchId=ma&from=${date}&to=${date}`)).json();
    const account = list.items.find((item: { id: string }) => item.id === appointment.id);
    expect(account.surcharge).toBe(1.5);
    expect(account.total).toBeCloseTo(account.subtotal - (account.discount ?? 0) + account.tax + 1.5, 2);
  });

  test("cerrar un turno deja la caja abierta; el siguiente cuenta desde ahí y el del día la cierra", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
    const day = () => call(OWNER, `/register?branchId=ma&date=${today}`).then((response) => response.json());
    const first = await day();
    expect(first.shift).toBe(1);
    const shift = await call(OWNER, "/register/close", post({ branchId: "ma", date: today, opening: 0, counted: first.expected.cash, note: "", final: false }));
    expect(shift.status).toBe(201);
    expect(await shift.json()).toMatchObject({ shift: 1, final: false, difference: 0 });
    // Un retiro en el segundo turno: lo esperado del turno 2 es solo eso.
    expect((await call(OWNER, "/register/movements", post({ branchId: "ma", date: today, type: "out", amount: 20, reason: "Pago al proveedor" }))).status).toBe(201);
    const second = await day();
    expect(second).toMatchObject({ shift: 2, closure: null });
    expect(second.closures).toHaveLength(1);
    expect(second.expected.cash).toBe(-20);
    const close = await call(OWNER, "/register/close", post({ branchId: "ma", date: today, opening: 100, counted: 80, note: "" }));
    expect(close.status).toBe(201);
    const closed = await day();
    expect(closed.closure).toMatchObject({ shift: 2, final: true });
    expect((await call(OWNER, "/register/movements", post({ branchId: "ma", date: today, type: "in", amount: 5, reason: "Sencillo" }))).status).toBe(409);
    expect(date.length).toBe(10);
  });
});
