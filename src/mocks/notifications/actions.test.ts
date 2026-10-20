import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { noAnswerOf } from "../calendar/risk";
import { toShellNotifications, type AppNotification } from "@/app/notifications";

const OWNER = "mock-acc_admin-notify";
const BARBER = "mock-acc_barber-notify";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const NOW = new Date("2026-10-20T15:00:00.000Z");

describe("avisos y confirmación: no contestó, reprogramación, WhatsApp fallido", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  });
  afterEach(() => vi.useRealTimers());

  const upcoming = () => appointmentsOn("ma", "2026-10-21").find((item) => item.status === "scheduled" && !item.walkIn)!;

  test("«no contestó»: le salió el recordatorio hace más de dos horas y no respondió", () => {
    const appointment = { ...upcoming(), confirmation: null };
    const message = { id: "msg_ask", appointmentId: appointment.id, clientId: appointment.clientId, to: "+15550001111", channel: "whatsapp" as const, kind: "reminder24h" as const, sendAt: "2026-10-20T11:00:00.000Z", sentAt: "2026-10-20T11:00:00.000Z", status: "sent" as const };
    db.booking.outbox = [message];
    expect(noAnswerOf(appointment, NOW)).toBe(true);
    // Hace una hora: todavía no.
    expect(noAnswerOf(appointment, new Date("2026-10-20T12:00:00.000Z"))).toBe(false);
    // Respondió algo (aunque no confirme): ya no es «no contestó».
    db.booking.inbound = [{ id: "in_1", at: "2026-10-20T12:30:00.000Z", from: "15550001111", intent: "other", text: "¿Hay parqueadero?", appointmentId: appointment.id, clientId: appointment.clientId }];
    expect(noAnswerOf(appointment, NOW)).toBe(false);
  });

  test("mover una cita avisa a recepción y a su barbero", async () => {
    const appointment = upcoming();
    const moved = await call(OWNER, `/appointments/${appointment.id}`, { method: "PATCH", body: JSON.stringify({ start: "2026-10-21T18:30", force: true }) });
    expect(moved.ok).toBe(true);
    const inbox = await (await call(OWNER, "/notifications?branchId=ma&role=recepcion")).json();
    expect(inbox.items).toContainEqual(expect.objectContaining({ kind: "rescheduled", params: expect.objectContaining({ time: "18:30" }) }));
  });

  test("un WhatsApp fallido trae el celular y el mensaje; reintentarlo lo vuelve a poner en cola", async () => {
    const appointment = upcoming();
    db.booking.outbox = [{ id: "msg_fail", appointmentId: appointment.id, clientId: appointment.clientId, to: "+15550001111", channel: "whatsapp", kind: "confirmation", sendAt: "2026-10-20T10:00:00.000Z", sentAt: "2026-10-20T10:00:00.000Z", status: "failed", error: "Número inválido" }];
    const inbox = await (await call(OWNER, "/notifications?branchId=ma&role=recepcion")).json();
    const failed = inbox.items.find((item: AppNotification) => item.kind === "whatsappFailed") as AppNotification;
    expect(failed.params).toMatchObject({ phone: "+15550001111", messageId: "msg_fail" });

    const retryMessage = vi.fn();
    const [shell] = toShellNotifications([failed], { t: (key) => key, formatMoney: String, formatDate: () => "", navigate: () => undefined, markRead: () => undefined, retryMessage });
    expect(shell.actions?.map((action) => action.id)).toEqual(["call", "retry"]);
    shell.actions?.find((action) => action.id === "retry")?.onSelect();
    expect(retryMessage).toHaveBeenCalledWith("msg_fail");

    expect((await call(BARBER, "/messages/msg_fail/retry", post({}))).status).toBe(403);
    expect(await (await call(OWNER, "/messages/msg_fail/retry", post({}))).json()).toEqual({ id: "msg_fail", status: "scheduled" });
    expect(db.booking.outbox?.[0]).toMatchObject({ status: "scheduled", queued: false });
    expect((await call(OWNER, "/messages/msg_fail/retry", post({}))).status).toBe(409);
  });

  test("antes de escribirles a varios: a quién sí y por qué no a los demás", async () => {
    const [first, second] = db.calendar.clients.filter((item) => item.id !== "cli_walkin" && item.phone);
    const { profileOf, saveProfile } = await import("../customers/handlers");
    saveProfile(first.id, { ...profileOf(first), marketingConsent: { accepted: true, at: NOW.toISOString(), source: "app" } });
    saveProfile(second.id, { ...profileOf(second), marketingConsent: undefined });
    const result = await (await call(OWNER, "/customers/messages/check", post({ ids: [first.id, second.id, "nadie"], purpose: "birthday" }))).json();
    expect(result.items).toEqual([
      expect.objectContaining({ id: first.id, blocked: null }),
      expect.objectContaining({ id: second.id, blocked: "noConsent" }),
      expect.objectContaining({ id: "nadie", blocked: "notFound" }),
    ]);
    // Un «gracias» no pide permiso.
    expect((await (await call(OWNER, "/customers/messages/check", post({ ids: [second.id], purpose: "thanks" }))).json()).items[0].blocked).toBeNull();
  });
});
