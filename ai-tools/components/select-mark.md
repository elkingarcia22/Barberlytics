# SelectMark

La marca de elegir de las opciones que no son un control nativo —tarjetas y filas con foto, texto y acciones—: un círculo si se elige una opción y una casilla si se pueden varias, vacía mientras no se elige y rellena con su check al elegirla. Es lo que hace que sedes, servicios y barberos se lean como la misma familia, sean tarjetas o filas de una lista.

Familia: Selección · Doc: `/docs#/components/select-mark` · Fuente: `src/components/selection/SelectMark.tsx`

```ts
import { SelectMark } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `kind` | `"radio" \| "checkbox"` | `"radio"` | Círculo (una opción) o casilla (varias). |
| `checked` | `boolean` | `false` | Elegida: relleno de marca con su check. |
| `size` | `"default" \| "sm"` | `"default"` | 24 px o 20 px. |
| `className` | `string` |  | Solo para ubicarla (márgenes, posición). |

## Guías

- Sí: Ponla dentro del botón que ya lleva `role` y `aria-checked`: ella solo dibuja el estado.
- Sí: Úsala igual en tarjetas y en filas: el cliente lee la misma marca en cada paso.
- No: No la uses suelta como control: no es focusable ni anuncia nada.
- No: No pongas un radio nativo al lado: la marca ya es el indicador.

Relacionados: selectable-row, checkbox, radio-group, selectable-card

## Ejemplos

### Formas y estados

Círculo para una sola opción (sede, barbero) y casilla para varias (servicios).

```tsx
<SelectMark kind="radio" />
<SelectMark kind="radio" checked />
<SelectMark kind="checkbox" />
<SelectMark kind="checkbox" checked />
```
