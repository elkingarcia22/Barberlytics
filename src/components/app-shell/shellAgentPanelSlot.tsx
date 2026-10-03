import * as React from "react";
import { createPortal } from "react-dom";

/**
 * The Agente IA panel's anchor, sitting beside the shell's main content
 * column rather than above it. A screen's chat trigger renders the panel
 * wherever it happens to live in the tree, but the panel itself needs to be a
 * flex sibling of the content column so opening it narrows that column
 * instead of floating over it — the same reason the floating rail has its
 * own anchor (`shellRailSlot`) instead of rendering in place.
 */
const ShellAgentPanelSlotContext = React.createContext<HTMLElement | null>(null);

export const ShellAgentPanelSlotProvider = ShellAgentPanelSlotContext.Provider;

/** Renders its children into the shell's side anchor, next to the content column. */
export function ShellAgentPanelSlot({ children }: { children: React.ReactNode }) {
  const host = React.useContext(ShellAgentPanelSlotContext);
  if (!host) return null;
  return createPortal(children, host);
}

/**
 * El ancla de los paneles de trabajo (`SidePanelShell`): también al lado del
 * contenido, pero *debajo* de la cabecera. El panel del Agente IA ocupa todo
 * el alto de la ventana porque es de la app entera; un panel de trabajo es
 * de la pantalla, así que la cabecera se queda donde está y solo se estrecha
 * lo de abajo.
 */
const ShellSidePanelSlotContext = React.createContext<HTMLElement | null>(null);

export const ShellSidePanelSlotProvider = ShellSidePanelSlotContext.Provider;

/** El ancla de los paneles de trabajo, o `null` fuera del shell: para saber si se puede abrir al lado. */
export const useShellSidePanelHost = (): HTMLElement | null => React.useContext(ShellSidePanelSlotContext);
