import type { appEs } from "./es";

/** Toda clave de la aplicación, sacada de su diccionario español. */
export type AppMessageKey = keyof typeof appEs;

/** Un idioma de la aplicación traducido del todo. */
export type AppMessageCatalog = Readonly<Record<AppMessageKey, string>>;
