import { describe, expect, test } from "vitest";
import { seedServices } from "../services/seed";
import { withBarberPrices } from "./pricing";
import { isBarberRole, seedTeam } from "./seed";

describe("withBarberPrices", () => {
  const services = seedServices().items;
  const members = withBarberPrices(seedTeam(), services);
  const barbers = members.filter((member) => isBarberRole(member.role) || member.isAlsoBarber);

  test("cada barbero tiene su precio en todos los servicios", () => {
    for (const barber of barbers) {
      expect(barber.services.map((item) => item.serviceId).sort()).toEqual(services.map((item) => item.id).sort());
      expect(barber.services.every((item) => item.offered && typeof item.price === "number" && item.price > 0)).toBe(true);
    }
  });

  test("en una misma sede no hay dos barberos con el mismo precio para un servicio", () => {
    const branches = [...new Set(barbers.map((barber) => barber.homeBranchId))];
    for (const branchId of branches) {
      const here = barbers.filter((barber) => barber.homeBranchId === branchId);
      for (const service of services) {
        const prices = here.map((barber) => barber.services.find((item) => item.serviceId === service.id)?.price);
        expect(new Set(prices).size).toBe(prices.length);
      }
    }
  });

  test("quien no es barbero no recibe precios", () => {
    const others = members.filter((member) => !isBarberRole(member.role) && !member.isAlsoBarber);
    expect(others.every((member) => member.services.length === 0)).toBe(true);
  });
});
