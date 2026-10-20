import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { estimateCost, marketingPriceFor } from "@/features/marketing/messagePricing";
import { matchesGroup } from "@/features/customers/groupFilter";
import { db } from "./db";
import { profileOf, saveProfile } from "./customers/handlers";
import { audienceOf } from "./marketing/campaigns";
import { buildMarketingMetrics } from "./metricsTabs";

const OWNER = "mock-acc_admin-ten";
const RECEPTION = "mock-acc_reception-ten";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const CERA = { segment: null, alert: null, tag: "cera mate", source: null };

/** Da permiso de promociones a todos los del grupo «cera mate» menos al primero. */
function consentAllButFirst() {
  const members = audienceOf(CERA);
  members.forEach((client, index) => saveProfile(client.id, { ...profileOf(client), marketingConsent: index === 0 ? undefined : { accepted: true, at: new Date().toISOString(), source: "app" } }));
  return members;
}

describe("grupos guardados, campañas con vista previa y costo, resultados y origen del cliente", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    // Un martes a mediodía: dentro de la franja legal de promociones de la sede (EE. UU.).
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-20T16:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  test("los filtros de grupo son los de la lista: segmento, aviso, etiqueta y origen", () => {
    const base = { segment: "frequent", lastVisitAt: null, visitEveryDays: null, birthDate: null, cancellations: 2, noShows: 1, tags: ["vip"], source: null };
    expect(matchesGroup(base, { segment: "frequent", alert: "unreliable", tag: "vip", source: "unknown" })).toBe(true);
    expect(matchesGroup(base, { segment: null, alert: null, tag: "cera mate", source: null })).toBe(false);
    expect(matchesGroup(base, { segment: null, alert: null, tag: null, source: "instagram" })).toBe(false);
  });

  test("el costo sale del país de cada sede", () => {
    expect(marketingPriceFor("Colombia")).toBe(0.0125);
    expect(estimateCost(["US", "US", "CO"])).toBe(0.06);
  });

  test("un grupo se guarda con su tamaño de hoy; recepción lo arma y no repite nombres", async () => {
    const created = await call(RECEPTION, "/customers/groups", post({ name: "Cera mate", filters: CERA }));
    expect(created.status).toBe(201);
    expect((await created.json()).size).toBe(audienceOf(CERA).length);
    expect((await call(RECEPTION, "/customers/groups", post({ name: "cera mate", filters: CERA }))).status).toBe(422);
    expect((await call(RECEPTION, "/customers/groups", post({ name: "Todos", filters: {} }))).status).toBe(422);
    const list = await (await call(OWNER, "/customers/groups")).json();
    expect(list.items).toHaveLength(1);
  });

  test("la vista previa dice a quién sí, a quién no y cuánto costaría; mandar programa uno por cliente", async () => {
    const members = consentAllButFirst();
    expect(members.length).toBeGreaterThan(1);
    const draft = { filters: CERA, body: "Hola {nombre}, usa {cupon} esta semana.", couponCode: "BARBER5" };
    expect((await call(RECEPTION, "/campaigns/preview", post(draft))).status).toBe(403);
    expect((await call(OWNER, "/campaigns/preview", post({ ...draft, couponCode: null }))).status).toBe(422);
    const preview = await (await call(OWNER, "/campaigns/preview", post(draft))).json();
    expect(preview.audience).toBe(members.length);
    expect(preview.excluded.noConsent).toBeGreaterThanOrEqual(1);
    expect(preview.eligible).toBe(members.length - Object.values(preview.excluded as Record<string, number>).reduce((sum, value) => sum + value, 0));
    expect(preview.cost.amount).toBeGreaterThan(0);
    expect(preview.sample.text).toMatch(/^Hola \S+, usa BARBER5 esta semana\.$/);

    const sent = await call(OWNER, "/campaigns", post({ ...draft, name: "Cera mate octubre" }));
    expect(sent.status).toBe(201);
    const campaign = await sent.json();
    expect(campaign.recipients).toBe(preview.eligible);
    const messages = (db.booking.outbox ?? []).filter((item) => item.campaignId === campaign.id);
    expect(messages).toHaveLength(preview.eligible);
    expect(messages.every((item) => item.kind === "campaign" && item.params?.[1]?.includes("BARBER5"))).toBe(true);
    // Ya recibieron una promoción: una segunda campaña no les llega (tope de una al mes).
    const again = await (await call(OWNER, "/campaigns/preview", post(draft))).json();
    expect(again.excluded.promoCap).toBe(preview.eligible);
  });

  test("los resultados cuentan lo que salió, quién reservó en 14 días y lo cobrado; cancelar frena lo pendiente", async () => {
    const members = consentAllButFirst();
    const campaign = await (await call(OWNER, "/campaigns", post({ name: "Vuelve", filters: CERA, body: "Hola {nombre}, te esperamos." }))).json();
    const recipient = members.find((client) => profileOf(client).marketingConsent?.accepted)!;
    // Uno de ellos reserva dos días después y paga.
    db.calendar.appointments = [
      { id: "apt_cmp_1", branchId: "ma", clientId: recipient.id, barberId: "team-04", requestedBarberId: null, serviceIds: ["svc_corte"], products: [], start: "2026-10-24T10:00:00", durationMin: 30, status: "paid", barberReady: false, walkIn: false, source: "online", repeat: "none", seriesId: null, notes: null, createdAt: "2026-10-22T15:00:00.000Z", createdBy: recipient.name, history: [], payment: { method: "card", tip: 5, tax: 0, total: 40, paidAt: "2026-10-24T10:40:00.000Z" } },
      ...db.calendar.appointments,
    ];
    const list = await (await call(OWNER, "/campaigns")).json();
    const results = list.items.find((item: { id: string }) => item.id === campaign.id).results;
    expect(results).toMatchObject({ bookedClients: 1, bookings: 1, revenue: 35 });
    expect(results.scheduled).toBe(campaign.recipients);
    expect(results.roi).toBeGreaterThan(0);
    const cancelled = await (await call(OWNER, `/campaigns/${campaign.id}/cancel`, post({}))).json();
    expect(cancelled).toMatchObject({ status: "cancelled", results: { scheduled: 0, cancelled: campaign.recipients } });
  });

  test("Métricas › Marketing reparte a los clientes atendidos por origen", () => {
    vi.useRealTimers();
    const data = buildMarketingMetrics({ granularity: "month", date: "2026-09-15", barberId: "all", branchId: "ma" });
    expect(data.origins.length).toBeGreaterThan(0);
    expect(data.origins.every((row) => row.clients >= row.newClients)).toBe(true);
    expect(data.origins.map((row) => row.id)).toEqual(expect.arrayContaining(["instagram"]));
  });
});
