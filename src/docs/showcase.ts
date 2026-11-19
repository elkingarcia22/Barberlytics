/**
 * El modo vitrina de la documentación.
 *
 * Cuando la doc se ve dentro de otra página (el portafolio la abre en un
 * iframe a pantalla completa) no enseña todo lo construido: solo el inicio,
 * la página de marca y una selección de componentes. Fuera de un iframe la
 * doc sigue entera; `?vitrina=1` en la URL fuerza el modo para probarlo sin
 * montar un iframe.
 */

import * as React from "react";
import type { Localized } from "@/i18n";
import type { DocsRoute } from "./router";

/**
 * ¿La doc se ve dentro de otra página (un iframe, como el portafolio)? Si el
 * navegador no deja ni preguntar por `window.top`, también es que está
 * incrustada en un origen ajeno.
 */
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** `?vitrina=1` (o `?vitrina`) en la URL fuerza el modo fuera de un iframe. */
function isShowcaseForced(): boolean {
  if (typeof window === "undefined") return false;
  const value = new URLSearchParams(window.location.search).get("vitrina");
  return value !== null && value !== "0" && value !== "false";
}

/** El modo no cambia mientras la página vive: se decide una vez al cargar. */
export function isShowcaseMode(): boolean {
  return isEmbedded() || isShowcaseForced();
}

/** El modo vitrina para un componente; se lee una sola vez al montarlo. */
export function useShowcaseMode(): boolean {
  const [showcase] = React.useState(isShowcaseMode);
  return showcase;
}

/** Los fundamentos que se ven en la vitrina: solo la marca. */
export const SHOWCASE_FOUNDATION_IDS: readonly string[] = ["brand"];

/**
 * Los componentes de la vitrina, en el orden en que se listan. Una selección
 * de las piezas más vistosas y representativas: métricas y gráficas, agenda
 * y turnos, datos, marca, la capa de IA y un par de controles básicos. El
 * primero es la puerta de entrada del botón «Explorar» de la portada. Cada
 * uno abre su página de siempre (`#/components/<id>`); cualquier otro
 * componente, grupo, guía o fundamento vuelve al inicio.
 */
export const SHOWCASE_COMPONENT_IDS: readonly string[] = [
  "kpi-card",
  "metric-card",
  "line-chart",
  "bar-chart",
  "donut-chart",
  "heatmap-chart",
  "day-strip",
  "time-slot-groups",
  "event-calendar",
  "ticket-card",
  "table",
  "selectable-card",
  "barberlytics-logo",
  "barber-pole",
  "chat-composer",
  "ai-insight-card",
  "ai-button",
  "ai-loader",
  "button",
  "input",
];

/** El único grupo del sidebar en la vitrina. */
export const SHOWCASE_GROUP_LABEL: Localized = {
  es: "Ejemplo de componentes",
  en: "Component examples",
};
export const SHOWCASE_GROUP_DESCRIPTION: Localized = {
  es: "Una selección de piezas del sistema, cada una con su página completa.",
  en: "A selection of the system's pieces, each with its full page.",
};

/** ¿Esta ruta se puede abrir en la vitrina? Lo que no, vuelve al inicio. */
export function isRouteInShowcase(route: DocsRoute): boolean {
  switch (route.kind) {
    case "home":
      return true;
    case "foundation":
      return SHOWCASE_FOUNDATION_IDS.includes(route.id);
    case "component":
      return SHOWCASE_COMPONENT_IDS.includes(route.id);
    case "guide":
    case "group":
      return false;
  }
}
