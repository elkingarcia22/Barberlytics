import * as React from "react";

const NOOP = () => {};
export const CloseWorkspaceMenuContext = React.createContext<() => void>(NOOP);

/** Cierra el menú de la marca desde lo que la app puso en `extra` (p. ej. antes de abrir una ventana). */
export function useCloseWorkspaceMenu(): () => void {
  return React.useContext(CloseWorkspaceMenuContext);
}
