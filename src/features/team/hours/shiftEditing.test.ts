import { describe, expect, it } from "vitest";
import { applyPreset, hoursAccess, sameShift, shiftHours, shiftProblem } from "./shiftEditing";

const DAY = { start: "09:00", end: "18:00" };

describe("shiftEditing", () => {
  it("moves the start later or the end earlier by an hour", () => {
    expect(applyPreset(DAY, "late")).toEqual({ start: "10:00", end: "18:00" });
    expect(applyPreset(DAY, "early")).toEqual({ start: "09:00", end: "17:00" });
  });

  it("adds lunch at one, and refuses it when it does not fit", () => {
    expect(applyPreset(DAY, "lunch")).toEqual({ ...DAY, breaks: [{ start: "13:00", end: "14:00" }] });
    expect(applyPreset({ start: "14:00", end: "20:00" }, "lunch")).toBeUndefined();
  });

  it("drops breaks left outside a shorter shift", () => {
    expect(applyPreset({ start: "12:30", end: "18:00", breaks: [{ start: "13:00", end: "14:00" }] }, "late")).toEqual({ start: "13:30", end: "18:00" });
  });

  it("turns any day into a day off", () => {
    expect(applyPreset(DAY, "off")).toBeNull();
    expect(applyPreset(null, "late")).toBeUndefined();
  });

  it("says what is wrong with a shift", () => {
    expect(shiftProblem({ start: "18:00", end: "09:00" })).toBe("endBeforeStart");
    expect(shiftProblem({ ...DAY, breaks: [{ start: "08:00", end: "09:30" }] })).toBe("breaks");
    expect(shiftProblem(null)).toBeNull();
  });

  it("compares shifts and counts worked hours without breaks", () => {
    expect(sameShift(DAY, { ...DAY })).toBe(true);
    expect(sameShift(DAY, null)).toBe(false);
    expect(shiftHours({ ...DAY, breaks: [{ start: "13:00", end: "14:00" }] })).toBe(8);
  });

  it("lets reception change a day but not the fixed schedule; renters only their own", () => {
    const reception = hoursAccess({ role: "recepcion", member: { id: "r1", name: "R" } });
    expect([reception.canEditDay("b1"), reception.canEditPattern("b1")]).toEqual([true, false]);
    const renter = hoursAccess({ role: "barbero-renta", member: { id: "b1", name: "B" } });
    expect([renter.canEditPattern("b1"), renter.canEditDay("b2")]).toEqual([true, false]);
    const commission = hoursAccess({ role: "barbero-comision", member: { id: "b1", name: "B" } });
    expect(commission.canEditDay("b1")).toBe(false);
  });
});
