import type { BookingLayout } from "./BookingContext";

/** El ancho de lectura de un paso: la columna del contenido, no la de la barra del pie, que va de lado a lado. */
export const STEP_WIDTH: Record<BookingLayout, string> = { compact: "max-w-xl", wide: "max-w-3xl" };
