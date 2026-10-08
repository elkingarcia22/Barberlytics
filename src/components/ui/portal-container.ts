import * as React from "react"

/**
 * Dónde se montan los drawers y modales. Por defecto, en el `body`: cubren la
 * ventana. Una superficie que vive dentro de otra —la reserva en línea dentro
 * de un marco de celular o del panel flotante de un widget— envuelve su árbol
 * con este proveedor y sus ventanas se abren dentro de ella.
 *
 * Para que el `position: fixed` de esas ventanas se mida contra el contenedor
 * y no contra la ventana, el contenedor debe crear su propio bloque
 * contenedor (`transform`, por ejemplo `[transform:translateZ(0)]`).
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null)

export const PortalContainerProvider = PortalContainerContext.Provider

export function usePortalContainer(): HTMLElement | null {
  return React.useContext(PortalContainerContext)
}
