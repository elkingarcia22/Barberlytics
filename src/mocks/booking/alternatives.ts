import { db } from "../db";
import { dateKey, parseClock, type MockWaitlistEntry } from "../calendar/seed";
import { availability, barberPrice, bookableBarbers, branchHoursToday } from "./logic";

/**
 * Cuando el barbero elegido no tiene horas ese día: quién más puede atender
 * (hace los mismos servicios y sabe de lo mismo) y la lista de espera.
 */

/**
 * Qué servicios cubre cada habilidad. Las habilidades del equipo son texto libre
 * («Barba a navaja»); aquí se leen en servicios para comparar barberos por lo que
 * saben hacer, no por cómo se llama la etiqueta.
 */
export const SKILL_SERVICES: Readonly<Record<string, readonly string[]>> = {
  "Corte clásico": ["svc_corte", "svc_combo"],
  "Corte niño": ["svc_nino"],
  Fade: ["svc_fade", "svc_premium"],
  Barba: ["svc_barba", "svc_combo"],
  "Barba a navaja": ["svc_barba", "svc_afeitado", "svc_premium"],
  Diseño: ["svc_cejas", "svc_fade"],
  Color: ["svc_tinte"],
  Tratamientos: ["svc_tratamiento", "svc_premium"],
};

/** Hasta cuántos días adelante se busca la próxima hora libre de cada barbero. */
const SEARCH_DAYS = 7;
const MAX_ALTERNATIVES = 3;
const MAX_TIMES = 3;
const LEVEL_RANK: Readonly<Record<string, number>> = { lvl_aprendiz: 0, lvl_junior: 1, lvl_senior: 2, lvl_master: 3 };

const skillsOf = (barberId: string): string[] => db.team.members.find((member) => member.id === barberId)?.skills ?? [];
const levelOf = (barberId: string): number | null => {
  const levelId = db.team.members.find((member) => member.id === barberId)?.levelId;
  return levelId ? (LEVEL_RANK[levelId] ?? null) : null;
};
/** Las habilidades que tienen que ver con lo que se pidió. */
const skillsFor = (serviceIds: readonly string[]): Set<string> =>
  new Set(Object.entries(SKILL_SERVICES).filter(([, services]) => services.some((id) => serviceIds.includes(id))).map(([skill]) => skill));

const plusDays = (day: string, count: number): string => {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + count);
  return dateKey(date);
};

export interface Alternative {
  barberId: string;
  /** Lo que tiene en común con lo pedido y con el barbero elegido: «Fade», «Barba a navaja». */
  skills: string[];
  /** El día de sus horas: el pedido o, si ese no tiene, su próximo día libre. */
  date: string;
  times: string[];
}

/**
 * Otros barberos para lo mismo: hacen todos los servicios pedidos, se ordenan
 * por cuánto se parecen (habilidades que cubren lo pedido, las que comparten
 * con el elegido y su nivel) y traen sus horas de ese día o del próximo libre.
 * Los que tienen hora el mismo día van primero: es lo que el cliente quería.
 */
export function alternatives(branchId: string, day: string, serviceIds: readonly string[], barberId: string | null): Alternative[] {
  const wanted = skillsFor(serviceIds);
  const chosenSkills = new Set(barberId ? skillsOf(barberId) : []);
  const chosenLevel = barberId ? levelOf(barberId) : null;
  const ranked = bookableBarbers(branchId)
    .filter((barber) => barber.id !== barberId && serviceIds.every((id) => barberPrice(barber.id, id) !== null))
    .map((barber) => {
      const skills = skillsOf(barber.id);
      const covers = skills.filter((skill) => wanted.has(skill));
      const shared = skills.filter((skill) => chosenSkills.has(skill));
      const level = levelOf(barber.id);
      const levelGap = chosenLevel === null || level === null ? 1 : Math.abs(chosenLevel - level);
      const score = covers.length * 3 + shared.length * 2 - levelGap;
      let found: { date: string; times: string[] } | null = null;
      for (let offset = 0; offset < SEARCH_DAYS && !found; offset += 1) {
        const date = plusDays(day, offset);
        const slots = availability(branchId, date, serviceIds, barber.id);
        if (slots.length > 0) found = { date, times: slots.slice(0, MAX_TIMES).map((slot) => slot.time) };
      }
      return { barberId: barber.id, skills: [...new Set([...covers, ...shared])], score, found };
    })
    .filter((item): item is typeof item & { found: { date: string; times: string[] } } => item.found !== null)
    .sort((a, b) => Number(b.found.date === day) - Number(a.found.date === day) || b.score - a.score || a.found.date.localeCompare(b.found.date));
  return ranked.slice(0, MAX_ALTERNATIVES).map((item) => ({ barberId: item.barberId, skills: item.skills, date: item.found.date, times: item.found.times }));
}

/** Hasta cuántos días adelante se busca el primer hueco de «Lo antes posible». */
const EARLIEST_DAYS = 14;

/**
 * El primer hueco libre desde hoy: con el barbero elegido o, sin preferencia, con cualquiera
 * que haga todo lo pedido (el primero libre de esa hora). `null` si no hay en dos semanas.
 */
export function earliest(branchId: string, serviceIds: readonly string[], barberId: string | null, now = new Date()): { date: string; time: string; barberId: string } | null {
  const today = dateKey(now);
  for (let offset = 0; offset < EARLIEST_DAYS; offset += 1) {
    const date = plusDays(today, offset);
    const slot = availability(branchId, date, serviceIds, barberId)[0];
    if (slot) return { date, time: slot.time, barberId: barberId ?? slot.barberIds[0] };
  }
  return null;
}

export type WaitlistWindow = "morning" | "afternoon" | "evening" | "any";
const NOON = 12 * 60;
/** Desde aquí es noche: la misma frontera que las franjas del selector de horas. */
const EVENING = 18 * 60;
const HOUR = 60;

/**
 * La reserva se apunta en la misma lista de espera que ve la barbería en el
 * Calendario: una entrada por cada hora en punto de la franja que eligió el
 * cliente, así el aviso de «se liberó una hora» la encuentra.
 */
export function joinWaitlist(input: { branchId: string; clientId: string; date: string; serviceIds: readonly string[]; barberId: string | null; window: WaitlistWindow }): MockWaitlistEntry {
  const { opensAt } = branchHoursToday(input.branchId);
  const open = parseClock(opensAt);
  const close = parseClock(branchHoursToday(input.branchId).closesAt);
  const from = input.window === "afternoon" ? Math.max(open, NOON) : input.window === "evening" ? Math.max(open, EVENING) : open;
  const to = input.window === "morning" ? Math.min(close, NOON) : input.window === "afternoon" ? Math.min(close, EVENING) : close;
  const slots: { date: string; time: string }[] = [];
  for (let minute = Math.ceil(from / HOUR) * HOUR; minute < to; minute += HOUR) {
    slots.push({ date: input.date, time: `${String(Math.floor(minute / HOUR)).padStart(2, "0")}:00` });
  }
  const entry: MockWaitlistEntry = {
    id: `wl_${Date.now().toString(36)}`,
    branchId: input.branchId,
    clientId: input.clientId,
    serviceId: input.serviceIds[0] ?? "",
    barberId: input.barberId,
    slots: slots.length > 0 ? slots : [{ date: input.date, time: opensAt }],
    createdAt: new Date().toISOString(),
  };
  db.calendar.waitlist = [...db.calendar.waitlist, entry];
  db.persist();
  return entry;
}
