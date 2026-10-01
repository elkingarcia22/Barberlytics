# ActionFab

La barra de acciones cuando no hay sitio para una barra: un solo botón en la esquina que, al tocarlo, despliega hacia arriba todo lo que se puede hacer, con la acción principal la primera y destacada. Cerrado enseña el icono de esa acción principal —o el recuento, si hay algo marcado—, y abierto se convierte en la ✕ que lo cierra. No hace falta montarlo a mano: DataListActionRail lo pone solo por debajo de 1024px.

Familia: Action rail · Doc: `/docs#/components/action-fab` · Fuente: `src/components/action-rail/ActionFab.tsx`

```ts
import { ActionFab } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `RailActionSpec[]` |  | Las mismas que recibe la barra, con su `scope`. Si ninguna aplica, el botón no se pinta: un botón que no ofrece nada estorba. |
| `selectedCount` | `number` |  | Cuántos registros hay marcados. Decide el reparto y, cerrado, lo que enseña el botón. |
| `onClearSelection` | `() => void` |  | Soltar la selección, que aparece como primera entrada del abanico cuando hay algo marcado. |
| `gender` | `"f" \| "m"` | `"m"` | Concordancia del recuento: «soltar 3 seleccionadas» frente a «3 seleccionados». |
| `className` | `string` |  | Clases del contenedor anclado. |

## Guías

- Sí: Déjalo dentro del ancla del rail del shell: se posiciona solo abajo a la derecha, sobre el contenido.
- Sí: Cuida que las etiquetas sean cortas: aquí se leen enteras junto al icono, no en un tooltip.
- Sí: Deja la acción principal marcada con `primary`: es la que da cara al botón cerrado.
- No: No lo montes a la vez que la barra: `DataListActionRail` ya elige uno u otro según el ancho.
- No: No le cuelgues diez acciones: un abanico largo tapa la pantalla y obliga a estirar el pulgar.

Relacionados: data-list-action-rail, action-rail-shell, rail-button

## Ejemplos

### Lo mismo que la barra, en otra forma

Marca una fila y luego otra: reparte las acciones con las mismas reglas que la barra de escritorio. Girar el teléfono no puede cambiar lo que se puede hacer, así que el reparto lo decide el mismo código en los dos sitios.

```tsx
<ActionFab actions={acciones} selectedCount={selected.size} onClearSelection={clear} />
```
