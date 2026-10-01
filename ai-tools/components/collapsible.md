# Collapsible

Muestra u oculta un bloque de contenido desde un trigger, sin la lista de ítems de Accordion. Úsalo para «Ver más detalles», filtros avanzados o listas que se pliegan para dejar solo el primer elemento.

Familia: Primitivos · Doc: `/docs#/components/collapsible` · Fuente: `src/components/ui/collapsible.tsx`

```ts
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / defaultOpen` | `boolean` |  | Estado controlado o inicial. |
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar. |
| `disabled` | `boolean` | `false` | El trigger deja de responder. |
| `CollapsibleTrigger.asChild` | `boolean` |  | Aplica el rol y `aria-expanded` al hijo (normalmente un Button). |
| `CollapsibleContent.forceMount` | `boolean` |  | Mantiene el contenido en el DOM aunque esté cerrado (p. ej. para formularios). |

## Guías

- Sí: Di en el trigger qué se va a mostrar («Ver más detalles», «3 pendientes más»), no solo «Más».
- Sí: Gira la flecha con el estado para que se entienda que se puede volver a plegar.
- Sí: Deja fuera del contenido lo imprescindible: el título, el primer ítem, el contador.
- No: No lo uses para varias secciones seguidas: eso es Accordion.
- No: No escondas dentro campos obligatorios de un formulario sin indicarlo.
- No: No anides collapsibles; el usuario pierde la referencia de qué abrió.

Relacionados: accordion, drawer-section, button

## Ejemplos

### «Ver más detalles» en una ficha

Controlado con `open` para que el texto del trigger y la flecha reflejen el estado.

```tsx
const [open, setOpen] = React.useState(false);

<Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-surface">
  <div className="flex items-center justify-between px-4 py-3">
    <span>Ana Lucía Torres</span>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm">
        {open ? "Ver menos" : "Ver más detalles"}
        <ChevronDown data-icon="inline-end" className={open ? "rotate-180" : ""} />
      </Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent>
    <dl className="border-t px-4 py-3">…</dl>
  </CollapsibleContent>
</Collapsible>
```

### Lista plegada al primer elemento

El primer ítem queda fuera de CollapsibleContent para que siempre se vea; el trigger de icono despliega el resto.

```tsx
<Collapsible open={open} onOpenChange={setOpen}>
  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
    <span>{first}</span>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Mostrar pendientes"><ChevronsUpDown /></Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent className="flex flex-col gap-2 pt-2">
    {rest.map((item) => <div key={item} className="rounded-lg border px-3 py-2">{item}</div>)}
  </CollapsibleContent>
</Collapsible>
```

### Filtros avanzados abiertos por defecto

El trigger es una fila completa clicable; un Badge cuenta los filtros activos aunque el bloque esté cerrado.

```tsx
<Collapsible defaultOpen>
  <CollapsibleTrigger asChild>
    <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted">
      <Filter className="size-4" /> Filtros avanzados <Badge variant="secondary">2</Badge>
      <ChevronDown className="ml-auto size-4" />
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="grid grid-cols-2 gap-2 pt-2">…</div>
  </CollapsibleContent>
</Collapsible>
```
