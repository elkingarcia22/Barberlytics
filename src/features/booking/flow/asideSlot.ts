import * as React from "react";
import { createPortal } from "react-dom";

/**
 * El hueco al pie de «Tu reserva» (el panel de la derecha en monitor). El cierre deja ahí su botón
 * de pagar en vez de una barra abajo que cruza toda la pantalla.
 */
const AsideSlotContext = React.createContext<HTMLElement | null>(null);

export const AsideSlotProvider = AsideSlotContext.Provider;

/**
 * Lo que va al pie del cierre: con panel lateral se lleva a él (`portal`) y la página queda sin
 * barra; sin panel (celular, tablet, widget) va en la barra de abajo (`footer`).
 */
export function useAsideFooter(node: React.ReactNode, { asideOnly = false }: { /** Sin panel no se muestra (el botón bloqueado antes de identificarse). */ asideOnly?: boolean } = {}): { footer: React.ReactNode | undefined; portal: React.ReactNode } {
  const slot = React.useContext(AsideSlotContext);
  if (slot) return { footer: undefined, portal: createPortal(node, slot) };
  return { footer: asideOnly ? undefined : node, portal: null };
}
