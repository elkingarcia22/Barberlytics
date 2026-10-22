import * as React from "react";
import { railActionsFor, type RailActionSpec } from "./railActions";

/**
 * Qué acciones pone la persona a mano en la barra de cada pantalla: una
 * principal y hasta tres a la vista, elegidas de todas las acciones de la
 * pantalla y de sus filtros rápidos. Lo demás se pliega en «más acciones» y
 * los filtros que no eligió no salen.
 *
 * Se guarda por pantalla y en este navegador: cada pantalla tiene sus propias
 * acciones, así que una elección para el Calendario no dice nada de Clientes.
 * Sin elección vale lo que la pantalla declaró (`primary`, `overflow`).
 */

export interface RailLayout {
  /** La acción rellena del final. */
  primary: string | null;
  /** Las que se quedan a la vista, en este orden. Hasta `RAIL_LAYOUT_SECONDARY_MAX`. */
  secondary: readonly string[];
}

/** Tres a la vista, más la principal: lo que cabe sin que la barra pida plegarse. */
export const RAIL_LAYOUT_SECONDARY_MAX = 3;

const STORAGE_PREFIX = "thema.actionRail.layout.v1:";

/**
 * La pantalla a la que pertenece una ruta: los ids del final se cambian por
 * `:id` para que la ficha de un cliente y la de otro sean la misma pantalla.
 */
export function railLayoutKey(pathname: string): string {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => (/\d/.test(segment) ? ":id" : segment));
  return `/${segments.join("/")}`;
}

function read(key: string): RailLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { primary, secondary } = parsed as { primary?: unknown; secondary?: unknown };
    return {
      primary: typeof primary === "string" ? primary : null,
      secondary: Array.isArray(secondary) ? secondary.filter((id): id is string => typeof id === "string").slice(0, RAIL_LAYOUT_SECONDARY_MAX) : [],
    };
  } catch {
    return null;
  }
}

// Fuera de React: la barra de escritorio, el botón flotante y la cabecera de la
// pantalla leen la misma elección y se enteran a la vez cuando cambia.
const listeners = new Set<() => void>();

function write(key: string, layout: RailLayout | null): void {
  try {
    if (layout) window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(layout));
    else window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Sin almacenamiento la elección dura lo que la pestaña.
  }
  memory.set(key, layout);
  listeners.forEach((listener) => listener());
}

const memory = new Map<string, RailLayout | null>();
const layoutOf = (key: string): RailLayout | null => {
  if (!memory.has(key)) memory.set(key, read(key));
  return memory.get(key) ?? null;
};

/** La elección guardada para una pantalla y cómo cambiarla; `null` la devuelve a la de la pantalla. */
export function useRailLayout(key: string): readonly [RailLayout | null, (next: RailLayout | null) => void] {
  const layout = React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => layoutOf(key),
    () => null
  );
  const setLayout = React.useCallback((next: RailLayout | null) => write(key, next), [key]);
  return [layout, setLayout];
}

/** La elección que la pantalla trae de serie, para empezar a editar desde ella. */
export function declaredRailLayout(actions: readonly RailActionSpec[]): RailLayout {
  const screen = railActionsFor(actions, 0);
  return {
    primary: screen.find((action) => action.primary && !action.filter)?.id ?? null,
    secondary: screen.filter((action) => !action.primary && !action.overflow && !action.filter).map((action) => action.id).slice(0, RAIL_LAYOUT_SECONDARY_MAX),
  };
}

/**
 * Las acciones con la elección aplicada: la principal y las de a la vista
 * marcadas como tales y en su orden, lo demás plegado y los filtros no
 * elegidos fuera. Las de selección (`single`, `bulk`) no se tocan.
 */
export function applyRailLayout(actions: readonly RailActionSpec[], layout: RailLayout | null): readonly RailActionSpec[] {
  // Los filtros rápidos no salen en la barra hasta que alguien los elige.
  if (!layout) return actions.filter((action) => !action.filter);
  const ids = new Set(actions.map((action) => action.id));
  const primary = layout.primary && ids.has(layout.primary) ? layout.primary : null;
  const secondary = layout.secondary.filter((id) => ids.has(id) && id !== primary);
  const isScreen = (action: RailActionSpec) => action.scope.includes("screen");
  const placed = actions
    .filter((action) => !(isScreen(action) && action.filter && !secondary.includes(action.id)))
    .map((action) => {
      if (!isScreen(action)) return action;
      // Sin principal elegida se queda la que declaró la pantalla.
      const isPrimary = primary ? action.id === primary : Boolean(action.primary);
      return { ...action, primary: isPrimary, overflow: !isPrimary && !secondary.includes(action.id) };
    });
  const order = (action: RailActionSpec) => {
    const index = secondary.indexOf(action.id);
    return index === -1 ? secondary.length : index;
  };
  return [...placed].sort((a, b) => order(a) - order(b));
}

/** Lo que el editor de «Editar acciones» necesita de la barra que lo abre. */
export interface RailLayoutEditing {
  /** Las acciones tal como las declaró la pantalla, antes de la elección. */
  actions: readonly RailActionSpec[];
  layout: RailLayout | null;
  setLayout: (next: RailLayout | null) => void;
}

/** La barra se lo pasa a sus ajustes; fuera de una barra con acciones no hay nada que editar. */
export const RailLayoutContext = React.createContext<RailLayoutEditing | null>(null);

/**
 * Las acciones de una pantalla con la elección de la persona aplicada, y lo que
 * hace falta para editarla. La pantalla sale de la ruta salvo que se diga otra.
 */
export function useRailLayoutActions(actions: readonly RailActionSpec[], layoutKey?: string): { actions: readonly RailActionSpec[]; editing: RailLayoutEditing } {
  // Cada pantalla monta su barra: la ruta al montarla basta para saber cuál es.
  const [routeKey] = React.useState(() => (typeof window === "undefined" ? "/" : railLayoutKey(window.location.pathname)));
  const [layout, setLayout] = useRailLayout(layoutKey ?? routeKey);
  const applied = React.useMemo(() => applyRailLayout(actions, layout), [actions, layout]);
  const editing = React.useMemo(() => ({ actions, layout, setLayout }), [actions, layout, setLayout]);
  return { actions: applied, editing };
}
