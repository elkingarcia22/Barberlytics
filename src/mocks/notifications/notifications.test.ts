import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { notificationsFor } from "./handlers";

const TOKEN = "mock-acc_admin-test";
const api = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` } });

describe("bandeja de avisos", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("el dueño ve el stock y la caja; el barbero no", () => {
    const owner = notificationsFor("ma", "owner", null);
    expect(owner.some((item) => item.kind === "outOfStock" || item.kind === "lowStock")).toBe(true);
    expect(notificationsFor("ma", "barbero-comision", "team-04").some((item) => item.kind === "outOfStock" || item.kind === "lowStock" || item.kind === "payrollDue")).toBe(false);
  });

  test("un WhatsApp fallido avisa a recepción", () => {
    const appointment = db.calendar.appointments[0] ?? null;
    db.booking.outbox = [{ id: "m1", appointmentId: appointment?.id ?? "", clientId: "cli_001", to: "+573001112233", channel: "whatsapp", kind: "confirmation", sendAt: new Date().toISOString(), sentAt: new Date().toISOString(), status: "failed", error: "Template not found" }];
    expect(notificationsFor("ma", "recepcion", null).some((item) => item.kind === "whatsappFailed" && item.params.error === "Template not found")).toBe(true);
  });

  test("lo leído queda leído para esa cuenta", async () => {
    const first = await (await api("/notifications?branchId=ma&role=owner")).json();
    expect(first.unread).toBeGreaterThan(0);
    await api("/notifications/read", { method: "POST", body: JSON.stringify({ ids: first.items.map((item: { id: string }) => item.id) }) });
    expect((await (await api("/notifications?branchId=ma&role=owner")).json()).unread).toBe(0);
  });
});
