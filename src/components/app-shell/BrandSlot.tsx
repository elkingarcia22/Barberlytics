import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme, type ResolvedMode } from "@/themes";
import { BrandMark } from "./BrandMark";
import { logoShape, type LogoShape, type ShellBrandLogo } from "./brandLogo";

export interface BrandSlotProps {
  /** Isologo de la empresa. Sin él (o si no carga) se usa la flecha de Barberlytics. */
  logo?: ShellBrandLogo | null;
  /** Nombre de la empresa: va al lado del isologo y es su `alt` por defecto. */
  name: string;
  /** Línea bajo el nombre (p. ej. «Barbería»). */
  tagline?: string;
  /**
   * `isologo`: cuadro + nombre + línea; el formato del producto.
   * `wordmark`: el logotipo Barberlytics completo con la línea debajo, para la
   * portada de la doc. Con un logo de empresa siempre se usa `isologo`.
   */
  display?: "isologo" | "wordmark";
  /** Alto del logotipo Barberlytics en `wordmark`. */
  wordmarkSize?: "sm" | "md";
  /** `row` es la fila del panel expandido; `icon`, solo el cuadro de 32px del rail plegado. */
  variant?: "row" | "icon";
  /** Fuerza el modo (vista previa de claro y oscuro a la vez); por defecto, el del tema. */
  mode?: ResolvedMode;
  className?: string;
}

function useLogoSource(logo: ShellBrandLogo | null | undefined, mode?: ResolvedMode) {
  const { resolvedMode } = useTheme();
  const dark = (mode ?? resolvedMode) === "dark";
  const src = logo ? (dark && logo.darkSrc ? logo.darkSrc : logo.src) : null;
  return { src, onPlate: Boolean(logo && dark && !logo.darkSrc) };
}

/** Mide la proporción real de una imagen sin pintarla. */
function useLogoShape(src: string | null): { shape: LogoShape | null; failed: boolean } {
  const [state, setState] = React.useState<{ src: string; shape: LogoShape | null; failed: boolean } | null>(null);
  React.useEffect(() => {
    if (!src) return;
    let active = true;
    const probe = new Image();
    probe.onload = () => active && setState({ src, shape: logoShape(probe.naturalWidth, probe.naturalHeight), failed: false });
    probe.onerror = () => active && setState({ src, shape: null, failed: true });
    probe.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return state?.src === src ? { shape: state.shape, failed: state.failed } : { shape: null, failed: false };
}

/**
 * El cuadro de 32px: el isologo de la empresa, la inicial si lo que subió es
 * un logotipo horizontal (a 32px sería una raya ilegible) o la flecha de
 * Barberlytics si no hay nada.
 */
function BrandIcon({ logo, name, mode, className }: Pick<BrandSlotProps, "logo" | "name" | "mode" | "className">) {
  const { src, onPlate } = useLogoSource(logo, mode);
  const { shape, failed } = useLogoShape(src);
  if (!src || failed) return <BrandMark mode={mode} className={className} />;
  if (shape === "wide") {
    return (
      <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground", className)}>
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // Placa blanca: el isologo se diseñó para papel; sobre el cromo oscuro necesita su fondo.
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-opacity",
        onPlate && "bg-white p-0.5",
        !shape && "opacity-0",
        className
      )}
    >
      <img src={src} alt={logo?.alt ?? name} className="size-full object-contain" />
    </span>
  );
}

/**
 * La marca arriba del menú lateral: el isologo en un cuadro de 32px, el
 * nombre de la empresa al lado y una línea debajo. Es el mismo formato con
 * la flecha de Barberlytics o con el isologo que suba cada barbería, así el
 * menú no cambia de forma ni de alto según quién lo use.
 */
export function BrandSlot({ logo, name, tagline, display = "isologo", wordmarkSize = "md", variant = "row", mode, className }: BrandSlotProps) {
  if (variant === "icon") return <BrandIcon logo={logo} name={name} mode={mode} className={className} />;

  if (display === "wordmark" && !logo) {
    return (
      <span className={cn("flex min-w-0 flex-col justify-center gap-0.5", className)}>
        <BrandMark variant="wordmark" size={wordmarkSize} mode={mode} />
        {tagline && <span className="block truncate text-[11px] text-text-muted">{tagline}</span>}
      </span>
    );
  }

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandIcon logo={logo} name={name} mode={mode} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold leading-tight text-text-primary">{name}</span>
        {tagline && <span className="block truncate text-[11px] leading-tight text-text-muted">{tagline}</span>}
      </span>
    </span>
  );
}
