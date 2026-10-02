import type { CountryCode } from "@/components/forms";

/** Zonas IANA de cada país que ofrece `PhoneInput`; la primera es la más poblada. */
export const COUNTRY_TIMEZONES: Record<CountryCode, readonly string[]> = {
  CO: ["America/Bogota"],
  MX: ["America/Mexico_City", "America/Cancun", "America/Monterrey", "America/Hermosillo", "America/Tijuana"],
  AR: ["America/Argentina/Buenos_Aires"],
  BO: ["America/La_Paz"],
  BR: ["America/Sao_Paulo", "America/Manaus", "America/Fortaleza", "America/Rio_Branco"],
  CL: ["America/Santiago", "Pacific/Easter"],
  CR: ["America/Costa_Rica"],
  EC: ["America/Guayaquil", "Pacific/Galapagos"],
  SV: ["America/El_Salvador"],
  GT: ["America/Guatemala"],
  HN: ["America/Tegucigalpa"],
  NI: ["America/Managua"],
  PA: ["America/Panama"],
  PY: ["America/Asuncion"],
  PE: ["America/Lima"],
  DO: ["America/Santo_Domingo"],
  UY: ["America/Montevideo"],
  VE: ["America/Caracas"],
  ES: ["Europe/Madrid", "Atlantic/Canary"],
  US: ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"],
};

function offsetOf(timeZone: string, locale: string): string {
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((item) => item.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

/** «America/Mexico_City» → «Mexico City (GMT-6)». */
export function describeTimezone(timeZone: string, locale = "es"): string {
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  const offset = offsetOf(timeZone, locale);
  return offset ? `${city} (${offset})` : city;
}

export function timezonesFor(country: string): readonly string[] {
  return COUNTRY_TIMEZONES[country as CountryCode] ?? [];
}
