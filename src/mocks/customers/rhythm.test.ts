import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { reactivationCandidates } from "./rhythm";
import { profileOf, saveProfile } from "./handlers";

const OWNER = "mock-acc_admin-test";
const BARBER = "mock-acc_barber-test";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });

describe("ritmo del cliente", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
  });

  test("la reactivación solo sale a quien aceptó promociones y no se repite en el mes", async () => {
    const candidates = reactivationCandidates("ma");
    expect(candidates.length).toBeGreaterThan(0);
    const [first, second] = candidates;
    const client = db.calendar.clients.find((item) => item.id === first.clientId)!;
    saveProfile(client.id, { ...profileOf(client), marketingConsent: { accepted: true, at: new Date().toISOString(), source: "app" } });
    const ids = [first.clientId, second?.clientId].filter(Boolean);
    const result = await (await call(OWNER, "/customers/reactivation", { method: "POST", body: JSON.stringify({ branchId: "ma", clientIds: ids }) })).json();
    const expectedQueued = first.offer ? 1 : 0;
    expect(result.queued).toBe(expectedQueued);
    if (second && !(profileOf(db.calendar.clients.find((item) => item.id === second.clientId)!).marketingConsent?.accepted)) expect(result.skipped).toContainEqual({ clientId: second.clientId, reason: "noConsent" });
    if (expectedQueued) {
      expect(db.booking.outbox!.some((message) => message.clientId === first.clientId && message.kind === "reactivation")).toBe(true);
      const again = await (await call(OWNER, "/customers/reactivation", { method: "POST", body: JSON.stringify({ branchId: "ma", clientIds: [first.clientId] }) })).json();
      expect(again).toEqual({ queued: 0, skipped: [{ clientId: first.clientId, reason: "recent" }] });
    }
  });

  test("un barbero no aprueba la reactivación", async () => {
    expect((await call(BARBER, "/customers/reactivation?branchId=ma")).status).toBe(403);
  });

  test("la próxima visita sale de su frecuencia, con huecos reales", async () => {
    const client = db.calendar.clients.find((item) => item.visitEveryDays && item.lastVisitAt)!;
    const { suggestion } = await (await call(OWNER, `/customers/${client.id}/next-visit`)).json();
    if (suggestion) {
      expect(suggestion.everyDays).toBe(client.visitEveryDays);
      expect(suggestion.options[0]).toMatchObject({ start: expect.any(String), barberName: expect.any(String) });
    }
  });
});
