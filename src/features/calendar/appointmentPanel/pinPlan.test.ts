import { describe, expect, test } from "vitest";
import type { Appointment, Barber, CalendarDay } from "../types";
import { bookableStops, pinDates, planStop } from "./pinPlan";

const barber: Barber = { id: "b1", branchId: "ma", name: "Emilio Arango", avatarUrl: null, level: null, workingHours: { "2": [{ start: "10:00", end: "13:00" }] }, acceptsWalkIns: true };

function busy(start: string, durationMin: number, status: Appointment["status"] = "scheduled"): Appointment {
  return {
    id: `a_${start}`,
    branchId: "ma",
    clientId: "c9",
    barberId: "b1",
    requestedBarberId: null,
    serviceIds: ["s1"],
    products: [],
    start,
    durationMin,
    status,
    barberReady: false,
    walkIn: false,
    source: "internal",
    repeat: "none",
    seriesId: null,
    notes: null,
    createdAt: "2026-10-01T10:00:00Z",
    createdBy: "Lucía",
    history: [],
    payment: null,
  };
}

const day = (appointments: Appointment[] = [], blocks: CalendarDay["blocks"] = []): CalendarDay => ({ date: "2026-11-03", appointments, blocks });
// Martes 3 de noviembre de 2026, 10:30.
const date = new Date(2026, 10, 3, 10, 30);
const clock = (value: Date) => `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

describe("pinDates", () => {
  test("adds the chosen weeks once per appointment", () => {
    const dates = pinDates(new Date(2026, 9, 13, 10, 30), 3, 3);
    expect(dates.map((value) => value.toDateString())).toEqual([new Date(2026, 10, 3).toDateString(), new Date(2026, 10, 24).toDateString(), new Date(2026, 11, 15).toDateString()]);
  });
});

describe("planStop", () => {
  test("keeps the same time when the barber is free", () => {
    expect(planStop({ date, day: day(), barber, durationMin: 45, clientId: "c1" })).toEqual({ kind: "same", date });
  });

  test("moves to the closest free time that day when the hour is taken", () => {
    const stop = planStop({ date, day: day([busy("2026-11-03T10:30", 45)]), barber, durationMin: 45, clientId: "c1" });
    expect(stop.kind).toBe("moved");
    // 9:45 no es jornada; 11:15 sí, a 45 minutos de las 10:30.
    expect(clock(stop.date)).toBe("11:15");
  });

  test("ignores cancelled appointments and respects blocks", () => {
    expect(planStop({ date, day: day([busy("2026-11-03T10:30", 45, "cancelled")]), barber, durationMin: 45, clientId: "c1" }).kind).toBe("same");
    const blocked = planStop({ date, day: day([], [{ id: "bl1", branchId: "ma", barberId: "b1", category: "lunch", repeat: "none", startDate: "2026-11-03", endDate: "2026-11-03", startTime: "10:00", endTime: "12:00", description: null }]), barber, durationMin: 45, clientId: "c1" });
    expect(clock(blocked.date)).toBe("12:00");
  });

  test("says the day is full when nothing fits, and waits for the agenda", () => {
    expect(planStop({ date, day: day([busy("2026-11-03T10:00", 180)]), barber, durationMin: 45, clientId: "c1" }).kind).toBe("full");
    expect(planStop({ date, day: undefined, barber, durationMin: 45, clientId: "c1" }).kind).toBe("unknown");
  });

  test("does not book a second visit on a day the client already has one", () => {
    const own = { ...busy("2026-11-03T13:00", 45), clientId: "c1" };
    const stop = planStop({ date, day: day([own]), barber, durationMin: 45, clientId: "c1" });
    expect(stop.kind).toBe("taken");
    expect(clock(stop.date)).toBe("13:00");
  });
});

describe("bookableStops", () => {
  test("keeps only the dates that can be booked", () => {
    const moved = new Date(2026, 10, 24, 11, 15);
    expect(bookableStops([{ kind: "same", date }, { kind: "moved", date: moved, from: date }, { kind: "full", date }, { kind: "taken", date }, { kind: "unknown", date }])).toEqual([date, moved]);
  });
});
