import * as React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { iconRegistry, IconFallback } from './iconRegistry';
import type { IconSize, ThemaIconProps } from './iconTypes';

/** Grosor de trazo de la familia Hugeicons "stroke rounded" en todo el sistema. */
export const ICON_STROKE_WIDTH = 1.5;

/** Talla → clase Tailwind y píxeles equivalentes (atributos width/height del svg). */
const SIZE_MAP: Record<IconSize, { className: string; px: number }> = {
  xs: { className: 'size-3.5', px: 14 },
  sm: { className: 'size-4', px: 16 },
  md: { className: 'size-6', px: 24 },
  lg: { className: 'size-8', px: 32 },
  xl: { className: 'size-10', px: 40 },
};

/** Tono → token semántico del sistema; así el icono sigue al tema y al modo. */
const TONE_CLASSES: Record<NonNullable<ThemaIconProps['tone']>, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  positive: 'text-success',
  negative: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
  inverse: 'text-primary-foreground',
};

/**
 * Componente envoltorio ThemaIcon.
 * Estandariza el renderizado de iconos en toda la aplicación.
 *
 * Se encarga de:
 * - Nombres semánticos (búsqueda en el registro de Hugeicons)
 * - Tallas de camiseta (xs, sm, md, lg, xl)
 * - Tonos semánticos (primary, positive, negative, etc.)
 * - Accesibilidad (decorativo vs. con significado)
 * - Consistencia con los tokens
 */
export const ThemaIcon: React.FC<ThemaIconProps> = ({
  name,
  size = 'md',
  tone = 'default',
  label,
  decorative = true,
  className,
}) => {
  const icon = iconRegistry[name] || IconFallback;
  const dimensions = SIZE_MAP[size];

  // Requisitos de accesibilidad
  const a11yProps = decorative
    ? { 'aria-hidden': true }
    : {
        role: 'img',
        'aria-label': label || `${name} icon`,
      };

  return (
    <HugeiconsIcon
      icon={icon}
      size={dimensions.px}
      strokeWidth={ICON_STROKE_WIDTH}
      className={cn(
        'shrink-0 transition-colors',
        dimensions.className,
        TONE_CLASSES[tone],
        className
      )}
      {...a11yProps}
    />
  );
};

ThemaIcon.displayName = 'ThemaIcon';
