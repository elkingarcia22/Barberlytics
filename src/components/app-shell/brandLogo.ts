import { LOGO_METRICS, WORDMARK_BOX } from "@/components/ui/barberlyticsLogoPaths";

/** Alto en px del logotipo Barberlytics en la fila del menú. */
export const WORDMARK_HEIGHTS = { md: 44, sm: 26 } as const;

/** Aire entre el logotipo y la línea de debajo. */
const TAGLINE_GAP = 3;

/**
 * Dónde va la línea bajo el logotipo (p. ej. «Sistema de diseño · v0.1»):
 * no debajo de toda la caja —el pulso baja 1 x y la dejaba lejos del
 * nombre— sino en el hueco bajo «Barber», justo por debajo del descendente
 * de la «y», y sin pasar de donde arranca el pulso.
 */
export function wordmarkTaglinePlacement(height: number): { marginTop: number; maxWidth: number } {
  const scale = height / WORDMARK_BOX.h;
  const top = (LOGO_METRICS.descender - WORDMARK_BOX.y) * scale + TAGLINE_GAP;
  return {
    marginTop: Math.round(top - height),
    maxWidth: Math.floor((LOGO_METRICS.pulseStart - WORDMARK_BOX.x) * scale - TAGLINE_GAP * 2),
  };
}

export interface ShellBrandLogo {
  /** Isologo para fondos claros (PNG, SVG, JPG o WebP; URL o data URL). Mejor cuadrado. */
  src: string;
  /** Versión para fondos oscuros. Sin ella, en oscuro el isologo va sobre una placa clara. */
  darkSrc?: string | null;
  /** Texto alternativo; por defecto, el nombre de la empresa. */
  alt?: string;
}

/** A partir de esta proporción la imagen es un logotipo horizontal, no un isologo: no cabe en el cuadro. */
export const WIDE_LOGO_RATIO = 2.2;

export type LogoShape = "wide" | "compact";

export function logoShape(width: number, height: number): LogoShape {
  return height > 0 && width / height >= WIDE_LOGO_RATIO ? "wide" : "compact";
}
