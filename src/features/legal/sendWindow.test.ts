import { describe, expect, test } from "vitest";
import { colombianHolidays, isPromoAllowed, mexicanHolidays, nextPromoSlot, usHolidays, type SendPlace } from "./sendWindow";

const BOGOTA: SendPlace = { country: "CO", timeZone: "America/Bogota" };
const BOSTON: SendPlace = { country: "US", state: "Massachusetts", timeZone: "America/New_York" };
const MIAMI: SendPlace = { country: "US", state: "Florida", timeZone: "America/New_York" };
const CDMX: SendPlace = { country: "MX", timeZone: "America/Mexico_City" };
const HOUSTON: SendPlace = { country: "US", state: "TX", timeZone: "America/Chicago" };

/** Bogotá es UTC−5 todo el año. */
const bogota = (local: string) => new Date(`${local}:00-05:00`);

describe("franja legal de las promociones", () => {
  test("festivos de Colombia 2026: fijos, corridos al lunes y de Semana Santa", () => {
    const days = colombianHolidays(2026);
    for (const day of ["2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29", "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25"]) {
      expect(days.has(day), day).toBe(true);
    }
    expect(days.has("2026-10-19")).toBe(false);
    expect(days.size).toBe(18);
  });

  test("Colombia: entre semana de 7 a 19, sábado de 8 a 15, nunca domingo ni festivo", () => {
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-20T07:00"))).toBe(true);
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-20T06:59"))).toBe(false);
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-20T19:00"))).toBe(false);
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-24T14:30"))).toBe(true);
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-24T15:00"))).toBe(false);
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-25T10:00"))).toBe(false);
    expect(isPromoAllowed(BOGOTA, bogota("2026-10-12T10:00"))).toBe(false);
  });

  test("lo que no puede salir espera a la próxima apertura, saltando domingo y festivo", () => {
    // Sábado 7 de noviembre a las 4 p. m. → domingo no, lunes 9 sí (el festivo del 2 ya pasó).
    expect(nextPromoSlot(BOGOTA, bogota("2026-11-07T16:00")).toISOString()).toBe(bogota("2026-11-09T07:00").toISOString());
    // Sábado 31 de octubre de noche → domingo 1 no, lunes 2 festivo, martes 3 a las 7.
    expect(nextPromoSlot(BOGOTA, bogota("2026-10-31T20:00")).toISOString()).toBe(bogota("2026-11-03T07:00").toISOString());
    // Martes temprano → ese mismo día a las 7.
    expect(nextPromoSlot(BOGOTA, bogota("2026-10-20T05:10")).toISOString()).toBe(bogota("2026-10-20T07:00").toISOString());
    // Dentro de la franja sale ya.
    const now = bogota("2026-10-20T10:00");
    expect(nextPromoSlot(BOGOTA, now)).toBe(now);
  });

  test("Estados Unidos: 8 a 21 a la hora local; Florida hasta las 20; Texas el domingo desde el mediodía", () => {
    // 20:30 en Boston (EDT, UTC−4).
    const evening = new Date("2026-10-20T20:30:00-04:00");
    expect(isPromoAllowed(BOSTON, evening)).toBe(true);
    expect(isPromoAllowed(MIAMI, evening)).toBe(false);
    expect(nextPromoSlot(MIAMI, evening).toISOString()).toBe(new Date("2026-10-21T08:00:00-04:00").toISOString());
    // Domingo 10 a. m. en Houston (CDT, UTC−5) → al mediodía.
    expect(nextPromoSlot(HOUSTON, new Date("2026-10-25T10:00:00-05:00")).toISOString()).toBe(new Date("2026-10-25T12:00:00-05:00").toISOString());
  });

  test("el cambio de horario no corre la apertura", () => {
    // Noche del sábado 31 de octubre en Boston; el domingo 1 de noviembre se atrasa la hora (EST, UTC−5).
    expect(nextPromoSlot(BOSTON, new Date("2026-10-31T23:30:00-04:00")).toISOString()).toBe(new Date("2026-11-01T08:00:00-05:00").toISOString());
  });

  test("festivos federales de EE. UU. 2026, con el día observado si cae en fin de semana", () => {
    const days = usHolidays(2026);
    // 4 de julio es sábado: se observa el viernes 3. Juneteenth es viernes.
    for (const day of ["2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25", "2026-06-19", "2026-07-03", "2026-07-04", "2026-09-07", "2026-10-12", "2026-11-11", "2026-11-26", "2026-12-25"]) {
      expect(days.has(day), day).toBe(true);
    }
    expect(days.has("2026-07-06")).toBe(false);
    // El Año Nuevo 2028 cae en sábado: se observa el viernes 31 de diciembre de 2027.
    expect(usHolidays(2027).has("2027-12-31")).toBe(true);
  });

  test("días de descanso obligatorio de México, con la transmisión del Ejecutivo cada seis años", () => {
    const days = mexicanHolidays(2026);
    for (const day of ["2026-01-01", "2026-02-02", "2026-03-16", "2026-05-01", "2026-09-16", "2026-11-16", "2026-12-25"]) {
      expect(days.has(day), day).toBe(true);
    }
    expect(days.has("2026-10-01")).toBe(false);
    expect(mexicanHolidays(2030).has("2030-10-01")).toBe(true);
  });

  test("en un festivo no salen promociones: Thanksgiving en Boston, la Revolución en Ciudad de México", () => {
    expect(isPromoAllowed(BOSTON, new Date("2026-11-26T12:00:00-05:00"))).toBe(false);
    expect(nextPromoSlot(BOSTON, new Date("2026-11-26T12:00:00-05:00")).toISOString()).toBe(new Date("2026-11-27T08:00:00-05:00").toISOString());
    // Lunes 16 de noviembre en CDMX (UTC−6): pasa al martes a las 9.
    expect(nextPromoSlot(CDMX, new Date("2026-11-16T10:00:00-06:00")).toISOString()).toBe(new Date("2026-11-17T09:00:00-06:00").toISOString());
  });
});
