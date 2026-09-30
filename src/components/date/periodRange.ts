/**
 * Los periodos de un tablero: un día, una semana (de lunes a domingo) o un
 * mes natural, siempre alrededor de una fecha ancla. Solo `Date` e `Intl`,
 * como el resto de `date/`.
 */

export type PeriodGranularity = "day" | "week" | "month"

export interface PeriodRange {
  from: Date
  to: Date
}

const DAY_MS = 86_400_000

const atMidnight = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** El lunes de la semana de `date`, a medianoche. */
function startOfWeek(date: Date): Date {
  const day = atMidnight(date)
  const offset = (day.getDay() + 6) % 7
  return new Date(day.getTime() - offset * DAY_MS)
}

/** Los días que abarca el periodo de `date`, ambos incluidos y a medianoche. */
export function periodRange(date: Date, granularity: PeriodGranularity): PeriodRange {
  if (granularity === "day") {
    const from = atMidnight(date)
    return { from, to: from }
  }
  if (granularity === "week") {
    const from = startOfWeek(date)
    return { from, to: new Date(from.getTime() + 6 * DAY_MS) }
  }
  return {
    from: new Date(date.getFullYear(), date.getMonth(), 1),
    to: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  }
}

/** La misma fecha, `steps` periodos más adelante (o atrás, si es negativo). */
export function shiftPeriod(date: Date, granularity: PeriodGranularity, steps: number): Date {
  const anchor = atMidnight(date)
  if (granularity === "day") return new Date(anchor.getTime() + steps * DAY_MS)
  if (granularity === "week") return new Date(anchor.getTime() + steps * 7 * DAY_MS)
  return new Date(anchor.getFullYear(), anchor.getMonth() + steps, 1)
}

/** El periodo justo anterior al de `date`, para comparar. */
export const previousPeriodRange = (date: Date, granularity: PeriodGranularity): PeriodRange =>
  periodRange(shiftPeriod(date, granularity, -1), granularity)

/** «2026-09-28», la fecha en la zona local — para URL y consultas. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** La fecha de un «2026-09-28» en la zona local; `undefined` si no lo es. */
export function fromIsoDate(value: string | null | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.getMonth() === month - 1 && date.getDate() === day ? date : undefined
}

/**
 * Cómo se lee el periodo en la barra: «lunes, 28 de septiembre», «22 – 28 de
 * septiembre de 2026», «septiembre de 2026».
 */
export function formatPeriodLabel(date: Date, granularity: PeriodGranularity, locale: string): string {
  const { from, to } = periodRange(date, granularity)
  const label =
    granularity === "day"
      ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(from)
      : granularity === "month"
        ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(from)
        : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).formatRange(from, to)
  // Solo la primera letra: en español el mes va en minúscula y `capitalize`
  // de CSS pondría «Septiembre De 2026».
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1)
}

/** Si el periodo de `date` incluye hoy. */
export function isCurrentPeriod(date: Date, granularity: PeriodGranularity, today = new Date()): boolean {
  const { from, to } = periodRange(date, granularity)
  const now = atMidnight(today).getTime()
  return now >= from.getTime() && now <= to.getTime()
}
