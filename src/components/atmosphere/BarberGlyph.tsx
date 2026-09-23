import * as React from "react";

import { cn } from "@/lib/utils";

export type BarberGlyphKind = "comb" | "razor";

export interface BarberGlyphProps extends React.SVGProps<SVGSVGElement> {
  /** `comb` es el peine; `razor`, la navaja abierta. */
  kind: BarberGlyphKind;
  /** Flota despacio (14 s) con la inclinación de `rotate`. */
  floating?: boolean;
  /** Grados de inclinación en reposo. */
  rotate?: number;
}

const COMB_TEETH = Array.from({ length: 26 }, (_, index) => 34 + index * 14);

function CombPaths() {
  return (
    <>
      <rect x="6" y="6" width="408" height="30" rx="15" />
      {COMB_TEETH.map((x) => (
        <line key={x} x1={x} y1="36" x2={x} y2={x % 28 === 6 ? 118 : 108} strokeLinecap="round" />
      ))}
    </>
  );
}

function RazorPaths() {
  return (
    <>
      {/* Hoja */}
      <path d="M92 96 L392 46 C418 42 436 54 438 74 L440 96 C441 110 430 118 414 118 L96 118 Z" />
      <path d="M118 108 L400 108" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
      <path d="M392 46 L396 30 L420 26" strokeLinecap="round" />
      {/* Pivote */}
      <circle cx="94" cy="107" r="9" />
      <circle cx="94" cy="107" r="3" />
      {/* Mango abierto, cayendo hacia la derecha */}
      <path d="M100 120 L450 196 C470 200 478 186 470 176 L118 96 C104 92 96 104 100 120 Z" />
      <path d="M126 110 L440 180" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

const GLYPHS: Record<BarberGlyphKind, { viewBox: string; strokeWidth: string; paths: React.FC }> = {
  comb: { viewBox: "0 0 420 130", strokeWidth: "2", paths: CombPaths },
  razor: { viewBox: "0 0 560 220", strokeWidth: "2.5", paths: RazorPaths },
};

/**
 * Grafismos de fondo en línea: un peine y una navaja de afeitar. Van con
 * `currentColor` a muy baja opacidad detrás de una sección; son textura, no
 * contenido, así que siempre llevan `aria-hidden`. El tamaño lo pone el
 * ancho (`w-[40rem]`) y la posición, el padre `relative`.
 */
export function BarberGlyph({ kind, floating = false, rotate = 0, className, style, ...props }: BarberGlyphProps) {
  const glyph = GLYPHS[kind];
  const Paths = glyph.paths;
  return (
    <svg
      viewBox={glyph.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={glyph.strokeWidth}
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      data-slot="barber-glyph"
      data-kind={kind}
      className={cn("pointer-events-none", floating && "float-slow", className)}
      style={{ ...style, "--float-rot": `${rotate}deg`, ...(floating ? {} : { transform: `rotate(${rotate}deg)` }) } as React.CSSProperties}
      {...props}
    >
      <Paths />
    </svg>
  );
}
