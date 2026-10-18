import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { dispatchDue, payloadOf, type Sender } from "./dispatch";
import { newConfirmToken, scheduleMessages } from "./reminders";

const TOKEN = "mock-acc_admin-test";
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
};

/** Una cita por venir de un cliente de verdad, con su token. */
function upcoming(): MockAppointment {
  const day = inDays(3);
  const appointment = appointmentsOn("ma", day).find((item) => item.status === "scheduled" && !item.walkIn)!;
  const withToken = { ...appointment, confirmToken: newConfirmToken() };
  db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === withToken.id ? withToken : item));
  return withToken;
}

const api = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}`, ...(init.headers ?? {}) } });

describe("mensajes de WhatsApp", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("la confirmación sale ya; los recordatorios esperan su hora", async () => {
    const appointment = upcoming();
    const phone = db.calendar.clients.find((item) => item.id === appointment.clientId)!.phone;
    scheduleMessages(appointment, phone);
    const sender = vi.fn<Sender>().mockResolvedValue({ status: "sent", providerId: "wamid.1" });
    expect(await dispatchDue(new Date(), sender)).toEqual({ sent: 1, simulated: 0, failed: 0 });
    expect(sender.mock.calls[0][0]).toMatchObject({ kind: "confirmation", to: phone, buttonParam: appointment.confirmToken });
    const mine = db.booking.outbox!.filter((item) => item.appointmentId === appointment.id);
    expect(mine.find((item) => item.kind === "confirmation")).toMatchObject({ status: "sent", providerId: "wamid.1" });
    expect(mine.filter((item) => item.kind !== "confirmation").every((item) => item.status === "scheduled")).toBe(true);
  });

  test("sin WhatsApp conectado queda simulado; si WhatsApp lo rechaza, fallido con su motivo", async () => {
    const appointment = upcoming();
    scheduleMessages(appointment, "+573001112233");
    await dispatchDue(new Date(), async () => ({ status: "simulated" }));
    expect(db.booking.outbox!.find((item) => item.appointmentId === appointment.id && item.kind === "confirmation")).toMatchObject({ status: "sent", simulated: true });
    scheduleMessages(appointment, "+573001112233");
    await dispatchDue(new Date(), async () => ({ status: "failed", error: "Template not found" }));
    expect(db.booking.outbox!.some((item) => item.appointmentId === appointment.id && item.status === "failed" && item.error === "Template not found")).toBe(true);
  });

  test("la plantilla lleva nombre, servicio, cuándo y la sucursal", () => {
    const appointment = upcoming();
    scheduleMessages(appointment, "+573001112233");
    const message = db.booking.outbox!.find((item) => item.appointmentId === appointment.id && item.kind === "confirmation")!;
    const payload = payloadOf(message)!;
    expect(payload.params).toHaveLength(4);
    expect(payload.params[3]).toBe("Massachusetts");
  });

  test("el enlace del mensaje confirma la cita; un token inventado no", async () => {
    const appointment = upcoming();
    const ok = await api("/booking/confirm", { method: "POST", body: JSON.stringify({ token: appointment.confirmToken }) });
    expect(ok.status).toBe(200);
    expect(db.calendar.appointments.find((item) => item.id === appointment.id)?.confirmation).toMatchObject({ status: "confirmed", via: "link" });
    expect((await api("/booking/confirm", { method: "POST", body: JSON.stringify({ token: "cf_inventado" }) })).status).toBe(404);
  });

  test("una cita de recepción programa sus mensajes y cancelarla los anula", async () => {
    const seed = upcoming();
    const created = await (await api("/appointments", { method: "POST", body: JSON.stringify({ clientId: seed.clientId, barberId: seed.barberId, serviceIds: seed.serviceIds, start: `${inDays(5)}T07:00`, walkIn: false, repeat: "none", force: true }) })).json();
    expect(created.confirmToken).toBeTruthy();
    expect(db.booking.outbox!.filter((item) => item.appointmentId === created.id).length).toBeGreaterThan(1);
    await api(`/appointments/${created.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
    expect(db.booking.outbox!.filter((item) => item.appointmentId === created.id && item.status === "scheduled")).toEqual([]);
  });
});
