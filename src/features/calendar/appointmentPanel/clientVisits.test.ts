import { describe, expect, it } from "vitest";
import type { CustomerAppointment } from "@/features/customers/types";
import { barberLoyalty, completedVisits, visitGaps } from "./clientVisits";

const visit = (start: string, barberId: string | null, status: CustomerAppointment["status"] = "completed"): CustomerAppointment => ({
  id: `apt_${start}`,
  service: "Corte",
  start: `${start}T10:00:00.000Z`,
  barber: barberId,
  barberId,
  source: "internal",
  requestedBarber: false,
  status,
  total: 50,
});

const HISTORY = [visit("2026-10-01", "carlos"), visit("2026-09-21", "carlos"), visit("2026-09-14", "diana"), visit("2026-09-10", "carlos", "cancelled"), visit("2026-09-01", "santiago"), visit("2026-10-20", "carlos", "scheduled")];

describe("clientHistory", () => {
  it("lists only attended visits, newest first", () => {
    expect(completedVisits(HISTORY).map((item) => item.start.slice(0, 10))).toEqual(["2026-10-01", "2026-09-21", "2026-09-14", "2026-09-01"]);
  });

  it("measures the days between attended visits, oldest to newest", () => {
    expect(visitGaps(HISTORY)).toEqual([13, 7, 10]);
  });

  it("counts visits with the barber, the others seen and the current streak", () => {
    expect(barberLoyalty(HISTORY, "carlos")).toEqual({ withBarber: 2, total: 4, otherBarbers: 2, streak: 2 });
    expect(barberLoyalty(HISTORY, "diana")).toEqual({ withBarber: 1, total: 4, otherBarbers: 2, streak: 0 });
  });

  it("leaves counter sales out of loyalty", () => {
    expect(barberLoyalty([visit("2026-10-01", null), visit("2026-09-01", "carlos")], "carlos")).toEqual({ withBarber: 1, total: 1, otherBarbers: 0, streak: 1 });
  });
});
