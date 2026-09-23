import {
  ARROW_GRADIENT,
  ARROW_PATH,
  BARBER_PATH,
  LOGO_X,
  LYTICS_PATH,
  MARK_BOX,
  WORD_GRADIENT,
  WORDMARK_BOX,
  type Box,
} from "./barberlyticsLogoPaths";
import type { BarberlyticsLogoVariant } from "./BarberlyticsLogo";

export { LOGO_X };

const INK_BOX: Record<BarberlyticsLogoVariant, Box> = { wordmark: WORDMARK_BOX, mark: MARK_BOX };

export interface LogoSvgOptions {
  variant: BarberlyticsLogoVariant;
  /** Color de «Barber»; en una tinta, de todo el logo. */
  ink: string;
  /**
   * Paradas de «lytics» y la flecha. Con una sola parada (o vacío) el logo
   * sale en una tinta con `ink`. Tres paradas se reparten como el gradiente
   * de marca (0 · 52 · 100%); el resto, a partes iguales.
   */
  stops: readonly string[];
  /** Color de fondo; `null` deja el PNG transparente. */
  background: string | null;
  /** Ancho final en px. El alto sale de la proporción. */
  width: number;
  /** Aire alrededor, en «x». Por defecto 1 x, el espacio de respeto. */
  padding?: number;
  /** Solo isotipo: lienzo cuadrado, para icono de app y avatar. Por defecto `true`. */
  square?: boolean;
}

export interface LogoSvg {
  svg: string;
  width: number;
  height: number;
}

function offsets(count: number): string[] {
  if (count === 3) return ["0%", "52%", "100%"];
  return Array.from({ length: count }, (_, index) => `${Math.round((index / (count - 1)) * 100)}%`);
}

function stopsMarkup(stops: readonly string[]): string {
  return offsets(stops.length)
    .map((offset, index) => `<stop offset="${offset}" stop-color="${stops[index]}"/>`)
    .join("");
}

function gradient(id: string, axis: { x1: number; x2: number; y: number }, stops: readonly string[]): string {
  return `<linearGradient id="${id}" x1="${axis.x1}" y1="${axis.y}" x2="${axis.x2}" y2="${axis.y}" gradientUnits="userSpaceOnUse">${stopsMarkup(stops)}</linearGradient>`;
}

function frame(variant: BarberlyticsLogoVariant, padding: number, square: boolean): Box {
  const box = INK_BOX[variant];
  const pad = padding * LOGO_X;
  const w = box.w + pad * 2;
  const h = box.h + pad * 2;
  if (variant !== "mark" || !square) return { x: box.x - pad, y: box.y - pad, w, h };
  const side = Math.max(w, h);
  return { x: box.x + box.w / 2 - side / 2, y: box.y + box.h / 2 - side / 2, w: side, h: side };
}

const round = (value: number) => Math.round(value * 100) / 100;
const boxAttr = (box: Box) => [box.x, box.y, box.w, box.h].map(round).join(" ");

/**
 * El logo como SVG autocontenido: colores resueltos, sin variables CSS ni
 * clases, con el espacio de respeto incluido. Sirve para descargar el SVG o
 * para rasterizarlo a PNG a cualquier tamaño sin perder nitidez.
 */
export function buildBarberlyticsLogoSvg({ variant, ink, stops, background, width, padding = 1, square = true }: LogoSvgOptions): LogoSvg {
  const box = frame(variant, padding, square);
  const height = Math.round((width * box.h) / box.w);
  const mono = stops.length < 2;
  const arrowFill = mono ? ink : "url(#arrow)";
  const wordFill = mono ? ink : "url(#word)";
  const defs = mono
    ? ""
    : `<defs>${gradient("arrow", ARROW_GRADIENT, stops)}${variant === "wordmark" ? gradient("word", WORD_GRADIENT, stops) : ""}</defs>`;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${boxAttr(box)}" width="${width}" height="${height}">`,
    defs,
    background ? `<rect x="${round(box.x)}" y="${round(box.y)}" width="${round(box.w)}" height="${round(box.h)}" fill="${background}"/>` : "",
    `<path fill="${arrowFill}" d="${ARROW_PATH}"/>`,
    variant === "wordmark" ? `<path fill="${wordFill}" d="${LYTICS_PATH}"/><path fill="${ink}" d="${BARBER_PATH}"/>` : "",
    `</svg>`,
  ];
  return { svg: parts.join(""), width, height };
}

/** Cuánto del ancho del cuadro ocupa la flecha en el icono de app. */
const APP_ICON_ARROW_SHARE = 0.72;
/** Radio de las esquinas, como fracción del lado (el «squircle» de iOS ronda el 22%). */
const APP_ICON_RADIUS = 0.22;

export interface AppIconOptions {
  /** Relleno del cuadro: una parada = color liso; varias = gradiente en diagonal. */
  fill: readonly string[];
  /** Color de la flecha: el que contraste con el relleno. */
  arrow: string;
  /** Lado final en px. */
  size: number;
}

/**
 * El isotipo como icono de app: la flecha en un color liso sobre un cuadro
 * redondeado con el color de marca. Es la versión que aguanta los tamaños
 * más pequeños —favicon, pestaña, pantalla de inicio— porque no depende del
 * fondo que tenga detrás: el cuadro lo lleva consigo.
 */
export function buildBarberlyticsAppIcon({ fill, arrow, size }: AppIconOptions): LogoSvg {
  const side = MARK_BOX.w / APP_ICON_ARROW_SHARE;
  const x = MARK_BOX.x + MARK_BOX.w / 2 - side / 2;
  const y = MARK_BOX.y + MARK_BOX.h / 2 - side / 2;
  const box: Box = { x, y, w: side, h: side };
  const radius = round(side * APP_ICON_RADIUS);
  const solid = fill.length < 2;
  const defs = solid
    ? ""
    : `<defs><linearGradient id="tile" x1="${round(x)}" y1="${round(y)}" x2="${round(x + side)}" y2="${round(y + side)}" gradientUnits="userSpaceOnUse">${stopsMarkup(fill)}</linearGradient></defs>`;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${boxAttr(box)}" width="${size}" height="${size}">`,
    defs,
    `<rect x="${round(x)}" y="${round(y)}" width="${round(side)}" height="${round(side)}" rx="${radius}" fill="${solid ? fill[0] : "url(#tile)"}"/>`,
    `<path fill="${arrow}" d="${ARROW_PATH}"/>`,
    `</svg>`,
  ];
  return { svg: parts.join(""), width: size, height: size };
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Pinta un SVG en un canvas a su tamaño real y devuelve el PNG. El SVG ya
 * trae `width`/`height` en px, así el navegador lo rasteriza a esa resolución
 * en vez de escalar un mapa de bits.
 */
export function rasterizeSvg({ svg, width, height }: LogoSvg): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("El navegador no pudo crear el lienzo para el PNG."));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar el PNG."))), "image/png");
    };
    image.onerror = () => reject(new Error("No se pudo leer el SVG del logo."));
    image.src = svgDataUrl(svg);
  });
}
