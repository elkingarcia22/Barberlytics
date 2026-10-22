# TruncationTooltip

La regla del sistema para el texto cortado: todo texto que se corta con elipsis muestra el texto completo en un tooltip al pasar el ratón o al llegar con el teclado. Se monta una sola vez junto al `TooltipProvider` global (app, centro de ayuda y reserva) y vigila el documento entero, así que vale para `<Text truncate>`, `truncate`, `text-ellipsis` y `line-clamp-*` en cualquier componente o pantalla, sin envolver nada. Solo aparece cuando el texto no cabe: en móvil, al angostar la ventana o con nombres largos.

Familia: Overlays · Doc: `/docs#/components/truncation-tooltip` · Fuente: `src/components/overlays/TruncationTooltip.tsx`

```ts
import { TruncationTooltip } from "@/components/overlays"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `(sin props)` | `—` |  | Se monta una vez en los providers globales. No se usa en pantallas ni componentes. |
| `data-truncation-tooltip="off"` | `atributo` |  | En el elemento cortado o en un padre: no muestra el tooltip ahí. |
| `isTextTruncated(element)` | `(element: HTMLElement) => boolean` |  | La comprobación que usa: elipsis o `line-clamp` en el estilo calculado y texto que de verdad sobra. |

## Guías

- Sí: Corta con `truncate` o `line-clamp-N` cuando el espacio manda: el texto completo queda a un hover o un Tab.
- Sí: Dale al texto cortado un ancho que lo limite (`min-w-0` en flex, un ancho de columna): sin eso no se corta y no hay nada que mostrar.
- Sí: Lo imprescindible, además, en la ficha o el detalle: en táctil no hay hover.
- No: No pongas un `Tooltip` o un `title` a mano solo para enseñar el texto completo: ya lo hace esta capa.
- No: No montes un segundo `TruncationTooltip`: con uno global basta.
- No: No apagues la regla por estética; solo cuando el texto completo ya se ve en otro lugar inmediato.

Relacionados: tooltip, text

## Ejemplos

### Varias líneas

Con `line-clamp-N` pasa lo mismo: si sobran líneas, el tooltip enseña el texto entero.

```tsx
<Text size="sm" className="line-clamp-2">{appointment.note}</Text>
```

### Si cabe, no hay tooltip

La misma clase `truncate` sobre un texto corto no muestra nada: el tooltip depende de si el texto se corta, no de la clase.

```tsx
<Text truncate>Corte clásico</Text>
```

### Apagarlo en un caso concreto

`data-truncation-tooltip="off"` en el elemento o en un padre lo apaga, para cuando el texto completo ya se ve al lado o el elemento ya trae su propio tooltip con más contexto. Si ya lleva `Tooltip` o `title`, no hace falta: no se duplica.

```tsx
<div data-truncation-tooltip="off">
  <Text truncate>{LONG_NAME}</Text>
</div>
```
