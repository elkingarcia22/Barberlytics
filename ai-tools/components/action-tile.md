# ActionTile

Una tarjeta pulsable con icono, título y una pista: «Agregar otra cita», «Enviar recibo», «Avísame si se libera una hora». Es la acción secundaria que ocupa su propio sitio sin ser un botón. Tres tonos —neutro, punteada y de marca— y dos disposiciones, en fila o apilada para ponerlas en rejilla.

Familia: Utilidades · Doc: `/docs#/components/action-tile` · Fuente: `src/components/utility/ActionTile.tsx`

```ts
import { ActionTile } from "@/components/utility"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `ReactNode` |  | Lo que hace. |
| `description` | `ReactNode` |  | Una pista, o varias líneas apiladas. |
| `leading` | `ReactNode` |  | Un IconTile (a la izquierda; arriba en `stacked`). |
| `tone` | `"default" \| "dashed" \| "accent"` | `"default"` | Neutro, punteada (opcional) o de marca (algo que se suma). |
| `layout` | `"row" \| "stacked"` | `"row"` | En fila, o apilada para rejillas. |
| `chevron` | `boolean` |  | La flecha de la derecha; por defecto solo en `row`. |
| `href` | `string` |  | Si se pasa, es un enlace en vez de un botón. |

## Guías

- Sí: Úsala para acciones secundarias que no deben competir con el botón principal.
- Sí: Mantén el título en un verbo («Agregar», «Enviar») y la pista en una línea.
- No: No la uses para elegir entre opciones: para eso, SelectableRow o MagicCard con SelectMark.
- No: No pongas dos tonos de marca juntos: pierde su lugar.

Relacionados: button, selectable-row, icon-tile, magic-card

## Ejemplos

### En rejilla, apiladas

Con `layout="stacked"` el icono va arriba y no hay flecha: lo que se puede hacer con una cita ya confirmada.

```tsx
<div className="grid grid-cols-2 gap-2">
  {actions.map((action) => (
    <ActionTile key={action.id} layout="stacked" leading={<IconTile … />} title={action.title} description={action.description} onClick={action.onClick} />
  ))}
</div>
```
