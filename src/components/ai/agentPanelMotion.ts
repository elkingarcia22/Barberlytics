/**
 * El gesto de abrir el Agente IA, en un solo sitio.
 *
 * Abrir el panel mueve tres cosas a la vez: el panel entra por la derecha, el
 * cajón de objetivos se corre para dejarle sitio y el velo se recorta hasta
 * donde ese sitio empieza. Si cada una lleva su propia duración o su propia
 * curva se leen como tres animaciones sueltas —una empuja, otra se arrastra y
 * otra salta— en vez de como una sola cosa abriéndose.
 *
 * Y llevaban: el cajón heredaba los 500 ms de la animación de entrada del
 * propio `Sheet`, el panel corría a 300 ms y el velo cambiaba de golpe porque
 * nunca tuvo transición. Las curvas a medida tampoco se aplicaban: la clase
 * `duration-500` del `Sheet` viene con la variante `data-[state=open]`, que
 * pesa más que una clase suelta, así que ganaba siempre. Por eso esto se pasa
 * como estilo en línea y no como clases: es la única forma de que el número
 * que se lee aquí sea el que de verdad corre.
 */

import type * as React from "react";

/**
 * Lo que mide el panel abierto. El cajón se corre exactamente esto.
 *
 * No son 400 px a secas: en una ventana angosta —el panel del navegador de
 * Claude, media pantalla— reservarlos dejaba el cajón en 100 px y el chat
 * parecía montado encima del contenido en vez de al lado. Con el tope en
 * proporción, el panel cede cuando no hay sitio y los dos siguen cabiendo.
 * De 890 px de ventana en adelante son los 400 de siempre.
 */
export const AGENT_PANEL_WIDTH = "min(400px, 45vw)";

/**
 * El aire que queda a la izquierda del cajón cuando el panel está abierto,
 * para que se siga viendo que detrás está la app y no una pantalla partida.
 */
export const AGENT_PANEL_GUTTER = 32;

/**
 * El margen exterior de todo lo que flota sobre la página: el panel del Agente
 * IA, el cajón de ayuda, los `Sheet` y el tope de alto de los diálogos. Ni el
 * panel ni los cajones van pegados al borde de la ventana: dejarlos flotar a
 * esta distancia es lo que los separa visualmente de la app que tapan. Es
 * margen, no relleno: lo de dentro no cambia. Coincide con `3` de Tailwind
 * (0.75rem), que es lo que usan `sheet.tsx` y `dialog.tsx`.
 */
export const OVERLAY_INSET = 12;

/**
 * Lo que ocupa el panel en la fila del shell: su ancho más el margen que lo
 * separa del borde derecho de la ventana. Es lo que se anima al abrirlo.
 */
export const AGENT_PANEL_OUTER_WIDTH = `calc(${AGENT_PANEL_WIDTH} + ${OVERLAY_INSET}px)`;

/**
 * Lo que un cajón tiene que descontar además del ancho del panel para quedar
 * *junto* a él y no encima: el margen derecho del panel y el mismo margen entre
 * los dos.
 */
export const AGENT_PANEL_SHELL_FRAME = OVERLAY_INSET * 2;

export const AGENT_PANEL_DURATION_MS = 320;
export const AGENT_PANEL_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/** `transition` para las propiedades que se muevan con el panel. */
export const agentPanelTransition = (...properties: string[]): string =>
  properties
    .map((property) => `${property} ${AGENT_PANEL_DURATION_MS}ms ${AGENT_PANEL_EASING}`)
    .join(", ");

/**
 * Cómo se corre un cajón —y su velo— para dejarle sitio al panel.
 *
 * El velo no lleva el ancho máximo: con `left: 0` y un `right` puesto, un
 * `max-width` lo encogería desde la izquierda y dejaría sin tapar la franja
 * que el cajón sí cubre.
 */
export function agentPanelShift(open: boolean): {
  content: React.CSSProperties;
  overlay: React.CSSProperties;
} {
  // Cerrado no vuelve a 0: el cajón flota a `OVERLAY_INSET` del borde, como sin el panel.
  const right = open ? `calc(${AGENT_PANEL_WIDTH} + ${AGENT_PANEL_SHELL_FRAME}px)` : `${OVERLAY_INSET}px`;
  return {
    content: {
      right,
      // Cerrado vuelve a su ancho de siempre, dicho aquí y no en una clase:
      // dejarlo sin poner lo devolvía al `max-w` del tamaño del cajón —más
      // estrecho— en cuanto se cerraba el panel.
      maxWidth: open
        ? `calc(100vw - ${AGENT_PANEL_WIDTH} - ${AGENT_PANEL_SHELL_FRAME + AGENT_PANEL_GUTTER}px)`
        : `min(1280px, calc(100vw - ${OVERLAY_INSET * 2}px))`,
      transition: agentPanelTransition("right", "max-width"),
    },
    // El velo llega hasta el borde izquierdo del panel (abierto) o hasta la ventana (cerrado).
    overlay: { right: open ? AGENT_PANEL_OUTER_WIDTH : 0, transition: agentPanelTransition("right") },
  };
}
