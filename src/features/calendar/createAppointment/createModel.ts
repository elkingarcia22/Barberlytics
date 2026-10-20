import * as React from "react";
import { format, isSameDay } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { formatClock, type TimeSlotGroup } from "@/components/scheduling";
import { matchesPerson } from "@/lib/search/personSearch";
import type { Client } from "../types";
import { windowOf, type FreeTime } from "./useDaySlots";

/** Lo que comparten las propuestas de «Crear cita» y no se pinta: buscar clientes, decir la hora, armar las franjas. */

/** Cuántos clientes se muestran sin buscar (los de más visitas) y cuántos al buscar. */
const FREQUENT_LIMIT = 6;
const SEARCH_LIMIT = 20;

/** Lo que sale del buscador de clientes: sin «sin cita previa» ni bloqueados, por nombre, celular o correo; sin buscar, los de más visitas. */
export function matchClients(clients: readonly Client[], query: string): Client[] {
  const real = clients.filter((client) => client.type !== "walkin" && !client.blocked);
  if (!query.trim()) return [...real].sort((a, b) => b.visits - a.visits).slice(0, FREQUENT_LIMIT);
  return real.filter((client) => matchesPerson(client, query)).slice(0, SEARCH_LIMIT);
}

/** «Hoy · 3:00 p. m.» o «Mié 22 oct · 3:00 p. m.». */
export function useWhenLabel(): (date: Date, now: Date, intl: string) => string {
  const t = useAppT();
  const { locale } = useLocale();
  return React.useCallback(
    (date: Date, now: Date, intl: string) => {
      const day = isSameDay(date, now) ? t("schedule.today") : format(date, "EEE d MMM", { locale: calendarLocale(locale) });
      return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${formatClock(date, intl)}`;
    },
    [t, locale]
  );
}

/** Las franjas del día con sus horas; `trailing` pone algo junto a cada una (las caras). */
export function groupTimes(times: readonly FreeTime[], label: (time: FreeTime) => string, selected: Date | null, trailing?: (time: FreeTime) => React.ReactNode, windowLabel?: (id: string) => string): TimeSlotGroup[] {
  const groups = new Map<string, TimeSlotGroup["options"][number][]>();
  for (const time of times) {
    const id = windowOf(time.minute);
    groups.set(id, [...(groups.get(id) ?? []), { time: String(time.minute), label: label(time), selected: selected?.getTime() === time.start.getTime(), trailing: trailing?.(time) }]);
  }
  return [...groups.entries()].map(([id, options]) => ({ id, label: windowLabel?.(id) ?? id, options }));
}

