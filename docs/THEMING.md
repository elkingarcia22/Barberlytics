# Theming · UBITS Thema

Cómo funcionan los temas, cómo añadir uno y cómo consumirlos desde componentes.

## Modelo

Un tema (`ThemePreset`, en `src/themes/presets.ts`) es:

| Campo | Qué es |
|---|---|
| `primary.light` / `primary.dark` | El color de marca en cada modo. Todo lo demás se deriva. |
| `neutral` | `tinted` tiñe fondos y superficies con el matiz del primario; `gray` mantiene neutros neutros. |
| `neutralHue` | Matiz alternativo para los neutros (por defecto, el del primario). |
| `darkNeutralSaturation` | Saturación de los neutros en oscuro. 45 para el navy UBITS, 24 por defecto. |

`buildThemeTokens(preset, mode)` (`src/themes/buildTokens.ts`) produce el mapa completo de variables CSS:

- Marca: `--color-brand`, `--color-brand-hover`, `--color-brand-pressed`, `--color-brand-hsl`, `--primary`, `--primary-foreground`, `--ring`.
- Neutros: fondo de app, superficie, superficie muted/subtle, pista de tabs, accent, bordes, textos, y sus equivalentes shadcn (`--background`, `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--foreground`, `--muted-foreground`…).
- Radios: `buildRadiusTokens(scale)` multiplica los siete pasos (`--radius-xs` … `--radius-3xl`) por 0 / 0.6 / 1 / 1.45.

Lo que **no** cambia con el tema, a propósito: positivo, negativo, warning, info, amarillo, índigo, la familia de IA y la navegación navy. Son significado, no decoración.

## Aplicación en runtime

`ThemeProvider` (`src/themes/ThemeProvider.tsx`):

1. Lee `localStorage["ubits-theme"]` → `{ preset, mode, radius }`.
2. Resuelve `mode: "system"` con `prefers-color-scheme`.
3. Escribe en `<html>`: la clase `.dark`, `data-theme="<id>"`, `color-scheme`, y cada token como `style.setProperty(...)`. Los estilos inline ganan a `tokens.css` y `globals.css`, así que ningún componente necesita cambios.
4. `index.html` lleva un script mínimo que aplica `.dark` antes del primer pintado para evitar el flash.

```tsx
import { ThemeProvider, ThemeSelector, ThemeModeToggle, useTheme } from "@/themes";

<ThemeProvider>
  <ThemeSelector />      // popover: color, radio, modo
  <ThemeModeToggle />    // claro ⇄ oscuro
</ThemeProvider>

const { preset, setPreset, mode, setMode, resolvedMode, radius, setRadius, tokens } = useTheme();
```

## Exportar un tema como CSS estático

`themeToCss(preset, radius)` devuelve un bloque `:root { … } .dark { … }` listo para pegar después de `tokens.css` en cualquier proyecto que use estos componentes (es lo que copia el botón "Copiar CSS" de la página de temas).

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
- Los gráficos leen los tokens con `getComputedStyle` al montar (`getUbitsChartTheme`); si dependen del tema en vivo, remóntalos con `key={preset.id + resolvedMode}`.
