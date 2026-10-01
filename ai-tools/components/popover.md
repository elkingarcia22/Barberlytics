# Popover

Panel flotante anclado a un disparador, con entrada suave (fade + zoom + deslizamiento según el lado) y salida rápida. Úsalo para filtros, selectores y microformularios que no justifican un diálogo.

Familia: Primitivos · Doc: `/docs#/components/popover` · Fuente: `src/components/ui/popover.tsx`

```ts
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverAnchor } from "@/components/ui/popover"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Lado del disparador por el que sale; también decide la dirección del deslizamiento. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alineación respecto al disparador. |
| `sideOffset` | `number` | `4` | Separación en px respecto al disparador. |
| `collisionPadding` | `number` | `16` | Margen mínimo con los bordes del viewport antes de recolocarse. |
| `container` | `HTMLElement` |  | Nodo donde se monta el portal (por defecto, body). |
| `liquid` | `boolean` | `false` | Reservado a los paneles del header del shell: sustituye el zoom por un clip-path circular desde `--reveal-x`/`--reveal-y`. |
| `open / onOpenChange` | `boolean / (open) => void` |  | Estado controlado, en `Popover`. |

## Guías

- Sí: Usa `asChild` en el disparador para que el botón conserve su semántica.
- Sí: Mantén el contenido a una tarea: un filtro, un ajuste, una confirmación ligera.
- Sí: Cierra desde dentro con estado controlado cuando hay acciones.
- No: No lo uses para flujos largos o con scroll: usa Sheet o Dialog.
- No: No actives `liquid` fuera del header del shell.

Relacionados: tooltip, dialog, sheet, hover-card, dropdown-menu

## Ejemplos

### Microformulario

Encabezado más un par de campos; el ancho se ajusta con `className`.

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline"><Settings2 /> Dimensiones</Button>
  </PopoverTrigger>
  <PopoverContent className="w-64 gap-3">
    <PopoverHeader>
      <PopoverTitle>Dimensiones</PopoverTitle>
      <PopoverDescription>Tamaño del bloque en píxeles.</PopoverDescription>
    </PopoverHeader>
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <Label htmlFor="width">Ancho</Label>
      <Input id="width" className="h-8" value={width} onChange={(e) => setWidth(e.target.value)} />
      <Label htmlFor="height">Alto</Label>
      <Input id="height" className="h-8" value={height} onChange={(e) => setHeight(e.target.value)} />
    </div>
  </PopoverContent>
</Popover>
```

### Controlado

Con `open` y `onOpenChange` los botones internos pueden cerrarlo.

```tsx
const [open, setOpen] = React.useState(false);

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><Button variant="outline">Archivar encuesta</Button></PopoverTrigger>
  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>¿Archivar "Clima Q3"?</PopoverTitle>
      <PopoverDescription>Dejará de recibir respuestas. Podrás restaurarla.</PopoverDescription>
    </PopoverHeader>
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      <Button size="sm" onClick={() => setOpen(false)}>Archivar</Button>
    </div>
  </PopoverContent>
</Popover>
```
