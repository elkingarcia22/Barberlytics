import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import type { MockAppointment } from "../calendar/seed";
import { payloadOf } from "./dispatch";
import { startInstant } from "../settings/branchRules";
import { reminderPlan, rescheduleMessages, scheduleMessages } from "./reminders";

const DAY_MS = 86_400_000;
const future = () => appointmentsOn("ma", new Date(Date.now() + 4 * DAY_MS).toISOString().slice(0, 10)).find((item) => item.status === "scheduled" && !item.walkIn) as MockAppointment;
const messagesOf = (id: string) => (db.booking.outbox ?? []).filter((item) => item.appointmentId === id && item.status === "scheduled");
const setPrefs = (prefs: Record<string, unknown>) => {
  db.settings.sections = { ...db.settings.sections, notifications: { toggles: {}, thresholds: {}, ...prefs } };
};

describe("recordatorios según Configuración", () => {
  beforeEach(() => {
    db.reset();
    db.booking.outbox = [];
  });

  test("por defecto: confirmación y recordatorios a 24 h y 2 h", () => {
    const appointment = future();
    scheduleMessages(appointment, "+573001112233");
    expect(messagesOf(appointment.id).map((item) => item.kind)).toEqual(["confirmation", "reminder24h", "reminder2h"]);
  });

  test("las horas que elige la barbería, hasta tres y sin repetir; la plantilla lleva la hora", () => {
    setPrefs({ reminderHours: [2, 48, 48, 6, 1] });
    expect(reminderPlan().map((item) => item.hoursBefore)).toEqual([48, 6, 2]);
    const appointment = future();
    scheduleMessages(appointment, "+573001112233");
    const reminder = messagesOf(appointment.id).find((item) => item.hoursBefore === 48)!;
    expect(reminder.kind).toBe("reminder");
    expect(startInstant(appointment).getTime() - new Date(reminder.sendAt).getTime()).toBe(48 * 3_600_000);
    expect(payloadOf(reminder)?.params.at(-1)).toBe("48");
  });

  test("lo apagado para el cliente por WhatsApp no se programa", () => {
    setPrefs({ toggles: { "clients.bookingReminder.whatsapp": false, "clients.bookingConfirmed.whatsapp": false, "clients.bookingRescheduled.whatsapp": false } });
    const appointment = future();
    scheduleMessages(appointment, "+573001112233");
    expect(messagesOf(appointment.id)).toEqual([]);
    rescheduleMessages({ ...appointment, start: appointment.start.replace(/T\d{2}/, "T20") }, "+573001112233");
    expect(messagesOf(appointment.id)).toEqual([]);
  });

  test("mover la cita avisa del cambio aunque la confirmación esté apagada", () => {
    setPrefs({ toggles: { "clients.bookingConfirmed.whatsapp": false } });
    const appointment = future();
    rescheduleMessages(appointment, "+573001112233");
    expect(messagesOf(appointment.id).map((item) => item.kind)).toContain("rescheduled");
  });
});
