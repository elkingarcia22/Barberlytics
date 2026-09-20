import { hexToChannels, hexToHsl, hexToRgb, hslChannels, hslToHex, readableForeground, shiftLightness } from "./color";
import { findFont, resolveHeadingFont, type FontId, type HeadingFontId } from "./fonts";
import type { ThemePreset } from "./presets";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedMode = "light" | "dark";
export type RadiusScale = "none" | "sm" | "md" | "lg";

/** Mapa `--variable` → valor, listo para `style.setProperty` o para un bloque CSS. */
export type ThemeTokens = Readonly<Record<string, string>>;

/** Radios base del sistema (px) en su escala "md"; ver tokens.css. */
const BASE_RADII: Readonly<Record<string, number>> = {
  "--radius-xs": 6,
  "--radius-sm": 8,
  "--radius-md": 10,
  "--radius-lg": 12,
  "--radius-xl": 14,
  "--radius-2xl": 16,
  "--radius-3xl": 24,
};

export const RADIUS_FACTORS: Readonly<Record<RadiusScale, number>> = {
  none: 0,
  sm: 0.6,
  md: 1,
  lg: 1.45,
};

export function buildRadiusTokens(scale: RadiusScale): ThemeTokens {
  const factor = RADIUS_FACTORS[scale];
  return Object.fromEntries(
    Object.entries(BASE_RADII).map(([name, px]) => [name, `${Math.round(px * factor)}px`])
  );
}

export interface ThemeFonts {
  body: FontId;
  heading: HeadingFontId;
}

export function buildFontTokens(fonts: ThemeFonts): ThemeTokens {
  return {
    "--font-body": findFont(fonts.body).family,
    "--font-heading": resolveHeadingFont(fonts.heading, fonts.body).family,
  };
}

/**
 * La familia de IA es siempre un gradiente y ahora sigue al tema: arranca en
 * el primario y recorre ~120° del círculo cromático, con paradas intermedias
 * para las mallas y el loader. Un preset puede fijar sus dos extremos.
 */
function buildAiTokens(preset: ThemePreset, mode: ResolvedMode): ThemeTokens {
  const primary = hexToHsl(preset.primary[mode]);
  const lift = mode === "dark" ? 8 : 0;
  const start = preset.ai
    ? shiftLightness(preset.ai.start, lift)
    : hslToHex({ h: primary.h, s: Math.max(primary.s, 70), l: Math.min(Math.max(primary.l, 45), 62) + lift });
  const end = preset.ai
    ? shiftLightness(preset.ai.end, lift)
    : hslToHex({ h: primary.h + 120, s: Math.max(primary.s, 72), l: 52 + lift });
  const hue = hexToHsl(start).h;
  const stop = (offset: number, s: number, l: number) => hslToHex({ h: hue + offset, s, l: l + lift });
  const stops = [start, stop(50, 82, 53), stop(115, 95, 47), stop(115, 95, 47), stop(155, 100, 54)];
  const rgb = (hex: string) => hexToRgb(hex).join(", ");
  const pastel = (hex: string) => hslChannels({ ...hexToHsl(hex), l: Math.min(hexToHsl(hex).l + 10, 78) });
  const tokens: Record<string, string> = {
    "--color-ai-gradient-start": start,
    "--color-ai-gradient-end": end,
    "--color-ai-gradient-start-hsl": hexToChannels(start),
    "--color-ai-gradient-end-hsl": hexToChannels(end),
    "--color-ai-gradient-start-pastel-hsl": pastel(start),
    "--color-ai-gradient-end-pastel-hsl": pastel(end),
    "--ai-gradient-start": hexToChannels(start),
    "--ai-gradient-end": hexToChannels(end),
    "--ai-gradient-start-pastel": pastel(start),
    "--ai-gradient-end-pastel": pastel(end),
    "--color-ai-bg":
      mode === "light" ? hslToHex({ h: hue + 20, s: 100, l: 97 }) : hslToHex({ h: hue + 20, s: 33, l: 15 }),
    "--color-ai-border":
      mode === "light" ? hslToHex({ h: hue + 12, s: 96, l: 79 }) : hslToHex({ h: hue + 14, s: 38, l: 48 }),
    "--shadow-ai-premium": `0 4px 15px rgba(${rgb(start)}, 0.3), 0 2px 5px rgba(${rgb(end)}, 0.2)`,
  };
  stops.forEach((hex, index) => {
    tokens[`--color-ai-stop-${index + 1}`] = hex;
    tokens[`--color-ai-stop-${index + 1}-rgb`] = rgb(hex);
  });
  return tokens;
}

/**
 * Los neutros del sistema son blancos y grises con un ligero tinte del matiz
 * del primario. Cada tema define ese matiz y cuánta saturación admite: los
 * temas "gray" bajan la saturación para que un naranja no vuelva beige toda
 * la pantalla.
 */
function neutralScale(preset: ThemePreset, mode: ResolvedMode) {
  const hue = preset.neutralHue ?? hexToHsl(preset.primary.light).h;
  const tinted = preset.neutral === "tinted";
  const sat = (tintedValue: number, grayValue: number) => (tinted ? tintedValue : grayValue);
  const at = (s: number, l: number) => ({ h: hue, s, l });

  if (mode === "light") {
    return {
      bgApp: at(sat(100, 20), 98.5),
      surface: at(0, 100),
      surfaceMuted: at(sat(100, 18), 97),
      surfaceSubtle: at(sat(100, 20), 99),
      tabTrack: at(sat(58, 14), 95),
      accent: at(sat(28, 10), 90),
      border: at(sat(4, 3), 82),
      borderStrong: at(sat(6, 4), 62),
      textPrimary: at(sat(19, 10), 23),
      textSecondary: at(sat(10, 6), 40),
      textMuted: at(sat(6, 4), 62),
    };
  }
  // En oscuro la saturación base la fija el preset (45 para el navy Thema,
  // 24 por defecto) y cada superficie se escala respecto a ella, así la
  // relación entre fondo, card y borde es la misma en todos los temas.
  const base = tinted ? (preset.darkNeutralSaturation ?? 24) : 10;
  const scaled = (ratio: number) => Math.round(base * ratio);
  return {
    bgApp: at(scaled(1), 9),
    surface: at(scaled(0.8), 14),
    popover: at(scaled(0.82), 17),
    surfaceMuted: at(scaled(0.69), 19),
    surfaceSubtle: at(scaled(1.04), 11),
    tabTrack: at(scaled(0.64), 16),
    accent: at(scaled(1.04), 20),
    border: at(scaled(0.36), 29),
    borderStrong: at(scaled(0.22), 35),
    textPrimary: at(sat(6, 3), 93),
    textSecondary: at(sat(6, 3), 64),
    textMuted: at(sat(6, 3), 46),
  };
}

/**
 * Deriva todos los tokens de color que dependen del tema para un modo dado.
 * Los estados semánticos (positivo, negativo, warning, info, IA) no aparecen
 * aquí a propósito: viven en tokens.css y no cambian entre temas.
 */
export function buildThemeTokens(preset: ThemePreset, mode: ResolvedMode): ThemeTokens {
  const primary = preset.primary[mode];
  const hoverDelta = mode === "light" ? -8 : 8;
  const brandHover = shiftLightness(primary, hoverDelta);
  const brandPressed = shiftLightness(primary, hoverDelta * 2);
  const primaryForeground = readableForeground(primary);
  const n = neutralScale(preset, mode);

  const common: Record<string, string> = {
    "--color-brand": primary,
    "--color-brand-hover": brandHover,
    "--color-brand-pressed": brandPressed,
    "--color-brand-hsl": hexToChannels(primary),
    "--primary": hexToChannels(primary),
    "--primary-foreground": hexToChannels(primaryForeground),
    "--ring": hexToChannels(primary),

    "--color-bg-app": hslToHex(n.bgApp),
    "--color-bg-app-hsl": hslChannels(n.bgApp),
    "--background": hslChannels(n.bgApp),
    "--color-surface": hslToHex(n.surface),
    "--color-surface-hsl": hslChannels(n.surface),
    "--card": hslChannels(n.surface),
    "--color-surface-muted": hslToHex(n.surfaceMuted),
    "--color-surface-muted-hsl": hslChannels(n.surfaceMuted),
    "--secondary": hslChannels(n.surfaceMuted),
    "--color-surface-subtle": hslToHex(n.surfaceSubtle),
    "--color-surface-subtle-hsl": hslChannels(n.surfaceSubtle),
    "--color-tab-track": hslToHex(n.tabTrack),
    "--accent": hslChannels(n.accent),

    "--color-border": hslToHex(n.border),
    "--color-border-hsl": hslChannels(n.border),
    "--border": hslChannels(n.border),
    "--input": hslChannels(n.border),
    "--color-border-strong": hslToHex(n.borderStrong),
    "--color-border-strong-hsl": hslChannels(n.borderStrong),

    "--color-text-primary": hslToHex(n.textPrimary),
    "--color-text-primary-hsl": hslChannels(n.textPrimary),
    "--foreground": hslChannels(n.textPrimary),
    "--card-foreground": hslChannels(n.textPrimary),
    "--popover-foreground": hslChannels(n.textPrimary),
    "--secondary-foreground": hslChannels(n.textPrimary),
    "--accent-foreground": hslChannels(n.textPrimary),
    "--color-text-secondary": hslToHex(n.textSecondary),
    "--color-text-secondary-hsl": hslChannels(n.textSecondary),
    "--muted-foreground": hslChannels(n.textSecondary),
    "--color-text-muted": hslToHex(n.textMuted),
  };

  const ai = buildAiTokens(preset, mode);
  if (mode === "light") {
    return {
      ...common,
      ...ai,
      "--popover": hslChannels(n.surface),
      "--muted": hslChannels(n.surfaceMuted),
    };
  }
  return {
    ...common,
    ...ai,
    "--popover": hslChannels(n.popover ?? n.surface),
    "--muted": hslChannels(n.surfaceSubtle),
  };
}

/**
 * Versión estática del tema, como el bloque que shadcn deja copiar desde su
 * página de temas: `:root` con el modo claro y `.dark` con el oscuro. Sirve
 * para llevarse un tema a otro proyecto sin cargar el provider.
 */
export function themeToCss(preset: ThemePreset, radius: RadiusScale = "md", fonts?: ThemeFonts): string {
  const block = (selector: string, tokens: ThemeTokens) =>
    `${selector} {\n${Object.entries(tokens)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join("\n")}\n}`;
  const light = {
    ...buildThemeTokens(preset, "light"),
    ...buildRadiusTokens(radius),
    ...(fonts ? buildFontTokens(fonts) : {}),
  };
  const dark = buildThemeTokens(preset, "dark");
  return `/* Tema "${preset.name}" — generado por Thema */\n${block(":root", light)}\n\n${block(".dark", dark)}\n`;
}
