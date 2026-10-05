import { PRODUCTS, SERVICES, type MockClient } from "../calendar/seed";
import { PRODUCT_PHOTOS } from "../media";

/**
 * Los clientes del backend simulado. El directorio sale de los mismos
 * clientes que usa el calendario (`db.calendar.clients`), así una persona es
 * la misma en la agenda y en su ficha; aquí se le añade lo que la agenda no
 * necesita: contacto, dirección, en qué momento de la relación está y su
 * historial. Todo se deriva del id, de forma determinista.
 */

export type MockSegment = "new" | "retained" | "frequent" | "vip" | "atRisk" | "lost" | "recovered" | "blocked";

export interface MockGuest {
  id: string;
  name: string;
  relation: string;
  visits: number;
}

export interface MockCustomerProfile {
  email: string;
  branchId: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipcode: string;
  birthDate: string | null;
  onlineOnly: boolean;
  blocked: boolean;
  createdAt: string;
  guests: MockGuest[];
  /** Borrado del directorio; la agenda conserva sus citas. */
  deleted?: boolean;
}

/** Solo lo que cambió o se creó; el resto se deriva al vuelo. */
export interface MockCustomersState {
  profiles: Record<string, MockCustomerProfile>;
}

export const emptyCustomers = (): MockCustomersState => ({ profiles: {} });

const DAY_MS = 86_400_000;
const BRANCH_IDS: readonly string[] = ["ma", "ma", "ma", "nc", "ri", "ut"];
const PLACES: readonly (readonly [string, string, string])[] = [
  ["Estados Unidos", "Massachusetts", "Boston"],
  ["Estados Unidos", "North Carolina", "Charlotte"],
  ["Estados Unidos", "Rhode Island", "Providence"],
  ["Colombia", "Bogotá, D.C.", "Bogotá"],
];
const STREETS: readonly string[] = ["Newbury St", "Beacon St", "Tremont St", "Boylston St", "Hanover St", "Charles St"];
const RELATIONS: readonly string[] = ["Hijo", "Hermano", "Amigo", "Primo", "Sobrino"];
const GUEST_NAMES: readonly string[] = ["Santi", "Tomás", "Emilio", "Martín", "Lucas", "Nico"];
const SOURCES = ["internal", "online", "online", "walkin"] as const;
const METHODS = ["card", "card", "cash", "link"] as const;

export function hashOf(value: string, salt = 0): number {
  let hash = 2166136261 ^ salt;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export function deriveProfile(client: MockClient, now = new Date()): MockCustomerProfile {
  const h = hashOf(client.id);
  const place = PLACES[h % PLACES.length];
  /* El cumpleaños cae en los próximos meses para que la lista siempre tenga
     alguno cerca; uno de cada seis no lo dejó registrado. */
  const birthday = new Date(now.getTime() + (hashOf(client.id, 3) % 150) * DAY_MS);
  const birthDate = h % 6 === 5 ? null : `${1978 + (h % 28)}-${isoDay(birthday).slice(5)}`;
  const guests: MockGuest[] =
    h % 5 === 0
      ? [{ id: `gst_${client.id}_1`, name: GUEST_NAMES[h % GUEST_NAMES.length], relation: RELATIONS[hashOf(client.id, 5) % RELATIONS.length], visits: 1 + (h % 4) }]
      : [];
  return {
    email: `${slug(client.name)}@correo.com`,
    branchId: BRANCH_IDS[hashOf(client.id, 1) % BRANCH_IDS.length],
    country: place[0],
    state: place[1],
    city: place[2],
    address: `${10 + (h % 380)} ${STREETS[h % STREETS.length]}`,
    zipcode: String(10_000 + (h % 80_000)).padStart(5, "0"),
    birthDate,
    onlineOnly: h % 9 === 0,
    blocked: h % 23 === 7,
    createdAt: new Date(now.getTime() - (60 + (hashOf(client.id, 2) % 700)) * DAY_MS).toISOString(),
    guests,
  };
}

/**
 * En qué momento de la relación está el cliente y cuándo vino por última vez.
 * El tipo de la agenda (nuevo, retenido, frecuente, VIP) dice cuánto viene;
 * aquí se le suma el tiempo: quien lleva dos ciclos sin volver está en
 * riesgo, quien lleva meses se perdió y quien volvió tras perderse se
 * recuperó. Un bloqueo manda sobre todo lo demás.
 */
export function lifecycleOf(client: MockClient, blocked: boolean, now = new Date()): { segment: MockSegment; lastVisitAt: string | null } {
  if (client.visits === 0) return { segment: blocked ? "blocked" : "new", lastVisitAt: null };
  const h = hashOf(client.id, 7);
  const every = client.visitEveryDays ?? 21;
  const bucket = h % 10;
  const ago = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();
  const base: MockSegment = client.type === "walkin" ? "new" : client.type;
  let segment: MockSegment = base;
  let lastVisitAt = ago(1 + (h % Math.max(2, Math.min(every, 25))));
  if (bucket === 0) {
    segment = "lost";
    lastVisitAt = ago(100 + (h % 120));
  } else if (bucket === 1 && client.visits >= 2) {
    segment = "atRisk";
    lastVisitAt = ago(every * 2 + (h % 10));
  } else if ((bucket === 2 || bucket === 3) && client.visits >= 3) {
    segment = "recovered";
    lastVisitAt = ago(3 + (h % 9));
  }
  return { segment: blocked ? "blocked" : segment, lastVisitAt };
}

export interface MockCustomerAppointment {
  id: string;
  service: string;
  start: string;
  barberId: string | null;
  source: (typeof SOURCES)[number];
  requestedBarber: boolean;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  total: number;
}

export interface MockCustomerPayment {
  id: string;
  date: string;
  status: "paid" | "refunded";
  amount: number;
  method: (typeof METHODS)[number];
  reference: string;
}

export interface MockCustomerProduct {
  id: string;
  name: string;
  units: number;
  total: number;
  lastBoughtAt: string;
  imageUrl: string | null;
}

export const ticketOf = (client: MockClient): number => 28 + (hashOf(client.id, 11) % 48);

const HISTORY_LIMIT = 12;

export function historyOf(client: MockClient, lastVisitAt: string | null, segment: MockSegment, barberIds: readonly string[], now = new Date()): MockCustomerAppointment[] {
  const h = hashOf(client.id, 13);
  const every = client.visitEveryDays ?? 21;
  const pickBarber = (index: number) => client.preferredBarberId ?? barberIds[(h + index) % Math.max(1, barberIds.length)] ?? null;
  const history: MockCustomerAppointment[] = [];
  const upcoming = segment !== "lost" && segment !== "blocked" && h % 3 === 0;
  if (upcoming) {
    const service = SERVICES[h % SERVICES.length];
    history.push({ id: `apt_${client.id}_next`, service: service.name, start: new Date(now.getTime() + (1 + (h % 9)) * DAY_MS).toISOString(), barberId: pickBarber(0), source: SOURCES[h % SOURCES.length], requestedBarber: client.preferredBarberId !== null, status: "scheduled", total: service.price });
  }
  if (!lastVisitAt) return history;
  const total = Math.min(HISTORY_LIMIT, client.visits + client.cancellations + client.noShows);
  let cancellations = client.cancellations;
  let noShows = client.noShows;
  const last = new Date(lastVisitAt).getTime();
  for (let index = 0; index < total; index += 1) {
    const service = SERVICES[(h + index * 3) % SERVICES.length];
    let status: MockCustomerAppointment["status"] = "completed";
    if (index > 0 && index % 4 === 2 && cancellations > 0) {
      status = "cancelled";
      cancellations -= 1;
    } else if (index > 0 && index % 5 === 3 && noShows > 0) {
      status = "no_show";
      noShows -= 1;
    }
    history.push({
      id: `apt_${client.id}_${index}`,
      service: service.name,
      start: new Date(last - index * every * DAY_MS).toISOString(),
      barberId: pickBarber(index),
      source: SOURCES[(h + index) % SOURCES.length],
      requestedBarber: client.preferredBarberId !== null,
      status,
      total: status === "completed" ? service.price : 0,
    });
  }
  return history;
}

export function paymentsOf(clientId: string, history: readonly MockCustomerAppointment[]): MockCustomerPayment[] {
  const h = hashOf(clientId, 17);
  return history
    .filter((item) => item.status === "completed")
    .map((item, index) => ({
      id: `pay_${item.id}`,
      date: item.start,
      status: h % 8 === 0 && index === 1 ? ("refunded" as const) : ("paid" as const),
      amount: item.total,
      method: METHODS[(h + index) % METHODS.length],
      reference: `${hashOf(item.id).toString(16).padStart(8, "0")}-${hashOf(item.id, 1).toString(16).slice(0, 4)}`,
    }));
}

export function productsOf(clientId: string, lastVisitAt: string | null): MockCustomerProduct[] {
  const h = hashOf(clientId, 19);
  if (!lastVisitAt) return [];
  return Array.from({ length: h % 3 }, (_, index) => {
    const product = PRODUCTS[(h + index * 2) % PRODUCTS.length];
    const units = 1 + ((h >> (index + 1)) % 4);
    return { id: product.id, name: product.name, units, total: units * product.price, lastBoughtAt: lastVisitAt, imageUrl: PRODUCT_PHOTOS[product.id] ?? null };
  });
}
