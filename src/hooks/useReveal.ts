import * as React from "react";

import { useReducedMotion } from "./useReducedMotion";

const REVEAL_THRESHOLD = 0.15;
const REVEAL_MARGIN = "0px 0px -8% 0px";

/**
 * Marca el elemento con `data-revealed="true"` la primera vez que entra en
 * pantalla, para que la clase `reveal` (src/styles/atmosphere.css) haga su
 * transición. Un IntersectionObserver por elemento y ningún manejador de
 * scroll: la aparición no cuesta cuadros. Con `prefers-reduced-motion` o sin
 * observador (SSR, pruebas) se marca de inmediato.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = React.useRef<T>(null);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      node.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_MARGIN }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return ref;
}
