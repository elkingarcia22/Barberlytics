import * as React from "react";
import { cn } from "@/lib/utils";

export type ChatVoiceWavesState = "listening" | "thinking" | "idle";

export interface ChatVoiceWavesProps {
  state: ChatVoiceWavesState;
  /**
   * Cambia cada vez que llega voz (un trozo nuevo de transcripción): las
   * ondas se levantan y vuelven a bajar solas, así se ve que está oyendo.
   */
  pulse?: unknown;
  className?: string;
}

/** Cuánto se mueven las ondas en cada estado: altura (0–1) y velocidad. */
const MOTION: Record<ChatVoiceWavesState, { amplitude: number; speed: number }> = {
  listening: { amplitude: 0.55, speed: 1 },
  thinking: { amplitude: 0.3, speed: 2.4 },
  idle: { amplitude: 0.06, speed: 0.35 },
};

/** Las capas: cada una con su frecuencia, fase, grosor y parada del gradiente. */
const LAYERS = [
  { frequency: 1.6, speed: 1.1, scale: 1, width: 2.4, alpha: 0.9, stops: [1, 2, 3] },
  { frequency: 2.3, speed: -0.8, scale: 0.8, width: 1.8, alpha: 0.7, stops: [2, 3, 5] },
  { frequency: 1.1, speed: 0.6, scale: 0.65, width: 1.6, alpha: 0.6, stops: [5, 1, 2] },
  { frequency: 2.9, speed: -1.4, scale: 0.45, width: 1.2, alpha: 0.5, stops: [3, 5, 1] },
] as const;

const POINTS = 120;
const PULSE_BOOST = 0.45;
const PULSE_DECAY = 0.92;
const EASE = 0.06;

/** Las paradas del gradiente de IA del tema; si alguna falta, se usa la del centro (o el color del texto). */
function readStops(element: HTMLElement): Record<number, string> {
  const style = getComputedStyle(element);
  const read = (index: number) => style.getPropertyValue(`--color-ai-stop-${index}`).trim();
  const fallback = read(2) || style.color;
  return { 1: read(1) || fallback, 2: fallback, 3: read(3) || fallback, 5: read(5) || fallback };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Las ondas del modo voz: varias curvas con el gradiente de IA del tema,
 * superpuestas como en un visualizador de audio. Escuchando se mueven con
 * vida y se levantan cuando llega voz; pensando van rápidas y bajas; en
 * pausa se quedan casi planas. Se dibujan en un canvas para que el
 * movimiento vaya a 60 fps sin tocar el DOM; con `prefers-reduced-motion`
 * se dibujan una sola vez, quietas.
 */
export function ChatVoiceWaves({ state, pulse, className }: ChatVoiceWavesProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const target = React.useRef(MOTION[state]);
  const boost = React.useRef(0);

  React.useEffect(() => {
    target.current = MOTION[state];
  }, [state]);

  // Cada trozo nuevo de voz levanta las ondas un momento.
  React.useEffect(() => {
    if (pulse === undefined) return;
    boost.current = Math.min(1, boost.current + PULSE_BOOST);
  }, [pulse]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const stops = readStops(canvas);
    const reduced = prefersReducedMotion();
    let amplitude = target.current.amplitude;
    let speed = target.current.speed;
    let phase = 0;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      amplitude += (target.current.amplitude + boost.current * 0.35 - amplitude) * EASE;
      speed += (target.current.speed - speed) * EASE;
      boost.current *= PULSE_DECAY;
      phase += dt * speed * 2.2;

      const { width, height } = canvas.getBoundingClientRect();
      const middle = height / 2;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      for (const [index, layer] of LAYERS.entries()) {
        const gradient = context.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, stops[layer.stops[0]]);
        gradient.addColorStop(0.5, stops[layer.stops[1]]);
        gradient.addColorStop(1, stops[layer.stops[2]]);
        const peak = middle * 0.9 * amplitude * layer.scale;

        const curve = new Path2D();
        for (let point = 0; point <= POINTS; point += 1) {
          const t = point / POINTS;
          // La envolvente baja los bordes a cero: las ondas nacen y mueren en la línea.
          const envelope = Math.pow(Math.sin(Math.PI * t), 2);
          const wobble = Math.sin(phase * 0.7 + index) * 0.25 + 1;
          const y = middle + Math.sin(t * Math.PI * 2 * layer.frequency + phase * layer.speed + index * 1.3) * peak * envelope * wobble;
          if (point === 0) curve.moveTo(t * width, y);
          else curve.lineTo(t * width, y);
        }
        // El relleno hasta la línea media da cuerpo; el trazo va solo por la curva,
        // no por la línea media, que sumada en las cuatro capas se volvía una raya blanca.
        const body = new Path2D(curve);
        body.lineTo(width, middle);
        body.lineTo(0, middle);
        body.closePath();
        context.globalAlpha = layer.alpha * 0.18;
        context.fillStyle = gradient;
        context.fill(body);
        context.globalAlpha = layer.alpha;
        context.lineWidth = layer.width;
        context.strokeStyle = gradient;
        context.stroke(curve);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      if (!reduced) frame = requestAnimationFrame(draw);
    };
    // El primer cuadro se pinta ya: nunca se ve un lienzo vacío, y con movimiento reducido es el único.
    draw(last);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {/* Un resplandor del gradiente detrás, para que las ondas floten en luz. */}
      <div className="chat-waves-glow pointer-events-none absolute inset-x-[15%] inset-y-[20%] rounded-full" />
      <canvas ref={canvasRef} className="relative h-full w-full" />
    </div>
  );
}
