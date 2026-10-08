import { describe, expect, test } from "vitest";
import { SCHEDULE_COLUMN_MAX_PX, SCHEDULE_COLUMN_MIN_PX } from "@/components/scheduling";
import { parseColumnWidths, withColumnWidth } from "./calendarColumnWidths";

describe("parseColumnWidths", () => {
  test("returns nothing for empty, broken or non-object storage", () => {
    expect(parseColumnWidths(null)).toEqual({});
    expect(parseColumnWidths("{nope")).toEqual({});
    expect(parseColumnWidths("[240]")).toEqual({});
    expect(parseColumnWidths("240")).toEqual({});
  });

  test("keeps only numeric widths and clamps them to the limits", () => {
    const parsed = parseColumnWidths(JSON.stringify({ a: 240, b: "wide", c: 9999, d: 4 }));
    expect(parsed).toEqual({ a: 240, c: SCHEDULE_COLUMN_MAX_PX, d: SCHEDULE_COLUMN_MIN_PX });
  });
});

describe("withColumnWidth", () => {
  test("sets a width without touching the original", () => {
    const original = { a: 200 };
    const next = withColumnWidth(original, "b", 300.4);
    expect(next).toEqual({ a: 200, b: 300 });
    expect(original).toEqual({ a: 200 });
  });

  test("returns the same object when nothing changes", () => {
    const original = { a: 200 };
    expect(withColumnWidth(original, "a", 200)).toBe(original);
    expect(withColumnWidth(original, "missing", null)).toBe(original);
  });

  test("null brings a column back to the default", () => {
    expect(withColumnWidth({ a: 200, b: 300 }, "a", null)).toEqual({ b: 300 });
    expect(withColumnWidth({ a: 200 }, "a", null)).toEqual({});
  });
});
