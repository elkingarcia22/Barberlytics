import * as React from "react";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * Con qué diseño se abre el panel de una cita. Son propuestas para comparar
 * (docs/investigacion-modulos/panel-de-cita.md): la de pestañas que había y
 * las dos que el usuario eligió de la segunda ronda (2026-10-18): «Arma la
 * cita» y «Tarjeta del momento». Es una preferencia de la
 * persona, como la densidad: vive fuera de React y se guarda. Un enlace con
 * `?panel=<id>` la fija al cargar, para compartir una versión.
 */

export const PANEL_VERSIONS = ["tabs", "cards", "moment"] as const;
export type PanelVersion = (typeof PANEL_VERSIONS)[number];

export const DEFAULT_PANEL_VERSION: PanelVersion = "tabs";

export const PANEL_VERSION_LABEL: Record<PanelVersion, AppMessageKey> = {
  tabs: "calendar.panel.version.tabs",
  cards: "calendar.panel.version.cards",
  moment: "calendar.panel.version.moment",
};

export const PANEL_VERSION_HINT: Record<PanelVersion, AppMessageKey> = {
  tabs: "calendar.panel.hint.tabs",
  cards: "calendar.panel.hint.cards",
  moment: "calendar.panel.hint.moment",
};

const STORAGE_KEY = "thema.calendar.panelVersion.v2";
const URL_PARAM = "panel";

export const isPanelVersion = (value: unknown): value is PanelVersion => typeof value === "string" && (PANEL_VERSIONS as readonly string[]).includes(value);

function read(): PanelVersion {
  if (typeof window === "undefined") return DEFAULT_PANEL_VERSION;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (isPanelVersion(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isPanelVersion(stored) ? stored : DEFAULT_PANEL_VERSION;
  } catch {
    return DEFAULT_PANEL_VERSION;
  }
}

let version = read();
const listeners = new Set<() => void>();

export function setPanelVersion(value: PanelVersion): void {
  if (value === version) return;
  version = value;
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
const getSnapshot = () => version;
const getServerSnapshot = () => DEFAULT_PANEL_VERSION;

export function usePanelVersion(): [PanelVersion, (value: PanelVersion) => void] {
  const current = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [current, setPanelVersion];
}
