import { describe, expect, test } from "vitest";
import { buildRebookLink, readRebookLink } from "./rebookLink";

describe("rebook link", () => {
  test("round-trips services, barber and branch", () => {
    const link = buildRebookLink("https://reservas.barberia.co", { branchId: "ma", serviceIds: ["svc_corte", "svc_barba"], barberId: "team-04" });
    expect(link).toBe("https://reservas.barberia.co/reservar?reagendar=1&servicios=svc_corte%2Csvc_barba&sucursal=ma&barbero=team-04");
    expect(readRebookLink(new URL(link).search)).toEqual({ branchId: "ma", serviceIds: ["svc_corte", "svc_barba"], barberId: "team-04" });
  });

  test("ignores links that are not a rebook or come malformed", () => {
    expect(readRebookLink("?version=chat")).toBeNull();
    expect(readRebookLink("?reagendar=1&sucursal=ma")).toBeNull();
    expect(readRebookLink("?reagendar=1&servicios=svc_a&sucursal=ma&barbero=<script>")).toEqual({ branchId: "ma", serviceIds: ["svc_a"], barberId: null });
  });
});
