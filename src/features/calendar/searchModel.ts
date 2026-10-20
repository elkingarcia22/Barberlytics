import { format, type Locale } from "date-fns";
import type { useAppT } from "@/app/i18n";
import { formatClock } from "@/components/scheduling";
import { appointmentStage, appointmentStart, findBarber, findClient, servicesOf, type ModelContext } from "./calendarModel";
import { normalizeSearch } from "@/lib/search/personSearch";
import { CLIENT_TYPE_KEYS, STATUS_KEYS, type Appointment, type AppointmentStatus } from "./types";

export { normalizeSearch };

/**
 * El buscador del calendario: por todo lo que se pregunta en el mostrador —el
 * nombre, el celular o el correo del cliente, el barbero, el servicio, el estado («no
 * asistió», «cobrada», «tarde»), el tipo de cliente, si vino en línea o sin
 * cita, la nota, el producto, el día («20 oct», «sábado») o la hora («9:30»).
 *
 * Cada cita se vuelve un texto sin tildes ni mayúsculas con todo eso, y una
 * búsqueda encuentra las citas donde aparecen **todas** las palabras escritas
 * («marcela fade» = Marcela y Fade). Los números también se comparan sin
 * espacios ni signos, así «300 123» encuentra «+57 300 123 4567».
 */

type Translate = ReturnType<typeof useAppT>;

/** Otras maneras de decir cada estado, además de su nombre en pantalla. */
const STATUS_WORDS: Record<AppointmentStatus, readonly string[]> = {
  scheduled: ["agendada", "agendado", "pendiente", "por llegar", "programada", "scheduled", "booked"],
  arrived: ["ingreso", "llego", "esperando", "en espera", "arrived", "waiting", "checked in"],
  seated: ["en silla", "silla", "atendiendo", "seated", "in the chair"],
  paid: ["cobrada", "cobrado", "pagada", "pago", "paid"],
  no_show: ["no asistio", "no vino", "inasistencia", "planton", "no show", "no-show"],
  cancelled: ["cancelada", "cancelado", "anulada", "cancelled", "canceled"],
};

/** Las del momento de la cita que no son un estado guardado: «tarde», «por cobrar». */
const STAGE_WORDS: Partial<Record<NonNullable<ReturnType<typeof appointmentStage>>, readonly string[]>> = {
  late: ["tarde", "retrasada", "late"],
  toCollect: ["por cobrar", "cobrar", "to collect"],
};

const SOURCE_WORDS: Record<Appointment["source"], readonly string[]> = {
  online: ["en linea", "online", "reserva online", "reserva en linea", "web"],
  internal: ["en la barberia", "recepcion", "interna"],
  walkin: ["sin cita", "sin cita previa", "walk in", "walk-in"],
};

const digitsOf = (text: string): string => text.replace(/\D/g, "");

export interface SearchIndexEntry {
  appointment: Appointment;
  /** Todo el texto que se puede buscar, normalizado. */
  text: string;
  /** Las cifras del celular, juntas: para encontrarlo escrito con o sin espacios. */
  digits: string;
  /** El nombre del cliente normalizado, para premiar a quien lo empieza igual. */
  name: string;
}

export interface SearchIndexInput {
  appointments: readonly Appointment[];
  ctx: Pick<ModelContext, "catalog" | "intl" | "formatMoney" | "now">;
  t: Translate;
  dateLocale: Locale;
}

/** El texto buscable de cada cita, armado una vez por lista. */
export function buildSearchIndex({ appointments, ctx, t, dateLocale }: SearchIndexInput): SearchIndexEntry[] {
  return appointments.map((appointment) => {
    const client = findClient(ctx.catalog, appointment.clientId);
    const barber = findBarber(ctx.catalog, appointment.barberId);
    const start = appointmentStart(appointment);
    const stage = appointmentStage(appointment, ctx.now);
    const products = appointment.products.map((line) => ctx.catalog.products.find((product) => product.id === line.productId)?.name ?? "");
    const parts = [
      client?.name ?? t("calendar.clientType.walkin"),
      client?.phone ?? "",
      client?.email ?? "",
      client ? t(CLIENT_TYPE_KEYS[client.type]) : "",
      client?.notes.map((note) => note.text).join(" ") ?? "",
      barber?.name ?? "",
      servicesOf(ctx.catalog, appointment)
        .map((service) => `${service.name} ${service.category}`)
        .join(" "),
      products.join(" "),
      t(STATUS_KEYS[appointment.status]),
      STATUS_WORDS[appointment.status].join(" "),
      stage ? (STAGE_WORDS[stage] ?? []).join(" ") : "",
      SOURCE_WORDS[appointment.source].join(" "),
      appointment.walkIn ? SOURCE_WORDS.walkin.join(" ") : "",
      appointment.notes ?? "",
      appointment.referencePhotos?.length ? "foto referencia photo" : "",
      appointment.linkId ? "enlazada linked" : "",
      // El día de todas las formas en que se escribe: «sábado 17 de octubre», «17 oct», «17/10», «2026-10-17».
      format(start, "EEEE d 'de' MMMM yyyy", { locale: dateLocale }),
      format(start, "EEE d MMM", { locale: dateLocale }),
      format(start, "d/M dd/MM yyyy-MM-dd"),
      // La hora: «9:30 a. m.», «09:30», «21:30».
      formatClock(start, ctx.intl),
      format(start, "H:mm HH:mm"),
      appointment.id,
    ];
    const text = normalizeSearch(parts.join(" "));
    return { appointment, text, digits: digitsOf(client?.phone ?? ""), name: normalizeSearch(client?.name ?? "") };
  });
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Si una palabra buscada está en la cita. Lo que empieza por cifra («20», «9:30») cuenta como número
 * entero —el día 20, no el 20 de «2026»; las 9:30, no las 19:30—; un celular se busca también solo por
 * sus cifras, desde tres, para que «2» no traiga media agenda.
 */
function matchesWord(entry: SearchIndexEntry, word: string): boolean {
  if (!/^\d/.test(word)) return entry.text.includes(word);
  if (new RegExp(`(^|[^0-9])${escapeRegExp(word)}($|[^0-9])`).test(entry.text)) return true;
  const digits = digitsOf(word);
  return digits.length >= 3 && digits === word.replace(/[\s+\-().]/g, "") && entry.digits.includes(digits);
}

/** Lo más que se enseña de una vez: con más, mejor afinar la búsqueda. */
export const MAX_SEARCH_RESULTS = 30;

export interface SearchResult {
  items: Appointment[];
  /** Cuántas coinciden en total, aunque se enseñen menos. */
  total: number;
}

/**
 * Las citas que tienen todas las palabras buscadas. Primero las que empiezan
 * por el nombre buscado; luego, de la más cercana a hoy a la más lejana, con
 * las que vienen antes que las que ya pasaron.
 */
export function searchAppointments(index: readonly SearchIndexEntry[], query: string, now: Date, limit = MAX_SEARCH_RESULTS): SearchResult {
  const normalized = normalizeSearch(query);
  if (normalized.length === 0) return { items: [], total: 0 };
  const words = normalized.split(" ");
  const matches = index.filter((entry) => words.every((word) => matchesWord(entry, word)));
  // Los números sueltos (un celular a medias) también se buscan juntos: «300 123» = «300123».
  const joined = digitsOf(normalized);
  const byDigits = words.length > 1 && joined.length >= 6 && words.every((word) => /^[\d+\-().]+$/.test(word)) ? index.filter((entry) => entry.digits.includes(joined)) : [];
  const all = [...new Set([...matches, ...byDigits])];
  const firstWord = words[0];
  const nowTime = now.getTime();
  const rank = (entry: SearchIndexEntry) => {
    const time = appointmentStart(entry.appointment).getTime();
    const upcoming = time >= nowTime - 60 * 60_000 ? 0 : 1;
    return { name: entry.name.startsWith(firstWord) || entry.name.includes(` ${firstWord}`) ? 0 : 1, upcoming, distance: Math.abs(time - nowTime) };
  };
  const sorted = all
    .map((entry) => ({ entry, rank: rank(entry) }))
    .sort((a, b) => a.rank.name - b.rank.name || a.rank.upcoming - b.rank.upcoming || a.rank.distance - b.rank.distance)
    .map(({ entry }) => entry.appointment);
  return { items: sorted.slice(0, limit), total: sorted.length };
}
