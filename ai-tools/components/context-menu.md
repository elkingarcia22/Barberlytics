# ContextMenu

Menú que se abre con clic derecho (o pulsación larga) sobre un elemento, con los mismos ítems, casillas, radios, atajos y submenús que DropdownMenu y la misma apariencia. Úsalo como atajo experto sobre filas, tarjetas y lienzos; nunca como único acceso a una acción.

Familia: Primitivos · Doc: `/docs#/components/context-menu` · Fuente: `src/components/ui/context-menu.tsx`

```ts
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/components/ui/context-menu"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar; la apertura la decide el clic derecho, no es controlable. |
| `modal` | `boolean` | `true` | Bloquea la interacción con el resto de la página mientras está abierto. |
| `ContextMenuTrigger.disabled` | `boolean` | `false` | El clic derecho vuelve a mostrar el menú del navegador. |
| `ContextMenuTrigger.asChild` | `boolean` |  | Convierte al hijo (una fila, una tarjeta) en la zona de clic derecho. |
| `ContextMenuItem.variant` | `"default" \| "destructive"` | `"default"` | Tiñe el ítem y la píldora de resaltado en rojo. |
| `ContextMenuItem.inset` | `boolean` |  | Sangría izquierda para alinear con ítems que tienen indicador. |
| `ContextMenuItem.onSelect` | `(event) => void` |  | Se dispara al elegir; `event.preventDefault()` mantiene el menú abierto. |
| `ContextMenuCheckboxItem.checked / onCheckedChange` | `boolean / (checked) => void` |  | Estado de la casilla. |
| `ContextMenuRadioGroup.value / onValueChange` | `string / (value) => void` |  | Valor activo del grupo de radios. |
| `ContextMenuSubContent.sideOffset` | `number` | `12` | Separación del submenú respecto al ítem que lo abre. |

## Guías

- Sí: Ofrece las mismas acciones también por un botón visible (un DropdownMenu de «⋯»): el clic derecho no se descubre solo.
- Sí: Resalta el trigger mientras el menú está abierto (`data-[state=open]`) para que se sepa sobre qué se actúa.
- Sí: Ordena igual que en el DropdownMenu equivalente; lo destructivo, al final y separado.
- No: No lo pongas sobre zonas donde el usuario espera el menú nativo (campos de texto, enlaces, imágenes).
- No: No superes ~10 ítems ni más de un nivel de submenú.
- No: No mezcles en un mismo menú acciones sobre la fila y ajustes globales de la tabla.

Relacionados: dropdown-menu, kbd, table, fluid-highlight

## Ejemplos

### Clic derecho sobre una fila de colaboradores

Cada fila lleva su propio ContextMenu con `asChild`; `data-[state=open]` resalta la fila mientras el menú está abierto. Incluye submenú «Enviar» y una acción destructiva al final.

```tsx
<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="flex items-center gap-3 px-4 py-2.5 data-[state=open]:bg-muted">
      <Avatar size="sm"><AvatarFallback>AT</AvatarFallback></Avatar>
      <span>Ana Lucía Torres</span>
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <ContextMenuLabel>Ana Lucía Torres</ContextMenuLabel>
    <ContextMenuItem onSelect={edit}><Pencil /> Editar perfil <ContextMenuShortcut>⌘E</ContextMenuShortcut></ContextMenuItem>
    <ContextMenuItem onSelect={copyEmail}><Copy /> Copiar correo</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger><Send /> Enviar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Encuesta de clima</ContextMenuItem>
        <ContextMenuItem>Recordatorio de curso</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" onSelect={offboard}><Trash2 /> Dar de baja</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Casillas y radios

CheckboxItem para columnas visibles (varias a la vez) y RadioGroup para la densidad (una sola), separados por etiquetas de grupo.

```tsx
<ContextMenuContent className="w-56">
  <ContextMenuLabel>Columnas</ContextMenuLabel>
  <ContextMenuCheckboxItem checked={columns.area} onCheckedChange={(on) => setColumns({ ...columns, area: on })}>Área</ContextMenuCheckboxItem>
  <ContextMenuCheckboxItem checked={columns.manager} onCheckedChange={(on) => setColumns({ ...columns, manager: on })}>Líder</ContextMenuCheckboxItem>
  <ContextMenuSeparator />
  <ContextMenuLabel>Densidad</ContextMenuLabel>
  <ContextMenuRadioGroup value={density} onValueChange={setDensity}>
    <ContextMenuRadioItem value="comfortable">Cómoda</ContextMenuRadioItem>
    <ContextMenuRadioItem value="compact">Compacta</ContextMenuRadioItem>
  </ContextMenuRadioGroup>
</ContextMenuContent>
```

### Ítems con sangría y deshabilitados

`inset` alinea el texto con los ítems que llevan indicador; `disabled` deja la acción visible pero inactiva.

```tsx
<ContextMenuContent>
  <ContextMenuCheckboxItem checked>Mostrar archivados</ContextMenuCheckboxItem>
  <ContextMenuItem inset>Refrescar</ContextMenuItem>
  <ContextMenuItem inset disabled>Exportar (sin permisos)</ContextMenuItem>
</ContextMenuContent>
```
