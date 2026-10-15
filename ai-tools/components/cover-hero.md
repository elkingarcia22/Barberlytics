# CoverHero

La portada de una pantalla: la foto arriba, encuadrada donde está la cara y fundida hacia abajo, con la columna del contenido montada sobre ella, y CoverTitle para el título encima. En claro la foto va entera y algo más clara y el título en vidrio ahumado; en oscuro un velo la cubre. Es el arranque de los pasos de elegir de la reserva en línea.

Familia: Layout y shell · Doc: `/docs#/components/cover-hero` · Fuente: `src/components/layout/CoverHero.tsx`

```ts
import { CoverHero, CoverTitle } from "@/components/layout"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `imageUrl` | `string \| null` |  | La foto de fondo. |
| `wide` | `boolean` | `false` | Más alta, para pantallas anchas. |
| `columnClassName` | `string` |  | El ancho de la columna (lo pone el marco: `max-w-…`). |
| `title / lead / aside` | `CoverTitle` |  | CoverTitle: el título en vidrio, su bajada y lo que va a la derecha. |

## Guías

- Sí: Úsala una vez por pantalla, arriba de todo.
- Sí: Pon el título con CoverTitle: sobre la foto el texto normal no contrasta.
- No: No la uses en pantallas de datos: es para pasos de elegir con imagen de marca.
- No: No pongas una foto con texto o logos: el título ya va encima.

Relacionados: page-shell, header

## Ejemplos

### Sin foto

Sin `imageUrl` solo queda el espacio: el contenido no salta cuando la foto tarda.

```tsx
<CoverHero columnClassName="max-w-md"><CoverTitle title="Elige tus servicios" /></CoverHero>
```
