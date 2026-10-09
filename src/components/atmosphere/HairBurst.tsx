import * as React from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const MAX_DPR = 2;
/** Ancho que cubre un foco: el celular tiene uno; una tablet o un monitor, varios a lo ancho. */
const EMITTER_SPAN_PX = 360;
/** Tope de pelos en total, aunque la pantalla sea muy ancha. */
const MAX_CLIPPINGS = 900;
/** Alto de referencia (un celular): en pantallas más altas el impulso crece para llegar arriba. */
const REFERENCE_HEIGHT_PX = 640;
/** Cuánto dura la ráfaga entera, en ms; desde `FADE_START` cada pelo se va apagando. */
const DURATION_MS = 3800;
const FADE_START_MS = 2400;
/** Un fotograma de referencia (60 fps): la física se escala al tiempo real transcurrido. */
const FRAME_MS = 1000 / 60;
/** El pelo pesa poco y el aire lo frena: cae despacio y se mece. */
const GRAVITY = 0.11;
const DRAG = 0.965;
/** Puntos con que se traza cada pelo; con más, la curva sale lisa. */
const STRAND_POINTS = 12;
/** Desde qué parte del largo el pelo empieza a afinarse hacia la punta. */
const TAPER_FROM = 0.55;

/*
 * Colores de pelo de verdad (negro, castaños, alguna cana), no los del tema: es material, como
 * una foto. Sobre fondo oscuro van algo más claros, como el pelo bajo la luz del local, para que
 * se vean. El último de cada lista sale poco: son las canas.
 */
const HAIR_ON_LIGHT = ["#16110e", "#231a15", "#33261e", "#4a382b", "#6b6460"] as const;
const HAIR_ON_DARK = ["#5b4a3e", "#6e5848", "#816a58", "#9a8370", "#b9b2ab"] as const;
const GREY_SHARE = 0.08;

interface Clipping {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  /** El trazo del pelo en su propio sistema, centrado en el origen. */
  points: ReadonlyArray<readonly [number, number]>;
  /** Grosor en el extremo cortado; la punta se afina. */
  width: number;
  sway: number;
  swaySpeed: number;
  alpha: number;
  color: string;
}

export interface HairBurstOrigin {
  /** De 0 a 1, sobre el ancho del contenedor. */
  x: number;
  /** De 0 a 1, sobre el alto del contenedor. */
  y: number;
}

/** Si el fondo del tema es oscuro: la luminosidad de `--background` (tripleta HSL) bajo el 50 %. */
function isDarkBackground(): boolean {
  const triplet = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  const lightness = Number.parseFloat(triplet.split(/\s+/)[2] ?? "100");
  return lightness < 50;
}

function pickColor(palette: readonly string[]): string {
  if (Math.random() < GREY_SHARE) return palette[palette.length - 1];
  return palette[Math.floor(Math.random() * (palette.length - 1))];
}

/** Recentra el trazo en su punto medio, para que gire sobre sí mismo. */
function centered(points: Array<[number, number]>): Array<[number, number]> {
  const [cx, cy] = points[Math.floor(points.length / 2)];
  return points.map(([x, y]) => [x - cx, y - cy]);
}

/** Un pelo fino y largo, muestreado en `STRAND_POINTS` puntos: casi siempre una C suave, a veces una S. */
function strandPoints(): Array<[number, number]> {
  const steps = Array.from({ length: STRAND_POINTS }, (_, i) => i / (STRAND_POINTS - 1));
  const isWave = Math.random() < 0.35;
  const length = 16 + Math.random() * 20;
  const amplitude = isWave ? 1.5 + Math.random() * 2 : (Math.random() - 0.5) * 6;
  const wavelength = isWave ? 2 : 1;
  return centered(steps.map((t) => [t * length, Math.sin(Math.PI * wavelength * t) * amplitude]));
}

/** Cuánto se abre el punto de salida de un foco solo (el del celular), en px. */
const SINGLE_SPREAD_PX = 60;

interface Emitters {
  xs: number[];
  /** Ancho en que nace cada pelo alrededor de su foco: con varios, los tramos se tocan y se lee una sola ráfaga. */
  spread: number;
}

/** Dónde nace cada foco: uno en `originX` si cabe uno solo; si no, repartidos a lo ancho. */
function emittersFor(width: number, originX: number): Emitters {
  const count = Math.max(1, Math.round(width / EMITTER_SPAN_PX));
  if (count === 1) return { xs: [width * originX], spread: SINGLE_SPREAD_PX };
  return { xs: Array.from({ length: count }, (_, i) => (width * (i + 0.5)) / count), spread: (width / count) * 0.9 };
}

/** Cuánto más fuerte sale en una pantalla alta: la altura que alcanza crece con el cuadrado de la velocidad. */
function reachFor(height: number): number {
  return Math.min(1.4, Math.max(0.9, Math.sqrt(height / REFERENCE_HEIGHT_PX)));
}

function spawnClipping(originX: number, originY: number, spread: number, reach: number, palette: readonly string[]): Clipping {
  // Hacia arriba y abriéndose, como al sacudir la capa después del arreglo.
  const direction = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
  const speed = (2.5 + Math.random() * 6) * reach;
  return {
    x: originX + (Math.random() - 0.5) * spread,
    y: originY + (Math.random() - 0.5) * 16,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.08,
    points: strandPoints(),
    width: 0.6 + Math.random() * 0.5,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.04 + Math.random() * 0.06,
    alpha: 0.82 + Math.random() * 0.18,
    color: pickColor(palette),
  };
}

function stepClipping(clipping: Clipping, dt: number): Clipping {
  const drag = DRAG ** dt;
  const vx = clipping.vx * drag;
  const vy = clipping.vy * drag + GRAVITY * dt;
  // Al caer se mece de lado a lado, como un pelo de verdad.
  const flutter = vy > 0 ? Math.sin(clipping.sway) * 0.7 : 0;
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

/**
 * El pelo como una línea continua: tramo a tramo sobre su trazo, del grosor
 * del corte a una punta casi invisible, con los extremos redondeados.
 */
function drawStrand(context: CanvasRenderingContext2D, points: Clipping["points"], width: number) {
  const last = points.length - 1;
  for (let i = 0; i < last; i++) {
    const t = i / last;
    const taper = t < TAPER_FROM ? 1 : 1 - 0.85 * ((t - TAPER_FROM) / (1 - TAPER_FROM));
    context.beginPath();
    context.moveTo(points[i][0], points[i][1]);
    context.lineTo(points[i + 1][0], points[i + 1][1]);
    context.lineWidth = width * taper;
    context.stroke();
  }
}

export interface HairBurstProps {
  className?: string;
  /** Cuántos pelos salen por foco; hay un foco por cada 360 px de ancho. */
  count?: number;
  /** De dónde estallan, en proporción del contenedor. Con varios focos, `x` no cuenta: van repartidos a lo ancho. */
  origin?: HairBurstOrigin;
  /** Al terminar la ráfaga (o enseguida, con «reducir movimiento»). */
  onDone?: () => void;
}

/**
 * Una ráfaga de pelo de barba para celebrar: como el confeti, pero con los
 * pelos finos que quedan tras un arreglo de barba —largos, con una curva
 * suave y afinándose hacia la punta— en colores de pelo de verdad.
 * Estalla una sola vez al montarse sobre el contenedor (que debe ser
 * `relative`) y se adapta a su tamaño: en un celular sale de un punto; en una
 * tablet o un monitor, de varios a lo ancho. Cae despacio meciéndose y se apaga en unos 4 s. Para
 * repetirla, cambia su `key`. Con `prefers-reduced-motion` no se monta.
 */
export function HairBurst({ className, count = 160, origin = { x: 0.5, y: 0.3 }, onDone }: HairBurstProps) {
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

    const palette = isDarkBackground() ? HAIR_ON_DARK : HAIR_ON_LIGHT;
    const { xs, spread } = emittersFor(rect.width, originX);
    const reach = reachFor(rect.height);
    const total = Math.min(MAX_CLIPPINGS, count * xs.length);
    let clippings = Array.from({ length: total }, (_, i) => spawnClipping(xs[i % xs.length], rect.height * originY, spread, reach, palette));
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
        context.save();
        context.translate(clipping.x, clipping.y);
        context.rotate(clipping.angle);
        context.globalAlpha = clipping.alpha * fade;
        context.strokeStyle = clipping.color;
        context.lineCap = "round";
        context.lineJoin = "round";
        drawStrand(context, clipping.points, clipping.width);
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
