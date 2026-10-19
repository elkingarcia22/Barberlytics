import { describe, expect, test } from "vitest";
import { renderWithProviders } from "@/test/render";
import { db } from "@/mocks/db";
import { appointmentsOn } from "@/mocks/calendar/handlers";
import { api } from "@/lib/api";
import { calendarApi } from "./api";

/**
 * La agenda del barbero recortada en el servidor (docs/roles/01-calendario.md): su columna, sus citas, la
 * ficha de sus clientes y solo el nombre de los demás; escribe solo en lo suyo y nunca fuerza.
 */

const DAY = (() => {
  const date = new Date(Date.now() + 2 * 86_400_000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
})();
const BARBER = "team-04";
const RENTER = "team-30";

function signIn(accountId: string) {
  const token = `mock-${accountId}-scope`;
  db.sessions.set(token, accountId);
  renderWithProviders(<div />, { token });
}

describe("agenda del barbero recortada en el servidor", () => {
  test("el día, el rango y el mes traen solo su columna; recepción ve todo", async () => {
    const all = appointmentsOn("ma", DAY);
    expect(new Set(all.map((item) => item.barberId)).size).toBeGreaterThan(1);
    signIn("acc_barber");
    const day = await calendarApi.day("ma", DAY);
    expect(day.appointments.length).toBeGreaterThan(0);
    expect(day.appointments.every((item) => item.barberId === BARBER)).toBe(true);
    expect(day.blocks.every((block) => block.barberId === BARBER)).toBe(true);
    expect(Object.keys(day.hours ?? {})).toEqual([BARBER]);
    const range = await api.get<{ items: { barberId: string }[] }>("/calendar/appointments", { query: { branchId: "ma", from: DAY, to: DAY } });
    expect(range.items.every((item) => item.barberId === BARBER)).toBe(true);
    const catalog = await calendarApi.catalog("ma");
    expect(catalog.barbers.map((barber) => barber.id)).toEqual([BARBER]);

    signIn("acc_reception");
    expect((await calendarApi.day("ma", DAY)).appointments.length).toBe(all.length);
  });

  test("de los clientes ajenos solo llega el nombre: sin teléfono ni notas de salud", async () => {
    signIn("acc_barber");
    const day = await calendarApi.day("ma", DAY);
    const catalog = await calendarApi.catalog("ma");
    const mine = catalog.clients.find((client) => client.id === day.appointments[0].clientId)!;
    expect(mine.phone).not.toBe("");
    const others = catalog.clients.filter((client) => client.phone === "");
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((client) => client.notes.length === 0 && client.name.length > 0)).toBe(true);
  });

  test("«cliente suyo» es lo mismo en Clientes y en la agenda, y no es la base entera", async () => {
    // La agenda de unas semanas atrás y por venir: lo que de verdad atendió y tiene agendado.
    for (let offset = -21; offset <= 7; offset++) appointmentsOn("ma", new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10));
    signIn("acc_barber");
    const customers = await api.get<{ items: { id: string }[] }>("/customers");
    const catalog = await calendarApi.catalog("ma");
    const full = catalog.clients.filter((client) => client.phone !== "" && client.type !== "walkin").map((client) => client.id).sort();
    expect(customers.items.map((item) => item.id).sort()).toEqual(full);
    expect(full.length).toBeGreaterThan(0);
    expect(full.length).toBeLessThan(catalog.clients.length * 0.6);
    // Todo cliente con el que tiene una cita en la agenda es suyo en Clientes.
    const booked = new Set(db.calendar.appointments.filter((item) => item.barberId === BARBER && item.status !== "cancelled" && item.status !== "no_show").map((item) => item.clientId));
    expect([...booked].every((id) => full.includes(id))).toBe(true);
  });

  test("escribe solo en lo suyo: no toca citas ajenas, no las pasa a otro, no fuerza ni devuelve dinero", async () => {
    const theirs = appointmentsOn("ma", DAY).find((item) => item.barberId !== BARBER && item.status === "scheduled")!;
    const mine = appointmentsOn("ma", DAY).find((item) => item.barberId === BARBER && item.status === "scheduled")!;
    signIn("acc_barber");
    await expect(calendarApi.updateAppointment(theirs.id, { notes: "x" })).rejects.toMatchObject({ status: 403 });
    await expect(calendarApi.updateAppointment(mine.id, { barberId: theirs.barberId })).rejects.toMatchObject({ status: 403 });
    await expect(calendarApi.createAppointment({ clientId: mine.clientId, barberId: theirs.barberId, serviceIds: mine.serviceIds, start: `${DAY}T23:00`, walkIn: false, repeat: "none" })).rejects.toMatchObject({ status: 403 });
    // Forzar no le sirve: encima de otra cita suya, la agenda dice que choca.
    const other = appointmentsOn("ma", DAY).find((item) => item.barberId === BARBER && item.id !== mine.id && item.status !== "cancelled" && item.status !== "no_show")!;
    await expect(calendarApi.updateAppointment(mine.id, { start: other.start.slice(0, 16), force: true })).rejects.toMatchObject({ status: 409 });
    await expect(calendarApi.updateAppointment(mine.id, { notes: "Trae su foto" })).resolves.toMatchObject({ notes: "Trae su foto" });
    const paid = appointmentsOn("ma", "2026-09-22").find((item) => item.barberId === BARBER && item.status === "paid")!;
    await expect(api.post(`/appointments/${paid.id}/refund`, { amount: 1, reason: "Prueba", to: "cash" })).rejects.toMatchObject({ status: 403 });
  });

  test("bloqueos: el de comisión no bloquea; el de renta solo su agenda", async () => {
    const block = { category: "lunch" as const, repeat: "none" as const, startDate: DAY, endDate: DAY, startTime: "13:00", endTime: "14:00", description: null };
    signIn("acc_barber");
    await expect(calendarApi.createBlock({ ...block, barberId: BARBER })).rejects.toMatchObject({ status: 403 });
    signIn("acc_renter");
    await expect(calendarApi.createBlock({ ...block, barberId: BARBER })).rejects.toMatchObject({ status: 403 });
    const own = await calendarApi.createBlock({ ...block, barberId: RENTER });
    expect(own.barberId).toBe(RENTER);
  });

  test("lista de espera: ve las suyas y las de cualquiera; se apunta consigo", async () => {
    const service = db.services.items[0].id;
    const client = db.calendar.clients[1].id;
    db.calendar.waitlist = [
      { id: "wl_a", branchId: "ma", clientId: client, serviceId: service, barberId: "team-05", slots: [{ date: DAY, time: "10:00" }], createdAt: new Date().toISOString() },
      { id: "wl_b", branchId: "ma", clientId: client, serviceId: service, barberId: null, slots: [{ date: DAY, time: "10:00" }], createdAt: new Date().toISOString() },
    ];
    signIn("acc_barber");
    expect((await calendarApi.waitlist("ma", DAY)).items.map((item) => item.id)).toEqual(["wl_b"]);
    const added = await calendarApi.addToWaitlist({ branchId: "ma", clientId: client, serviceId: service, barberId: null, slots: [{ date: DAY, time: "11:00" }] });
    expect(added.barberId).toBe(BARBER);
  });
});
