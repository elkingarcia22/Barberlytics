import type * as React from "react";

/**
 * El drawer de abajo se limita por defecto al alto de la ventana (`100dvh`).
 * Dentro de la reserva se abre en su propio contenedor —el marco del celular,
 * el panel del widget—, así que el tope es el alto de ese contenedor.
 */
export const DRAWER_FIT_STYLE: React.CSSProperties = { maxHeight: "calc(100% - 1.5rem)" };

/**
 * De qué lado entran las hojas de la reserva: desde abajo en el celular y el widget (al alcance
 * del pulgar); como panel lateral en tablet y monitor, donde sobra ancho.
 */
export function sheetSide({ layout, touch }: { layout: "compact" | "wide"; touch: "default" | "lg" }): "bottom" | "right" {
  return layout === "compact" && touch === "default" ? "bottom" : "right";
}

/**
 * En celular, tablet y widget la columna que se desplaza no muestra su barra (en pantallas táctiles
 * no se ve igual): así la barra fija de abajo llega de lado a lado sin dejar el hueco del scroll.
 */
export const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
