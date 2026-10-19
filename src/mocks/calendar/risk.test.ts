import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "./handlers";
import { dateKey, type MockAppointment } from "./seed";
import { noShowRisk } from "./risk";

const future = (days: number) => dateKey(new Date(Date.now() + days * 86_400_000));

describe("riesgo de no venir", () => {
  beforeEach(() => db.reset());

  test("pesa el historial: con plantones previos sube; con anticipo y confirmada baja", () => {
    const appointment = appointmentsOn("ma", future(2)).find((item) => item.status === "scheduled" && !item.walkIn) as MockAppointment;
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId)!;
    db.calendar.clients = db.calendar.clients.map((item) => (item.id === client.id ? { ...item, noShows: 0, cancellations: 0, visits: 10, type: "frequent" } : item));
    const clean = noShowRisk(appointment)!;
    db.calendar.clients = db.calendar.clients.map((item) => (item.id === client.id ? { ...item, noShows: 4, visits: 6 } : item));
    const flaky = noShowRisk(appointment)!;
    expect(flaky.probability).toBeGreaterThan(clean.probability);
    expect(flaky.reasons[0]).toBe("pastNoShows");
    const safer = noShowRisk({ ...appointment, confirmation: { status: "confirmed", at: new Date().toISOString(), via: "link" }, online: { reservation: "R1", method: "card", paid: 20, tip: 0, discount: 0 } } as MockAppointment)!;
    expect(safer.probability).toBeLessThan(flaky.probability);
  });

  test("en una semana de la demo la mayoría es riesgo bajo y alguno es alto", () => {
    const risks = Array.from({ length: 7 }, (_, index) => appointmentsOn("ma", future(index + 1)))
      .flat()
      .map((item) => noShowRisk(item))
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const high = risks.filter((item) => item.level === "high").length;
    expect(risks.length).toBeGreaterThan(20);
    expect(high).toBeGreaterThan(0);
    expect(high / risks.length).toBeLessThan(0.3);
  });
});
