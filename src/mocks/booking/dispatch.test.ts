import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { payloadOf, syncOutbox, type Queue, type QueueRequest, type QueueView } from "./dispatch";
import type { InboxEvent } from "./replies";
import { profileOf } from "../customers/handlers";
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

  /** Una cola de mentira con la misma forma que la del servidor: guarda, anula y «envía» con `deliver`. */
  function fakeQueue() {
    const items = new Map<string, QueueRequest & { status: QueueView["status"] }>();
    const inboxEvents: InboxEvent[] = [];
    const view = (id: string): QueueView => ({ id, status: items.get(id)!.status, providerId: items.get(id)!.status === "sent" ? `wamid.${id}` : null, error: null, sentAt: null });
    const queue: Queue = {
      enqueue: vi.fn(async (batch: QueueRequest[]) => {
        batch.forEach((item) => items.set(item.id, { ...item, status: "scheduled" }));
        return { items: batch.map((item) => view(item.id)), rejected: [] };
      }),
      cancel: vi.fn(async (ids: string[]) => {
        ids.forEach((id) => items.set(id, { ...items.get(id)!, status: "cancelled" }));
        return ids.map(view);
      }),
      status: vi.fn(async (ids: string[]) => ids.filter((id) => items.has(id)).map(view)),
      inbox: vi.fn(async (after: number) => ({ events: inboxEvents.filter((_, index) => index + 1 > after), cursor: inboxEvents.length })),
    };
    const deliver = (now: Date) => items.forEach((item, id) => item.status === "scheduled" && Date.parse(item.sendAt) <= now.getTime() && items.set(id, { ...item, status: "sent" }));
    const reply = (event: Omit<InboxEvent, "at" | "wamid"> & { wamid?: string }) => inboxEvents.push({ at: new Date().toISOString(), wamid: event.wamid ?? `wamid.in${inboxEvents.length}`, ...event });
    return { queue, items, deliver, reply };
  }

  test("la app encola todo lo programado y refleja lo que el servidor ya envió", async () => {
    const appointment = upcoming();
    const phone = db.calendar.clients.find((item) => item.id === appointment.clientId)!.phone;
    scheduleMessages(appointment, phone);
    const { queue, items, deliver } = fakeQueue();
    const now = new Date();
    await syncOutbox(now, queue);
    const mine = () => db.booking.outbox!.filter((item) => item.appointmentId === appointment.id);
    expect(mine().every((item) => item.queued === true && item.status === "scheduled")).toBe(true);
    expect([...items.values()].find((item) => item.kind === "confirmation")).toMatchObject({ to: phone, buttonParam: appointment.confirmToken });
    deliver(now);
    expect(await syncOutbox(now, queue)).toEqual({ sent: 1, simulated: 0, failed: 0, replies: 0 });
    expect(mine().find((item) => item.kind === "confirmation")).toMatchObject({ status: "sent", providerId: expect.stringMatching(/^wamid\./) });
    expect(mine().filter((item) => item.kind !== "confirmation").every((item) => item.status === "scheduled")).toBe(true);
  });

  test("lo que se cancela en la app se anula en la cola", async () => {
    const appointment = upcoming();
    scheduleMessages(appointment, "+573001112233");
    const { queue, items } = fakeQueue();
    await syncOutbox(new Date(), queue);
    db.booking.outbox = db.booking.outbox!.map((item) => (item.appointmentId === appointment.id ? { ...item, status: "cancelled" as const } : item));
    await syncOutbox(new Date(), queue);
    expect([...items.values()].every((item) => item.status === "cancelled")).toBe(true);
    expect(db.booking.outbox!.filter((item) => item.appointmentId === appointment.id).every((item) => !item.queued)).toBe(true);
  });

  test("sin cola en el servidor, lo que ya toca queda simulado y lo demás espera", async () => {
    const appointment = upcoming();
    scheduleMessages(appointment, "+573001112233");
    const none: Queue = { enqueue: async () => null, cancel: async () => null, status: async () => null, inbox: async () => null };
    expect(await syncOutbox(new Date(), none)).toMatchObject({ simulated: 1, replies: 0 });
    const mine = db.booking.outbox!.filter((item) => item.appointmentId === appointment.id);
    expect(mine.find((item) => item.kind === "confirmation")).toMatchObject({ status: "sent", simulated: true });
    expect(mine.filter((item) => item.kind !== "confirmation").every((item) => item.status === "scheduled" && !item.queued)).toBe(true);
  });

  test("las respuestas del cliente llegan a su cita: confirma, pide otra hora o no puede venir", async () => {
    const appointment = upcoming();
    const phone = db.calendar.clients.find((item) => item.id === appointment.clientId)!.phone;
    scheduleMessages(appointment, phone);
    const { queue, reply } = fakeQueue();
    await syncOutbox(new Date(), queue);
    const confirmation = db.booking.outbox!.find((item) => item.appointmentId === appointment.id && item.kind === "confirmation")!;
    const current = () => db.calendar.appointments.find((item) => item.id === appointment.id)!;

    reply({ from: phone.replace(/\D/g, ""), intent: "reschedule", text: "¿Me la pasan a otra hora?", messageId: confirmation.id });
    expect(await syncOutbox(new Date(), queue)).toMatchObject({ replies: 1 });
    expect(current().confirmation).toMatchObject({ status: "reschedule_requested", via: "whatsapp" });
    expect(current().status).toBe("scheduled");

    // Sin decir a qué mensaje responde: va a su próxima cita por el celular.
    reply({ from: phone.replace(/\D/g, ""), intent: "confirm", text: "Confirmo", messageId: null });
    await syncOutbox(new Date(), queue);
    expect(current().confirmation).toMatchObject({ status: "confirmed", via: "whatsapp" });
    expect(current().history.at(-1)).toMatchObject({ event: "confirmed", actor: "Cliente (respondió el mensaje)" });

    // «Cancelar» no tumba la cita sola: queda dicho para que recepción decida.
    reply({ from: phone.replace(/\D/g, ""), intent: "cancel", text: "No puedo ir", messageId: confirmation.id });
    await syncOutbox(new Date(), queue);
    expect(current()).toMatchObject({ status: "scheduled", confirmation: { status: "declined" } });
    expect(db.booking.inbound!.filter((item) => item.appointmentId === appointment.id)).toHaveLength(3);
  });

  test("BAJA retira el permiso de promociones del cliente y una respuesta no se aplica dos veces", async () => {
    const appointment = upcoming();
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId)!;
    const { queue, reply } = fakeQueue();
    reply({ wamid: "wamid.baja", from: client.phone.replace(/\D/g, ""), intent: "stop", text: "BAJA", messageId: null });
    expect(await syncOutbox(new Date(), queue)).toMatchObject({ replies: 1 });
    expect(profileOf(client).marketingConsent).toMatchObject({ accepted: false, source: "whatsapp" });
    db.booking.inboxCursor = 0;
    expect(await syncOutbox(new Date(), queue)).toMatchObject({ replies: 0 });
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
