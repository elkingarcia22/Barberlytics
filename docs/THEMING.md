# Theming · Thema

Cómo funcionan los temas, cómo añadir uno y cómo consumirlos desde componentes.

## Modelo

Un tema (`ThemePreset`, en `src/themes/presets.ts`) es:

| Campo | Qué es |
|---|---|
| `primary.light` / `primary.dark` | El color de marca en cada modo. Todo lo demás se deriva. |
| `neutral` | `tinted` tiñe fondos y superficies con el matiz del primario; `gray` mantiene neutros neutros. |
| `neutralHue` | Matiz alternativo para los neutros (por defecto, el del primario). |
| `darkNeutralSaturation` | Saturación de los neutros en oscuro. 45 para el navy del tema Azul, 24 por defecto. |
| `ai` | Opcional. Extremos del gradiente de IA. Sin él, arranca en el primario y termina 120° más allá en el círculo cromático. |
| `fonts` | Opcional. Tipografía sugerida `{ body, heading }`; el selector permite cambiarla. |

`buildThemeTokens(preset, mode)` (`src/themes/buildTokens.ts`) produce el mapa completo de variables CSS:

- Marca: `--color-brand`, `--color-brand-hover`, `--color-brand-pressed`, `--color-brand-hsl`, `--primary`, `--primary-foreground`, `--ring`.
- Neutros: fondo de app, superficie, superficie muted/subtle, pista de tabs, accent, bordes, textos, y sus equivalentes shadcn (`--background`, `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--foreground`, `--muted-foreground`…).
- IA: `--color-ai-gradient-start/end` (HEX y canales HSL, más las versiones pastel), las cinco paradas `--color-ai-stop-1..5` con sus `-rgb`, `--color-ai-bg`, `--color-ai-border` y `--shadow-ai-premium`. Las mallas animadas de `globals.css` leen las paradas, así que también siguen al tema.
- Radios: `buildRadiusTokens(scale)` multiplica los siete pasos (`--radius-xs` … `--radius-3xl`) por 0 / 0.6 / 1 / 1.45.
- Tipografía: `buildFontTokens({ body, heading })` → `--font-body` y `--font-heading`. `body` y todos los encabezados los leen desde `globals.css`; Tailwind `font-sans` apunta a `--font-body`.

Lo que **no** cambia con el tema, a propósito: positivo, negativo, warning, info, amarillo, índigo y la navegación navy. Son significado, no decoración.

## Tipografía

El catálogo vive en `src/themes/fonts.ts`: Inter, Geist (local, vía `@fontsource-variable/geist`), Manrope, DM Sans, IBM Plex Sans, Space Grotesk, Nunito Sans, Fraunces y Playfair Display (serif, pensadas para títulos) y Sistema. Las de Google se cargan bajo demanda con un `<link>` que `ThemeProvider` inyecta solo al elegirlas. Para añadir una fuente basta con una entrada más en `FONT_OPTIONS`.

## Aplicación en runtime

`ThemeProvider` (`src/themes/ThemeProvider.tsx`):

1. Lee `localStorage["thema-theme"]` → `{ preset, mode, radius }`.
2. Resuelve `mode: "system"` con `prefers-color-scheme`.
3. Escribe en `<html>`: la clase `.dark`, `data-theme="<id>"`, `color-scheme`, y cada token como `style.setProperty(...)`. Los estilos inline ganan a `tokens.css` y `globals.css`, así que ningún componente necesita cambios.
4. `index.html` lleva un script mínimo que aplica `.dark` antes del primer pintado para evitar el flash.

```tsx
import { ThemeProvider, ThemeSelector, ThemeModeToggle, useTheme } from "@/themes";

<ThemeProvider>
  <ThemeSelector />      // popover: color, radio, modo
  <ThemeModeToggle />    // claro ⇄ oscuro
</ThemeProvider>

const { preset, setPreset, mode, setMode, resolvedMode, radius, setRadius, font, setFont, headingFont, setHeadingFont, tokens } = useTheme();
```

## Exportar un tema como CSS estático

`themeToCss(preset, radius, fonts?)` devuelve un bloque `:root { … } .dark { … }` listo para pegar después de `tokens.css` en cualquier proyecto que use estos componentes (es lo que copia el botón "Copiar CSS" de la página de temas).

## Añadir un tema

```ts
// src/themes/presets.ts
{
  id: "coral",
  name: "Coral",
  description: "Cálido, para campañas internas.",
  primary: { light: "#F43F5E", dark: "#FB7185" },
  neutral: "gray",
}
```

Aparece automáticamente en el selector, en la página de temas y en el hero del inicio.

## Reglas para componentes

- Usa clases mapeadas a tokens (`bg-primary`, `text-text-secondary`, `border-border/60`), nunca HEX.
- Para opacidad usa las variantes HSL (`bg-primary/10`); los HEX (`--color-brand`) quedan para canvas, ECharts y `style={}`.
- Un tono por intención: `@/lib/tone` da `toneChip`, `toneSolid`, `toneWash`, `toneBorder`, `toneSelected` para acentos semánticos.
- Los gráficos leen los tokens con `getComputedStyle` al montar (`getChartTheme`); si dependen del tema en vivo, remóntalos con `key={preset.id + resolvedMode}`.
