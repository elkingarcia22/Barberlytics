import type { FaviconStops } from "./barberlyticsFavicon";

/**
 * El gradiente de marca de Barberlytics, fijo: el oro champán del tema
 * Premium, el que definió la identidad original. No sigue al tema que haya
 * elegido quien mira la pantalla — como el logo de cualquier producto real,
 * no cambia de color porque alguien prefiera el tema Violeta o Esmeralda.
 * Úsalo donde la marca deba leerse siempre igual: la marca del menú, el pie
 * de la documentación y el favicon.
 */
export const BARBERLYTICS_BRAND_LIGHT: FaviconStops = ["#D2A45A", "#98621B", "#6B4312"];
export const BARBERLYTICS_BRAND_DARK: FaviconStops = ["#F3E1AE", "#D9B36A", "#A8823A"];

/**
 * El icono oficial (favicon y apple-touch-icon): el cuadro con el gradiente
 * champán del modo oscuro y la flecha en el carbón de ese mismo modo
 * (`--color-bg-app` de Premium oscuro). Es la versión que eligió la marca.
 */
export const BARBERLYTICS_ICON_TILE: FaviconStops = BARBERLYTICS_BRAND_DARK;
export const BARBERLYTICS_ICON_ARROW = "#0E0D0C";
