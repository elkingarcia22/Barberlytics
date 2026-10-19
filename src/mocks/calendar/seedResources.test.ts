import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";
import { resourceDay } from "@/features/calendar/resourceModel";
import type { Appointment } from "@/features/calendar/types";
import { seedResources } from "../services/seed";
import { appointmentsOn, catalogServices, resourceMessage } from "./handlers";

const catalog = () => ({ services: catalogServices(), barbers: [] }) as unknown as Parameters<typeof resourceDay>[2];

describe("la semilla y los recursos especiales", () => {
  it("no siembra más citas a la vez de las unidades que hay de cada recurso", () => {
    for (let offset = 3; offset < 10; offset++) {
      const day = format(addDays(new Date(), offset), "yyyy-MM-dd");
      const appointments = appointmentsOn("ma", day) as unknown as Appointment[];
      for (const resource of seedResources()) {
        expect(resourceDay(resource, appointments, catalog()).clashes, `${resource.name} el ${day}`).toEqual([]);
      }
    }
  });

  it("el servidor rechaza una cita que pide un recurso ya completo", () => {
    const day = format(addDays(new Date(), 4), "yyyy-MM-dd");
    const busy = (appointmentsOn("ma", day) as unknown as Appointment[]).find((item) => item.serviceIds.includes("svc_tratamiento") && item.status !== "cancelled" && item.status !== "no_show");
    expect(busy).toBeDefined();
    const other = busy!.barberId === "team-01" ? "team-02" : "team-01";
    const message = resourceMessage("ma", { id: "", serviceIds: ["svc_tratamiento"], barberId: other, durationMin: 45, start: busy!.start, status: "scheduled" });
    expect(message).toMatch(/Sillón de lavado está ocupado/);
  });
});
