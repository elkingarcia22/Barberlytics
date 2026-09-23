import * as React from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/** Hebras por cada 22 000 px² de lienzo, con tope. */
const AREA_PER_STRAND = 22000;
const MAX_STRANDS = 70;
const MAX_DPR = 2;
/** Proporción de hebras que van en el color de marca; el resto, en el del texto. */
const BRAND_SHARE = 0.45;

interface Strand {
  x: number;
  y: number;
  length: number;
  angle: number;
  spin: number;
  fallSpeed: number;
  drift: number;
  sway: number;
  swaySpeed: number;
  curve: number;
  alpha: number;
  width: number;
  isBrand: boolean;
}

interface Palette {
  brand: string;
  text: string;
}

/**
 * Los dos colores salen del tema en vivo (tripletas HSL): `--primary` y
 * `--foreground`; sobre el cromo oscuro de navegación, `--nav-foreground`.
 */
function readPalette(onChrome: boolean): Palette {
  const styles = getComputedStyle(document.documentElement);
  return {
    brand: styles.getPropertyValue("--primary").trim(),
    text: styles.getPropertyValue(onChrome ? "--nav-foreground" : "--foreground").trim(),
  };
}

function spawnStrand(width: number, height: number, anywhere: boolean): Strand {
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : -40,
    length: 14 + Math.random() * 30,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.02,
    fallSpeed: 0.22 + Math.random() * 0.55,
    drift: (Math.random() - 0.5) * 0.3,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.008 + Math.random() * 0.018,
    curve: (Math.random() - 0.5) * 18,
    alpha: 0.16 + Math.random() * 0.36,
    width: 0.6 + Math.random() * 0.9,
    isBrand: Math.random() < BRAND_SHARE,
  };
}

export interface HairCanvasProps {
  className?: string;
  /** Multiplicador de densidad; 1 es la portada, 0.7 un cierre. */
  density?: number;
  /** Sobre el cromo oscuro (`bg-surface-nav`): las hebras de texto usan `--nav-foreground`. */
  onChrome?: boolean;
}

/**
 * Cabello cayendo: hebras finas y curvas que bajan, se mecen y giran sobre
 * el contenedor (que debe ser `relative`). Es un canvas 2D con
 * `requestAnimationFrame`: se detiene cuando sale de pantalla o la pestaña
 * se oculta, relee la paleta cuando cambia el tema y con
 * `prefers-reduced-motion` no se monta.
 */
export function HairCanvas({ className, density = 1, onChrome = false }: HairCanvasProps) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent || reducedMotion) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let strands: Strand[] = [];
    let palette = readPalette(onChrome);
    let frame = 0;
    let isVisible = true;
    let isRunning = false;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(MAX_STRANDS, Math.round(((width * height) / AREA_PER_STRAND) * density));
      strands = Array.from({ length: count }, () => spawnStrand(width, height, true));
    };

    const step = (strand: Strand): Strand => {
      const next = {
        ...strand,
        sway: strand.sway + strand.swaySpeed,
        y: strand.y + strand.fallSpeed,
        x: strand.x + strand.drift + Math.sin(strand.sway) * 0.35,
        angle: strand.angle + strand.spin,
      };
      const isOut = next.y > height + 40 || next.x < -60 || next.x > width + 60;
      return isOut ? spawnStrand(width, height, false) : next;
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      strands = strands.map(step);
      for (const strand of strands) {
        context.save();
        context.translate(strand.x, strand.y);
        context.rotate(strand.angle);
        context.beginPath();
        context.moveTo(-strand.length / 2, 0);
        context.quadraticCurveTo(0, strand.curve, strand.length / 2, 0);
        context.strokeStyle = `hsl(${strand.isBrand ? palette.brand : palette.text} / ${strand.alpha})`;
        context.lineWidth = strand.width;
        context.lineCap = "round";
        context.stroke();
        context.restore();
      }
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (isRunning || !isVisible || document.hidden) return;
      isRunning = true;
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      isRunning = false;
      cancelAnimationFrame(frame);
    };
    const sync = () => (isVisible && !document.hidden ? start() : stop());

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const intersection = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      sync();
    });
    intersection.observe(canvas);

    // El tema puede cambiar de claro a oscuro o de preset: se relee la paleta.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette(onChrome);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    document.addEventListener("visibilitychange", sync);
    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [density, onChrome, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="hair-canvas"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
