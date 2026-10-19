import * as React from "react";
import { useSearchParams } from "react-router";
import { format, isValid, parseISO } from "date-fns";
import { CALENDAR_VIEWS, clientTypeSchema, type CalendarView, type ClientType, type TeamFilter } from "./types";
import { PULSE_FOCUSES, type PulseFocus } from "./pulseModel";
import type { CalendarColorBy } from "./calendarModel";

/** «Colorear por» en la URL (`color=servicio|estado`); sin el parámetro, neutral. */
const COLOR_PARAM: Record<Exclude<CalendarColorBy, "neutral">, string> = { service: "servicio", status: "estado", client: "cliente" };
const CLIENT_TYPES: readonly ClientType[] = clientTypeSchema.options;

/**
 * Lo que se ve vive en la URL: el día, la vista, el filtro de equipo y la
 * cita abierta. Copiar el enlace reproduce la misma agenda y «atrás» vuelve
 * al día anterior. El calendario abre en hoy, en la vista Día y con
 * «Trabajando», como en producción.
 */

const DATE_KEY = "yyyy-MM-dd";

export const toDateKey = (date: Date): string => format(date, DATE_KEY);

export function fromDateKey(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function useCalendarState(today: Date = new Date()) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("fecha");
  const date = React.useMemo(() => fromDateKey(dateParam) ?? today, [dateParam, today]);
  const viewParam = searchParams.get("vista");
  const view: CalendarView = CALENDAR_VIEWS.includes(viewParam as CalendarView) ? (viewParam as CalendarView) : "day";
  const team: TeamFilter = searchParams.get("equipo") || "working";
  const appointmentId = searchParams.get("cita");
  // Los filtros admiten varios valores, separados por comas: «foco=late,toCollect».
  const focusParam = searchParams.get("foco");
  const focuses = React.useMemo(() => (focusParam ?? "").split(",").filter((item): item is PulseFocus => PULSE_FOCUSES.includes(item as PulseFocus)), [focusParam]);
  const serviceParam = searchParams.get("servicio");
  const serviceIds = React.useMemo(() => (serviceParam ?? "").split(",").filter(Boolean), [serviceParam]);
  const colorParam = searchParams.get("color");
  const colorBy: CalendarColorBy = (Object.keys(COLOR_PARAM) as Exclude<CalendarColorBy, "neutral">[]).find((key) => COLOR_PARAM[key] === colorParam) ?? "neutral";
  // «tipo», no «cliente»: `?cliente=` ya abre el alta con un cliente elegido.
  const typeParam = searchParams.get("tipo");
  const clientTypes = React.useMemo(() => (typeParam ?? "").split(",").filter((item): item is ClientType => CLIENT_TYPES.includes(item as ClientType)), [typeParam]);

  const set = React.useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return {
    date,
    dateKey: toDateKey(date),
    view,
    team,
    appointmentId,
    /** Los estados que se están mirando; vacío es «todos». */
    focuses,
    /** Los servicios que se están mirando (ids del catálogo); vacío es «todos». */
    serviceIds,
    /** Los tipos de cliente que se están mirando; vacío es «todos». */
    clientTypes,
    /** Ver solo los huecos disponibles: las citas se apagan y lo libre se marca. */
    freeOnly: searchParams.get("huecos") === "1",
    setFreeOnly: (next: boolean) => set({ huecos: next ? "1" : undefined }),
    /** Resaltar las citas enlazadas: cada grupo con su color, las demás apagadas. */
    showLinked: searchParams.get("enlazadas") === "1",
    setShowLinked: (next: boolean) => set({ enlazadas: next ? "1" : undefined }),
    /** De qué se tiñen las tarjetas: es de la vista, no un filtro, y no apaga ninguna cita. */
    colorBy,
    setColorBy: (next: CalendarColorBy) => set({ color: next === "neutral" ? undefined : COLOR_PARAM[next] }),
    /** Estado y servicio cambian en una sola escritura de la URL. */
    setFilters: (next: { focuses?: readonly PulseFocus[]; serviceIds?: readonly string[]; clientTypes?: readonly ClientType[] }) =>
      set({
        ...(next.focuses ? { foco: next.focuses.join(",") || undefined } : {}),
        ...(next.serviceIds ? { servicio: next.serviceIds.join(",") || undefined } : {}),
        ...(next.clientTypes ? { tipo: next.clientTypes.join(",") || undefined } : {}),
      }),
    /** Abre un día en la vista Día, opcionalmente con un solo barbero. */
    openDay: (next: Date, barberId: string | null) => set({ fecha: toDateKey(next) === toDateKey(today) ? undefined : toDateKey(next), vista: undefined, equipo: barberId ?? undefined }),
    isToday: toDateKey(date) === toDateKey(today),
    setDate: (next: Date) => set({ fecha: toDateKey(next) === toDateKey(today) ? undefined : toDateKey(next) }),
    setView: (next: CalendarView) => set({ vista: next === "day" ? undefined : next }),
    setTeam: (next: TeamFilter) => set({ equipo: next === "working" ? undefined : next }),
    openAppointment: (id: string | null) => set({ cita: id ?? undefined }),
    /** Ir al día de una cita en la vista Día y abrirla, en una sola escritura de la URL (el buscador). */
    openAppointmentOn: (next: Date, id: string) => set({ fecha: toDateKey(next) === toDateKey(today) ? undefined : toDateKey(next), vista: undefined, cita: id }),
  };
}
