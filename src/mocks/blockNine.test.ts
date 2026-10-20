import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db";
import { appointmentsOn } from "./calendar/handlers";
import { referralCodeOf } from "./customers/loyalty";
import { runBirthdays } from "./marketing/automations";
import { saveProfile, profileOf } from "./customers/handlers";

const OWNER = "mock-acc_admin-nine";
const BARBER = "mock-acc_barber-nine";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/** Un día por venir, «AAAA-MM-DD». */
function inDays(days: number): string {
  const day = new Date();
  day.setDate(day.getDate() + days);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

const scheduled = (offset = 0) => appointmentsOn("ma", inDays(2)).filter((item) => item.status === "scheduled" && !item.walkIn)[offset];
const setSection = (key: string, value: unknown) => {
  db.settings = { ...db.settings, sections: { ...db.settings.sections, [key]: value } as typeof db.settings.sections };
};

describe("cortes, etiquetas, cupones, referidos y mensajes automáticos", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
  });

  test("un corte anotado queda con su fórmula y fotos, y es el último de la ficha", async () => {
    const client = db.calendar.clients.find((item) => item.id !== "cli_walkin")!;
    expect((await call(OWNER, `/customers/${client.id}/cuts`, post({ formula: {}, photos: [] }))).status).toBe(422);
    expect((await call(OWNER, `/customers/${client.id}/cuts`, post({ formula: { fade: "bajo" }, photos: ["no-es-foto"] }))).status).toBe(422);
    const created = await call(OWNER, `/customers/${client.id}/cuts`, post({ formula: { fade: "Bajo", guard: "1 a los lados, 3 arriba", products: "Cera mate" }, photos: [PHOTO] }));
    expect(created.status).toBe(201);
    const list = await (await call(OWNER, `/customers/${client.id}/cuts`)).json();
    expect(list.items).toHaveLength(1);
    const detail = await (await call(OWNER, `/customers/${client.id}`)).json();
    expect(detail.lastCut).toMatchObject({ formula: { fade: "Bajo", guard: "1 a los lados, 3 arriba" }, photos: [PHOTO] });
  });

  test("las etiquetas se normalizan, se ponen a varios y el barbero no las cambia", async () => {
    const [a, b] = db.calendar.clients.filter((item) => item.id !== "cli_walkin");
    const set = await call(OWNER, `/customers/${a.id}/tags`, { method: "PUT", body: JSON.stringify({ tags: ["  Cera  Mate ", "cera mate", "VIP"] }) });
    expect((await set.json()).tags).toEqual(["cera mate", "vip"]);
    const bulk = await call(OWNER, "/customers/tags", post({ ids: [a.id, b.id], add: ["Estudiante"], remove: ["vip"] }));
    expect((await bulk.json()).updated).toBe(2);
    expect(profileOf(a).tags).toEqual(["cera mate", "estudiante"]);
    expect(profileOf(b).tags).toContain("estudiante");
    const catalog = await (await call(OWNER, "/customers/tags")).json();
    expect(catalog.items.find((item: { name: string }) => item.name === "estudiante").count).toBeGreaterThanOrEqual(2);
    expect((await call(BARBER, "/customers/tags", post({ ids: [a.id], add: ["x"] }))).status).toBe(403);
    const list = await (await call(OWNER, "/customers")).json();
    expect(list.items.find((item: { id: string }) => item.id === a.id).tags).toEqual(["cera mate", "estudiante"]);
  });

  test("un cupón de Configuración vale en la reserva y en la caja con sus fechas y topes", async () => {
    const yesterday = inDays(-1);
    const base = { type: "percent", value: 20, description: "", firstVisitOnly: false, minAppointments: null, validFrom: null, serviceIds: [], maxUses: null, active: true };
    expect((await call(OWNER, "/settings/lists/coupons", post({ ...base, code: "VENCIDO", validTo: yesterday, perClient: null }))).status).toBe(201);
    expect((await call(OWNER, "/settings/lists/coupons", post({ ...base, code: "martes 20", validTo: null, perClient: 1 }))).status).toBe(201);
    expect((await call(OWNER, "/settings/lists/coupons", post({ ...base, code: "MARTES20", validTo: null, perClient: 1 }))).status).toBe(422);
    const expired = await call(null, "/booking/promo", post({ code: "vencido", appointments: 1 }));
    expect(expired.status).toBe(422);
    expect((await expired.json()).problem).toBe("expired");
    const appointment = scheduled();
    const scope = { clientId: appointment.clientId, branchId: "ma", serviceIds: appointment.serviceIds };
    expect((await call(OWNER, "/coupons/check", post({ ...scope, code: "martes20" }))).ok).toBe(true);
    const paid = await call(OWNER, `/appointments/${appointment.id}/checkout`, post({ method: "cash", tip: 0, coupon: "MARTES20" }));
    expect(paid.ok).toBe(true);
    const payment = (await paid.json()).payment;
    expect(payment.coupon).toBe("MARTES20");
    expect(payment.discount).toBeGreaterThan(0);
    // Uno por cliente: la segunda vez ya no.
    const again = await call(OWNER, "/coupons/check", post({ ...scope, code: "MARTES20" }));
    expect((await again.json()).details.problem).toBe("usedByClient");
    const list = await (await call(OWNER, "/settings/lists/coupons")).json();
    expect(list.items.find((item: { code: string }) => item.code === "MARTES20").uses).toBe(1);
  });

  test("quien llega con un código queda referido y, al cobrarse su primera visita, los dos reciben saldo", async () => {
    const referrer = db.calendar.clients.find((item) => item.id !== "cli_walkin")!;
    const bad = await call(OWNER, "/customers", post({ firstName: "Nuevo", lastName: "Cliente", phone: "+573119998877", email: "", country: "", state: "", city: "", address: "", zipcode: "", birthDate: "", onlineOnly: false, referralCode: "NADIE0000" }));
    expect(bad.status).toBe(422);
    const created = await call(OWNER, "/customers", post({ firstName: "Nuevo", lastName: "Cliente", phone: "+573119998877", email: "", country: "", state: "", city: "", address: "", zipcode: "", birthDate: "", onlineOnly: false, source: "instagram", referralCode: referralCodeOf(referrer).toLowerCase() }));
    expect(created.status).toBe(201);
    const newbie = await created.json();
    expect(newbie).toMatchObject({ source: "referral", referral: { referredBy: { id: referrer.id } } });
    const appointment = scheduled(1);
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === appointment.id ? { ...item, clientId: newbie.id } : item));
    expect((await call(OWNER, `/appointments/${appointment.id}/checkout`, post({ method: "cash", tip: 0 }))).ok).toBe(true);
    expect(db.booking.credits[newbie.id]).toBe(5);
    expect(db.booking.credits[referrer.id]).toBe(5);
    const card = await (await call(OWNER, `/customers/${referrer.id}`)).json();
    expect(card.referral).toMatchObject({ referred: 1, rewarded: 1, earned: 5 });
  });

  test("las gracias y la reseña salen solas al cobrar; el cumpleaños solo con permiso y una vez al año", async () => {
    setSection("marketing", { referral: { enabled: false, reward: 0, maxPerReferrer: 0 }, automations: { birthday: { enabled: true }, thanks: { enabled: true, delayHours: 3 }, review: { enabled: true, delayHours: 2 } } });
    const appointment = scheduled(2);
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId)!;
    db.calendar.clients = db.calendar.clients.map((item) => (item.id === client.id ? { ...item, visits: 0 } : item));
    expect((await call(OWNER, `/appointments/${appointment.id}/checkout`, post({ method: "cash", tip: 0 }))).ok).toBe(true);
    const kinds = (db.booking.outbox ?? []).filter((item) => item.clientId === client.id).map((item) => item.kind);
    expect(kinds).toEqual(expect.arrayContaining(["thanks", "reviewRequest"]));
    const review = db.booking.outbox?.find((item) => item.kind === "reviewRequest" && item.clientId === client.id);
    expect(review?.params?.[0]).toBe(client.name.split(" ")[0]);

    // Cumpleaños de hoy: sin permiso no sale; con permiso, una vez.
    const birthdayClient = db.calendar.clients.find((item) => item.id !== "cli_walkin" && item.id !== client.id && item.phone)!;
    const today = new Date().toISOString().slice(5, 10);
    saveProfile(birthdayClient.id, { ...profileOf(birthdayClient), birthDate: `1990-${today}`, branchId: "ma", marketingConsent: undefined });
    expect(runBirthdays().filter((item) => item.clientId === birthdayClient.id)).toHaveLength(0);
    saveProfile(birthdayClient.id, { ...profileOf(birthdayClient), marketingConsent: { accepted: true, at: new Date().toISOString(), source: "app" } });
    db.booking.outbox = (db.booking.outbox ?? []).filter((item) => item.clientId !== birthdayClient.id);
    expect(runBirthdays().filter((item) => item.clientId === birthdayClient.id)).toHaveLength(1);
    expect(runBirthdays().filter((item) => item.clientId === birthdayClient.id)).toHaveLength(0);
  });
});
