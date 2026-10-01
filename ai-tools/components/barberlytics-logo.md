# BarberlyticsLogo

El logotipo de Barberlytics como SVG inline que sigue al tema: «Barber» en `currentColor`, «lytics» y la flecha en el gradiente de marca del tema activo. Sin props de color; el modo claro u oscuro lo resuelve el contenedor. `variant="mark"` deja la flecha sola como isotipo.

Familia: Primitivos · Doc: `/docs#/components/barberlytics-logo` · Fuente: `src/components/ui/BarberlyticsLogo.tsx`

```ts
import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"wordmark" \| "mark"` | `"wordmark"` | Logotipo completo o la flecha sola (isotipo). |
| `gradient` | `"brand" \| "ai" \| "mono"` | `"brand"` | Color de «lytics» y la flecha: gradiente de marca del tema, gradación de IA del tema o una tinta (`currentColor`). |
| `height` | `number` | `32` | Alto en px de la tinta. El ancho es `height × 4,44` (wordmark) o `height × 1,5` (mark). |
| `title` | `string` | `"Barberlytics"` | Nombre accesible del `role="img"`. |
| `...props` | `React.SVGAttributes<SVGSVGElement>` |  | Atributos del `<svg>`, incluido `className` para el layout de afuera. |

## Guías

- Sí: Colócalo en un contenedor con `text-text-primary`; sobre el cromo oscuro, `text-nav-foreground`.
- Sí: Deja alrededor al menos el alto de la «B» (0,5 × `height`) libre de otros elementos.
- Sí: Usa `variant="mark"` a partir de 16px y el logotipo completo a partir de 20px de alto.
- No: No lo estires ni le pases `width`: cambia solo `height`.
- No: No le pongas colores a mano ni lo saques del tema; `gradient="ai"` es solo para superficies de IA.
- No: No uses «lytics» con la flecha sin «Barber», ni la flecha girada o en espejo.

Relacionados: thema-logo, thema-product-header

## Ejemplos

### Los tres colores

`brand` es el uso normal; `ai` solo en superficies de IA; `mono` cuando no hay gradiente posible (una tinta, grabado, cromo oscuro).

```tsx
<BarberlyticsLogo />
<BarberlyticsLogo gradient="ai" />
<BarberlyticsLogo gradient="mono" />
```

### Isotipo: la flecha sola

Para favicon, avatar e icono de app. Cambia solo `height`; el ancho sale de la proporción.

```tsx
<BarberlyticsLogo variant="mark" height={16} />
<BarberlyticsLogo variant="mark" height={24} />
<BarberlyticsLogo variant="mark" height={32} />
<BarberlyticsLogo variant="mark" height={48} />
```

### Sobre el cromo oscuro

El rail y la cabecera son oscuros en los dos modos: el contenedor pone `text-nav-foreground` y «Barber» pasa a blanco solo.

```tsx
<div className="bg-surface-nav text-nav-foreground p-6">
  <BarberlyticsLogo height={24} />
</div>
```
