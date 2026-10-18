import { seededRandom } from "../db";
import { clientPhoto } from "../media";

/**
 * Los datos del calendario del backend simulado: el equipo con su horario,
 * los clientes, el catálogo y una agenda que se genera día a día de forma
 * determinista (la misma fecha produce las mismas citas), así las pruebas y
 * las capturas se repiten y navegar por el mes siempre encuentra algo.
 */

export interface MockWorkingRange {
  start: string;
  end: string;
}

/**
 * Lo que el calendario sabe de un barbero. Sale del equipo
 * (`mocks/team`): el horario fijo por día de la semana, su nivel y si toma
 * clientes sin cita, según el orden de la sucursal.
 */
export interface MockBarber {
  id: string;
  branchId: string;
  name: string;
  avatarUrl: string | null;
  level: string | null;
  /** Franjas por día de la semana (0 = domingo). Sin entrada, no trabaja. */
  workingHours: Partial<Record<number, MockWorkingRange[]>>;
  acceptsWalkIns: boolean;
  bookingVisible: boolean;
}

export type MockClientType = "walkin" | "new" | "retained" | "frequent" | "vip";
export type MockNoteKind = "note" | "medication" | "allergy";

export interface MockClientNote {
  id: string;
  kind: MockNoteKind;
  text: string;
  createdAt: string;
}

export interface MockClient {
  id: string;
  name: string;
  phone: string;
  type: MockClientType;
  visits: number;
  cancellations: number;
  noShows: number;
  lastVisitAt: string | null;
  preferredBarberId: string | null;
  /** Cada cuántos días suele volver; `null` si no hay ritmo aún. */
  visitEveryDays: number | null;
  notes: MockClientNote[];
  /** La foto que subió el cliente, o `null` (se pintan sus iniciales). */
  avatarUrl: string | null;
}

export interface MockService {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  price: number;
  imageUrl?: string | null;
}

export interface MockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string | null;
}

export type MockAppointmentStatus = "scheduled" | "arrived" | "seated" | "paid" | "no_show" | "cancelled";
export type MockAppointmentSource = "internal" | "online" | "walkin";
export type MockRepeatRule = "none" | "weekly" | "biweekly" | "triweekly" | "monthly" | "bimonthly" | "quarterly";
export type MockPaymentMethod = "cash" | "card" | "link" | "mixed";

export interface MockHistoryEntry {
  id: string;
  at: string;
  actor: string;
  event: string;
}

export interface MockPayment {
  method: MockPaymentMethod;
  tip: number;
  tax: number;
  total: number;
  paidAt: string;
}

export interface MockAppointment {
  id: string;
  branchId: string;
  clientId: string;
  barberId: string;
  requestedBarberId: string | null;
  serviceIds: string[];
  products: { productId: string; qty: number }[];
  /** Inicio en ISO local (sin zona): la agenda es de la sucursal, no de UTC. */
  start: string;
  durationMin: number;
  status: MockAppointmentStatus;
  barberReady: boolean;
  walkIn: boolean;
  source: MockAppointmentSource;
  repeat: MockRepeatRule;
  seriesId: string | null;
  notes: string | null;
  /** Fotos del corte que quiere el cliente (data URL), si las mandó al reservar en línea. */
  referencePhotos?: string[];
  createdAt: string;
  createdBy: string;
  history: MockHistoryEntry[];
  payment: MockPayment | null;
  linkId?: string | null;
}

export type MockBlockCategory = "sick" | "vacation" | "holiday" | "lunch" | "meeting" | "business" | "personal";
export type MockBlockRepeat = "none" | "daily" | "weekly" | "monthly";

export interface MockTimeBlock {
  id: string;
  branchId: string;
  barberId: string;
  category: MockBlockCategory;
  repeat: MockBlockRepeat;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  description: string | null;
}

export interface MockWaitlistEntry {
  id: string;
  branchId: string;
  clientId: string;
  serviceId: string;
  barberId: string | null;
  slots: { date: string; time: string }[];
  createdAt: string;
}

export interface MockSale {
  id: string;
  branchId: string;
  items: { productId: string; qty: number }[];
  method: MockPaymentMethod;
  total: number;
  paidAt: string;
}

/* --------------------------------------------------------------- catalog */

export const SERVICES: readonly MockService[] = [
  { id: "svc_corte", name: "Corte clásico", category: "Cortes", durationMin: 30, price: 35 },
  { id: "svc_fade", name: "Fade", category: "Cortes", durationMin: 45, price: 45 },
  { id: "svc_nino", name: "Corte niño", category: "Cortes", durationMin: 30, price: 25 },
  { id: "svc_barba", name: "Arreglo de barba", category: "Barba", durationMin: 30, price: 30 },
  { id: "svc_afeitado", name: "Afeitado clásico", category: "Barba", durationMin: 45, price: 40 },
  { id: "svc_combo", name: "Corte + barba", category: "Combos", durationMin: 60, price: 60 },
  { id: "svc_premium", name: "Ritual premium", category: "Combos", durationMin: 90, price: 95 },
  { id: "svc_cejas", name: "Diseño de cejas", category: "Extras", durationMin: 15, price: 12 },
  { id: "svc_tratamiento", name: "Tratamiento capilar", category: "Extras", durationMin: 45, price: 55 },
];

export const PRODUCTS: readonly MockProduct[] = [
  { id: "prd_cera", name: "Cera mate", category: "Styling", price: 18 },
  { id: "prd_pomada", name: "Pomada brillo", category: "Styling", price: 16 },
  { id: "prd_polvo", name: "Polvo texturizante", category: "Styling", price: 20 },
  { id: "prd_aceite", name: "Aceite de barba", category: "Barba", price: 22 },
  { id: "prd_balsamo", name: "Bálsamo de barba", category: "Barba", price: 19 },
  { id: "prd_shampoo", name: "Shampoo diario", category: "Cuidado", price: 14 },
  { id: "prd_acond", name: "Acondicionador", category: "Cuidado", price: 14 },
  { id: "prd_toalla", name: "Toalla de barbería", category: "Accesorios", price: 25 },
];

/* --------------------------------------------------------------- clients */

const CLIENT_FIRST = ["Marcela", "Santiago", "Mariana", "Juan", "Camila", "Andrés", "Valentina", "Sebastián", "Daniela", "Mateo", "Sara", "Nicolás", "Isabella", "Samuel", "Gabriela", "Martín", "Antonia", "Emilio", "Luciana", "Tomás", "Renata", "Diego", "Julieta", "Felipe", "Elena", "Simón", "Paula", "Gael", "Victoria", "Bruno"];
const CLIENT_LAST = ["Gómez", "Pérez", "Rodríguez", "Martínez", "López", "García", "Hernández", "Torres", "Ramírez", "Castro", "Moreno", "Jiménez", "Ortiz", "Silva", "Rojas", "Vargas"];
const TYPES: readonly MockClientType[] = ["new", "retained", "frequent", "vip"];
const NOTE_SAMPLES: readonly [MockNoteKind, string][] = [
  ["note", "Le gusta el fade alto con la barba perfilada."],
  ["note", "Suele llegar 10 minutos tarde; avisar al barbero."],
  ["allergy", "Alergia al aceite de árbol de té."],
  ["medication", "Toma anticoagulantes: cuidado con el afeitado a navaja."],
  ["note", "Prefiere que no le hablen durante el corte."],
];

/** Los barberos de Massachusetts (ids del equipo), para repartir preferencias. */
const MA_BARBER_IDS: readonly string[] = ["team-04", "team-05", "team-06", "team-07", "team-08", "team-26", "team-27", "team-28", "team-29", "team-30"];

export const WALK_IN_CLIENT: MockClient = {
  id: "cli_walkin",
  name: "Walk in",
  phone: "000******0000",
  type: "walkin",
  visits: 0,
  cancellations: 0,
  noShows: 0,
  lastVisitAt: null,
  preferredBarberId: null,
  visitEveryDays: null,
  notes: [],
  avatarUrl: null,
};

/**
 * Dos clientes no se llaman igual: si el nombre ya salió, se cambia el
 * apellido por el siguiente libre. No consume el dado, así el resto de la
 * semilla no se mueve.
 */
function uniqueName(name: string, taken: Set<string>): string {
  const [first, last] = name.split(" ");
  let candidate = name;
  for (let step = 1; taken.has(candidate) && step <= CLIENT_LAST.length; step += 1) {
    candidate = `${first} ${CLIENT_LAST[(CLIENT_LAST.indexOf(last ?? "") + step) % CLIENT_LAST.length]}`;
  }
  taken.add(candidate);
  return candidate;
}

export function seedClients(count = 44, seed = 11): MockClient[] {
  const rand = seededRandom(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const base = Date.UTC(2026, 8, 1);
  const taken = new Set<string>();
  const clients = Array.from({ length: count }, (_, index) => {
    const type = index === 0 ? "vip" : index === 1 ? "new" : pick(TYPES);
    const visits = type === "new" ? 1 + Math.floor(rand() * 2) : type === "retained" ? 3 + Math.floor(rand() * 5) : type === "frequent" ? 8 + Math.floor(rand() * 10) : 18 + Math.floor(rand() * 25);
    const notes: MockClientNote[] = rand() < 0.4 ? [pick(NOTE_SAMPLES)].map(([kind, text], noteIndex) => ({ id: `note_${index}_${noteIndex}`, kind, text, createdAt: new Date(base - Math.floor(rand() * 90) * 86_400_000).toISOString() })) : [];
    const name = uniqueName(index === 0 ? "Marcela Gómez" : `${pick(CLIENT_FIRST)} ${pick(CLIENT_LAST)}`, taken);
    const barbers = MA_BARBER_IDS;
    return {
      id: `cli_${String(index + 1).padStart(3, "0")}`,
      name,
      phone: `+57 3${String(Math.floor(rand() * 90_000_000) + 10_000_000).padStart(8, "0")}`,
      type,
      visits,
      cancellations: Math.floor(rand() * (type === "vip" ? 4 : 2)),
      noShows: rand() < 0.2 ? 1 : 0,
      lastVisitAt: new Date(base - Math.floor(rand() * 30) * 86_400_000).toISOString(),
      preferredBarberId: rand() < 0.7 ? pick(barbers) : null,
      visitEveryDays: type === "new" ? null : 7 * (1 + Math.floor(rand() * 4)),
      notes,
      avatarUrl: clientPhoto(index + 1, name),
    } satisfies MockClient;
  });
  return [WALK_IN_CLIENT, ...clients];
}

/* --------------------------------------------------------------- agenda */

export const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** «2026-09-25» + «10:30» → ISO local sin zona («2026-09-25T10:30:00»). */
export const localIso = (day: string, time: string): string => `${day}T${time}:00`;

export const parseClock = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export const clockOf = (minutes: number): string => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

function hashKey(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Cada cuántas citas, de media, se vende además un producto. */
const PRODUCT_SALE_EVERY = 5;

/** Cada cuántas citas, de media, una se repite y una trae nota (del hash del id). */
const REPEAT_EVERY = 5;
const NOTE_EVERY = 7;
/** Una de cada tantas citas pegadas a la anterior del mismo barbero es el segundo servicio del mismo cliente. */
const SAME_VISIT_EVERY = 3;
const SEED_NOTES = ["Quiere el mismo corte de la última vez", "Trae foto de referencia", "Llega con el tiempo justo", "Prefiere máquina 2 a los lados"] as const;

/** Antes de esta hora (10:00) la agenda de hoy se siembra como a las 12:30, para que la demo muestre todos los estados. */
const DEMO_EARLY_BEFORE_MINUTES = 10 * 60;
const DEMO_TODAY_AT_MINUTES = 12 * 60 + 30;

export interface SeedDayOptions {
  branchId: string;
  day: string;
  /** Los barberos de la sucursal ese día, con su horario ya resuelto. */
  barbers: readonly MockBarber[];
  clients: readonly MockClient[];
  /** Ahora, para decidir en qué estado va cada cita de hoy. */
  now: Date;
  /** Los bloqueos de ese día (almuerzos, reuniones…): ahí no se siembran citas. */
  blocks?: readonly MockTimeBlock[];
}

/**
 * La agenda de un día: para cada barbero con horario, citas encadenadas con
 * huecos, con servicios del catálogo y clientes de la lista. Las de días
 * pasados están cobradas (con algún plantón o cancelación); las de hoy van
 * según la hora; las futuras siguen agendadas.
 */
export function seedDay({ branchId, day, barbers, clients, now, blocks = [] }: SeedDayOptions): MockAppointment[] {
  const rand = seededRandom(hashKey(`${branchId}:${day}`));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const date = new Date(`${day}T00:00:00`);
  const weekday = date.getDay();
  const isPast = dateKey(now) > day;
  const isToday = dateKey(now) === day;
  // Abriendo la app antes de las 10 casi nada habría pasado y el día saldría entero en «Agendada».
  // Entonces hoy se siembra como a mediodía: la demo trae citas cobradas, en silla, en espera y por
  // venir. Desde las 10 manda la hora real.
  const realMinutes = now.getHours() * 60 + now.getMinutes();
  const nowMinutes = isToday && realMinutes < DEMO_EARLY_BEFORE_MINUTES ? DEMO_TODAY_AT_MINUTES : realMinutes;
  const realClients = clients.filter((client) => client.id !== WALK_IN_CLIENT.id);
  const appointments: MockAppointment[] = [];
  let counter = 0;

  for (const barber of barbers) {
    const ranges = barber.workingHours[weekday] ?? [];
    for (const range of ranges) {
      let cursor = parseClock(range.start) + (rand() < 0.5 ? 0 : 30);
      const end = parseClock(range.end);
      while (cursor + 30 <= end) {
        if (rand() < 0.35) {
          cursor += 30;
          continue;
        }
        const service = pick(SERVICES);
        if (cursor + service.durationMin > end) break;
        // Nadie agenda encima de un almuerzo o de una reunión: la cita se va a después del bloqueo.
        const from = cursor;
        const blocked = blocks.find((block) => block.barberId === barber.id && from < parseClock(block.endTime) && parseClock(block.startTime) < from + service.durationMin);
        if (blocked) {
          cursor = parseClock(blocked.endTime);
          continue;
        }
        const client = pick(realClients);
        const startMinutes = cursor;
        const endMinutes = cursor + service.durationMin;
        const status = appointmentStatus({ isPast, isToday, nowMinutes, startMinutes, endMinutes, roll: rand() });
        const walkIn = rand() < 0.12;
        const id = `apt_${day.replace(/-/g, "")}_${barber.id.replace("team-", "")}_${counter++}`;
        const createdAt = new Date(date.getTime() - Math.floor(rand() * 10 + 1) * 86_400_000).toISOString();
        const paidAt = new Date(`${day}T${clockOf(endMinutes)}:00`).toISOString();
        // Una de cada cinco citas se lleva además un producto. Sale del id, no del dado: la agenda sembrada no cambia.
        const productRoll = hashKey(id);
        const product = productRoll % PRODUCT_SALE_EVERY === 0 ? PRODUCTS[productRoll % PRODUCTS.length] : null;
        const sold = product ? [{ productId: product.id, qty: 1 + (productRoll % 2) }] : [];
        const soldTotal = product ? product.price * sold[0].qty : 0;
        // Algunas citas se repiten y otras traen nota. Sale del id, no del dado, para no mover la agenda
        // sembrada. Solo repite quien ya tiene historia (retenido en adelante) y reservó: la primera visita
        // de alguien o un cliente de paso no pueden ser una serie.
        const extraRoll = hashKey(`${id}:extra`);
        const canRepeat = !walkIn && (client.type === "retained" || client.type === "frequent" || client.type === "vip");
        const repeat = canRepeat && extraRoll % REPEAT_EVERY === 0 ? (extraRoll % 2 === 0 ? "weekly" : "biweekly") : "none";
        const notes = extraRoll % NOTE_EVERY === 1 ? SEED_NOTES[extraRoll % SEED_NOTES.length] : null;
        appointments.push({
          id,
          branchId,
          clientId: client.id,
          barberId: barber.id,
          requestedBarberId: rand() < 0.75 ? barber.id : null,
          serviceIds: [service.id],
          products: sold,
          start: localIso(day, clockOf(startMinutes)),
          durationMin: service.durationMin,
          status,
          barberReady: status !== "scheduled",
          walkIn,
          source: walkIn ? "walkin" : rand() < 0.4 ? "online" : "internal",
          repeat,
          seriesId: repeat === "none" ? null : `ser_${client.id}_${barber.id.replace("team-", "")}`,
          notes,
          createdAt,
          createdBy: walkIn ? barber.name : rand() < 0.5 ? "Lucía Bernal" : "Reserva online",
          history: [{ id: `${id}_h0`, at: createdAt, actor: walkIn ? barber.name : "Lucía Bernal", event: walkIn ? "walkin" : "created" }, ...visitSteps(id, day, startMinutes, endMinutes, status, barber.name)],
          payment: status === "paid" ? { method: pick(["cash", "card", "link"] as const), tip: rand() < 0.6 ? Math.round(service.price * 0.15) : 0, tax: 0, total: service.price + soldTotal, paidAt } : null,
        });
        cursor = endMinutes + (rand() < 0.4 ? 0 : 30);
      }
    }
  }
  return splitCombos(chainVisits(appointments));
}

/** Llega entre 8 min antes y 4 min después de su hora; pasa a la silla de 1 a 7 min después. Sale del id. */
const ARRIVAL_SPREAD_MINUTES = 13;
const ARRIVAL_EARLIEST_MINUTES = -8;
const SEAT_WAIT_SPREAD_MINUTES = 7;

/** Lo que pasó en la barbería con una cita ya empezada: llegó, se sentó y se cobró, con su hora. */
function visitSteps(id: string, day: string, startMinutes: number, endMinutes: number, status: MockAppointment["status"], barberName: string): MockHistoryEntry[] {
  if (status !== "arrived" && status !== "seated" && status !== "paid") return [];
  const roll = hashKey(`${id}:visit`);
  const arrived = startMinutes + ARRIVAL_EARLIEST_MINUTES + (roll % ARRIVAL_SPREAD_MINUTES);
  const seated = Math.max(startMinutes, arrived) + 1 + (roll % SEAT_WAIT_SPREAD_MINUTES);
  const at = (minutes: number) => new Date(`${day}T${clockOf(minutes)}:00`).toISOString();
  const steps: MockHistoryEntry[] = [{ id: `${id}_h1`, at: at(arrived), actor: "Lucía Bernal", event: "status:arrived" }];
  if (status === "seated" || status === "paid") steps.push({ id: `${id}_h2`, at: at(seated), actor: barberName, event: "status:seated" });
  if (status === "paid") steps.push({ id: `${id}_h3`, at: at(endMinutes), actor: "Lucía Bernal", event: "status:paid" });
  return steps;
}

/**
 * Los combos que se piden por partes: una cita, varios servicios. Ocupan lo mismo que el combo
 * (corte 30 + barba 30 = 60; fade 45 + afeitado 45 = 90), así que la agenda no se mueve.
 */
const COMBO_PARTS: Readonly<Record<string, readonly string[]>> = {
  svc_combo: ["svc_corte", "svc_barba"],
  svc_premium: ["svc_fade", "svc_afeitado"],
};
/** Uno de cada tantos combos se agenda por partes. Sale del id, no del dado. */
const SPLIT_COMBO_EVERY = 2;

function splitCombos(appointments: readonly MockAppointment[]): MockAppointment[] {
  const priceOf = (ids: readonly string[]) => ids.reduce((sum, id) => sum + (SERVICES.find((service) => service.id === id)?.price ?? 0), 0);
  return appointments.map((item) => {
    const parts = item.serviceIds.length === 1 ? COMBO_PARTS[item.serviceIds[0]] : undefined;
    if (!parts || hashKey(`${item.id}:split`) % SPLIT_COMBO_EVERY !== 0) return item;
    const payment = item.payment ? { ...item.payment, total: item.payment.total - priceOf(item.serviceIds) + priceOf(parts) } : null;
    return { ...item, serviceIds: [...parts], payment };
  });
}

/**
 * Un cliente que agenda dos citas de una vez (corte y después barba) ocupa dos citas seguidas
 * con el mismo barbero, enlazadas: algunas citas pegadas a la anterior pasan a ser del mismo
 * cliente y comparten `linkId`. Sale del id, no del dado: el resto no se mueve.
 */
function chainVisits(appointments: readonly MockAppointment[]): MockAppointment[] {
  const result: MockAppointment[] = [];
  for (const item of appointments) {
    const previous = result[result.length - 1];
    const glued =
      previous &&
      previous.barberId === item.barberId &&
      !previous.walkIn &&
      new Date(previous.start).getTime() + previous.durationMin * 60_000 === new Date(item.start).getTime() &&
      hashKey(`${item.id}:visit`) % SAME_VISIT_EVERY === 0;
    if (!glued) {
      result.push(item);
      continue;
    }
    // Salieron del mismo agendamiento: quedan enlazadas (la primera también).
    const linkId = previous.linkId ?? `lnk_${previous.id}`;
    result[result.length - 1] = { ...previous, linkId };
    result.push({ ...item, clientId: previous.clientId, walkIn: false, source: previous.source, requestedBarberId: previous.requestedBarberId, repeat: "none", seriesId: null, linkId });
  }
  return result;
}

function appointmentStatus({ isPast, isToday, nowMinutes, startMinutes, endMinutes, roll }: { isPast: boolean; isToday: boolean; nowMinutes: number; startMinutes: number; endMinutes: number; roll: number }): MockAppointmentStatus {
  if (isPast) return roll < 0.06 ? "no_show" : roll < 0.12 ? "cancelled" : "paid";
  if (!isToday) return roll < 0.05 ? "cancelled" : "scheduled";
  if (endMinutes <= nowMinutes) return roll < 0.08 ? "no_show" : roll < 0.95 ? "paid" : "seated";
  if (startMinutes <= nowMinutes) return roll < 0.6 ? "seated" : "arrived";
  if (startMinutes - nowMinutes <= 30) return roll < 0.4 ? "arrived" : "scheduled";
  return "scheduled";
}

/** Un almuerzo diario por barbero y un par de bloqueos puntuales, para que se vean. */
export function seedBlocks(): MockTimeBlock[] {
  return [
    { id: "blk_lunch_andres", branchId: "ma", barberId: "team-04", category: "lunch", repeat: "daily", startDate: "2026-01-01", endDate: "2027-12-31", startTime: "13:00", endTime: "14:00", description: null },
    { id: "blk_lunch_daniela", branchId: "ma", barberId: "team-08", category: "lunch", repeat: "daily", startDate: "2026-01-01", endDate: "2027-12-31", startTime: "13:00", endTime: "13:30", description: null },
    { id: "blk_meeting", branchId: "ma", barberId: "team-05", category: "meeting", repeat: "weekly", startDate: "2026-09-04", endDate: "2027-12-31", startTime: "10:00", endTime: "10:30", description: "Reunión de equipo" },
    { id: "blk_vac_valeria", branchId: "ma", barberId: "team-06", category: "vacation", repeat: "none", startDate: "2026-10-05", endDate: "2026-10-09", startTime: "08:00", endTime: "16:00", description: "Vacaciones" },
  ];
}

/** Si un bloqueo (con su repetición) cae en un día concreto. */
export function blockAppliesOn(block: MockTimeBlock, day: string): boolean {
  if (day < block.startDate || day > block.endDate) return false;
  if (block.repeat === "none" || block.repeat === "daily") return true;
  const target = new Date(`${day}T00:00:00`);
  const first = new Date(`${block.startDate}T00:00:00`);
  if (block.repeat === "weekly") return target.getDay() === first.getDay();
  return target.getDate() === first.getDate();
}
