import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ARROW_GRADIENT,
  ARROW_PATH,
  BARBER_PATH,
  LYTICS_PATH,
  MARK_RATIO,
  MARK_VIEWBOX,
  WORDMARK_RATIO,
  WORDMARK_VIEWBOX,
  WORD_GRADIENT,
} from "./barberlyticsLogoPaths";

export type BarberlyticsLogoVariant = "wordmark" | "mark";
export type BarberlyticsLogoGradient = "brand" | "ai" | "mono";

export interface BarberlyticsLogoProps extends Omit<React.SVGAttributes<SVGSVGElement>, "height" | "width"> {
  /** `wordmark` es el logotipo completo; `mark` es la flecha sola (isotipo). */
  variant?: BarberlyticsLogoVariant;
  /**
   * Color de «lytics» y de la flecha. `brand` es el gradiente de marca del
   * tema; `ai` la gradación de IA del tema; `mono` una sola tinta
   * (`currentColor`), para cuando el gradiente no es posible.
   */
  gradient?: BarberlyticsLogoGradient;
  /** Altura en px de la tinta; el ancho sale de la proporción. */
  height?: number;
  /** Nombre accesible. */
  title?: string;
}

const BRAND_STOPS = [
  { offset: "0%", color: "var(--color-brand-gradient-from)" },
  { offset: "52%", color: "var(--color-brand-gradient-via)" },
  { offset: "100%", color: "var(--color-brand-gradient-to)" },
];

const AI_STOPS = [1, 2, 3, 4, 5].map((n, index) => ({
  offset: `${index * 25}%`,
  color: `var(--color-ai-stop-${n})`,
}));

function Gradient({ id, x1, x2, y, stops }: { id: string; x1: number; x2: number; y: number; stops: typeof BRAND_STOPS }) {
  return (
    <linearGradient id={id} x1={x1} y1={y} x2={x2} y2={y} gradientUnits="userSpaceOnUse">
      {stops.map((stop) => (
        <stop key={stop.offset} offset={stop.offset} style={{ stopColor: stop.color }} />
      ))}
    </linearGradient>
  );
}

/**
 * El logotipo Barberlytics. «Barber» va en `currentColor` y «lytics» y la
 * flecha en el gradiente del tema, así el logo sigue al tema y al modo sin
 * props de color: basta con colocarlo en un contenedor con `text-text-primary`
 * (o `text-nav-foreground` sobre el cromo oscuro).
 */
export function BarberlyticsLogo({
  variant = "wordmark",
  gradient = "brand",
  height = 32,
  title = "Barberlytics",
  className,
  ...props
}: BarberlyticsLogoProps) {
  const reactId = React.useId().replace(/:/g, "");
  const arrowId = `blogo-${reactId}-arrow`;
  const wordId = `blogo-${reactId}-word`;
  const isMark = variant === "mark";
  const ratio = isMark ? MARK_RATIO : WORDMARK_RATIO;
  const stops = gradient === "ai" ? AI_STOPS : BRAND_STOPS;
  const arrowFill = gradient === "mono" ? "currentColor" : `url(#${arrowId})`;
  const wordFill = gradient === "mono" ? "currentColor" : `url(#${wordId})`;

  return (
    <svg
      viewBox={isMark ? MARK_VIEWBOX : WORDMARK_VIEWBOX}
      width={Math.round(height * ratio)}
      height={height}
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      {...props}
    >
      {gradient !== "mono" && (
        <defs>
          <Gradient id={arrowId} x1={ARROW_GRADIENT.x1} x2={ARROW_GRADIENT.x2} y={ARROW_GRADIENT.y} stops={stops} />
          {!isMark && <Gradient id={wordId} x1={WORD_GRADIENT.x1} x2={WORD_GRADIENT.x2} y={WORD_GRADIENT.y} stops={stops} />}
        </defs>
      )}
      <path d={ARROW_PATH} fill={arrowFill} />
      {!isMark && (
        <>
          <path d={LYTICS_PATH} fill={wordFill} />
          <path d={BARBER_PATH} fill="currentColor" />
        </>
      )}
    </svg>
  );
}
