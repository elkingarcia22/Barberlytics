import * as React from "react";
import { clampColumnWidth } from "@/components/scheduling";

/**
 * El ancho de cada columna de barbero en la vista Día, cuando alguien lo
 * ajusta desde el borde de la cabecera. Como la densidad, es de la persona y
 * no de la barbería: vive fuera de React y se guarda para sobrevivir a una
 * recarga. Solo se guardan las columnas tocadas; las demás se reparten el
 * sitio que queda.
 */

export type CalendarColumnWidths = Readonly<Record<string, number>>;

const STORAGE_KEY = "thema.calendar.columnWidths.v1";
const EMPTY: CalendarColumnWidths = {};

/** Lo guardado puede venir de otra versión o a medias: solo pasan los anchos que son números. */
export function parseColumnWidths(raw: string | null): CalendarColumnWidths {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY;
    const entries = Object.entries(parsed as Record<string, unknown>).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]));
    return entries.length === 0 ? EMPTY : Object.fromEntries(entries.map(([id, width]) => [id, clampColumnWidth(width)]));
  } catch {
    return EMPTY;
  }
}

/** El reparto con el ancho de una columna cambiado; `null` la devuelve al de siempre. */
export function withColumnWidth(current: CalendarColumnWidths, id: string, width: number | null): CalendarColumnWidths {
  if (width === null) {
    if (!(id in current)) return current;
    const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== id));
    return Object.keys(rest).length === 0 ? EMPTY : rest;
  }
  const next = clampColumnWidth(width);
  return current[id] === next ? current : { ...current, [id]: next };
}

function read(): CalendarColumnWidths {
  if (typeof window === "undefined") return EMPTY;
  try {
    return parseColumnWidths(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

let widths = read();
const listeners = new Set<() => void>();

function commit(next: CalendarColumnWidths): void {
  if (next === widths) return;
  widths = next;
  try {
    if (Object.keys(next).length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Almacenamiento bloqueado: la sesión sigue, solo que sin recordarlo.
  }
  listeners.forEach((listener) => listener());
}

export const setCalendarColumnWidth = (id: string, width: number | null): void => commit(withColumnWidth(widths, id, width));
export const resetCalendarColumnWidths = (): void => commit(EMPTY);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => widths;
const getServerSnapshot = () => EMPTY;

/** Los anchos ajustados, cómo cambiar uno y cómo volver todos al de siempre. */
export function useCalendarColumnWidths(): [CalendarColumnWidths, (id: string, width: number | null) => void, () => void] {
  const current = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [current, setCalendarColumnWidth, resetCalendarColumnWidths];
}
