# Tooltip

Etiqueta flotante de Radix en fondo oscuro con flecha, que aparece tras 200ms al pasar el cursor o enfocar. Úsalo para nombrar botones de solo icono o dar un dato breve; nunca para contenido que la persona necesite leer para continuar.

Familia: Primitivos · Doc: `/docs#/components/tooltip` · Fuente: `src/components/ui/tooltip.tsx`

```ts
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"top"` | En `TooltipContent`. Lado preferido; Radix lo invierte si no cabe. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | En `TooltipContent`. Alineación sobre el trigger. |
| `sideOffset` | `number` | `0` | En `TooltipContent`. Separación en px; la flecha ya aporta la suya. |
| `open / onOpenChange` | `boolean / (open) => void` |  | En `Tooltip`. Estado controlado. |
| `delayDuration` | `number` | `200` | En `TooltipProvider`. Milisegundos antes de mostrarse. La app monta un provider global. |
| `asChild` | `boolean` |  | En `TooltipTrigger`. Usa el hijo como trigger sin añadir un botón extra. |

## Guías

- Sí: Nombra los botones de solo icono con tooltip y `aria-label`.
- Sí: Una línea corta; si necesitas más, usa HoverCard o Popover.
- Sí: Envuelve los triggers deshabilitados en un `<span tabIndex={0}>`.
- No: No pongas información imprescindible solo en un tooltip: en móvil no hay hover.
- No: No metas enlaces ni botones dentro; el contenido no es interactivo.
- No: No montes otro `TooltipProvider` global; ya existe en la app.

Relacionados: hover-card, popover, button

## Ejemplos

### Botones de solo icono

El caso principal: el tooltip nombra la acción y el `aria-label` la cubre para lectores de pantalla.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil /></Button>
  </TooltipTrigger>
  <TooltipContent>Editar</TooltipContent>
</Tooltip>
```

### Con atajo de teclado

Un `<kbd data-slot="kbd">` dentro del contenido ajusta el padding derecho automáticamente.

```tsx
<TooltipContent>
  Guardar <kbd data-slot="kbd">⌘S</kbd>
</TooltipContent>
```

### Sobre un botón deshabilitado

Un botón `disabled` no emite eventos de puntero; envuélvelo en un `<span>` que sí los reciba.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0} className="inline-flex">
      <Button disabled>Exportar</Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>Disponible cuando cierre la encuesta</TooltipContent>
</Tooltip>
```

### Controlado

Con `open` y `onOpenChange` se puede abrir desde otra parte de la interfaz.

```tsx
const [open, setOpen] = React.useState(false);

<Tooltip open={open} onOpenChange={setOpen}>
  <TooltipTrigger asChild><Button variant="outline">Publicar</Button></TooltipTrigger>
  <TooltipContent>Se enviará a 412 personas</TooltipContent>
</Tooltip>
```

### Sin retardo

Un `TooltipProvider` local cambia el `delayDuration` solo para sus hijos; la app ya monta uno global con 200ms.

```tsx
<TooltipProvider delayDuration={0}>
  <Tooltip>
    <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Ayuda"><Info /></Button></TooltipTrigger>
    <TooltipContent>Aparece al instante</TooltipContent>
  </Tooltip>
</TooltipProvider>
```
