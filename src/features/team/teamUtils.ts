import { addDays, format, startOfWeek } from "date-fns";
import type { Locale } from "date-fns";
import { useShellConfig } from "@/components/app-shell";
import { parseClock } from "@/components/scheduling";
import { BRANCHES, DEFAULT_BRANCH_ID } from "@/features/branches";
import type { ServiceOverride, TeamMember, WeekSchedule } from "./types";

/** Las ayudas sin JSX del módulo de equipo. */
export function useBranchId(): string {
  const { activeCompanyId } = useShellConfig();
  return activeCompanyId ?? DEFAULT_BRANCH_ID;
}

export const branchName = (id: string): string => BRANCHES.find((branch) => branch.id === id)?.name ?? id;

export const WEEKDAYS: readonly string[] = ["0", "1", "2", "3", "4", "5", "6"];

/** Las medias horas del día como «HH:mm». */
export function halfHours(startHour = 5, endHour = 24): string[] {
  const options: string[] = [];
  for (let minute = startHour * 60; minute < endHour * 60; minute += 30) {
    options.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
  }
  return options;
}

/** Los barberos que atienden en la sucursal, en el orden guardado (los nuevos, al final). */
export function orderedBarbers(members: readonly TeamMember[], branchId: string, order: readonly string[]): TeamMember[] {
  const pool = members.filter((member) => (member.role === "barbero-comision" || member.role === "barbero-renta" || member.isAlsoBarber) && member.status !== "inactive" && member.branchIds.includes(branchId));
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...pool].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

/** Los siete días en orden lunes → domingo, con su clave («1»…«0»). */
export function orderedWeekdays(): string[] {
  return [...WEEKDAYS.slice(1), WEEKDAYS[0]];
}

export function weekdayLabel(day: string, locale: Locale): string {
  const monday = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 });
  const offset = (Number(day) + 6) % 7;
  return capitalize(format(addDays(monday, offset), "EEEE", { locale }));
}

export function weeklyHours(value: WeekSchedule): number {
  const minutes = WEEKDAYS.reduce((sum, day) => {
    const range = value[day];
    return sum + (range ? Math.max(0, parseClock(range.end) - parseClock(range.start)) : 0);
  }, 0);
  return Math.round((minutes / 60) * 10) / 10;
}

/** Sin fila propia, el servicio se ofrece con lo del catálogo. */
export const overrideFor = (value: readonly ServiceOverride[], serviceId: string): ServiceOverride => value.find((item) => item.serviceId === serviceId) ?? ({ serviceId, offered: true, price: null, newClientPrice: null, loyaltyPrice: null, durationMin: null, splitCommission: null, extraCommission: null });

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
