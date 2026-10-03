import * as React from "react";
import { SCHEDULE_DENSITIES, type ScheduleDensity } from "@/components/scheduling";

/**
 * Cuánto ocupa cada media hora en la rejilla del día. Es una preferencia de
 * la persona, no de la pantalla: quien quiere ver la jornada entera la
 * quiere siempre. Vive fuera de React y se guarda para sobrevivir a una
 * recarga, igual que la posición de la barra de acciones.
 */

export const DEFAULT_DENSITY: ScheduleDensity = "normal";
export const DENSITY_OPTIONS: readonly ScheduleDensity[] = ["compact", "normal", "wide"];

const STORAGE_KEY = "thema.calendar.density.v1";

const isDensity = (value: unknown): value is ScheduleDensity => typeof value === "string" && value in SCHEDULE_DENSITIES;

function read(): ScheduleDensity {
  if (typeof window === "undefined") return DEFAULT_DENSITY;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isDensity(stored) ? stored : DEFAULT_DENSITY;
  } catch {
    return DEFAULT_DENSITY;
  }
}

let density = read();
const listeners = new Set<() => void>();

export function setCalendarDensity(value: ScheduleDensity): void {
  if (value === density) return;
  density = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Almacenamiento bloqueado: la sesión sigue, solo que sin recordarlo.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => density;
const getServerSnapshot = () => DEFAULT_DENSITY;

/** La densidad actual y su alto de franja en píxeles. */
export function useCalendarDensity(): [ScheduleDensity, (value: ScheduleDensity) => void, number] {
  const current = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [current, setCalendarDensity, SCHEDULE_DENSITIES[current]];
}
