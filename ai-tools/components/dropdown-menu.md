# DropdownMenu

Menú contextual anclado a un botón con ítems, grupos, atajos, casillas, radios y submenús; el resaltado se desliza entre ítems con FluidHighlight. Úsalo para acciones secundarias sobre un elemento o para menús de cuenta.

Familia: Primitivos · Doc: `/docs#/components/dropdown-menu` · Fuente: `src/components/ui/dropdown-menu.tsx`

```ts
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open) => void` |  | Estado de apertura controlado. |
| `DropdownMenuContent.align` | `"start" \| "center" \| "end"` | `"start"` | Alineación respecto al trigger. |
| `DropdownMenuContent.side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Lado preferido; cambia si no cabe. |
| `DropdownMenuContent.sideOffset` | `number` | `4` | Separación con el trigger en px. |
| `DropdownMenuItem.variant` | `"default" \| "destructive"` | `"default"` | Tiñe el ítem y la píldora de resaltado en rojo. |
| `DropdownMenuItem.inset` | `boolean` |  | Añade sangría izquierda para alinear con ítems que tienen indicador. |
| `DropdownMenuItem.onSelect` | `(event) => void` |  | Se dispara al elegir; `event.preventDefault()` mantiene el menú abierto. |
| `DropdownMenuCheckboxItem.checked / onCheckedChange` | `boolean / (checked) => void` |  | Estado de la casilla. |
| `DropdownMenuRadioGroup.value / onValueChange` | `string / (value) => void` |  | Valor activo del grupo de radios. |

## Guías

- Sí: Ordena los ítems por frecuencia y separa lo destructivo al final.
- Sí: Usa `align="end"` cuando el trigger está en el borde derecho.
- Sí: Añade `aria-label` al trigger si es solo un icono.
- No: No superes ~10 ítems sin agrupar; considera Command con búsqueda.
- No: No uses el menú para navegación principal.
- No: No anides más de un nivel de submenú.

Relacionados: command, popover, select, fluid-highlight

## Ejemplos

### Menú de cuenta con submenú

Grupos, separadores y un `DropdownMenuSub` para acciones anidadas.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Más opciones"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Ana Torres</DropdownMenuLabel>
    <DropdownMenuGroup>
      <DropdownMenuItem><User /> Perfil <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem><Settings /> Ajustes <DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger><UserPlus /> Invitar</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Por correo</DropdownMenuItem>
        <DropdownMenuItem>Por enlace</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><LogOut /> Cerrar sesión</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Casillas

`DropdownMenuCheckboxItem` mantiene el menú abierto entre cambios; ideal para visibilidad de columnas.

```tsx
const [columns, setColumns] = React.useState({ progress: true, manager: false, deadline: true });

<DropdownMenuContent className="w-48">
  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
  <DropdownMenuCheckboxItem checked={columns.progress} onCheckedChange={(on) => setColumns((c) => ({ ...c, progress: on }))}>
    Progreso
  </DropdownMenuCheckboxItem>
  …
</DropdownMenuContent>
```

### Radio group

Una sola opción activa; el trigger refleja el valor elegido.

```tsx
const [sort, setSort] = React.useState("recent");

<DropdownMenuContent className="w-48">
  <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
    <DropdownMenuRadioItem value="recent">Más recientes</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="name">Nombre</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="progress">Progreso</DropdownMenuRadioItem>
  </DropdownMenuRadioGroup>
</DropdownMenuContent>
```
