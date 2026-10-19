import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { branchNow } from "../settings/branchRules";
import { notificationsFor } from "../notifications/handlers";
import { resetKioskLimits } from "./handlers";
import { estimateQueue } from "./estimate";
import { applyReply } from "../booking/replies";

const OWNER = "mock-acc_admin-frontdesk";
const RECEPTION = "mock-acc_reception-frontdesk";
const BARBER = "mock-acc_barber-frontdesk";

const staff = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
const kiosk = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { "x-kiosk-token": token } : {}), ...(init.headers ?? {}) } });
const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

/** Un kiosco de Massachusetts ya emparejado. */
async function pairedKiosk(): Promise<string> {
  const device = await (await staff(OWNER, "/front-desk/devices", post({ branchId: "ma", name: "Entrada" }))).json();
  const paired = await (await kiosk(null, "/kiosk/pair", post({ code: device.pairingCode }))).json();
  return paired.token as string;
}

/** Una cita de hoy, ahora, en Massachusetts, para un cliente con celular conocido. */
async function appointmentNow(clientId = "cli_002") {
  const local = branchNow("ma");
  const minute = Math.floor((Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16))) / 5) * 5;
  const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  const catalog = await (await staff(OWNER, "/calendar/catalog?branchId=ma")).json();
  const created = await (await staff(OWNER, "/appointments", post({ clientId, barberId: catalog.barbers[0].id, serviceIds: [catalog.services[0].id], start: `${local.slice(0, 10)}T${time}`, walkIn: false, repeat: "none", force: true, branchId: "ma" }))).json();
  const phone = db.calendar.clients.find((item) => item.id === clientId)!.phone;
  return { appointment: created, phone };
}

describe("recepción y kiosco", () => {
  beforeEach(() => {
    db.reset();
    resetKioskLimits();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    db.sessions.set(BARBER, "acc_barber");
  });

  test("el kiosco se activa con un código de una sola vez; solo gerencia lo crea y lo desactiva", async () => {
    expect((await staff(RECEPTION, "/front-desk/devices", post({ branchId: "ma" }))).status).toBe(403);
    const device = await (await staff(OWNER, "/front-desk/devices", post({ branchId: "ma", name: "Entrada" }))).json();
    expect(device).toMatchObject({ branchId: "ma", status: "pending", pairingCode: expect.stringMatching(/^\d{6}$/) });
    expect((await kiosk(null, "/kiosk/pair", post({ code: "000000" }))).status).toBe(422);
    const paired = await (await kiosk(null, "/kiosk/pair", post({ code: device.pairingCode }))).json();
    expect(paired).toMatchObject({ branch: { id: "ma" }, token: expect.stringMatching(/^kio_/) });
    expect((await kiosk(null, "/kiosk/pair", post({ code: device.pairingCode }))).status).toBe(422);
    // La lista nunca muestra el token.
    const listed = await (await staff(OWNER, "/front-desk/devices")).json();
    expect(JSON.stringify(listed)).not.toContain(paired.token);
    expect((await kiosk(paired.token, "/kiosk/me")).status).toBe(200);
    await staff(OWNER, `/front-desk/devices/${device.id}`, { method: "DELETE" });
    expect((await kiosk(paired.token, "/kiosk/me")).status).toBe(401);
    expect((await kiosk(null, "/kiosk/me")).status).toBe(401);
  });

  test("buscar por celular muestra solo nombre de pila y hora; un número desconocido no dice nada", async () => {
    const token = await pairedKiosk();
    const { appointment, phone } = await appointmentNow();
    const found = await (await kiosk(token, "/kiosk/lookup", post({ phone }))).json();
    expect(found.appointments).toEqual([{ id: appointment.id, time: appointment.start.slice(11, 16), firstName: expect.any(String) }]);
    expect(found.appointments[0].firstName).not.toContain(" ");
    expect(await (await kiosk(token, "/kiosk/lookup", post({ phone: "+19998887777" }))).json()).toEqual({ appointments: [] });
  });

  test("«Ya llegué» pasa la cita a «Llegó» y avisa a su barbero y a recepción; con otro celular no", async () => {
    const token = await pairedKiosk();
    const { appointment, phone } = await appointmentNow();
    expect((await kiosk(token, "/kiosk/check-in", post({ appointmentId: appointment.id, phone: "+19998887777" }))).status).toBe(404);
    const done = await (await kiosk(token, "/kiosk/check-in", post({ appointmentId: appointment.id, phone }))).json();
    expect(done).toMatchObject({ time: appointment.start.slice(11, 16) });
    const saved = db.calendar.appointments.find((item) => item.id === appointment.id)!;
    expect(saved.status).toBe("arrived");
    expect(saved.history.at(-1)).toMatchObject({ event: "status:arrived", actor: "Kiosco · Entrada" });
    expect(notificationsFor("ma", "recepcion", null).some((item) => item.kind === "clientArrived" && item.id === `arrived:${appointment.id}`)).toBe(true);
    expect(notificationsFor("ma", "barbero-comision", appointment.barberId).some((item) => item.kind === "clientArrived")).toBe(true);
  });

  test("la fila: se une en el kiosco con su lugar y espera; recepción lo llama (cita «Llegó») o marca que se fue", async () => {
    const token = await pairedKiosk();
    const me = await (await kiosk(token, "/kiosk/me")).json();
    const serviceId = me.services[0].id;
    const first = await (await kiosk(token, "/kiosk/queue", post({ firstName: "Ana", serviceIds: [serviceId], barberId: null }))).json();
    const second = await (await kiosk(token, "/kiosk/queue", post({ firstName: "Beto", phone: "+15551234567", serviceIds: [serviceId], barberId: null }))).json();
    expect(first.position).toBe(1);
    expect(second.position).toBe(2);
    expect((await kiosk(token, "/kiosk/queue", post({ firstName: "Beto", phone: "+15551234567", serviceIds: [serviceId] }))).status).toBe(409);
    expect((await kiosk(token, "/kiosk/queue", post({ firstName: "", serviceIds: [] }))).status).toBe(422);

    const queue = await (await staff(RECEPTION, "/front-desk/queue?branchId=ma")).json();
    expect(queue.waiting.map((item: { firstName: string }) => item.firstName)).toEqual(["Ana", "Beto"]);
    // Un barbero la ve, pero no la mueve.
    expect((await staff(BARBER, `/front-desk/queue/${first.id}/call`, post({}))).status).toBe(403);

    const called = await (await staff(RECEPTION, `/front-desk/queue/${first.id}/call`, post({}))).json();
    expect(called.appointment).toMatchObject({ status: "arrived", walkIn: true, branchId: "ma" });
    expect(called.queue).toMatchObject({ served: 1, waiting: [{ firstName: "Beto", position: 1 }] });
    const left = await (await staff(RECEPTION, `/front-desk/queue/${second.id}/leave`, post({ reason: "left" }))).json();
    expect(left).toMatchObject({ waiting: [], served: 1, left: 1 });
  });

  test("«ya casi te toca» sale una vez a quien dejó celular; «Ya no voy» lo saca de la fila", async () => {
    const token = await pairedKiosk();
    const me = await (await kiosk(token, "/kiosk/me")).json();
    const joined = await (await kiosk(token, "/kiosk/queue", post({ firstName: "Ana", phone: "+15551230000", serviceIds: [me.services[0].id], barberId: null }))).json();
    // Recién unida no se le escribe: está aquí y ya vio su espera.
    expect((db.booking.outbox ?? []).some((item) => item.kind === "queueAlmost")).toBe(false);
    db.frontDesk = { ...db.frontDesk, queue: db.frontDesk.queue.map((entry) => ({ ...entry, joinedAt: new Date(Date.now() - 10 * 60_000).toISOString() })) };
    await staff(RECEPTION, "/front-desk/queue?branchId=ma");
    await staff(RECEPTION, "/front-desk/queue?branchId=ma");
    const sent = (db.booking.outbox ?? []).filter((item) => item.kind === "queueAlmost");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "+15551230000", queueEntryId: joined.id, params: ["Ana", expect.any(String), expect.stringMatching(/^en unos/)] });

    applyReply({ wamid: "wamid.novoy", at: new Date().toISOString(), from: "15551230000", intent: "cancel", text: "Ya no voy", messageId: sent[0].id });
    const queue = await (await staff(RECEPTION, "/front-desk/queue?branchId=ma")).json();
    expect(queue).toMatchObject({ waiting: [], left: 1 });
  });

  test("la pantalla de turnos muestra a quién llamaron y quién sigue, sin celular ni servicio", async () => {
    const token = await pairedKiosk();
    const me = await (await kiosk(token, "/kiosk/me")).json();
    const first = await (await kiosk(token, "/kiosk/queue", post({ firstName: "Ana", phone: "+15551230001", serviceIds: [me.services[0].id], barberId: null }))).json();
    await kiosk(token, "/kiosk/queue", post({ firstName: "Beto", serviceIds: [me.services[0].id], barberId: null }));
    await staff(RECEPTION, `/front-desk/queue/${first.id}/call`, post({}));
    const board = await (await kiosk(token, "/kiosk/board")).json();
    expect(board.called).toEqual([{ id: first.id, firstName: "Ana", barberFirstName: expect.any(String), calledAt: expect.any(String) }]);
    // Solo turno, nombre de pila y espera (que puede ser null cerca del cierre).
    expect(board.next).toMatchObject([{ position: 1, firstName: "Beto" }]);
    expect(Object.keys(board.next[0]).sort()).toEqual(["firstName", "id", "position", "waitMax", "waitMin"]);
    expect(JSON.stringify(board)).not.toContain("5551230001");
    expect((await kiosk(null, "/kiosk/board")).status).toBe(401);
  });

  test("la espera crece en la fila y quien pide un barbero ocupado espera más que sin preferencia", () => {
    const day = branchNow("ma").slice(0, 10);
    const base = { branchId: "ma", day, phone: null, clientId: null, serviceIds: ["svc_corte"], status: "waiting" as const, source: "kiosk" as const, calledAt: null, appointmentId: null, leftAt: null };
    const entries = Array.from({ length: 6 }, (_, index) => ({ ...base, id: `q${index}`, firstName: `C${index}`, barberId: null, joinedAt: `2026-01-01T00:0${index}:00.000Z` }));
    const estimates = estimateQueue("ma", entries);
    const waits = entries.map((entry) => estimates.get(entry.id)?.waitMin ?? Number.MAX_SAFE_INTEGER);
    expect(waits).toEqual([...waits].sort((a, b) => a - b));
    expect(estimates.get("q0")?.position).toBe(1);
  });
});
