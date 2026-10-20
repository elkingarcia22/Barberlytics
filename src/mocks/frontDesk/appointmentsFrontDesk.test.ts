import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";

const OWNER = "mock-acc_admin-fd";
const call = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${OWNER}` } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

describe("recepción: sede de la cita, walk-in que llega y aviso de lista de espera", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-20T15:00:00.000Z") });
  });
  afterEach(() => vi.useRealTimers());

  const client = () => db.calendar.clients.find((item) => item.id !== "cli_walkin")!.id;

  test("la cita va a la sede donde se crea si el barbero trabaja ahí; si no, a la suya", async () => {
    // El dueño también corta y trabaja en las cuatro sedes.
    const owner = db.team.members.find((item) => item.id === "team-01")!;
    db.team.members = db.team.members.map((item) => (item.id === owner.id ? { ...item, isAlsoBarber: true } : item));
    const service = db.services.items.find((item) => item.kind === "service")!.id;
    const inNc = await call("/appointments", post({ clientId: client(), barberId: "team-04", serviceIds: [service], start: "2026-10-27T10:00", repeat: "none", branchId: "nc", force: true }));
    const created = await inNc.json();
    // team-04 solo trabaja en «ma»: la cita va a su sede.
    expect(created.branchId).toBe(db.team.members.find((item) => item.id === "team-04")!.branchIds[0]);
  });

  test("un walk-in de hoy nace «llegó»; uno de otro día, agendado", async () => {
    const service = db.services.items.find((item) => item.kind === "service")!.id;
    const today = await (await call("/appointments", post({ clientId: client(), barberId: "team-04", serviceIds: [service], start: "2026-10-20T16:00", repeat: "none", walkIn: true, requestedBarberId: null, branchId: "ma", force: true }))).json();
    expect(today.status).toBe("arrived");
    expect(today.history.map((item: { event: string }) => item.event)).toEqual(["walkin", "status:arrived"]);
    const later = await (await call("/appointments", post({ clientId: client(), barberId: "team-04", serviceIds: [service], start: "2026-10-22T16:00", repeat: "none", walkIn: true, requestedBarberId: null, branchId: "ma", force: true }))).json();
    expect(later.status).toBe("scheduled");
  });

  test("quien se apunta a la lista de espera avisa a recepción", async () => {
    const service = db.services.items.find((item) => item.kind === "service")!.id;
    const created = await call("/waitlist", post({ branchId: "ma", clientId: client(), serviceId: service, barberId: null, slots: [{ date: "2026-10-21", time: "10:00" }] }));
    expect(created.ok).toBe(true);
    const inbox = await (await call("/notifications?branchId=ma&role=recepcion")).json();
    expect(inbox.items).toContainEqual(expect.objectContaining({ kind: "waitlistJoined", params: expect.objectContaining({ day: "2026-10-21", time: "10:00" }) }));
  });
});
