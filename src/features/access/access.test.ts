import { describe, expect, test } from "vitest";
import { buildAppNavigation } from "@/app/navigation";
import { buildAccess, canOpen, ROLE_HOME, teamRoleFromSession, type AccessArea } from "./access";

const ids = (role: Parameters<typeof buildAccess>[0]["role"]) =>
  buildAppNavigation((key) => key, buildAccess({ role }))
    .filter((entry) => entry.kind === "item")
    .map((entry) => ("id" in entry ? entry.id : ""));

describe("acceso por rol", () => {
  test("el dueño abre todo, aunque su matriz cambie", () => {
    const owner = buildAccess({ role: "owner", permissions: {} });
    const areas: AccessArea[] = ["metrics", "calendar", "customers", "team", "services", "products", "expenses", "payroll", "transactions", "settings", "designSystem"];
    expect(areas.every((area) => canOpen(owner, area))).toBe(true);
    expect(canOpen(owner, "myPay")).toBe(false);
  });

  test("cada barbero ve lo suyo: comisión sin gastos ni nómina; renta con sus gastos y sus cuentas", () => {
    const commission = buildAccess({ role: "barbero-comision" });
    expect(commission.scope).toBe("own");
    expect(commission.member?.id).toBe("team-04");
    expect(canOpen(commission, "metrics")).toBe(true);
    expect(canOpen(commission, "expenses")).toBe(false);
    expect(canOpen(commission, "payroll")).toBe(false);
    expect(canOpen(commission, "transactions")).toBe(false);
    expect(canOpen(commission, "myPay")).toBe(true);
    // Producción: el de comisión solo ve los bloqueos; el de renta crea los suyos.
    expect(commission.can("block-calendar", "create")).toBe(false);

    const rent = buildAccess({ role: "barbero-renta" });
    expect(canOpen(rent, "expenses")).toBe(true);
    expect(canOpen(rent, "transactions")).toBe(true);
    expect(canOpen(rent, "team")).toBe(false);
    expect(rent.can("block-calendar", "create")).toBe(true);
    expect(rent.can("export-clients", "active")).toBe(true);
  });

  test("recepción agenda y cobra, sin métricas, nómina ni gastos", () => {
    const reception = buildAccess({ role: "recepcion" });
    expect(reception.scope).toBe("all");
    expect(canOpen(reception, "calendar")).toBe(true);
    expect(canOpen(reception, "metrics")).toBe(false);
    expect(canOpen(reception, "payroll")).toBe(false);
    expect(canOpen(reception, "expenses")).toBe(false);
    expect(reception.can("clients", "delete")).toBe(false);
  });

  test("el menú se arma con lo que abre cada rol y el de renta llama a su pago «Mi negocio»", () => {
    expect(ids("owner")).toContain("nomina");
    expect(ids("owner")).not.toContain("mipago");
    expect(ids("barbero-comision")).toEqual(["inicio", "mipago", "calendario", "clientes", "equipo"]);
    expect(ids("recepcion")).not.toContain("inicio");
    const rentPay = buildAppNavigation((key) => key, buildAccess({ role: "barbero-renta" })).find((entry) => entry.kind === "item" && "id" in entry && entry.id === "mipago");
    expect(rentPay && "label" in rentPay ? rentPay.label : null).toBe("nav.myBusiness");
  });

  test("cada rol aterriza en lo suyo y la sesión de la plantilla se traduce a un rol de la barbería", () => {
    expect(ROLE_HOME.owner).toBe("/metricas");
    expect(ROLE_HOME["barbero-renta"]).toBe("/calendario");
    expect(teamRoleFromSession("admin")).toBe("owner");
    expect(teamRoleFromSession("manager")).toBe("admin");
    expect(teamRoleFromSession("barbero-renta")).toBe("barbero-renta");
  });
});
