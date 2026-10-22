import { describe, expect, test } from "vitest";
import type { CustomerAppointment } from "@/features/customers/types";
import { clientHighlights, type HighlightsInput } from "./clientHighlightsModel";

const visit = (start: string, barberId: string | null, service = "Fade"): CustomerAppointment => ({ id: start, service, start, barber: barberId ? "Andrés" : null, barberId, source: "internal", requestedBarber: false, status: "completed", total: 30 });

const base: HighlightsInput = {
  conduct: [],
  critical: [],
  notes: [],
  visits: 6,
  noShows: 0,
  cancellations: 0,
  lastVisit: new Date("2026-08-03T10:00:00"),
  visitEveryDays: 7,
  preferredName: null,
  barberId: "b1",
  barberName: "Andrés",
  history: [visit("2026-07-27T10:00:00", "b2"), visit("2026-08-03T10:00:00", "b1", "Corte + barba")],
  now: new Date("2026-10-22T10:00:00"),
};

describe("clientHighlights", () => {
  test("lo que hay que cuidar va primero y cada punto lleva a su pestaña", () => {
    const items = clientHighlights({
      ...base,
      conduct: [{ id: "c1", reasons: ["rude"], text: "Fue grosero", appointmentId: null, by: "Ana", createdAt: "2026-10-01T10:00:00.000Z" }],
      critical: [{ id: "n1", kind: "medication", text: "Anticoagulantes", createdAt: "2026-09-01T10:00:00.000Z" }],
      notes: [{ id: "n2", kind: "note", text: "Le gusta corto", createdAt: "2026-09-02T10:00:00.000Z" }],
    });
    expect(items.map((item) => [item.kind, item.tab])).toEqual([
      ["conduct", "care"],
      ["health", "care"],
      ["reliability", "visits"],
      ["rhythm", "visits"],
      ["lastVisit", "visits"],
      ["note", "care"],
      ["loyalty", "loyalty"],
    ]);
  });

  test("avisa cuando lleva más de una vez y media su ritmo sin venir", () => {
    const rhythm = clientHighlights(base).find((item) => item.kind === "rhythm");
    expect(rhythm).toMatchObject({ overdue: true, tone: "warning", daysSince: 80, every: 7 });
    // Sin historial cuenta la fecha de su ficha.
    const recent = clientHighlights({ ...base, history: [], lastVisit: new Date("2026-10-15T10:00:00") }).find((item) => item.kind === "rhythm");
    expect(recent).toMatchObject({ overdue: false, tone: "neutral" });
  });

  test("los días sin venir salen de la última visita del historial, no de la ficha", () => {
    const rhythm = clientHighlights({ ...base, lastVisit: new Date("2026-06-01T10:00:00") }).find((item) => item.kind === "rhythm");
    expect(rhythm).toMatchObject({ daysSince: 80 });
  });

  test("las inasistencias tiñen «si cumple»; la última vez es la atendida más reciente", () => {
    const items = clientHighlights({ ...base, noShows: 2 });
    expect(items.find((item) => item.kind === "reliability")).toMatchObject({ tone: "warning", noShows: 2 });
    expect(items.find((item) => item.kind === "lastVisit")).toMatchObject({ visit: { service: "Corte + barba" } });
    expect(items.find((item) => item.kind === "loyalty")).toMatchObject({ withBarber: 1, total: 2 });
  });
});
