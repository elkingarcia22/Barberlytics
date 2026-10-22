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
| `lightNeutralSaturation` | Saturación del fondo teñido en claro (0–100, 100 por defecto). 45 da el marfil del tema Premium. Solo con `neutral: "tinted"`. |
| `depth` | `standard` (fondo oscuro al 9%) o `deep` (carbón al 5%, cards al 9.5%, bordes hairline). |
| `tier` | `standard` o `premium`. `premium` escribe `data-tier="premium"` en `<html>` y enciende los acabados de `src/styles/themes/premium.css`. |
| `brandGradient` | Opcional. Tres paradas por modo para `--color-brand-gradient`. Sin él: primario +12 → primario → primario −10. |
| `ai` | Opcional. Extremos del gradiente de IA. Sin él, arranca en el primario y termina 120° más allá en el círculo cromático. Admite `stops` (las cinco paradas de las mallas) y `bg` / `border` por modo. |
| `fonts` | Opcional. Tipografía sugerida `{ body, heading }`; el selector permite cambiarla. |

`buildThemeTokens(preset, mode)` (`src/themes/buildTokens.ts`) produce el mapa completo de variables CSS:

- Marca: `--color-brand`, `--color-brand-hover`, `--color-brand-pressed`, `--color-brand-hsl`, `--color-brand-rgb`, `--primary`, `--primary-foreground`, `--ring`.
- Gradiente de marca: `--color-brand-gradient` (+ `-from`, `-via`, `-to`) y `--shadow-glow-brand`. En Tailwind: `bg-brand-gradient`, `text-brand-gradient`, `shadow-glow-brand`.
- Atmósfera: `--page-atmosphere`, un halo radial del primario para el contenedor de página (`.page-atmosphere`, ya puesto en el `<main>` del shell y de la doc), y `--shadow-tint-rgb`, el matiz de los neutros para teñir sombras.
- Espaciado: `buildSpacingTokens(density)` → `--space-unit`, `--space-1 … --space-16` y los alias `--space-inline` (8px), `--space-stack` (12px), `--space-card` (24px), `--space-page` (24px), `--space-section` (48px). Densidad `compact` ×0.875, `normal` ×1, `comfortable` ×1.125. En Tailwind: `gap-inline`, `space-y-stack`, `p-card`, `px-page`, `mt-section`; la escala numérica (`p-4`) no cambia.
  La escala vive **también** en `tokens.css` con sus valores por defecto y cada utilitario lleva fallback (`var(--space-card, 24px)`). Sin eso, un contexto sin los tokens —un componente copiado a otro proyecto, una impresión, un test— resolvía `padding` a nada y la card se quedaba literalmente sin márgenes internas. Si añades un alias, añádelo en los tres sitios.
- Neutros: fondo de app, superficie, superficie muted/subtle, pista de tabs, accent, bordes, textos, y sus equivalentes shadcn (`--background`, `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--foreground`, `--muted-foreground`…).
- IA: `--color-ai-gradient-start/end` (HEX y canales HSL, más las versiones pastel), las cinco paradas `--color-ai-stop-1..5` con sus `-rgb`, `--color-ai-bg`, `--color-ai-border`, `--shadow-ai-premium` y `--color-ai-ink` (el texto sobre el gradiente, blanco o tinta oscura: lo elige `aiInk` por tema y modo midiendo con APCA el tramo del gradiente donde cae el texto del botón principal de IA). Las mallas animadas de `globals.css` leen las paradas, así que también siguen al tema.
- Radios: `buildRadiusTokens(scale)` multiplica los siete pasos (`--radius-xs` … `--radius-3xl`) por 0 / 0.6 / 1 / 1.45.
- Tipografía: `buildFontTokens({ body, heading })` → `--font-body` y `--font-heading`. `body` y todos los encabezados los leen desde `globals.css`; Tailwind `font-sans` apunta a `--font-body`.

Lo que **no** cambia con el tema, a propósito: positivo, negativo, warning, info, amarillo, índigo y la navegación navy. Son significado, no decoración.

### Contraste, garantizado por test

`src/themes/presets.test.ts` recorre todos los presets en ambos modos y exige: 4.5:1 entre el primario y
`--primary-foreground` (texto de botón), 7:1 del texto primario y 4.5:1 del secundario sobre fondo y
card, y 3:1 del primario sobre el fondo (enlaces, ítem activo). Por eso los componentes deben usar
`text-primary-foreground` sobre `bg-primary` y nunca `text-white`: en Premium o Cian el primario
oscuro es claro y el blanco se pierde.

## Tipografía

El catálogo vive en `src/themes/fonts.ts` y es corto a propósito: cada familia cubre un papel distinto
y todas están entre las mejor valoradas para interfaz. Se cargan bajo demanda con un `<link>` que
`ThemeProvider` inyecta solo al elegirlas.

| Fuente | Papel | Origen |
|---|---|---|
| **Inter** | El referente de interfaz; neutra y legible a 12px. Es la que viene por defecto. | Google |
| **Geist** | Mecánica y compacta, para paneles densos y herramientas técnicas. | Local (`@fontsource-variable/geist`) |
| **Plus Jakarta Sans** | Profesional pero cálida; cansa menos en pantallas de uso prolongado. | Google |
| **Satoshi** | Grotesca con esqueleto geométrico: carácter propio sin perder neutralidad. | Fontshare |
| **DM Sans** | Geométrica de bajo contraste, para tamaños pequeños y tablas. | Google |
| **IBM Plex Sans** | Humanista con aire corporativo y cobertura multilingüe amplia. | Google |
| **Space Grotesk** | La más marcada; para titulares y producto con tono técnico. | Google |
| **Fraunces** | La serif variable de referencia, con ejes ópticos. Solo para títulos. | Google |
| **Sistema** | La nativa de cada plataforma; cero descarga y cero desplazamiento. | — |

Para añadir una fuente basta con una entrada más en `FONT_OPTIONS`: `stylesheet` lleva la URL completa
de la hoja de estilos, así que sirve cualquier proveedor. Si añades uno nuevo, acuérdate de sumar su
origen a la CSP (ver [DEPLOYMENT.md](DEPLOYMENT.md)).

## Aplicación en runtime

`ThemeProvider` (`src/themes/ThemeProvider.tsx`):

1. Lee `localStorage["thema-theme"]` → `{ preset, mode, radius, density, font, headingFont }`.
2. Resuelve `mode: "system"` con `prefers-color-scheme`.
3. Escribe en `<html>`: la clase `.dark`, `data-theme="<id>"`, `data-tier="<standard|premium>"`, `color-scheme`, y cada token como `style.setProperty(...)`. Los estilos inline ganan a `tokens.css` y `globals.css`, así que ningún componente necesita cambios.
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

`themeToCss(preset, radius, fonts?, density?)` devuelve un bloque `:root { … } .dark { … }` listo para pegar después de `tokens.css` en cualquier proyecto que use estos componentes (es lo que copia el botón "Copiar CSS" de la página de temas).

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

### El nivel Premium

Tres presets llevan `tier: "premium"` y `depth: "deep"`:

| Tema | Primario claro / oscuro | Neutros | Tipografía |
|---|---|---|---|
| **Premium** | bronce `#98621B` / champán `#D9B36A` | hue 40, marfil y carbón cálido | Plus Jakarta Sans + Fraunces |
| **Premium Jade** | jade `#1F7A5A` / celadón `#7FD8AF` | hue 160, papel de arroz y verde-negro | Satoshi + Fraunces |
| **Premium Platino** | acero `#4A5B70` / platino `#C8D3E0` | hue 215, gris perla y grafito azulado | Geist + Space Grotesk |

El halo del ítem activo solo se aplica en navegaciones cuyo ítem es una pastilla. Una barra de
pestañas inferior o una paginación marcan `data-nav-plain` en su `<nav>`: ahí el ítem ocupa todo el
alto y un relleno lo convertiría en un bloque pegado a los bordes.

Lo que un token de color no puede expresar vive en `src/styles/themes/premium.css`, activado por el
`data-tier="premium"` de `<html>`: sombras teñidas con `--shadow-tint-rgb` en claro y casi negras con
un filo de luz en oscuro, un barniz de arriba abajo sobre las cards (`.shadow-card`), brillo y glow en
el botón primario sólido, halo del primario en el ítem de navegación activo y ajustes de títulos (peso
600, eje `SOFT` de Fraunces). Ningún componente sabe que existe y un Premium nuevo lo hereda con solo
poner `tier: "premium"`. Si un nivel futuro necesita sus propios acabados, sigue el mismo patrón: un
archivo por nivel, importado desde `globals.css`, todo bajo `html[data-tier="<nivel>"]`.

## Reglas para componentes

- Usa clases mapeadas a tokens (`bg-primary`, `text-text-secondary`, `border-border/60`), nunca HEX.
- Para opacidad usa las variantes HSL (`bg-primary/10`); los HEX (`--color-brand`) quedan para canvas, ECharts y `style={}`.
- Un tono por intención: `@/lib/tone` da `toneChip`, `toneSolid`, `toneWash`, `toneBorder`, `toneSelected` para acentos semánticos.
- Los gráficos leen los tokens con `getComputedStyle` al montar (`getChartTheme`); si dependen del tema en vivo, remóntalos con `key={preset.id + resolvedMode}`.
