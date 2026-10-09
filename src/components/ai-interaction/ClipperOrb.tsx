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
      <span className="clipper-orb__sphere" />
      <span className="clipper-orb__glass" />
    </span>
  );
}
