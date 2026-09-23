import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo";
import {
  BARBERLYTICS_BRAND_DARK,
  BARBERLYTICS_BRAND_LIGHT,
  BARBERLYTICS_ICON_ARROW,
  BARBERLYTICS_ICON_TILE,
} from "@/components/ui/barberlyticsBrandColors";
import { useTheme, type ResolvedMode } from "@/themes";

export interface BrandMarkProps {
  /** `mark` es el isotipo solo (rail, botón del menú plegado); `wordmark` es el logotipo completo (fila del panel expandido). */
  variant?: "mark" | "wordmark";
  size?: "sm" | "md";
  /** Fuerza el modo (una vista previa de claro y oscuro a la vez); por defecto, el del tema. */
  mode?: ResolvedMode;
  className?: string;
}

/**
 * La marca del producto en el menú: el logotipo de Barberlytics, siempre en
 * su oro de marca (el del tema Premium, el que la definió).
 *
 * No sigue el tema que haya elegido quien mira la pantalla — como el
 * logotipo de cualquier producto real, no se pone violeta porque alguien
 * prefiera ese tema. Es identidad, no un selector: el espacio de trabajo
 * (empresa, sucursal) se cambia desde la cabecera; aquí arriba solo se dice
 * de qué producto es esta pantalla, que es lo único que no cambia nunca.
 */
export function BrandMark({ variant = "mark", size = "md", mode, className }: BrandMarkProps) {
  const { resolvedMode } = useTheme();
  const [from, via, to] = (mode ?? resolvedMode) === "dark" ? BARBERLYTICS_BRAND_DARK : BARBERLYTICS_BRAND_LIGHT;
  const brandVars = {
    "--color-brand-gradient-from": from,
    "--color-brand-gradient-via": via,
    "--color-brand-gradient-to": to,
  } as CSSProperties;

  if (variant === "wordmark") {
    return (
      <span aria-hidden style={brandVars} className={cn("flex shrink-0 items-center text-text-primary", className)}>
        <BarberlyticsLogo height={size === "md" ? 44 : 26} />
      </span>
    );
  }

  // El isotipo va como icono de app, idéntico al favicon oficial: cuadro
  // champán y flecha carbón, en los dos modos. Así se lee a 24–32 px y
  // convive con los isologos cuadrados que suben las barberías.
  const [tileFrom, tileVia, tileTo] = BARBERLYTICS_ICON_TILE;
  return (
    <span
      aria-hidden
      style={{ background: `linear-gradient(135deg, ${tileFrom} 0%, ${tileVia} 52%, ${tileTo} 100%)`, color: BARBERLYTICS_ICON_ARROW }}
      className={cn("flex shrink-0 items-center justify-center rounded-lg", size === "md" ? "size-8" : "size-6", className)}
    >
      <BarberlyticsLogo variant="mark" gradient="mono" height={size === "md" ? 15 : 11} />
    </span>
  );
}
