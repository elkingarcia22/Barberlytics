import * as React from "react";

/**
 * Los atajos de una letra del calendario, los de cualquier calendario
 * rápido: C crea una cita, T vuelve a hoy, A/D/W/M cambian de vista, las
 * flechas [ y ] mueven el día Z deshace lo último que se movió y H abre los huecos. Solo cuando
 * nadie está escribiendo: dentro de un campo o con una tecla modificadora
 * pulsada, la letra es una letra.
 */

export interface CalendarShortcutHandlers {
  create?: () => void;
  today?: () => void;
  agenda?: () => void;
  day?: () => void;
  week?: () => void;
  month?: () => void;
  previous?: () => void;
  next?: () => void;
  undo?: () => void;
  /** El resumen con IA. */
  assistant?: () => void;
  /** El panel de huecos. */
  gaps?: () => void;
}

const KEYS: Record<string, keyof CalendarShortcutHandlers> = {
  c: "create",
  t: "today",
  a: "agenda",
  d: "day",
  w: "week",
  m: "month",
  "[": "previous",
  "]": "next",
  z: "undo",
  i: "assistant",
  h: "gaps",
};

/** Un elemento donde escribir: ahí las letras no son atajos. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.getAttribute("role") === "combobox";
}

export function useCalendarShortcuts(handlers: CalendarShortcutHandlers, enabled = true): void {
  // Los manejadores cambian en cada render; el oyente se queda con los últimos sin volver a registrarse.
  const ref = React.useRef(handlers);
  React.useEffect(() => {
    ref.current = handlers;
  });

  React.useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      // Con un diálogo o un menú abierto, las letras son suyas.
      if (document.querySelector("[role='dialog'][data-state='open'], [role='menu'][data-state='open'], [role='listbox']")) return;
      const action = KEYS[event.key.toLowerCase()];
      const handler = action ? ref.current[action] : undefined;
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
