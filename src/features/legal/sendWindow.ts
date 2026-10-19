/**
 * Cuándo se puede mandar una promoción, a la hora del cliente (la de la sede). Lo usan la app, el backend
 * simulado y el servidor de la cola (server/whatsapp/queue.ts), así que no importa nada: ni alias ni zod.
 *
 * - **Colombia** (Ley 2300 de 2023, «Dejen de fregar»): lunes a viernes de 7:00 a. m. a 7:00 p. m., sábados
 *   de 8:00 a. m. a 3:00 p. m., nunca domingos ni festivos (festivos de la Ley 51 de 1983, con los que se
 *   corren al lunes y los de Semana Santa).
 * - **Estados Unidos** (TCPA, 47 CFR 64.1200(c)(1)): de 8:00 a. m. a 9:00 p. m. Algunos estados son más
 *   estrictos: Florida, Oklahoma, Maryland y Washington hasta las 8:00 p. m.; Connecticut de 9 a 8; Texas de
 *   9 a 9 entre semana y desde el mediodía el domingo.
 * - **México y el resto**: de 9:00 a. m. a 8:00 p. m., lunes a sábado (regla de producto, prudente).
 * - **Festivos**: en Colombia los prohíbe la ley. En Estados Unidos (los 11 federales, el día y el que se
 *   observa si cae en fin de semana) y en México (los días de descanso obligatorio de la Ley Federal del
 *   Trabajo, art. 74) no se mandan promociones por regla de producto: nadie quiere una oferta el 4 de julio.
 *
 * Solo aplica a promociones: los mensajes de una cita (recordatorio, confirmación, recibo) salen cuando
 * toca. Son reglas de producto que confirma el abogado de cada país.
 */

export type SendCountry = "CO" | "US" | "MX" | "GENERIC";

/** Una franja del día en minutos desde la medianoche: [desde, hasta). */
type Span = readonly [number, number];
/** Domingo = 0 … sábado = 6; `null` es día sin envíos. */
type Week = readonly (Span | null)[];

const H = 60;
const every = (span: Span): Week => [span, span, span, span, span, span, span];

const RULES: Readonly<Record<string, Week>> = {
  CO: [null, [7 * H, 19 * H], [7 * H, 19 * H], [7 * H, 19 * H], [7 * H, 19 * H], [7 * H, 19 * H], [8 * H, 15 * H]],
  US: every([8 * H, 21 * H]),
  "US-FL": every([8 * H, 20 * H]),
  "US-OK": every([8 * H, 20 * H]),
  "US-MD": every([8 * H, 20 * H]),
  "US-WA": every([8 * H, 20 * H]),
  "US-CT": every([9 * H, 20 * H]),
  "US-TX": [[12 * H, 21 * H], [9 * H, 21 * H], [9 * H, 21 * H], [9 * H, 21 * H], [9 * H, 21 * H], [9 * H, 21 * H], [9 * H, 21 * H]],
  MX: [null, [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H]],
  GENERIC: [null, [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H], [9 * H, 20 * H]],
};

/** Los estados con regla propia, por nombre o código (Configuración › Sucursales guarda el nombre). */
const STATES: Readonly<Record<string, string>> = {
  fl: "FL", florida: "FL",
  ok: "OK", oklahoma: "OK",
  md: "MD", maryland: "MD",
  wa: "WA", washington: "WA",
  ct: "CT", connecticut: "CT",
  tx: "TX", texas: "TX",
};

const ruleKey = (country: SendCountry, state?: string | null): string => {
  if (country !== "US") return country;
  const code = STATES[(state ?? "").trim().toLowerCase()];
  return code ? `US-${code}` : "US";
};

export interface SendPlace {
  country: SendCountry;
  /** El estado de la sede (Estados Unidos), por nombre o código. */
  state?: string | null;
  /** La zona de la sede («America/Bogota»): la hora que cuenta es la del cliente. */
  timeZone: string;
}

// ── Hora local sin dependencias ──────────────────────────────────────────────────────────────────

interface Local {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
}

const WEEKDAYS: Readonly<Record<string, number>> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localOf(at: Date, timeZone: string): Local {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(at)
      .map((part) => [part.type, part.value])
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), weekday: WEEKDAYS[parts.weekday] ?? 0, minutes: Number(parts.hour) * H + Number(parts.minute) };
}

/** El instante de una hora de pared en esa zona (con el cambio de horario resuelto). */
function instantAt(year: number, month: number, day: number, minutes: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, 0, minutes);
  const offset = (at: number) => {
    const local = localOf(new Date(at), timeZone);
    return Date.UTC(local.year, local.month - 1, local.day, 0, local.minutes) - Math.floor(at / 60_000) * 60_000;
  };
  const first = guess - offset(guess);
  return new Date(guess - offset(first));
}

// ── Festivos de Colombia ─────────────────────────────────────────────────────────────────────────

const iso = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const DAY_MS = 86_400_000;
const shift = (base: number, days: number) => {
  const date = new Date(base + days * DAY_MS);
  return iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher), como instante UTC a medianoche. */
function easter(year: number): number {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day);
}

/** El lunes siguiente (o el mismo día si ya es lunes): la Ley Emiliani. */
const toMonday = (year: number, month: number, day: number) => {
  const base = Date.UTC(year, month - 1, day);
  const weekday = new Date(base).getUTCDay();
  return shift(base, (8 - weekday) % 7);
};

const holidayCache = new Map<string, ReadonlySet<string>>();

/** El n-ésimo día de la semana del mes (n = −1: el último). */
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return iso(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(year, month, 0));
  const back = (lastDay.getUTCDay() - weekday + 7) % 7;
  return iso(year, month, lastDay.getUTCDate() - back);
}

/** El día que se descansa si cae en fin de semana (sábado → viernes, domingo → lunes). */
function observed(year: number, month: number, day: number): string {
  const base = Date.UTC(year, month - 1, day);
  const weekday = new Date(base).getUTCDay();
  return weekday === 6 ? shift(base, -1) : weekday === 0 ? shift(base, 1) : iso(year, month, day);
}

const cached = (key: string, build: () => string[]): ReadonlySet<string> => {
  const hit = holidayCache.get(key);
  if (hit) return hit;
  const days = new Set(build());
  holidayCache.set(key, days);
  return days;
};

/** Los festivos federales de EE. UU. (5 U.S.C. 6103): el día y, si cae en fin de semana, el que se observa. */
export function usHolidays(year: number): ReadonlySet<string> {
  const fixed: [number, number][] = [[1, 1], [6, 19], [7, 4], [11, 11], [12, 25]];
  return cached(`US-${year}`, () => [
    ...fixed.flatMap(([month, day]) => [iso(year, month, day), observed(year, month, day)]),
    // El 1 de enero del año siguiente puede observarse el viernes 31 de diciembre.
    observed(year + 1, 1, 1),
    nthWeekday(year, 1, 1, 3), // Martin Luther King Jr.
    nthWeekday(year, 2, 1, 3), // Presidents' Day
    nthWeekday(year, 5, 1, -1), // Memorial Day
    nthWeekday(year, 9, 1, 1), // Labor Day
    nthWeekday(year, 10, 1, 2), // Columbus Day
    nthWeekday(year, 11, 4, 4), // Thanksgiving
  ]);
}

/** Los días de descanso obligatorio de México (Ley Federal del Trabajo, art. 74). */
export function mexicanHolidays(year: number): ReadonlySet<string> {
  return cached(`MX-${year}`, () => [
    iso(year, 1, 1),
    nthWeekday(year, 2, 1, 1), // Constitución
    nthWeekday(year, 3, 1, 3), // Natalicio de Benito Juárez
    iso(year, 5, 1),
    iso(year, 9, 16),
    nthWeekday(year, 11, 1, 3), // Revolución
    iso(year, 12, 25),
    // La transmisión del Poder Ejecutivo Federal, cada seis años desde 2024.
    ...(year >= 2024 && (year - 2024) % 6 === 0 ? [iso(year, 10, 1)] : []),
  ]);
}

const HOLIDAYS: Partial<Record<SendCountry, (year: number) => ReadonlySet<string>>> = {
  CO: (year) => colombianHolidays(year),
  US: usHolidays,
  MX: mexicanHolidays,
};

/** Los festivos de Colombia de ese año («AAAA-MM-DD»). */
export function colombianHolidays(year: number): ReadonlySet<string> {
  const sunday = easter(year);
  return cached(`CO-${year}`, () => [
    iso(year, 1, 1),
    iso(year, 5, 1),
    iso(year, 7, 20),
    iso(year, 8, 7),
    iso(year, 12, 8),
    iso(year, 12, 25),
    toMonday(year, 1, 6),
    toMonday(year, 3, 19),
    toMonday(year, 6, 29),
    toMonday(year, 8, 15),
    toMonday(year, 10, 12),
    toMonday(year, 11, 1),
    toMonday(year, 11, 11),
    shift(sunday, -3), // Jueves Santo
    shift(sunday, -2), // Viernes Santo
    shift(sunday, 43), // Ascensión (jueves +39, al lunes)
    shift(sunday, 64), // Corpus Christi (jueves +60, al lunes)
    shift(sunday, 71), // Sagrado Corazón (viernes +68, al lunes)
  ]);
}

// ── La franja ────────────────────────────────────────────────────────────────────────────────────

/** La franja permitida de ese día local, o `null` si ese día no se envía. */
function spanOf(place: SendPlace, local: Pick<Local, "year" | "month" | "day" | "weekday">): Span | null {
  if (HOLIDAYS[place.country]?.(local.year).has(iso(local.year, local.month, local.day))) return null;
  return RULES[ruleKey(place.country, place.state)][local.weekday];
}

/** Si en ese instante se puede mandar una promoción a la hora de la sede. */
export function isPromoAllowed(place: SendPlace, at: Date = new Date()): boolean {
  const local = localOf(at, place.timeZone);
  const span = spanOf(place, local);
  return span !== null && local.minutes >= span[0] && local.minutes < span[1];
}

/** Días que se miran hacia adelante: una Semana Santa con sábado y domingo no pasa de cinco. */
const LOOKAHEAD_DAYS = 14;

/**
 * El primer instante desde `at` en que se puede mandar: `at` si ya se puede; si no, la apertura de la
 * próxima franja (hoy más tarde o el siguiente día con envíos).
 */
export function nextPromoSlot(place: SendPlace, at: Date = new Date()): Date {
  if (isPromoAllowed(place, at)) return at;
  const today = localOf(at, place.timeZone);
  for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
    // El mediodía de cada día local evita saltar o repetir días en un cambio de horario.
    const noon = new Date(instantAt(today.year, today.month, today.day, 12 * H, place.timeZone).getTime() + offset * DAY_MS);
    const local = localOf(noon, place.timeZone);
    const span = spanOf(place, local);
    if (!span) continue;
    if (offset === 0 && today.minutes >= span[0]) continue;
    return instantAt(local.year, local.month, local.day, span[0], place.timeZone);
  }
  return at;
}

/** La franja de la semana para mostrarla («L–V 7:00–19:00 · S 8:00–15:00»), en minutos por día. */
export function promoWeek(place: Pick<SendPlace, "country" | "state">): Week {
  return RULES[ruleKey(place.country, place.state)];
}
