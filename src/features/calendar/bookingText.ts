import { addDays, startOfDay } from "date-fns";
import { atMinutes } from "@/components/scheduling";
import type { CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import type { CalendarCatalog } from "./types";

/**
 * Entender una cita escrita como se dice en recepción —«corte para Martín
 * mañana a las 4 con Nicolás»— y dejarla lista para confirmar. No hay modelo
 * detrás: busca en la frase los nombres del catálogo, el día y la hora. Lo
 * que no entiende lo deja en blanco y el alta lo pide.
 */

export interface ParsedBooking {
  initial: CreateAppointmentInitial;
  /** Lo que se entendió, para decírselo a quien escribió. */
  client?: string;
  service?: string;
  barber?: string;
  when?: Date;
}

const plain = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const WEEKDAYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
/** Sin «a. m.» ni «p. m.», de la 1 a las 7 se entiende la tarde: nadie agenda a las 4 de la madrugada. */
const AFTERNOON_UNTIL_HOUR = 7;
const MIN_WORD = 4;

function parseDay(text: string, now: Date): Date | undefined {
  if (/\bpasado manana\b/.test(text)) return addDays(startOfDay(now), 2);
  // «mañana» es el día siguiente salvo en «por la mañana» o «en la mañana».
  if (/(?<!\bla )\bmanana\b/.test(text)) return addDays(startOfDay(now), 1);
  if (/\bhoy\b/.test(text)) return startOfDay(now);
  const weekday = WEEKDAYS.findIndex((name) => new RegExp(`\\b${name}\\b`).test(text));
  if (weekday === -1) return undefined;
  const ahead = (weekday - now.getDay() + 7) % 7 || 7;
  return addDays(startOfDay(now), ahead);
}

function parseMinutes(text: string): number | undefined {
  const match = /\b(?:a las|a la|las|la)\s+(\d{1,2})(?:[:.h](\d{2}))?(?:\s*(y media|y cuarto))?\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/.exec(text) ?? /\b(\d{1,2})(?:[:.h](\d{2}))?\s*(?:(y media|y cuarto)\s*)?(a\.?\s?m\.?|p\.?\s?m\.?)\b/.exec(text) ?? /\b(\d{1,2})[:.](\d{2})\b/.exec(text);
  if (!match) return undefined;
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : match[3] === "y media" ? 30 : match[3] === "y cuarto" ? 15 : 0;
  const meridiem = match[4]?.replace(/[.\s]/g, "");
  if (hour > 23 || minute > 59) return undefined;
  if (meridiem === "pm" && hour < 12) hour += 12;
  else if (meridiem === "am" && hour === 12) hour = 0;
  else if (!meridiem && hour >= 1 && hour <= AFTERNOON_UNTIL_HOUR) hour += 12;
  return hour * 60 + minute;
}

const firstName = (name: string): string => plain(name).split(" ")[0];
const has = (text: string, word: string): boolean => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);

export function parseBookingText(input: string, catalog: CalendarCatalog, now: Date): ParsedBooking {
  const text = plain(input);
  // Lo que va después de «con» es el barbero; lo de antes, el cliente y el servicio.
  const withAt = text.lastIndexOf(" con ");
  const head = withAt === -1 ? text : text.slice(0, withAt);
  const tail = withAt === -1 ? "" : text.slice(withAt + 5);

  const barber = catalog.barbers.find((item) => tail !== "" && has(tail, firstName(item.name)));
  const clients = catalog.clients.filter((item) => item.type !== "walkin");
  const client = clients.find((item) => head.includes(plain(item.name))) ?? clients.find((item) => has(head, firstName(item.name)));
  const service =
    catalog.services.find((item) => text.includes(plain(item.name))) ??
    catalog.services.find((item) => plain(item.name).split(" ").some((word) => word.length >= MIN_WORD && has(head, word)));

  const minutes = parseMinutes(text);
  const day = parseDay(text, now) ?? (minutes === undefined ? undefined : startOfDay(now));
  const when = day && minutes !== undefined ? atMinutes(day, minutes) : undefined;

  return {
    initial: { clientId: client?.id, serviceId: service?.id, barberId: barber?.id, start: when },
    client: client?.name,
    service: service?.name,
    barber: barber?.name,
    when,
  };
}
