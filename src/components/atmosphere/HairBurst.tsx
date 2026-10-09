import * as React from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { readHairPalette } from "./HairCanvas";

const MAX_DPR = 2;
/** Cuánto dura la ráfaga entera, en ms; desde `FADE_START` cada pelo se va apagando. */
const DURATION_MS = 3600;
const FADE_START_MS = 2200;
/** Un fotograma de referencia (60 fps): la física se escala al tiempo real transcurrido. */
const FRAME_MS = 1000 / 60;
const GRAVITY = 0.2;
const DRAG = 0.982;
/** Proporción de pelos en el color de marca; el resto, en el del texto (el pelo). */
const BRAND_SHARE = 0.25;
/** Proporción de cañones: los pelitos más cortos y gruesos de la barba recién cortada. */
const STUBBLE_SHARE = 0.3;

interface Clipping {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  length: number;
  width: number;
  /** Lo que se riza: el pelo de barba no es recto, hace una S. */
  curl: number;
  sway: number;
  swaySpeed: number;
  alpha: number;
  isBrand: boolean;
}

export interface HairBurstOrigin {
  /** De 0 a 1, sobre el ancho del contenedor. */
  x: number;
  /** De 0 a 1, sobre el alto del contenedor. */
  y: number;
}

function spawnClipping(originX: number, originY: number): Clipping {
  const isStubble = Math.random() < STUBBLE_SHARE;
  // Hacia arriba, abriéndose en abanico: como el confeti al estallar.
  const direction = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
  const speed = 4 + Math.random() * 8;
  return {
    x: originX + (Math.random() - 0.5) * 24,
    y: originY + (Math.random() - 0.5) * 12,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.3,
    length: isStubble ? 3 + Math.random() * 4 : 8 + Math.random() * 12,
    width: isStubble ? 1.6 + Math.random() * 1 : 1 + Math.random() * 1,
    curl: (Math.random() < 0.5 ? -1 : 1) * (isStubble ? 1 : 3 + Math.random() * 5),
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.05 + Math.random() * 0.08,
    alpha: 0.6 + Math.random() * 0.35,
    isBrand: Math.random() < BRAND_SHARE,
  };
}

function stepClipping(clipping: Clipping, dt: number): Clipping {
  const drag = DRAG ** dt;
  const vx = clipping.vx * drag;
  const vy = clipping.vy * drag + GRAVITY * dt;
  // Al caer se mece como un pelo de verdad, no como una piedra.
  const flutter = vy > 0 ? Math.sin(clipping.sway) * 0.6 : 0;
  return {
    ...clipping,
    vx,
    vy,
    x: clipping.x + (vx + flutter) * dt,
    y: clipping.y + vy * dt,
    angle: clipping.angle + clipping.spin * dt,
    sway: clipping.sway + clipping.swaySpeed * dt,
  };
}

export interface HairBurstProps {
  className?: string;
  /** Cuántos pelos salen. */
  count?: number;
  /** De dónde estallan, en proporción del contenedor. */
  origin?: HairBurstOrigin;
  /** Al terminar la ráfaga (o enseguida, con «reducir movimiento»). */
  onDone?: () => void;
}

/**
 * Una ráfaga de pelo de barba para celebrar: como el confeti, pero con los
 * pelitos cortos y rizados que quedan tras un arreglo de barba. Estalla una
 * sola vez al montarse sobre el contenedor (que debe ser `relative`), cae
 * meciéndose y se apaga en unos 3,5 s. Para repetirla, cambia su `key`.
 * Toma los colores del tema y con `prefers-reduced-motion` no se monta.
 */
export function HairBurst({ className, count = 110, origin = { x: 0.5, y: 0.3 }, onDone }: HairBurstProps) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  });
  const { x: originX, y: originY } = origin;

  React.useEffect(() => {
    if (reducedMotion) {
      onDoneRef.current?.();
      return;
    }
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !parent || !context) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = readHairPalette();
    let clippings = Array.from({ length: count }, () => spawnClipping(rect.width * originX, rect.height * originY));
    const startedAt = performance.now();
    let last = startedAt;
    let frame = 0;

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      const dt = Math.min(now - last, 48) / FRAME_MS;
      last = now;
      const fade = elapsed < FADE_START_MS ? 1 : Math.max(0, 1 - (elapsed - FADE_START_MS) / (DURATION_MS - FADE_START_MS));

      context.clearRect(0, 0, rect.width, rect.height);
      clippings = clippings.map((clipping) => stepClipping(clipping, dt));
      for (const clipping of clippings) {
        const half = clipping.length / 2;
        context.save();
        context.translate(clipping.x, clipping.y);
        context.rotate(clipping.angle);
        context.beginPath();
        context.moveTo(-half, 0);
        context.bezierCurveTo(-half / 3, clipping.curl, half / 3, -clipping.curl, half, 0);
        context.strokeStyle = `hsl(${clipping.isBrand ? palette.brand : palette.text} / ${clipping.alpha * fade})`;
        context.lineWidth = clipping.width;
        context.lineCap = "round";
        context.stroke();
        context.restore();
      }

      if (elapsed < DURATION_MS) {
        frame = requestAnimationFrame(draw);
        return;
      }
      context.clearRect(0, 0, rect.width, rect.height);
      onDoneRef.current?.();
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [count, originX, originY, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="hair-burst"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
