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
