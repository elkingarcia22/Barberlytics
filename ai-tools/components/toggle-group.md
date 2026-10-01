# ToggleGroup

Conjunto de Toggle pegados que comparten variante y tamaño por contexto. En modo `single` funciona como selector exclusivo (vista tabla o tablero); en `multiple`, como barra de opciones combinables (negrita + cursiva).

Familia: Primitivos · Doc: `/docs#/components/toggle-group` · Fuente: `src/components/ui/toggle-group.tsx`

```ts
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `"single" \| "multiple"` |  | Obligatorio. `single` guarda un string; `multiple`, un array. |
| `value / defaultValue` | `string \| string[]` |  | Estado controlado o inicial, según `type`. |
| `onValueChange` | `(value: string \| string[]) => void` |  | En `single`, al deseleccionar llega `""`. |
| `variant` | `"default" \| "outline"` | `"default"` | Se propaga a todos los ítems por contexto. |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Se propaga a todos los ítems por contexto. |
| `disabled` | `boolean` | `false` | Deshabilita el grupo completo. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Solo afecta a la navegación con flechas; el layout sigue siendo en fila. |
| `ToggleGroupItem.value` | `string` |  | Obligatorio. Identificador del ítem. |

## Guías

- Sí: Usa `single` para vistas o alineaciones (exclusivas) y `multiple` para atributos combinables.
- Sí: Pon `aria-label` en el grupo y en cada ítem que solo lleve icono.
- Sí: Fija `variant` y `size` en el grupo, no ítem por ítem.
- No: No lo uses como navegación entre páginas: eso es Tabs.
- No: No pases de cinco o seis ítems; a partir de ahí, Select.
- No: No dejes un `single` sin valor si la interfaz necesita siempre una opción activa: filtra el `""`.

Relacionados: toggle, segmented-control, tabs, button-group

## Ejemplos

### Selector de vista (single)

Una sola opción activa. Radix permite deseleccionar al volver a pulsar y emite `""`; el ejemplo lo ignora para que siempre haya una vista.

```tsx
const [view, setView] = React.useState("table");

<ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => { if (v) setView(v); }} aria-label="Vista de colaboradores">
  <ToggleGroupItem value="table" aria-label="Tabla"><Table2 /> Tabla</ToggleGroupItem>
  <ToggleGroupItem value="board" aria-label="Tablero"><KanbanSquare /> Tablero</ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista"><List /> Lista</ToggleGroupItem>
</ToggleGroup>
```

### Barra de formato (multiple)

Varias opciones activas a la vez; el valor es un array de strings.

```tsx
const [format, setFormat] = React.useState<string[]>(["bold"]);

<ToggleGroup type="multiple" value={format} onValueChange={setFormat} aria-label="Formato del texto">
  <ToggleGroupItem value="bold" aria-label="Negrita"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Cursiva"><Italic /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Subrayado"><Underline /></ToggleGroupItem>
</ToggleGroup>
```

### Días laborables (sm, outline)

Siete ítems de ancho fijo con `className="w-8 px-0"`; el tamaño `sm` lo fija el grupo una sola vez.

```tsx
<ToggleGroup type="multiple" variant="outline" size="sm" value={days} onValueChange={setDays} aria-label="Días laborables">
  {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
    <ToggleGroupItem key={day} value={day} aria-label={day} className="w-8 px-0">{day}</ToggleGroupItem>
  ))}
</ToggleGroup>
```

### Deshabilitado

`disabled` en el grupo bloquea todos los ítems; también se puede poner en un ítem suelto.

```tsx
<ToggleGroup type="single" defaultValue="left" variant="outline" disabled>
  …
</ToggleGroup>

<ToggleGroup type="single" defaultValue="left" variant="outline">
  <ToggleGroupItem value="left" aria-label="Izquierda"><AlignLeft /></ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centro" disabled><AlignCenter /></ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Derecha"><AlignRight /></ToggleGroupItem>
</ToggleGroup>
```
