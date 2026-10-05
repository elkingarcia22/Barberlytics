import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconTileVariants = cva("relative inline-flex shrink-0 items-center justify-center overflow-hidden [&>svg]:shrink-0", {
  variants: {
    tone: {
      primary: "bg-primary/10 text-primary",
      neutral: "bg-muted text-text-secondary",
      positive: "bg-success/10 text-success",
      negative: "bg-destructive/10 text-destructive",
      warning: "bg-warning/10 text-warning",
      info: "bg-info/10 text-info",
      /* La identidad de IA del sistema: el gradiente de cinco paradas con el glifo en blanco. */
      ai: "bg-ai-gradient text-text-inverse",
    },
    size: {
      sm: "size-7 [&>svg]:size-3.5",
      md: "size-9 [&>svg]:size-[18px]",
      lg: "size-12 [&>svg]:size-6",
      xl: "size-16 [&>svg]:size-7",
    },
    shape: {
      rounded: "",
      circle: "rounded-full",
    },
  },
  compoundVariants: [
    { shape: "rounded", size: "sm", className: "rounded-sm" },
    { shape: "rounded", size: "md", className: "rounded-md" },
    { shape: "rounded", size: "lg", className: "rounded-lg" },
    { shape: "rounded", size: "xl", className: "rounded-xl" },
  ],
  defaultVariants: { tone: "primary", size: "md", shape: "rounded" },
});

export interface IconTileProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof iconTileVariants> {
  /** El icono (p. ej. `<Sparkles />`). Su tamaño lo fija la baldosa. */
  icon: React.ReactNode;
  /**
   * La foto de la cosa (un producto, un servicio). Cubre la baldosa; mientras
   * carga, si falta o si falla, se ve el icono.
   */
  src?: string | null;
}

/**
 * IconTile
 *
 * Un icono sobre una baldosa tintada: el tinte al 10 % del tono y el glifo en el
 * color pleno. Es la misma receta de los chips del home y de las plantillas.
 * Con `src` es la miniatura de una cosa con foto, con el icono de respaldo.
 */
export function IconTile({ icon, tone, size, shape, src, className, ...props }: IconTileProps) {
  /* El fallo se recuerda por URL: si cambia la foto, se vuelve a intentar. */
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;
  return (
    <span aria-hidden data-tone={tone ?? "primary"} data-has-image={showImage || undefined} className={cn(iconTileVariants({ tone, size, shape }), className)} {...props}>
      {icon}
      {showImage && src && <img src={src} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailedSrc(src)} className="absolute inset-0 size-full object-cover" />}
    </span>
  );
}
