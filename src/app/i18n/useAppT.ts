import { useLocale, type MessageKey, type MessageParams } from "@/i18n";
import type { AppMessageKey } from "./types";

/**
 * `t()` con las claves de esta aplicación autocompletadas, más las del
 * sistema: una pantalla dice tanto "users.title" como "common.cancel", y no
 * tiene por qué pedir dos traductores para eso.
 *
 * Es exactamente el mismo `t` del sistema —el mismo idioma activo, la misma
 * cadena de recambio—, solo que tipado, para que el editor sugiera las claves
 * y una mal escrita no compile.
 */
export function useAppT(): (key: AppMessageKey | MessageKey, params?: MessageParams) => string {
  return useLocale().t;
}
