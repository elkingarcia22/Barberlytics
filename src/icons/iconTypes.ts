/**
 * Tipos del sistema de iconos de Thema Enterprise Design System.
 * Define tallas, tonos y propiedades estándar para iconos.
 */
import type { IconSvgElement } from "@hugeicons/react";

/**
 * Datos SVG de un icono tal como los exporta Hugeicons:
 * una lista de `[etiqueta, atributos]` que se renderiza dentro de un `<svg viewBox="0 0 24 24">`.
 */
export type IconData = IconSvgElement;

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type IconTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info'
  | 'inverse';

/**
 * Nombres semánticos de icono del sistema Thema.
 * Se mapean al proveedor (Hugeicons) en `iconRegistry.ts`.
 */
export type IconName =
  | 'dashboard'
  | 'analytics'
  | 'survey'
  | 'calendar'
  | 'filter'
  | 'upload'
  | 'download'
  | 'users'
  | 'settings'
  | 'warning'
  | 'success'
  | 'error'
  | 'info'
  | 'trendUp'
  | 'trendDown'
  | 'neutral'
  | 'chart'
  | 'file'
  | 'search'
  | 'chevronDown'
  | 'chevronUp'
  | 'chevronLeft'
  | 'chevronRight'
  | 'arrowLeft'
  | 'arrowRight'
  | 'close'
  | 'check'
  | 'notification'
  | 'home'
  | 'building'
  | 'bolt'
  | 'award'
  | 'palette'
  | 'code'
  | 'help'
  | 'graduation'
  | 'sparkles'
  | 'layers'
  | 'sun'
  | 'moon'
  | 'vacancies'
  | 'templates'
  | 'logout';

export interface ThemaIconProps {
  /** Nombre semántico del icono en el registro */
  name: IconName;
  /** Tallas de camiseta estándar */
  size?: IconSize;
  /** Tono semántico de color */
  tone?: IconTone;
  /** Etiqueta accesible para iconos no decorativos */
  label?: string;
  /** Si el icono es puramente decorativo (se oculta a lectores de pantalla) */
  decorative?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/** Tonos de las ilustraciones Glass. `brand` sigue al gradiente de marca del tema. */
export type GlassTone = 'violet' | 'blue' | 'green' | 'orange' | 'rose' | 'amber' | 'teal' | 'brand';

/** Tamaños en píxeles de las ilustraciones Glass. */
export type GlassSize = 48 | 64 | 96;

export interface GlassIconProps {
  /** Nombre semántico del glifo (reutiliza el registro de Hugeicons) */
  name: IconName;
  /** Par de gradiente de la ilustración */
  tone?: GlassTone;
  /** Lado del cuadrado en píxeles */
  size?: GlassSize;
  /** Etiqueta accesible; sin ella la ilustración es decorativa (siempre debe ir acompañada de texto) */
  label?: string;
  /** Clases CSS adicionales */
  className?: string;
}
