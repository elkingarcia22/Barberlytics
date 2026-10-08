import * as React from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Lo que hay que mover el puntero antes de que cuente como arrastre y no como clic. */
const DRAG_THRESHOLD = 5;
const ACTIVE = '[aria-pressed="true"], [aria-selected="true"]';

interface DragScrollOptions {
  /**
   * Cuando cambia, la fila se desliza hasta dejar a la vista el elemento
   * marcado (`aria-pressed` o `aria-selected`). Pásale lo elegido.
   */
  follow?: unknown;
}

/**
 * Una tira que se desliza de lado también con ratón. En el celular el dedo ya
 * la mueve; en la computadora no hay barra a la vista, así que:
 * - se arrastra con el ratón (y soltar tras arrastrar no cuenta como clic),
 * - la rueda la mueve de lado mientras quede tira por recorrer,
 * - al elegir algo, la tira lo trae a la vista si estaba cortado.
 */
export function useDragScroll<T extends HTMLElement>({ follow }: DragScrollOptions = {}): (node: T | null) => void {
  // En estado y no en un ref: la tira suele aparecer después (cuando llegan los datos)
  // y los listeners tienen que engancharse en ese momento.
  const [element, setElement] = React.useState<T | null>(null);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!element) return;

    let start: { x: number; left: number; id: number } | null = null;
    let dragged = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      start = { x: event.clientX, left: element.scrollLeft, id: event.pointerId };
      dragged = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      if (!dragged && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!dragged) {
        dragged = true;
        element.setPointerCapture(start.id);
      }
      element.scrollLeft = start.left - dx;
    };
    const onPointerUp = () => {
      start = null;
      // Si el clic no llega (se soltó fuera), que no se coma el siguiente.
      if (dragged) window.setTimeout(() => (dragged = false));
    };
    // Soltar después de arrastrar no debe elegir el chip que quedó debajo.
    const onClick = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const max = element.scrollWidth - element.clientWidth;
      if (max <= 0) return;
      const atEdge = (event.deltaY < 0 && element.scrollLeft <= 0) || (event.deltaY > 0 && element.scrollLeft >= max - 1);
      // En el borde la rueda vuelve a mover la página.
      if (atEdge) return;
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("click", onClick, true);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("click", onClick, true);
      element.removeEventListener("wheel", onWheel);
    };
  }, [element]);

  React.useEffect(() => {
    const active = element?.querySelector<HTMLElement>(ACTIVE);
    if (!element || !active) return;
    const box = element.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(element).paddingLeft) || 0;
    let delta = 0;
    if (item.left < box.left + padding) delta = item.left - box.left - padding;
    else if (item.right > box.right - padding) delta = item.right - box.right + padding;
    if (delta !== 0) element.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
  }, [element, follow, reduceMotion]);

  return setElement;
}
