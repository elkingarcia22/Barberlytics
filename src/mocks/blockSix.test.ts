import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db";
import { createGiftCard, sendGiftCard } from "./booking/giftCards";
import { deviceLabel } from "@/features/auth/device";
import { earnedOf } from "@/features/payroll/payrollUtils";

const OWNER = "mock-acc_admin-six";
const ADMIN = "mock-acc_manager-six";
const RECEPTION = "mock-acc_reception-six";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

describe("todas las sucursales, lo que gana hoy, tarjeta de regalo y dispositivo nuevo", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(ADMIN, "acc_manager");
    db.sessions.set(RECEPTION, "acc_reception");
  });

  test("«Todas las sucursales» suma las sedes, es del dueño y no mezcla monedas", async () => {
    const query = (branchId: string, token = OWNER) => call(token, `/metrics/business?granularity=month&date=2026-09-15&barberId=all&branchId=${branchId}`);
    const ma = await (await query("ma")).json();
    const all = await (await query("all")).json();
    expect(all.barbers.length).toBeGreaterThan(ma.barbers.length);
    expect(JSON.stringify(all)).not.toEqual(JSON.stringify(ma));
    expect((await query("all", ADMIN)).status).toBe(403);
    db.settings.lists.branches = db.settings.lists.branches.map((item) => (item.id === "ut" ? { ...item, currency: "COP" } : item));
    const mixed = await query("all");
    expect(mixed.status).toBe(409);
    expect((await mixed.json()).code).toBe("mixed_currency");
    // Un mes de cuatro sedes se simula entero: con carga tarda más que los 5 s por defecto.
  }, 30_000);

  test("lo que gana hoy: comisión y propinas; con renta, lo vendido y propinas menos deducciones", () => {
    const base = { serviceCommission: 40, productCommission: 5, tips: 10, serviceSales: 100, productSales: 20, deductions: 15 };
    expect(earnedOf({ ...base, payout: "commission" })).toBe(55);
    expect(earnedOf({ ...base, payout: "rent" })).toBe(115);
  });

  test("la tarjeta de regalo manda su código por WhatsApp y se puede reenviar desde la ficha", async () => {
    const buyer = db.calendar.clients.find((item) => item.id !== "cli_walkin")!;
    const card = createGiftCard({ initial: 50, buyerId: buyer.id, recipientName: "Laura Gómez", recipientContact: "+57 300 111 2233", message: "" });
    const id = sendGiftCard(card, buyer.name, "ma", buyer.name);
    expect(db.booking.outbox?.find((item) => item.id === id)).toMatchObject({ kind: "giftCard", to: "+573001112233", status: "scheduled", params: ["Laura", buyer.name.split(" ")[0], expect.stringContaining("50"), card.code] });
    const relationship = await (await call(RECEPTION, `/customers/${buyer.id}/relationship`)).json();
    expect(relationship.giftCards.find((item: { code: string }) => item.code === card.code).sent).toMatchObject({ status: "scheduled" });
    const resent = await call(RECEPTION, `/customers/${buyer.id}/gift-cards/${card.code}/resend`, post({}));
    expect(resent.ok).toBe(true);
    expect(db.booking.outbox?.filter((item) => item.kind === "giftCard")).toHaveLength(2);
  });

  test("entrar desde un dispositivo nuevo avisa a la propia cuenta; «No fui yo» cierra las otras sesiones", async () => {
    const login = (deviceId: string) => call(null, "/auth/otp/verify", post({ phone: "+573001234567", code: "246810", device: { id: deviceId, label: "Chrome · macOS" } }));
    const first = await (await login("dev-aaaaaaaa")).json();
    // El primero es el de siempre: no avisa.
    expect(db.security.events).toHaveLength(0);
    const second = await (await login("dev-bbbbbbbb")).json();
    expect(db.security.events).toEqual([expect.objectContaining({ kind: "newDevice", label: "Chrome · macOS" })]);
    const inbox = await (await call(second.accessToken, "/notifications?branchId=ma")).json();
    expect(inbox.items).toContainEqual(expect.objectContaining({ kind: "newDevice", params: { device: "Chrome · macOS" } }));
    // Otra cuenta no lo ve.
    expect((await (await call(ADMIN, "/notifications?branchId=ma")).json()).items.some((item: { kind: string }) => item.kind === "newDevice")).toBe(false);
    const revoked = await (await call(second.accessToken, "/auth/sessions/revoke-others", post({}))).json();
    expect(revoked.closed).toBeGreaterThanOrEqual(1);
    expect(db.sessions.has(first.accessToken)).toBe(false);
    expect(db.sessions.has(second.accessToken)).toBe(true);
  });

  test("el dispositivo se nombra por navegador y sistema", () => {
    expect(deviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36")).toBe("Chrome · macOS");
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1")).toBe("Safari · iOS");
  });
});
