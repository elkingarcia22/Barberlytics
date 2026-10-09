import type * as React from "react";
import { cn } from "@/lib/utils";
import "./clipperOrb.css";

export type ClipperOrbState = "idle" | "listening" | "thinking";

export interface ClipperOrbProps {
  /** Lado en px. Pequeño (18–24) acompaña al nombre; grande (120+) es la portada. */
  size?: number;
  /** En reposo gira despacio; escuchando, rápido y late; pensando, el halo se aviva. */
  state?: ClipperOrbState;
  /** Sin halo ni anillo: para tamaños pequeños, junto a un texto. */
  bare?: boolean;
  className?: string;
}

/*
 * Las franjas del poste, en un lienzo de 100×100: rectas, a 45°. Una línea vertical las corta
 * como un vidrio: al cruzarla, cada franja sigue recta pero corrida. `STRIPE_PERIOD` es lo que
 * se desplaza la animación (en `clipperOrb.css`) para que el ciclo empalme sin salto.
 */
const STRIPE_PERIOD = 24;
const STRIPE_THICKNESS = 12;
/** Dónde cae la línea vertical que corta las franjas. */
const STRIPE_SEAM_X = 50;
/** Cuánto se corre la franja al otro lado de la línea. */
const STRIPE_SEAM_SHIFT = 6;

/** Las franjas a cada lado de la línea: `[desde, hasta, corrimiento]`. */
const STRIPE_SLICES = [
  [-2, STRIPE_SEAM_X, 0],
  [STRIPE_SEAM_X, 102, STRIPE_SEAM_SHIFT],
] as const;

function stripePath(baseline: number) {
  return STRIPE_SLICES.map(([x0, x1, shift]) => {
    const y0 = baseline + shift - (x0 - 50);
    const y1 = baseline + shift - (x1 - 50);
    return `M${x0},${y0}L${x1},${y1}L${x1},${y1 + STRIPE_THICKNESS}L${x0},${y0 + STRIPE_THICKNESS}Z`;
  }).join("");
}

const STRIPES = Array.from({ length: 14 }, (_, i) => stripePath(-96 + i * STRIPE_PERIOD)).join("");

/**
 * El orbe de Clipper, el agente de IA de Barberlytics: el poste de barbería hecho esfera de vidrio
 * con el gradiente de IA. Tiene vida propia —gira, respira, late— y cambia con lo que hace Clipper
 * (escucha, piensa). No es un icono: es su presencia. Todo es CSS sobre los tokens del gradiente de IA.
 */
export function ClipperOrb({ size = 128, state = "idle", bare = false, className }: ClipperOrbProps) {
  return (
    <span aria-hidden data-slot="clipper-orb" data-state={state} className={cn("clipper-orb inline-block", className)} style={{ "--clipper-orb-size": `${size}px` } as React.CSSProperties}>
      {!bare && <span className="clipper-orb__halo" />}
      {!bare && <span className="clipper-orb__ring" />}
      <span className="clipper-orb__sphere">
        <svg className="clipper-orb__stripes" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <path className="clipper-orb__stripes-band" d={STRIPES} />
        </svg>
      </span>
      <span className="clipper-orb__glass" />
    </span>
  );
}
