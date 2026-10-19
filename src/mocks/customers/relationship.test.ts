import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";

const TOKEN = "mock-acc_admin-test";
const api = (path: string, init: RequestInit = {}) =>
  fetch(`http://localhost/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
  });

describe("ficha 360 del cliente", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("junta membresía, tarjetas guardadas, saldo y paquetes de la reserva", async () => {
    db.booking.credits = { cli_001: 12 };
    db.booking.ownedPackages = {
      cli_001: [
        {
          id: "own_1",
          packageId: "pk",
          name: "5 cortes",
          serviceId: db.services.items[0].id,
          remaining: 3,
          total: 5,
          expiresAt: "2999-01-01T00:00:00.000Z",
        },
      ],
    };
    const data = await (await api("/customers/cli_001/relationship")).json();
    expect(data.membership).toMatchObject({ every: expect.any(Number) });
    expect(data.cards.map((card: { last4: string }) => card.last4)).toEqual(["4242", "4444"]);
    expect(data.credit).toBe(12);
    expect(data.packages).toEqual([expect.objectContaining({ name: "5 cortes", remaining: 3, total: 5 })]);
    expect(data.consent.marketing).toBeNull();
  });

  test("el permiso de promociones se da con fecha y origen y se retira", async () => {
    const granted = await (
      await api("/customers/cli_001/consent", {
        method: "PATCH",
        body: JSON.stringify({ marketing: true }),
      })
    ).json();
    // La prueba del permiso: con qué texto se aceptó (la versión del país de su sede).
    expect(granted.consent.marketing).toMatchObject({
      accepted: true,
      source: "app",
      version: expect.stringMatching(/^(us|co|mx|gen)-/),
      country: expect.any(String),
    });
    const revoked = await (
      await api("/customers/cli_001/consent", {
        method: "PATCH",
        body: JSON.stringify({ marketing: false }),
      })
    ).json();
    expect(revoked.consent.marketing.accepted).toBe(false);
    expect(
      (
        await api("/customers/cli_001/consent", {
          method: "PATCH",
          body: JSON.stringify({}),
        })
      ).status
    ).toBe(422);
    expect((await api("/customers/nadie/relationship")).status).toBe(404);
  });

  test("un mensaje de promoción sin permiso se rechaza; con permiso queda en el historial", async () => {
    // Martes 11 a. m. en Boston: dentro de la franja legal de promociones.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-20T15:00:00.000Z") });
    const promo = { method: "POST", body: JSON.stringify({ purpose: "rebook", body: "Hola, te toca volver" }) };
    expect((await api("/customers/cli_001/messages", promo)).status).toBe(409);
    const thanks = await (await api("/customers/cli_001/messages", { method: "POST", body: JSON.stringify({ purpose: "thanks", body: "Gracias por venir" }) })).json();
    expect(thanks.messages[0]).toMatchObject({ kind: "manual", body: "Gracias por venir", status: "sent" });
    await api("/customers/cli_001/consent", { method: "PATCH", body: JSON.stringify({ marketing: true }) });
    expect((await api("/customers/cli_001/messages", promo)).status).toBe(201);
    vi.useRealTimers();
  });
});
