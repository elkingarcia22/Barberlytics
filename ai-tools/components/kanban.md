# Kanban

Tablero de columnas con tarjetas que cambian de etapa arrastrando: el pipeline de una vacante (Nuevos → En revisión → Entrevista → Oferta), o cualquier flujo por estados. Es controlado —`onItemMove` decide el nuevo orden— y comparte el motor de arrastre con `Sortable`, incluido el movimiento por teclado entre columnas.

Familia: Datos · Doc: `/docs#/components/kanban` · Fuente: `src/components/data-display/Kanban.tsx`

```ts
import { Kanban } from "@/components/data-display/Kanban"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `columns` | `KanbanColumn[]` |  | Las columnas, en el orden en que se dibujan. |
| `items` | `KanbanItem[]` |  | Todas las tarjetas del tablero; `columnId` decide en cuál aparece cada una. |
| `onItemMove` | `(itemId: string, toColumnId: string, toIndex: number) => void` |  | `toIndex` ya es la posición dentro de la columna destino, sin contar la tarjeta movida. |
| `renderItem` | `(item: KanbanItem) => React.ReactNode` |  | Sustituye el cuerpo de la tarjeta; el envoltorio arrastrable se mantiene. |
| `columnWidth` | `number` | `288` | Ancho de cada columna en píxeles. |
| `emptyColumnLabel` | `string` | `"Sin tarjetas"` | Texto cuando una columna no tiene tarjetas. |
| `KanbanColumn.id` | `string` |  | Identificador estable de la columna. |
| `KanbanColumn.title` | `string` |  | Título visible en la cabecera. |
| `KanbanColumn.description` | `string` |  | Línea de contexto bajo el título. |
| `KanbanColumn.tone` | `"default" \| "primary" \| "positive" \| "warning" \| "negative"` | `"default"` | Color del punto junto al título y del contador. |
| `KanbanColumn.limit` | `number` |  | Umbral de WIP; al superarlo aparece el aviso y el contador pasa a «x/y». |
| `KanbanItem.id` | `string` |  | Identificador estable de la tarjeta. |
| `KanbanItem.columnId` | `string` |  | Columna a la que pertenece la tarjeta. |
| `KanbanItem.title` | `string` |  | Título de la tarjeta. |
| `KanbanItem.description` | `string` |  | Línea de contexto bajo el título. |
| `KanbanItem.meta` | `React.ReactNode` |  | Texto corto al pie: una fecha, un responsable. |
| `KanbanItem.avatar` | `React.ReactNode` |  | Avatar mostrado junto al título en la tarjeta por defecto. |
| `KanbanItem.badges` | `React.ReactNode` |  | Fila de badges bajo la descripción, en la tarjeta por defecto. |

## Guías

- Sí: Confirma el movimiento en tu backend antes de repintar; el tablero es controlado y el estado que devuelves es el que se ve.
- Sí: Pon `limit` solo en las columnas donde el exceso importa de verdad (revisión), no en todas.
- Sí: Prueba el flujo completo con teclado: Espacio levanta, ↑/↓ mueve dentro de la columna, ←/→ cambia de columna.
- No: No uses Kanban para menos de dos columnas; ahí una lista `Sortable` es más simple.
- No: No quites el contador de tarjetas por columna: es lo primero que se lee en una revisión de pipeline.
- No: No conviertas `renderItem` en un formulario; dispara una acción que abra el detalle en otro lado.

Relacionados: sortable, status-badge, card

## Ejemplos

### Pipeline de una vacante

Espacio levanta la tarjeta, ↑/↓ la mueve dentro de la columna y ←/→ la pasa a la columna vecina. El contador de «En revisión» se pone en rojo al superar el límite de 3.

```tsx
const columns = [
  { id: "nuevos", title: "Nuevos" },
  { id: "revision", title: "En revisión", tone: "primary", limit: 3 },
  { id: "entrevista", title: "Entrevista", tone: "warning" },
  { id: "oferta", title: "Oferta", tone: "positive" },
];

<Kanban columns={columns} items={items} onItemMove={(itemId, toColumnId, toIndex) => setItems(moveItem(items, itemId, toColumnId, toIndex))} />
```

### Tarjeta con renderItem

`renderItem` sustituye el cuerpo de la tarjeta; el envoltorio arrastrable y el foco se mantienen. Aquí cada tarjeta muestra un avatar con iniciales y un badge de tiempo.

```tsx
<Kanban
  columns={columns}
  items={items}
  onItemMove={onItemMove}
  renderItem={(item) => (
    <div>
      <Avatar><AvatarFallback>{initials(item.title)}</AvatarFallback></Avatar>
      <p>{item.title}</p>
      <p>{item.description}</p>
      <Badge variant="secondary">{item.meta}</Badge>
    </div>
  )}
/>
```

### Aviso de límite (WIP)

Al pasar `limit` en una columna, el contador se vuelve `x/y` y aparece un aviso en cuanto la columna lo supera.

```tsx
<Kanban
  columns={[
    { id: "revision", title: "En revisión", tone: "warning", limit: 2 },
    { id: "entrevista", title: "Entrevista" },
  ]}
  items={items}
/>
```

### Columna vacía

Sin tarjetas, la columna muestra `emptyColumnLabel` en vez de quedar en blanco.

```tsx
<Kanban
  columns={[{ id: "oferta", title: "Oferta" }]}
  items={[]}
  emptyColumnLabel="Ninguna oferta activa"
/>
```
