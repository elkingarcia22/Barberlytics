import { BARBERLYTICS_ICON_ARROW, BARBERLYTICS_ICON_TILE } from "./barberlyticsBrandColors";
import { buildBarberlyticsAppIcon, svgDataUrl } from "./barberlyticsLogoSvg";

/** Tres paradas del gradiente de marca: from, vía, to. */
export type FaviconStops = readonly [string, string, string];

export interface BarberlyticsFaviconOptions {
  /** Gradiente del cuadro. Por defecto, el champán de la marca (Premium oscuro). */
  stops?: FaviconStops;
  /** Color de la flecha. Por defecto, el carbón de Premium oscuro. */
  arrow?: string;
  /** Lado en px del SVG. Por defecto 48; el navegador lo escala a 16 o 32. */
  size?: number;
}

/**
 * El favicon de Barberlytics: el icono de app (flecha sobre el cuadro de
 * marca). Sin opciones sale el oficial: cuadro champán y flecha carbón. A
 * 16px una línea con gradiente sobre la barra de pestañas se pierde; el
 * cuadro trae su propio fondo y se lee igual en pestañas claras y oscuras,
 * así que no hace falta una versión por modo.
 */
export function buildBarberlyticsFavicon({
  stops = BARBERLYTICS_ICON_TILE,
  arrow = BARBERLYTICS_ICON_ARROW,
  size = 48,
}: BarberlyticsFaviconOptions = {}): string {
  return buildBarberlyticsAppIcon({ fill: stops, arrow, size }).svg;
}

export const faviconDataUrl = svgDataUrl;
