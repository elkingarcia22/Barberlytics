import { describe, expect, it } from "vitest";
import { resourceDay, resourceSelected, toggleResource, type AgendaResource } from "./resourceModel";
import type { Appointment, CalendarCatalog } from "./types";

const catalog = {
  services: [
    { id: "svc_corte", name: "Corte", category: "Cortes", durationMin: 30, price: 35 },
    { id: "svc_trat", name: "Tratamiento", category: "Extras", durationMin: 45, price: 55 },
  ],
  barbers: [],
  clients: [],
  products: [],
} as unknown as CalendarCatalog;

const appointment = (id: string, start: string, serviceIds: string[], status: Appointment["status"] = "scheduled") =>
  ({ id, start, serviceIds, status, durationMin: serviceIds.reduce((sum, id) => sum + (id === "svc_trat" ? 45 : 30), 0), barberId: "b1", clientId: "c1", products: [] }) as unknown as Appointment;

const sink: AgendaResource = { id: "res_lavado", name: "Sillón de lavado", units: 1, serviceIds: ["svc_trat"] };

describe("resourceDay", () => {
  it("ocupa el recurso solo durante el tramo de su servicio", () => {
    const day = resourceDay(sink, [appointment("a", "2026-10-19T10:00", ["svc_corte", "svc_trat"])], catalog);
    expect(day.uses).toHaveLength(1);
    expect(day.uses[0].start.getHours() * 60 + day.uses[0].start.getMinutes()).toBe(10 * 60 + 30);
  });

  it("marca choque cuando dos citas lo piden a la vez y solo hay uno", () => {
    const day = resourceDay(sink, [appointment("a", "2026-10-19T10:00", ["svc_trat"]), appointment("b", "2026-10-19T10:30", ["svc_trat"])], catalog);
    expect(day.clashes).toEqual([expect.objectContaining({ appointmentIds: ["a", "b"] })]);
  });

  it("no choca si hay unidades para todos ni cuenta las canceladas", () => {
    const two = { ...sink, units: 2 };
    expect(resourceDay(two, [appointment("a", "2026-10-19T10:00", ["svc_trat"]), appointment("b", "2026-10-19T10:15", ["svc_trat"])], catalog).clashes).toEqual([]);
    expect(resourceDay(sink, [appointment("a", "2026-10-19T10:00", ["svc_trat"]), appointment("b", "2026-10-19T10:15", ["svc_trat"], "cancelled")], catalog).clashes).toEqual([]);
  });
});

describe("toggleResource", () => {
  it("suma sus servicios al filtro y los quita al desmarcarlo", () => {
    const resource = { serviceIds: ["svc_trat", "svc_tinte"] };
    const on = toggleResource(resource, ["svc_corte"]);
    expect(on).toEqual(["svc_corte", "svc_trat", "svc_tinte"]);
    expect(resourceSelected(resource, on)).toBe(true);
    expect(toggleResource(resource, on)).toEqual(["svc_corte"]);
  });
});
