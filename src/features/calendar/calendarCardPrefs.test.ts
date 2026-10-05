import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { DEFAULT_CARD_PREFS, resetCalendarCardPrefs, useCalendarCardPrefs } from "./calendarCardPrefs";

describe("calendarCardPrefs", () => {
  afterEach(() => act(() => resetCalendarCardPrefs()));

  test("cambiar un ajuste lo guarda y avisa a quien lo usa", () => {
    const { result } = renderHook(() => useCalendarCardPrefs());
    expect(result.current[0]).toEqual(DEFAULT_CARD_PREFS);
    act(() => result.current[1]("price", false));
    expect(result.current[0].price).toBe(false);
    expect(JSON.parse(window.localStorage.getItem("thema.calendar.card.v1") ?? "{}").price).toBe(false);
  });

  test("restablecer vuelve a lo de siempre", () => {
    const { result } = renderHook(() => useCalendarCardPrefs());
    act(() => result.current[1]("origin", true));
    act(() => result.current[2]());
    expect(result.current[0]).toEqual(DEFAULT_CARD_PREFS);
  });
});
