import { describe, expect, it } from "vitest";
import { colombianHolidayOn, colombianHolidays, easterSunday } from "./colombia";

describe("festivos de Colombia", () => {
  it("finds Easter Sunday", () => {
    expect(easterSunday(2026).getDate()).toBe(5);
    expect(easterSunday(2026).getMonth()).toBe(3);
    expect(easterSunday(2027).getMonth()).toBe(2);
    expect(easterSunday(2027).getDate()).toBe(28);
  });

  it("lists the 18 holidays of 2026, moved to Monday where the law says", () => {
    expect(colombianHolidays(2026).map((item) => item.date)).toEqual([
      "2026-01-01",
      "2026-01-12",
      "2026-03-23",
      "2026-04-02",
      "2026-04-03",
      "2026-05-01",
      "2026-05-18",
      "2026-06-08",
      "2026-06-15",
      "2026-06-29",
      "2026-07-20",
      "2026-08-07",
      "2026-08-17",
      "2026-10-12",
      "2026-11-02",
      "2026-11-16",
      "2026-12-08",
      "2026-12-25",
    ]);
  });

  it("names a holiday by its date", () => {
    expect(colombianHolidayOn("2026-10-12")?.name).toBe("Día de la Raza");
    expect(colombianHolidayOn("2026-10-13")).toBeUndefined();
  });
});

describe("festivos por país", () => {
  it("uses the federal holidays for a branch in the United States", async () => {
    const { holidaysFor, holidayOn } = await import("./index");
    expect(holidaysFor("Estados Unidos", 2026).map((item) => item.date)).toEqual(["2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25", "2026-06-19", "2026-07-04", "2026-09-07", "2026-10-12", "2026-11-11", "2026-11-26", "2026-12-25"]);
    expect(holidayOn("Colombia", "2026-11-16")?.name).toBe("Independencia de Cartagena");
    expect(holidaysFor("Perú", 2026)).toEqual([]);
  });
});
