import * as React from "react";

import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo";
import { cn } from "@/lib/utils";

/** Longitud del texto en unidades del viewBox: la circunferencia del carril (2π · 50). */
const TRACK_LENGTH = 312;

export interface RotatingSealProps {
  /** El texto del anillo. Termina en «·» para que la vuelta no tenga costura. */
  text?: string;
  /** Lo que va en el centro; por defecto, la flecha del logo. */
  children?: React.ReactNode;
  /** Lado del sello en px. */
  size?: number;
  className?: string;
}

/**
 * El sello de membresía: un anillo de texto girando muy despacio (36 s por
 * vuelta) alrededor de una pieza central. Es el detalle que abre una portada
 * o marca una invitación. Decorativo: el texto tiene que estar también como
 * contenido real.
 */
export function RotatingSeal({
  text = "Beta privada · Solo por invitación · Cohorte 01 ·",
  children,
  size = 128,
  className,
}: RotatingSealProps) {
  const trackId = `seal-track-${React.useId().replace(/:/g, "")}`;
  return (
    <div aria-hidden data-slot="rotating-seal" className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="seal-spin absolute inset-0 size-full text-primary">
        <defs>
          <path id={trackId} d="M64,64 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" />
        </defs>
        <circle cx="64" cy="64" r="63" className="fill-none stroke-primary/25" strokeWidth="0.75" />
        <text className="fill-current font-body text-[8.4px] font-medium uppercase" textLength={TRACK_LENGTH} lengthAdjust="spacing">
          <textPath href={`#${trackId}`}>{text}</textPath>
        </text>
      </svg>
      <span className="absolute inset-[27%] flex items-center justify-center rounded-full border border-primary/30 bg-card/70 shadow-glow-brand backdrop-blur-sm">
        {children ?? <BarberlyticsLogo variant="mark" height={Math.round(size * 0.22)} className="text-text-primary" />}
      </span>
    </div>
  );
}
