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
 * Las franjas del poste, en un lienzo de 100×100. No son rectas: se doblan alrededor del eje
 * vertical del orbe como si lo atravesara una lente: al cruzar el centro se tuercen y hacia los
 * bordes se empinan, como el poste envolviendo un cilindro. `STRIPE_PERIOD` es lo que se desplaza
 * la animación (en `clipperOrb.css`) para que el ciclo empalme sin salto.
 */
const STRIPE_PERIOD = 24;
const STRIPE_THICKNESS = 12;
/** Cuánto se tuerce la franja al cruzar el eje vertical: la onda que la deforma en el centro. */
const STRIPE_BEND = 14;
const STRIPE_SAMPLES = 40;

/** El cilindro (`asin`) empina los bordes; la onda (`sin`) tuerce la franja al pasar por el centro. */
function wrapOffset(x: number) {
  const u = Math.max(-1, Math.min(1, (x - 50) / 50));
  return 50 * Math.asin(u) + STRIPE_BEND * Math.sin(Math.PI * u);
}

function stripePath(baseline: number) {
  const xs = Array.from({ length: STRIPE_SAMPLES + 1 }, (_, i) => -2 + (i * 104) / STRIPE_SAMPLES);
  const top = xs.map((x) => `${x.toFixed(2)},${(baseline - wrapOffset(x)).toFixed(2)}`);
  const bottom = [...xs].reverse().map((x) => `${x.toFixed(2)},${(baseline + STRIPE_THICKNESS - wrapOffset(x)).toFixed(2)}`);
  return `M${top.join("L")}L${bottom.join("L")}Z`;
}

const STRIPES = Array.from({ length: 15 }, (_, i) => stripePath(-120 + i * STRIPE_PERIOD)).join("");

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
