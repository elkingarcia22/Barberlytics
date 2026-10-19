import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";
import { reactivationCandidates } from "./rhythm";
import { profileOf, saveProfile } from "./handlers";

const OWNER = "mock-acc_admin-window";
const call = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${OWNER}` } });
const consent = (clientId: string) => {
  const client = db.calendar.clients.find((item) => item.id === clientId)!;
  saveProfile(client.id, { ...profileOf(client), marketingConsent: { accepted: true, at: new Date().toISOString(), source: "app" } });
  return client;
};

describe("franja legal de las promociones en la app", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
  });
  afterEach(() => vi.useRealTimers());

  test("de noche la reactivación se aprueba, pero sale cuando abre la franja de la sede", async () => {
    // Martes 20 de octubre, 10:30 p. m. en Boston (EDT): pasada la franja federal (8 a 9).
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-21T02:30:00.000Z") });
    const list = await (await call("/customers/reactivation?branchId=ma")).json();
    expect(list.window).toEqual({ allowed: false, nextAt: new Date("2026-10-21T12:00:00.000Z").toISOString(), timeZone: "America/New_York" });
    const target = reactivationCandidates("ma").find((item) => item.offer && item.hasPhone && !item.recentlyContacted);
    expect(target).toBeDefined();
    consent(target!.clientId);
    const result = await (await call("/customers/reactivation", { method: "POST", body: JSON.stringify({ branchId: "ma", clientIds: [target!.clientId] }) })).json();
    expect(result).toMatchObject({ queued: 1, sendAt: "2026-10-21T12:00:00.000Z" });
    expect(db.booking.outbox?.find((item) => item.clientId === target!.clientId && item.kind === "reactivation")?.sendAt).toBe("2026-10-21T12:00:00.000Z");
  });

  test("un «te toca volver» manual fuera de la franja no se registra; de día sí", async () => {
    const client = consent("cli_001");
    const promo = { method: "POST", body: JSON.stringify({ purpose: "rebook", body: "Hola, te toca volver" }) };
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-21T05:00:00.000Z") });
    const night = await call(`/customers/${client.id}/messages`, promo);
    expect(night.status).toBe(409);
    expect((await night.json()).code).toBe("outside_window");
    const relationship = await (await call(`/customers/${client.id}/relationship`)).json();
    expect(relationship.promoWindow).toMatchObject({ allowed: false });
    // Un «gracias» no es promoción: sale a cualquier hora.
    expect((await call(`/customers/${client.id}/messages`, { method: "POST", body: JSON.stringify({ purpose: "thanks", body: "Gracias por venir" }) })).status).toBe(201);
    vi.setSystemTime(new Date("2026-10-21T15:00:00.000Z"));
    expect((await call(`/customers/${client.id}/messages`, promo)).status).toBe(201);
  });
});
