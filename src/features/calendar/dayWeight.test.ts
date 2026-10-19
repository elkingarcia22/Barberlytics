import { describe, expect, it } from "vitest";
import { bookedShare, dayWeightOf } from "./dayWeight";
import type { DayRhythm } from "./types";

const rhythm: DayRhythm = {
  weeks: 8,
  average: 20,
  weekdays: [
    { weekday: 0, average: 0, samples: 0 },
    { weekday: 1, average: 14, samples: 8 },
    { weekday: 3, average: 20, samples: 8 },
    { weekday: 6, average: 30, samples: 8 },
  ],
};

// 2026-10-19 es lunes.
const monday = new Date(2026, 9, 19);
const wednesday = new Date(2026, 9, 21);
const saturday = new Date(2026, 9, 24);
const sunday = new Date(2026, 9, 25);

describe("dayWeightOf", () => {
  it("marca pesado el día de la semana que suele tener bastantes más citas que el promedio", () => {
    expect(dayWeightOf(rhythm, saturday)).toMatchObject({ level: "heavy", expected: 30, average: 20 });
  });

  it("marca suave el que suele tener bastantes menos", () => {
    expect(dayWeightOf(rhythm, monday)?.level).toBe("light");
  });

  it("deja normal el que está cerca del promedio", () => {
    expect(dayWeightOf(rhythm, wednesday)?.level).toBe("normal");
  });

  it("no opina de un día que no se abre o sin historia", () => {
    expect(dayWeightOf(rhythm, sunday)).toBeNull();
    expect(dayWeightOf(undefined, monday)).toBeNull();
    expect(dayWeightOf({ ...rhythm, average: 0 }, monday)).toBeNull();
  });
});

describe("bookedShare", () => {
  it("dice cuánto de lo habitual ya está agendado", () => {
    expect(bookedShare(15, { expected: 30 })).toBe(0.5);
    expect(bookedShare(3, null)).toBeNull();
  });
});
