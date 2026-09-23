import * as React from "react";

import { useReducedMotion } from "./useReducedMotion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Inclina el elemento hacia el puntero (rotateX/rotateY con perspectiva).
 * Solo con ratón y sin `prefers-reduced-motion`; en táctil no hace nada.
 * Escribe el transform directamente en el nodo, fuera del ciclo de React,
 * y lo devuelve a su sitio con la transición de `.tilt-reset` al salir.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(maxDegrees = 6) {
  const ref = React.useRef<T>(null);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    if (!window.matchMedia(FINE_POINTER).matches) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.classList.remove("tilt-reset");
        node.style.transform = `perspective(1100px) rotateX(${(-py * maxDegrees).toFixed(2)}deg) rotateY(${(px * maxDegrees).toFixed(2)}deg) translateZ(0)`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      node.classList.add("tilt-reset");
      node.style.transform = "";
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      node.style.transform = "";
    };
  }, [maxDegrees, reducedMotion]);

  return ref;
}
