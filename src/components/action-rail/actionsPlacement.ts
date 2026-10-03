import * as React from "react";

/**
 * Dónde viven las acciones de una pantalla: en la barra flotante o en el
 * propio layout (la cabecera de la página y el marco de la tabla).
 *
 * Es una preferencia de la persona, no de cada tabla: quien prefiere la
 * barra la quiere en todas las pantallas. Por eso vive fuera de React, igual
 * que la orientación o el ocultarse sola, y se guarda para sobrevivir a una
 * recarga. Se cambia desde «Personalización» y desde los ajustes de la barra.
 */

export type ActionsPlacement = "rail" | "inline";

export const DEFAULT_ACTIONS_PLACEMENT: ActionsPlacement = "rail";

const STORAGE_KEY = "thema.actions.placement.v1";

function read(): ActionsPlacement {
  if (typeof window === "undefined") return DEFAULT_ACTIONS_PLACEMENT;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "inline" ? "inline" : DEFAULT_ACTIONS_PLACEMENT;
  } catch {
    return DEFAULT_ACTIONS_PLACEMENT;
  }
}

let placement = read();
const listeners = new Set<() => void>();

export function setActionsPlacement(value: ActionsPlacement): void {
  if (value === placement) return;
  placement = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Almacenamiento bloqueado: la sesión sigue, solo que sin recordarlo.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** La preferencia compartida y cómo cambiarla. */
export function useActionsPlacement(): readonly [ActionsPlacement, (value: ActionsPlacement) => void] {
  const value = React.useSyncExternalStore(subscribe, () => placement, () => DEFAULT_ACTIONS_PLACEMENT);
  return [value, setActionsPlacement];
}
