/**
 * Utilidades de color mínimas para derivar una paleta completa a partir de un
 * único color primario. Todo trabaja en HEX ⇄ HSL porque los tokens del
 * sistema viven en esas dos formas: `--color-brand` en HEX para los canvas y
 * `--primary` en canales HSL para que Tailwind pueda aplicar opacidad.
 */

export interface Hsl {
  /** 0–360 */
  h: number;
  /** 0–100 */
  s: number;
  /** 0–100 */
  l: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) {
    throw new Error(`Color HEX inválido: "${hex}"`);
  }
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function hexToHsl(hex: string): Hsl {
  const [r255, g255, b255] = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;
  let r: number;
  let g: number;
  let b: number;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** "219 90% 49%" — el formato de canales que consume `hsl(var(--x) / alpha)`. */
export function hslChannels(hsl: Hsl): string {
  const round = (n: number, digits = 1) => Number(n.toFixed(digits));
  return `${round(hsl.h, 0)} ${round(hsl.s)}% ${round(hsl.l)}%`;
}

export const hexToChannels = (hex: string): string => hslChannels(hexToHsl(hex));

/** Sube (+) o baja (−) la luminosidad en puntos porcentuales. */
export function shiftLightness(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: clamp(hsl.l + delta, 0, 100) });
}

/** Mezcla lineal en RGB, `t` = 0 devuelve `a`, `t` = 1 devuelve `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = clamp(t, 0, 1);
  return rgbToHex(ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k);
}

/** Luminancia relativa (WCAG) para decidir texto blanco o oscuro sobre un fondo. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Luminancia que usa APCA: sRGB con exponente 2.4 y una suave subida de los negros. */
function apcaLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => (v / 255) ** 2.4);
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
}

/**
 * Contraste perceptual APCA (W3 0.0.98G) del texto `text` sobre `background`, en Lc: positivo con texto
 * oscuro sobre fondo claro, negativo al revés; cuanto mayor el valor absoluto, mejor se lee. A diferencia
 * de la razón WCAG 2, no subestima el texto blanco sobre colores saturados de luminosidad media.
 */
export function apcaContrast(text: string, background: string): number {
  const textY = apcaLuminance(text);
  const backgroundY = apcaLuminance(background);
  if (Math.abs(backgroundY - textY) < 0.0005) return 0;
  if (backgroundY > textY) {
    const sapc = (backgroundY ** 0.56 - textY ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (backgroundY ** 0.65 - textY ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}

/** Blanco o casi negro, el que contraste mejor con `background`. */
export function readableForeground(background: string): string {
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#111827")
    ? "#ffffff"
    : "#111827";
}
