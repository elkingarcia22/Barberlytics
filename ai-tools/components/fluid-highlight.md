# FluidHighlight

Píldora de fondo que persigue al ítem activo de una lista en lugar de pintar cada ítem por separado, de modo que recorrer el menú se lee como un movimiento continuo. Ya viene integrada en DropdownMenu, Select y Command; úsala directamente solo al construir una lista propia.

Familia: Primitivos · Doc: `/docs#/components/fluid-highlight` · Fuente: `src/components/ui/fluid-highlight.tsx`

```ts
import { FluidHighlight } from "@/components/ui/fluid-highlight"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Clases extra para la píldora (p. ej. cambiar el color `bg-accent`). |
| `Contenedor padre` | `requisito` |  | Debe ser `position: relative` y ser el elemento con scroll; monta la píldora como PRIMER hijo. |
| `Ítem activo` | `requisito` |  | Se detecta por `[data-highlighted]`, `[cmdk-item][data-selected="true"]` o por el foco dentro de `[data-radix-collection-item]` / `[cmdk-item]`. |
| `data-variant` | `"destructive"` |  | En el ítem activo: la píldora se tiñe con `bg-destructive/10`. |
| `Ítems` | `requisito` |  | Deben llevar `relative z-[1]` para quedar por encima de la píldora y no pintar su propio fondo de hover/focus. |

## Guías

- Sí: Deja que DropdownMenu, Select y Command la monten por ti; no la dupliques dentro de ellos.
- Sí: En listas propias, quita `hover:bg-*` / `focus:bg-*` de los ítems para que se vea el recorrido.
- Sí: Mantén el `border-radius` en el ítem: la píldora lo copia.
- No: No la montes fuera de un contenedor `relative`; se posicionaría respecto a otro ancestro.
- No: No la uses en listas virtualizadas con ítems que se desmontan mientras están activos.
- No: No la coloques después de los ítems en el DOM: quedaría por encima del texto.

Relacionados: dropdown-menu, select, command

## Ejemplos

### Integrada en DropdownMenu

Abre el menú y mueve el ratón o usa las flechas: el fondo se desliza entre ítems y se tiñe de rojo en el destructivo.

```tsx
// No hay que hacer nada: DropdownMenuContent ya monta <FluidHighlight /> como primer hijo.
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Acciones <ChevronDown /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-48">
    <DropdownMenuItem><Pencil /> Editar</DropdownMenuItem>
    <DropdownMenuItem><Copy /> Duplicar</DropdownMenuItem>
    <DropdownMenuItem><Archive /> Archivar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><Trash2 /> Eliminar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Lista propia guiada por el foco

Pulsa Tab o haz clic en las opciones. Los ítems llevan `data-radix-collection-item` y el contenedor es `relative`; la píldora sigue al elemento enfocado.

```tsx
<div className="relative rounded-xl bg-popover p-2 ring-1 ring-foreground/10" role="listbox">
  <FluidHighlight />
  {OPTIONS.map((option) => (
    <button
      key={option}
      type="button"
      role="option"
      data-radix-collection-item=""
      className="relative z-[1] flex w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
    >
      {option}
    </button>
  ))}
</div>
```

### Lista propia guiada por atributo

Pasa el ratón. `data-highlighted` marca el ítem activo y `data-variant="destructive"` tiñe la píldora; el radio se copia del propio ítem.

```tsx
const [active, setActive] = React.useState<number | null>(null);

<div className="relative rounded-xl bg-popover p-2 ring-1 ring-foreground/10" onPointerLeave={() => setActive(null)}>
  <FluidHighlight />
  {ACTIONS.map((action, index) => (
    <div
      key={action.label}
      data-highlighted={active === index ? "" : undefined}
      data-variant={action.variant}
      onPointerEnter={() => setActive(index)}
      className="relative z-[1] flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm"
    >
      {action.icon} {action.label}
    </div>
  ))}
</div>
```
