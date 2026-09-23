import type { es } from "./es";

/**
 * Toda clave del sistema, sacada del diccionario español. Pedir una clave que
 * no existe es un error de tipos, no una cadena vacía que se descubre en
 * pantalla.
 */
export type MessageKey = keyof typeof es;

/**
 * Un idioma traducido del todo. El español es la fuente, así que el tipo sale
 * de él: si mañana se añade una clave nueva, el inglés deja de compilar hasta
 * que también la tenga.
 */
export type MessageCatalog = Readonly<Record<MessageKey, string>>;

/**
 * Un idioma a medio traducir. Lo que falte cae al recambio (inglés) y, si
 * tampoco está, al español: así se puede abrir un idioma nuevo con veinte
 * cadenas sin que la interfaz se quede con huecos en blanco.
 */
export type PartialMessageCatalog = Readonly<Partial<Record<MessageKey, string>>>;
