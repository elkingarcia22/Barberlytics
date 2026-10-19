import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { dueDateOf } from "./privacy";

const ADMIN = "mock-acc_admin-privacy";
const RECEPTION = "mock-acc_reception-privacy";
const BARBER = "mock-acc_barber-privacy";
const STEP_UP = "stepup-privacy";

const api = (path: string, init: RequestInit & { token?: string; stepUp?: boolean } = {}) =>
  fetch(`http://localhost/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${init.token ?? ADMIN}`,
      ...(init.stepUp ? { "x-step-up": STEP_UP } : {}),
    },
  });

/** Un cliente sin notas médicas ni permiso de salud (el seed deriva el permiso de las notas que ya tiene). */
const freshClient = () => {
  const client = db.calendar.clients.find((item) => item.id !== "cli_walkin" && item.notes.length === 0 && !db.customers.profiles[item.id]);
  if (!client) throw new Error("sin cliente limpio en el seed");
  return client;
};

describe("permiso de salud y derechos sobre los datos", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(ADMIN, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    db.sessions.set(BARBER, "acc_barber");
    db.stepUps.set(STEP_UP, { accountId: "acc_admin", expiresAt: Date.now() + 60_000 } as never);
  });

  test("sin el permiso aparte no se anotan alergias ni medicamentos; una nota normal sí", async () => {
    const client = freshClient();
    const allergy = await api(`/clients/${client.id}/notes`, { method: "POST", body: JSON.stringify({ kind: "allergy", text: "Alergia al látex" }) });
    expect(allergy.status).toBe(409);
    expect((await allergy.json()).code).toBe("health_consent_required");
    const note = await api(`/clients/${client.id}/notes`, { method: "POST", body: JSON.stringify({ kind: "note", text: "Le gusta el café" }) });
    expect(note.ok).toBe(true);

    const granted = await (await api(`/customers/${client.id}/consent`, { method: "PATCH", body: JSON.stringify({ health: true }) })).json();
    expect(granted.consent.health).toMatchObject({ accepted: true, source: "app", version: expect.stringMatching(/^health-/) });
    const after = await api(`/clients/${client.id}/notes`, { method: "POST", body: JSON.stringify({ kind: "allergy", text: "Alergia al látex" }) });
    expect(after.ok).toBe(true);
  });

  test("el barbero no anota el permiso de salud", async () => {
    const client = freshClient();
    const response = await api(`/customers/${client.id}/consent`, { method: "PATCH", token: BARBER, body: JSON.stringify({ health: true }) });
    expect(response.status).toBe(403);
  });

  test("retirar el permiso borra lo anotado y queda en el registro", async () => {
    const client = freshClient();
    await api(`/customers/${client.id}/consent`, { method: "PATCH", body: JSON.stringify({ health: true }) });
    await api(`/clients/${client.id}/notes`, { method: "POST", body: JSON.stringify({ kind: "medication", text: "Anticoagulantes" }) });
    await api(`/clients/${client.id}/notes`, { method: "POST", body: JSON.stringify({ kind: "note", text: "Corte bajo" }) });

    const revoked = await (await api(`/customers/${client.id}/consent`, { method: "PATCH", body: JSON.stringify({ health: false }) })).json();
    expect(revoked).toMatchObject({ consent: { health: { accepted: false } } });
    const notes = db.calendar.clients.find((item) => item.id === client.id)?.notes ?? [];
    expect(notes.map((item) => item.kind)).toEqual(["note"]);
    const log = await (await api(`/privacy-requests?clientId=${client.id}`)).json();
    expect(log.items).toEqual([expect.objectContaining({ type: "revoke", status: "done" })]);
  });

  test("exportar entrega todo lo del cliente y lo anota; recepción no exporta", async () => {
    const client = db.calendar.clients[1];
    expect((await api(`/customers/${client.id}/export`, { token: RECEPTION })).status).toBe(403);
    const data = await (await api(`/customers/${client.id}/export`)).json();
    expect(data.client).toMatchObject({ id: client.id, name: client.name, phone: client.phone });
    expect(Array.isArray(data.appointments)).toBe(true);
    expect(data.consents).toHaveProperty("health");
    expect(data.cards.every((card: Record<string, unknown>) => !("token" in card))).toBe(true);
    const log = await (await api(`/privacy-requests?clientId=${client.id}`)).json();
    expect(log.items[0]).toMatchObject({ type: "export", status: "done", by: expect.any(String) });
  });

  test("borrar pide confirmar la identidad y anonimiza sin perder las citas", async () => {
    const client = db.calendar.clients.find((item) => db.calendar.appointments.some((appointment) => appointment.clientId === item.id)) ?? db.calendar.clients[1];
    const appointments = db.calendar.appointments.filter((item) => item.clientId === client.id).length;
    expect((await api(`/customers/${client.id}/erase`, { method: "POST", body: "{}" })).status).toBe(403);

    const erased = await api(`/customers/${client.id}/erase`, { method: "POST", stepUp: true, body: JSON.stringify({ channel: "email" }) });
    expect(erased.ok).toBe(true);
    const after = db.calendar.clients.find((item) => item.id === client.id);
    expect(after).toMatchObject({ name: "Cliente borrado", phone: "", notes: [] });
    expect(db.customers.profiles[client.id]).toMatchObject({ email: "", deleted: true, erasedAt: expect.any(String) });
    expect(db.calendar.appointments.filter((item) => item.clientId === client.id)).toHaveLength(appointments);
    expect((await api(`/customers/${client.id}/export`)).status).toBe(404);
    // El registro dice de quién era, aunque el cliente ya no exista.
    const log = await (await api(`/privacy-requests?clientId=${client.id}`)).json();
    expect(log.items[0]).toMatchObject({ type: "erase", channel: "email", status: "done", clientName: client.name });
  });

  test("una solicitud por teléfono queda abierta con su plazo; gerencia la cierra", async () => {
    const client = db.calendar.clients[2];
    const missing = await api(`/customers/${client.id}/privacy-requests`, { method: "POST", token: RECEPTION, body: JSON.stringify({ type: "rectify" }) });
    expect(missing.status).toBe(422);
    const created = await (await api(`/customers/${client.id}/privacy-requests`, { method: "POST", token: RECEPTION, body: JSON.stringify({ type: "rectify", channel: "phone", note: "Cambió de correo" }) })).json();
    expect(created).toMatchObject({ status: "open", overdue: false, doneAt: null });
    expect(Date.parse(created.dueAt)).toBeGreaterThan(Date.parse(created.requestedAt));
    expect((await api("/privacy-requests?status=open")).ok).toBe(true);

    expect((await api(`/privacy-requests/${created.id}/done`, { method: "POST", token: RECEPTION, body: "{}" })).status).toBe(403);
    const done = await (await api(`/privacy-requests/${created.id}/done`, { method: "POST", body: JSON.stringify({ note: "Corregido" }) })).json();
    expect(done).toMatchObject({ status: "done", note: "Cambió de correo · Corregido" });
    expect((await api("/privacy-requests", { token: BARBER })).status).toBe(403);
  });

  test("los plazos siguen el país: Colombia en días hábiles, EE. UU. 45 días", () => {
    const friday = new Date("2026-10-16T15:00:00.000Z");
    // 10 hábiles desde un viernes: dos semanas completas, cae viernes 30.
    expect(dueDateOf("access", "CO", friday).toISOString().slice(0, 10)).toBe("2026-10-30");
    expect(dueDateOf("erase", "CO", friday).toISOString().slice(0, 10)).toBe("2026-11-06");
    expect(dueDateOf("erase", "US", friday).toISOString().slice(0, 10)).toBe("2026-11-30");
  });
});
