import type * as React from "react";

/**
 * El drawer de abajo se limita por defecto al alto de la ventana (`100dvh`).
 * Dentro de la reserva se abre en su propio contenedor —el marco del celular,
 * el panel del widget—, así que el tope es el alto de ese contenedor.
 */
export const DRAWER_FIT_STYLE: React.CSSProperties = { maxHeight: "calc(100% - 1.5rem)" };
