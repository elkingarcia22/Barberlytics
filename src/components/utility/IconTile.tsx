import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconTileVariants = cva("inline-flex shrink-0 items-center justify-center [&>svg]:shrink-0", {
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
  ],
  defaultVariants: { tone: "primary", size: "md", shape: "rounded" },
});

export interface IconTileProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof iconTileVariants> {
  /** El icono (p. ej. `<Sparkles />`). Su tamaño lo fija la baldosa. */
  icon: React.ReactNode;
}

/**
 * IconTile
 *
 * Un icono sobre una baldosa tintada: el tinte al 10 % del tono y el glifo en el
 * color pleno. Es la misma receta de los chips del home y de las plantillas.
 */
export function IconTile({ icon, tone, size, shape, className, ...props }: IconTileProps) {
  return (
    <span aria-hidden data-tone={tone ?? "primary"} className={cn(iconTileVariants({ tone, size, shape }), className)} {...props}>
      {icon}
    </span>
  );
}
