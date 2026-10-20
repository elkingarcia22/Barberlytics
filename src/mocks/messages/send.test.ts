import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";

const TOKEN = "mock-acc_admin-send";

async function post(id: string, body: Record<string, unknown>) {
  const response = await fetch(`http://localhost/api/appointments/${id}/messages`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(body) });
  return { status: response.status, json: (await response.json()) as Record<string, unknown> };
}

describe("enviar al cliente desde el panel de la cita", () => {
  const day = format(addDays(new Date(), -3), "yyyy-MM-dd");

  it("manda el recibo de una cita cobrada y queda en sus mensajes", async () => {
    db.sessions.set(TOKEN, "acc_admin");
    const paid = appointmentsOn("ma", day).find((item) => item.status === "paid")!;
    const sent = await post(paid.id, { kind: "receipt", channel: "email", to: "cliente@correo.com", body: "Tu recibo" });
    expect(sent).toEqual({ status: 201, json: { channel: "email", to: "cliente@correo.com" } });
    expect((db.booking.outbox ?? []).some((message) => message.appointmentId === paid.id && message.kind === "receipt" && message.status === "sent")).toBe(true);
  });

  it("rechaza un destino que no sirve y el recibo de una cita sin cobrar", async () => {
    db.sessions.set(TOKEN, "acc_admin");
    const paid = appointmentsOn("ma", day).find((item) => item.status === "paid")!;
    expect((await post(paid.id, { kind: "rebookLink", channel: "sms", to: "123", body: "Enlace" })).status).toBe(422);
    // El primer día por venir que tenga citas agendadas (un domingo la sede cierra).
    const upcoming = [5, 6, 7, 8].map((offset) => appointmentsOn("ma", format(addDays(new Date(), offset), "yyyy-MM-dd")).find((item) => item.status === "scheduled")).find(Boolean)!;
    expect((await post(upcoming.id, { kind: "receipt", channel: "email", to: "cliente@correo.com", body: "Tu recibo" })).status).toBe(409);
    expect((await post(upcoming.id, { kind: "rebookLink", channel: "sms", to: "+573001234567", body: "Enlace" })).status).toBe(201);
  });
});
