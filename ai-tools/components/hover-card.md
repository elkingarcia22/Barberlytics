# HoverCard

Panel flotante que aparece al pasar el cursor (o enfocar) un elemento, con el mismo lenguaje visual que Popover. Úsalo para previsualizar información de paso, como un perfil o una definición; para contenido que el usuario abre y cierra a propósito usa Popover.

Familia: Primitivos · Doc: `/docs#/components/hover-card` · Fuente: `src/components/ui/hover-card.tsx`

```ts
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `openDelay` | `number` | `150` | Milisegundos antes de abrir tras entrar con el cursor. |
| `closeDelay` | `number` | `100` | Milisegundos antes de cerrar tras salir. |
| `open / onOpenChange` | `boolean / (open) => void` |  | Control externo del estado. |
| `HoverCardContent.side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Lado preferido; se invierte si no cabe. |
| `HoverCardContent.align` | `"start" \| "center" \| "end"` | `"center"` | Alineación respecto al trigger. |
| `HoverCardContent.sideOffset` | `number` | `4` | Separación con el trigger en px. |
| `HoverCardContent.className` | `string` |  | Sobrescribe el ancho (`w-72` por defecto) u otros estilos. |

## Guías

- Sí: Usa un trigger enfocable (enlace o botón) para que funcione con teclado.
- Sí: Limita el contenido a texto, avatar y badges; nada que requiera clic.
- Sí: Sube el `openDelay` si el trigger está en una lista densa para evitar aperturas accidentales.
- No: No metas botones ni formularios dentro; el panel se cierra al salir.
- No: No lo uses en pantallas táctiles como único acceso a información importante.
- No: No lo confundas con Tooltip: si cabe en una línea, usa Tooltip.

Relacionados: popover, tooltip, avatar

## Ejemplos

### Vista previa de perfil

Pasa el cursor sobre la mención. El trigger es un enlace real, así que también se abre con el foco del teclado.

```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <a href="#/people/ana" className="font-medium text-primary hover:underline">@ana.torres</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-3">
      <Avatar size="lg"><AvatarImage src="…" /><AvatarFallback>AT</AvatarFallback></Avatar>
      <div>
        <p className="text-sm font-semibold">Ana Torres</p>
        <p className="text-[13px] text-text-secondary">Líder de Talento · Bogotá</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

### Definición de un término

Un icono de información junto a una métrica explica cómo se calcula sin ocupar espacio.

```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <button type="button" aria-label="¿Qué es la tasa de finalización?"><Info className="size-4" /></button>
  </HoverCardTrigger>
  <HoverCardContent side="right" className="w-64">
    <p className="text-sm font-medium">Tasa de finalización</p>
    <p className="text-[13px] text-text-secondary">Porcentaje de inscritos que completaron todos los módulos en los últimos 30 días.</p>
  </HoverCardContent>
</HoverCard>
```

### Detalle de un badge

```tsx
<HoverCard openDelay={300}>
  <HoverCardTrigger asChild>
    <Badge variant="outline" className="cursor-default border-warning/40 text-warning">Pendiente</Badge>
  </HoverCardTrigger>
  <HoverCardContent side="top" className="w-56">
    <p className="text-[13px] text-text-secondary">Esperando aprobación del manager desde el 12 de septiembre.</p>
  </HoverCardContent>
</HoverCard>
```
