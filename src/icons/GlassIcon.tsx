import * as React from "react";
import { cn } from "@/lib/utils";
import { iconRegistry, IconFallback } from "./iconRegistry";
import type { GlassIconProps, GlassTone } from "./iconTypes";

/** Lado del lienzo interno: todas las medidas de abajo están en estas unidades. */
const CANVAS = 64;
/** Centro y radio del squircle principal. */
const MAIN = { cx: 32, cy: 33, r: 22, rotate: -6 };
/** Blob de cristal secundario, más pequeño y claro, desplazado arriba a la derecha. */
const BLOB = { cx: 41, cy: 23, r: 15, rotate: 14, opacity: 0.7, blur: 2.4 };
/** Lado al que se escala el glifo de 24 unidades de Hugeicons. */
const GLYPH_SIZE = 26;
/** Grosor del trazo del glifo en unidades del icono (24). */
const GLYPH_STROKE = 1.75;
/** Alpha de la sombra que separa el glifo blanco del cristal. */
const GLYPH_SHADOW_ALPHA = 0.25;
/** Factor de las curvas del squircle: 0.5523 sería un círculo, 1 un cuadrado redondeado. */
const SQUIRCLE_TENSION = 0.9;

type Gradient = { from: string; via: string; to: string };

/** Pares de gradiente fijos (claro arriba-izquierda → saturado abajo-derecha). */
const TONE_GRADIENTS: Record<GlassTone, Gradient> = {
  violet: { from: "#C4B5FD", via: "#8B5CF6", to: "#6D28D9" },
  blue: { from: "#93C5FD", via: "#3B82F6", to: "#1D4ED8" },
  green: { from: "#86EFAC", via: "#22C55E", to: "#15803D" },
  orange: { from: "#FDBA74", via: "#F97316", to: "#C2410C" },
  rose: { from: "#FDA4AF", via: "#F43F5E", to: "#BE123C" },
  amber: { from: "#FDE68A", via: "#F59E0B", to: "#B45309" },
  teal: { from: "#5EEAD4", via: "#14B8A6", to: "#0F766E" },
  brand: {
    from: "var(--color-brand-gradient-from)",
    via: "var(--color-brand-gradient-via)",
    to: "var(--color-brand-gradient-to)",
  },
};

/**
 * Traza un squircle (cuadrado de esquinas continuas) centrado en (cx, cy).
 * Cuatro curvas cúbicas cuyos puntos de control se acercan a las esquinas según `tension`.
 */
function squirclePath(cx: number, cy: number, r: number, tension = SQUIRCLE_TENSION): string {
  const c = r * tension;
  return [
    `M ${cx} ${cy - r}`,
    `C ${cx + c} ${cy - r} ${cx + r} ${cy - c} ${cx + r} ${cy}`,
    `C ${cx + r} ${cy + c} ${cx + c} ${cy + r} ${cx} ${cy + r}`,
    `C ${cx - c} ${cy + r} ${cx - r} ${cy + c} ${cx - r} ${cy}`,
    `C ${cx - r} ${cy - c} ${cx - c} ${cy - r} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
}

/** Reutiliza `React.useId` pero deja solo caracteres válidos dentro de `url(#…)`. */
function useSvgIdPrefix(): string {
  const rawId = React.useId();
  return `glass-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * Ilustración "glass": dos capas de cristal con gradiente, brillo superior
 * y el glifo del registro en blanco. Pensada para atajos, indicadores y
 * estados vacíos a 48/64/96 px, siempre acompañada de texto.
 */
export const GlassIcon: React.FC<GlassIconProps> = ({ name, tone = "violet", size = 64, label, className }) => {
  const icon = iconRegistry[name] || IconFallback;
  const gradient = TONE_GRADIENTS[tone];
  const id = useSvgIdPrefix();
  const ids = {
    main: `${id}-main`,
    shine: `${id}-shine`,
    clip: `${id}-clip`,
    blur: `${id}-blur`,
    shadow: `${id}-shadow`,
  };

  const mainPath = squirclePath(MAIN.cx, MAIN.cy, MAIN.r);
  const blobPath = squirclePath(BLOB.cx, BLOB.cy, BLOB.r);
  const glyphScale = GLYPH_SIZE / 24;
  const glyphOffset = { x: MAIN.cx - GLYPH_SIZE / 2, y: MAIN.cy - GLYPH_SIZE / 2 };

  const a11yProps = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${CANVAS} ${CANVAS}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      data-glass-tone={tone}
      {...a11yProps}
    >
      <defs>
        <linearGradient id={ids.main} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: gradient.from }} />
          <stop offset="0.52" style={{ stopColor: gradient.via }} />
          <stop offset="1" style={{ stopColor: gradient.to }} />
        </linearGradient>
        <linearGradient id={ids.shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <path d={mainPath} transform={`rotate(${MAIN.rotate} ${MAIN.cx} ${MAIN.cy})`} />
        </clipPath>
        {/* Regiones absolutas (userSpaceOnUse): con la región porcentual por defecto un glifo
            de una sola línea (bbox de altura 0, p. ej. `neutral`) quedaría recortado por completo. */}
        <filter id={ids.blur} filterUnits="userSpaceOnUse" x="0" y="0" width={CANVAS} height={CANVAS}>
          <feGaussianBlur stdDeviation={BLOB.blur} />
        </filter>
        <filter id={ids.shadow} filterUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">
          <feDropShadow dx="0" dy="1" stdDeviation="1.1" floodColor="#000" floodOpacity={GLYPH_SHADOW_ALPHA} />
        </filter>
      </defs>

      {/* Capa trasera: blob de cristal más claro, desenfocado */}
      <path
        d={blobPath}
        transform={`rotate(${BLOB.rotate} ${BLOB.cx} ${BLOB.cy})`}
        style={{ fill: gradient.from }}
        opacity={BLOB.opacity}
        filter={`url(#${ids.blur})`}
      />

      {/* Capa principal: squircle con gradiente del tono */}
      <path d={mainPath} transform={`rotate(${MAIN.rotate} ${MAIN.cx} ${MAIN.cy})`} fill={`url(#${ids.main})`} />

      {/* Brillo superior recortado al squircle + borde de cristal */}
      <g clipPath={`url(#${ids.clip})`}>
        <ellipse cx={MAIN.cx - 2} cy={MAIN.cy - MAIN.r + 6} rx={MAIN.r - 2} ry={MAIN.r * 0.5} fill={`url(#${ids.shine})`} />
      </g>
      <path
        d={mainPath}
        transform={`rotate(${MAIN.rotate} ${MAIN.cx} ${MAIN.cy})`}
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="0.75"
      />

      {/* Glifo del registro en blanco, con sombra suave */}
      <g
        transform={`translate(${glyphOffset.x} ${glyphOffset.y}) scale(${glyphScale})`}
        color="#fff"
        filter={`url(#${ids.shadow})`}
      >
        {icon.map(([tag, attrs]) => {
          const { key, ...rest } = attrs;
          return React.createElement(tag, {
            ...rest,
            key,
            strokeWidth: rest.strokeWidth !== undefined ? GLYPH_STROKE : undefined,
          });
        })}
      </g>
    </svg>
  );
};

GlassIcon.displayName = "GlassIcon";
