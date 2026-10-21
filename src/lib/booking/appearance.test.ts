import { describe, expect, test } from "vitest";
import { bookingLocale, bookingThemeOverride, effectiveBookingAppearance, GENERAL_BOOKING_APPEARANCE, type BookingAppearance } from "./appearance";

const own: BookingAppearance = { useGeneral: false, theme: "crimson", custom: null, mode: "light", locale: "en", logo: null, logoDark: null };

describe("apariencia de la reserva", () => {
  test("sin apariencia o con «usar la general» se aplica la general", () => {
    expect(effectiveBookingAppearance(null)).toEqual(GENERAL_BOOKING_APPEARANCE);
    expect(effectiveBookingAppearance({ ...own, useGeneral: true })).toEqual(GENERAL_BOOKING_APPEARANCE);
    expect(bookingThemeOverride(null)).toEqual({ preset: "premium", mode: "dark" });
  });

  test("la propia fuerza su tema, su modo y su idioma", () => {
    expect(bookingThemeOverride(own)).toEqual({ preset: "crimson", mode: "light" });
    expect(bookingLocale(own)).toBe("en");
  });

  test("el modo de la vista previa gana al configurado sin cambiarlo", () => {
    expect(bookingThemeOverride(own, "dark").mode).toBe("dark");
  });

  test("«Personalizado» lleva sus colores; sin colores cae a la marca por defecto", () => {
    const custom = { primary: "#C8102E", secondary: "#0B3D91" };
    expect(bookingThemeOverride({ ...own, theme: "custom", custom })).toEqual({ preset: "custom", custom, mode: "light" });
    expect(bookingThemeOverride({ ...own, theme: "custom", custom: null }).preset).toBe("premium");
  });
});
