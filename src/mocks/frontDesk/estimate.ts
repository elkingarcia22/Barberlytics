import { db } from "../db";
import { appointmentsOn, hoursOn } from "../calendar/handlers";
import { parseClock, type MockAppointment } from "../calendar/seed";
import { durationOf } from "../booking/logic";
import { branchNow } from "../settings/branchRules";
import { barbersOf, memberName } from "../team/seed";
import { onAbsence } from "../team/workforce";
import type { MockQueueEntry } from "./state";

/**
 * Cuánto falta para cada persona de la fila. Es una simulación, no un modelo: se reparte la fila en
 * orden entre los barberos que atienden sin cita, cada uno cuando se libera (lo que le queda al que
 * está en la silla y sus citas de hoy), con la duración de catálogo del servicio. Quien pidió un
 * barbero espera a ese; «sin preferencia» va con el primero que quede libre, y a igualdad, con quien
 * va antes en la fila de Equipo. Se muestra como rango porque un corte no dura siempre lo mismo.
 */

/** Pasos con que se busca el hueco de cada barbero. */
const STEP_MIN = 5;
/** Lo mínimo que se cuenta para alguien que ya está en la silla, aunque su cita «debería» haber terminado. */
const MIN_REMAINING = 5;
/** El margen del rango: «unos 20–30 min». */
const SPREAD_MIN = 10;

export interface QueueEstimate {
  /** Con quién le tocaría (si se mantiene el orden). */
  barberId: string | null;
  barberName: string | null;
  /** Minuto del día (de la sede) en que lo atenderían; `null` si hoy ya no alcanza. */
  startMinute: number | null;
  /** Espera en minutos, como rango; `null` si hoy no alcanza. */
  waitMin: number | null;
  waitMax: number | null;
  position: number;
}

interface Lane {
  id: string;
  name: string;
  hours: [number, number][];
  busy: [number, number][];
}

const minuteOf = (iso: string) => parseClock(iso.slice(11, 16));

/** Lo que ocupa una cita viva a partir de ahora: la de la silla hasta que termine; la que viene, su tramo. */
function busyOf(item: MockAppointment, now: number): [number, number] | null {
  const start = minuteOf(item.start);
  const end = start + item.durationMin;
  if (item.status === "seated" || item.status === "arrived") return [now, Math.max(end, now + MIN_REMAINING)];
  if (item.status === "scheduled") return end > now ? [start, end] : null;
  return null;
}

/** Los barberos que atienden sin cita hoy en la sede, en el orden de la fila de Equipo. */
function lanes(branchId: string, day: string, now: number): Lane[] {
  const members = barbersOf(db.team.members, db.team.orders, branchId);
  const order = db.team.orders.find((item) => item.branchId === branchId)?.walkIn ?? [];
  const enabled = order.length > 0 ? order.filter((entry) => entry.enabled).map((entry) => members.find((member) => member.id === entry.memberId)).filter((member): member is NonNullable<typeof member> => Boolean(member)) : members;
  const today = appointmentsOn(branchId, day);
  return enabled
    .filter((member) => !onAbsence(member.id, day))
    .map((member) => ({
      id: member.id,
      name: memberName(member),
      hours: hoursOn(member, day).map((range): [number, number] => [parseClock(range.start), parseClock(range.end)]),
      busy: today
        .filter((item) => item.barberId === member.id)
        .map((item) => busyOf(item, now))
        .filter((range): range is [number, number] => range !== null),
    }))
    .filter((lane) => lane.hours.some(([, end]) => end > now));
}

/** El primer minuto desde `from` en que el barbero puede atender `length` minutos sin pisar nada. */
function firstFit(lane: Lane, from: number, length: number): number | null {
  for (const [open, close] of lane.hours) {
    for (let minute = Math.max(open, Math.ceil(from / STEP_MIN) * STEP_MIN); minute + length <= close; minute += STEP_MIN) {
      const candidate = minute;
      if (!lane.busy.some(([start, end]) => candidate < end && candidate + length > start)) return candidate;
    }
  }
  return null;
}

const roundDown = (value: number) => Math.floor(value / STEP_MIN) * STEP_MIN;

/** La espera de cada persona que sigue en la fila, en su orden. */
export function estimateQueue(branchId: string, entries: readonly MockQueueEntry[], at: Date = new Date()): Map<string, QueueEstimate> {
  const local = branchNow(branchId, at);
  const day = local.slice(0, 10);
  const now = minuteOf(local);
  const pool = lanes(branchId, day, now);
  const result = new Map<string, QueueEstimate>();
  const waiting = entries.filter((entry) => entry.status === "waiting" && entry.branchId === branchId && entry.day === day).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  waiting.forEach((entry, index) => {
    const length = Math.max(STEP_MIN, durationOf(entry.serviceIds));
    const candidates = entry.barberId ? pool.filter((lane) => lane.id === entry.barberId) : pool;
    const best = candidates
      .map((lane) => ({ lane, start: firstFit(lane, now, length) }))
      .filter((option): option is { lane: Lane; start: number } => option.start !== null)
      .sort((a, b) => a.start - b.start)[0];
    if (!best) {
      result.set(entry.id, { barberId: entry.barberId, barberName: null, startMinute: null, waitMin: null, waitMax: null, position: index + 1 });
      return;
    }
    // Ese tramo queda tomado para los que vienen detrás.
    best.lane.busy.push([best.start, best.start + length]);
    const wait = Math.max(0, best.start - now);
    result.set(entry.id, { barberId: best.lane.id, barberName: best.lane.name, startMinute: best.start, waitMin: roundDown(wait), waitMax: roundDown(wait) + SPREAD_MIN, position: index + 1 });
  });
  return result;
}

/** La espera si alguien se uniera ahora (para la portada del kiosco y «¿hay turno?»). */
export function estimateIfJoined(branchId: string, serviceIds: readonly string[], barberId: string | null, at: Date = new Date()): QueueEstimate | null {
  const day = branchNow(branchId, at).slice(0, 10);
  const probe: MockQueueEntry = { id: "__probe", branchId, day, firstName: "", phone: null, clientId: null, serviceIds: [...serviceIds], barberId, status: "waiting", joinedAt: "9999", source: "kiosk", calledAt: null, appointmentId: null, leftAt: null };
  return estimateQueue(branchId, [...db.frontDesk.queue, probe], at).get(probe.id) ?? null;
}
