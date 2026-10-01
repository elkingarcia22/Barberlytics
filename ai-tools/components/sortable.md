# Sortable

Lista que se reordena arrastrando: las lecciones de un plan de formación, las preguntas de una encuesta, los pasos de un proceso. El arrastre con ratón y el teclado (Espacio levanta, flechas mueve, Espacio suelta, Escape cancela) comparten el mismo motor, y cada cambio se anuncia en una región `aria-live`.

Familia: Datos · Doc: `/docs#/components/sortable` · Fuente: `src/components/data-display/Sortable.tsx`

```ts
import { Sortable, SortableItem } from "@/components/data-display/Sortable"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `T[]` |  | La lista en su orden actual. `Sortable` es un componente controlado: nunca la muta. |
| `getId` | `(item: T) => string` |  | Identificador estable de cada elemento. |
| `onReorder` | `(items: T[]) => void` |  | Recibe la lista completa ya reordenada, como copia nueva. |
| `getLabel` | `(item: T) => string` |  | Texto para los anuncios («Lección 3 movida a…»). Sin él se usa `label`, `title` o `name` del propio item. |
| `renderItem` | `(item: T, state: SortableItemState) => React.ReactNode` |  | Compone cada fila; alternativa a pasar `SortableItem` como children. |
| `children` | `React.ReactNode` |  | Composición manual con `SortableItem`, en el mismo orden que `items`. |
| `handle` | `boolean` | `true` | Agarre dedicado con `GripVertical`. En `false` toda la fila arrastra. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Define el eje de arrastre y qué flechas mueven el elemento levantado. |
| `disabled` | `boolean` | `false` | Desactiva el arrastre y el teclado sin ocultar la lista. |
| `SortableItemState.isDragging` | `boolean` |  | El elemento se está arrastrando con el puntero. |
| `SortableItemState.isOver` | `boolean` |  | El puntero está encima de este elemento con algo agarrado. |
| `SortableItemState.isLifted` | `boolean` |  | Se levantó con teclado y las flechas lo mueven. |

## Guías

- Sí: Da siempre `getLabel`, o un campo `label`/`title`/`name` en el objeto: los anuncios `aria-live` dependen de eso.
- Sí: Deja `handle` en `true` (su valor por defecto) cuando la fila tiene además un `onClick`; sin agarre dedicado el clic y el arrastre compiten.
- Sí: Prueba el reordenamiento completo con teclado (Espacio, flechas, Espacio, Escape) antes de dar la lista por accesible.
- No: No mutes `items` dentro de `onReorder`; usa la copia que ya te entrega el componente.
- No: No uses `orientation="horizontal"` en columnas estrechas: las flechas izquierda/derecha compiten con el scroll de la página.
- No: No pongas dos `Sortable` con ids repetidos en la misma pantalla; la región `aria-live` es por instancia, pero los anuncios se confunden si los ids coinciden.

Relacionados: kanban, list-item, table-shell

## Ejemplos

### Lecciones de un plan de formación

Tab hasta el agarre, Espacio para levantar la lección, flechas para moverla y Espacio otra vez para soltarla. Escape la devuelve a su posición original.

```tsx
const [items, setItems] = React.useState(lessons);

<Sortable items={items} getId={(item) => item.id} onReorder={setItems} renderItem={(item) => <span>{item.label}</span>} />
```

### Sin agarre dedicado

Con `handle={false}` la fila entera es el control de arrastre: útil cuando no hay otra acción en la fila que compita por el clic.

```tsx
<Sortable items={items} getId={(item) => item.id} onReorder={setItems} handle={false} renderItem={(item) => (
  <div>
    <span>{item.label}</span>
    <span>{item.type}</span>
  </div>
)} />
```

### Orientación horizontal

`orientation="horizontal"` cambia qué flechas mueven el elemento levantado: ← y → en vez de ↑ y ↓. Sirve para pasos de un proceso mostrados como chips.

```tsx
<Sortable items={steps} getId={(item) => item.id} onReorder={setSteps} orientation="horizontal" renderItem={(item) => <span>{item.label}</span>} />
```

### Composición con SortableItem

Alternativa a `renderItem`: compón los hijos tú mismo con `SortableItem`, en el mismo orden que `items`, cuando el contenido de cada fila varía demasiado para una sola función.

```tsx
<Sortable items={items} getId={(item) => item.id} onReorder={setItems}>
  {items.map((item) => (
    <SortableItem key={item.id} id={item.id}>
      <span>{item.label}</span>
      <span>{item.duration}</span>
    </SortableItem>
  ))}
</Sortable>
```
