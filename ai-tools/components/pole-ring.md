# PoleRing

La rueda: el poste visto desde arriba, un anillo de ticks radiales del primario girando muy despacio (una vuelta cada 80 s) detrás de un titular o un panel. Va centrado en su padre `relative`; el giro pisa cualquier otro transform, así que el centrado vive en el contenedor del componente.

Familia: Atmósfera y marca · Doc: `/docs#/components/pole-ring` · Fuente: `src/components/atmosphere/PoleRing.tsx`

```ts
import { PoleRing } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number \| string` | `"56rem"` | Diámetro del anillo; px si es número, o cualquier longitud CSS. |
| `opacity` | `number` | `0.6` | Opacidad del conjunto. El anillo ya es tenue (primario al 28%). |
| `className` | `string` |  | Posición del contenedor centrado (`top-[34%]`, `left-[70%]`…). |

## Guías

- Sí: Ponlo en un padre `relative overflow-hidden`: casi siempre es más grande que la sección.
- Sí: Combínalo con un Halo: el anillo dibuja, el halo ilumina.
- No: No lo uses a tamaño pequeño como spinner ni como avatar.
- No: No apliques `transform` al contenedor por `className`: el giro lo pisaría.

Relacionados: barber-pole, halo, hair-canvas

## Ejemplos

### Detrás del titular de portada

En la portada va grande (64rem) y muy tenue, desplazado hacia arriba con `top-[34%]` para que el titular caiga sobre el borde del anillo.

```tsx
<PoleRing size="64rem" opacity={0.3} className="top-[34%]" />
```
