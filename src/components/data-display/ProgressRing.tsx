import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Diámetro y grosor de cada tamaño, en px del viewBox. */
const SIZES = {
  sm: { box: 32, stroke: 3 },
  md: { box: 44, stroke: 4 },
  lg: { box: 64, stroke: 5 },
} as const;

/** El fondo del anillo pide un tamaño fijo para que el centro quede cuadrado. */
const progressRingVariants = cva("relative inline-grid shrink-0 place-items-center", {
  variants: {
    size: { sm: "size-8", md: "size-11", lg: "size-16" },
  },
  defaultVariants: { size: "md" },
});

const COLOR_CLASS = {
  primary: "stroke-primary",
  success: "stroke-[hsl(var(--success))]",
  warning: "stroke-[hsl(var(--warning))]",
  destructive: "stroke-destructive",
} as const;

/** El tramo «pendiente» va en el mismo color, más suave. */
const PENDING_OPACITY = 0.35;

export type ProgressRingColor = keyof typeof COLOR_CLASS;

export interface ProgressRingProps extends Omit<React.ComponentProps<"div">, "color">, VariantProps<typeof progressRingVariants> {
  /** Lo ya conseguido, de 0 a `max`. */
  value: number;
  /** El total del anillo. Por defecto, 100. */
  max?: number;
  /** Un tramo que se suma a continuación en tono suave: lo que aporta la acción en curso. */
  pending?: number;
  color?: ProgressRingColor;
  /** Lo que va en el centro: el conteo, un icono… Decorativo; el avance lo lee `aria-label`. */
  children?: React.ReactNode;
}

/**
 * Avance en un anillo: lo conseguido en color pleno y, opcionalmente, lo que suma la acción en
 * curso en un tono más suave. Para avances cortos y contables (visitas, pasos, sesiones) donde una
 * barra se pierde; el centro deja escribir el conteo o poner un icono.
 */
function ProgressRing({ value, max = 100, pending = 0, color = "primary", size, className, children, ...props }: ProgressRingProps) {
  const { box, stroke } = SIZES[size ?? "md"];
  const radius = (box - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const safeMax = max > 0 ? max : 1;
  const clamp = (count: number) => Math.min(Math.max(count, 0), safeMax);
  const done = clamp(value);
  const reach = clamp(value + pending);
  const dash = (count: number) => `${(length * count) / safeMax} ${length}`;
  const circle = { cx: box / 2, cy: box / 2, r: radius, fill: "none", strokeWidth: stroke };
  const arcClass = cn(COLOR_CLASS[color], "transition-[stroke-dasharray] duration-normal ease-out-expo motion-reduce:transition-none");

  return (
    <div data-slot="progress-ring" role="progressbar" aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={done} className={cn(progressRingVariants({ size }), className)} {...props}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle {...circle} className="stroke-border" />
        {/* Un arco de largo 0 con punta redonda deja un punto suelto: sin avance no se pinta. */}
        {reach > done && <circle {...circle} strokeLinecap="round" strokeDasharray={dash(reach)} strokeOpacity={PENDING_OPACITY} className={arcClass} />}
        {done > 0 && <circle {...circle} strokeLinecap="round" strokeDasharray={dash(done)} className={arcClass} />}
      </svg>
      {children !== undefined && (
        <span className="relative" aria-hidden>
          {children}
        </span>
      )}
    </div>
  );
}

export { ProgressRing, progressRingVariants };
