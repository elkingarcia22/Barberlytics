import { describe, expect, test } from "vitest";
import { hasFilters, isUnconfirmed, matchesFilters } from "./calendarModel";
import type { Appointment } from "./types";

const base = { status: "scheduled", confirmation: null, serviceIds: ["svc"], start: "2026-10-21T10:00:00" } as unknown as Appointment;

describe("filtro «Sin confirmar»", () => {
  test("pasan las citas por llegar sin confirmar (también las que pidieron otra hora); no las confirmadas ni las que ya llegaron", () => {
    expect(isUnconfirmed(base)).toBe(true);
    expect(isUnconfirmed({ ...base, confirmation: { status: "reschedule_requested", at: "", via: "whatsapp" } })).toBe(true);
    expect(isUnconfirmed({ ...base, confirmation: { status: "confirmed", at: "", via: "link" } })).toBe(false);
    expect(isUnconfirmed({ ...base, status: "arrived" })).toBe(false);
    const filters = { stages: [], serviceIds: [], unconfirmed: true };
    expect(hasFilters(filters)).toBe(true);
    expect(matchesFilters(base, filters, undefined)).toBe(true);
    expect(matchesFilters({ ...base, confirmation: { status: "confirmed", at: "", via: "link" } }, filters, undefined)).toBe(false);
  });
});
