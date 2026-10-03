# RailSelectionChip

«N seleccionadas ✕»: el lector de selección que toda barra flotante muestra mientras una tabla tiene filas marcadas. Responde a cuántas filas afectará la siguiente acción y ofrece la salida de la selección sin buscar el checkbox que la empezó.

Familia: Action rail · Doc: `/docs#/components/rail-selection-chip` · Fuente: `src/components/action-rail/RailSelectionChip.tsx`

```ts
import { RailSelectionChip } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `count` | `number` |  | Filas marcadas. Con 1 el rótulo va en singular. |
| `onClear` | `() => void` |  | Quita las marcas sin tocar las filas. |
| `gender` | `"f" \| "m"` | `"f"` | Género del sustantivo contado, para que el participio concuerde. |
| `className` | `string` |  | Clases extra del contenedor. |

## Guías

- Sí: Ponlo siempre el primero del grupo contextual: el número explica a qué afectan los botones que le siguen.
- Sí: Pasa el género correcto; «3 seleccionadas colaboradores» se nota.
- Sí: Envuélvelo en AnimatedActionItem con `skipColorFlash`: es un lector, no una acción.
- No: No lo dejes montado con `count={0}`; retira el grupo contextual entero.
- No: No lo uses como botón de acción: la ✕ solo limpia la selección, nunca borra.

Relacionados: action-rail-shell, rail-button, table-shell

## Ejemplos

### Ligado a la selección de una tabla

El chip encabeza el grupo contextual. Cuando la selección se vacía, la pantalla pasa `contextual={null}` al shell y el grupo entero desaparece.

```tsx
const contextual = selected.length > 0 ? (
  <>
    <RailSelectionChip count={selected.length} onClear={clear} />
    <RailDivider />
    <RailButton icon={<Copy />} label="Duplicar" onClick={duplicate} />
    <RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
  </>
) : null;
```

### Concordancia

«3 seleccionadas» para encuestas, «3 seleccionados» para colaboradores. El singular también concuerda: «1 seleccionado».

```tsx
<RailSelectionChip count={3} onClear={clear} />
<RailSelectionChip count={3} gender="m" onClear={clear} />
<RailSelectionChip count={1} gender="m" onClear={clear} />
```

### De pie, el conteo es un badge

No hay sitio para la frase: el número se queda en la barra y la oración completa pasa al tooltip.

```tsx
// Dentro de una barra vertical:
<RailSelectionChip count={12} gender="m" onClear={clear} />
```
