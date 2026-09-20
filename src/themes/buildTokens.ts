import { hexToChannels, hexToHsl, hslChannels, hslToHex, readableForeground, shiftLightness } from "./color";
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
  return {
    bgApp: at(sat(45, 12), 9),
    surface: at(sat(36, 10), 14),
    popover: at(sat(37, 10), 17),
    surfaceMuted: at(sat(31, 9), 19),
    surfaceSubtle: at(sat(47, 12), 11),
    tabTrack: at(sat(29, 8), 16),
    accent: at(sat(47, 12), 20),
    border: at(sat(16, 6), 29),
    borderStrong: at(sat(10, 5), 35),
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

  if (mode === "light") {
    return {
      ...common,
      "--popover": hslChannels(n.surface),
      "--muted": hslChannels(n.surfaceMuted),
    };
  }
  return {
    ...common,
    "--popover": hslChannels(n.popover ?? n.surface),
    "--muted": hslChannels(n.surfaceSubtle),
  };
}

/**
 * Versión estática del tema, como el bloque que shadcn deja copiar desde su
 * página de temas: `:root` con el modo claro y `.dark` con el oscuro. Sirve
 * para llevarse un tema a otro proyecto sin cargar el provider.
 */
export function themeToCss(preset: ThemePreset, radius: RadiusScale = "md"): string {
  const block = (selector: string, tokens: ThemeTokens) =>
    `${selector} {\n${Object.entries(tokens)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join("\n")}\n}`;
  const light = { ...buildThemeTokens(preset, "light"), ...buildRadiusTokens(radius) };
  const dark = buildThemeTokens(preset, "dark");
  return `/* Tema "${preset.name}" — generado por UBITS Thema */\n${block(":root", light)}\n\n${block(".dark", dark)}\n`;
}
