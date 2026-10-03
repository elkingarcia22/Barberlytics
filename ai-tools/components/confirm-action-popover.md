# ConfirmActionPopover

El sí/no de una acción de la barra, anclado al botón que lo pide en vez de un diálogo centrado con velo. RailConfirmButton lo empaqueta con un botón de la barra que lleva tooltip y popover sobre el mismo elemento, y railButtonClass da las clases de un botón con rótulo para disparadores propios.

Familia: Action rail · Doc: `/docs#/components/confirm-action-popover` · Fuente: `src/components/action-rail/ConfirmActionPopover.tsx`

```ts
import { ConfirmActionPopover, RailConfirmButton, railButtonClass } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del popover. Cierra tú mismo en `onConfirm`. |
| `trigger` | `React.ReactNode` |  | Solo en ConfirmActionPopover: un único elemento del DOM que recibe las props del trigger vía `asChild`. |
| `title / description` | `string` |  | La pregunta y su consecuencia, en una línea cada una. |
| `confirmLabel` | `string` |  | Texto del botón que confirma; el de cancelar siempre dice «Cancelar». |
| `tone (ConfirmActionPopover) / confirmTone (RailConfirmButton)` | `"destructive" \| "warning" \| "primary"` |  | Color del botón de confirmar según la gravedad de la acción. |
| `onConfirm` | `() => void` |  | Se ejecuta al confirmar. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `useRailPopoutSide()` | Solo en ConfirmActionPopover: hacia dónde abre; por defecto, lejos de la barra. |
| `tooltip` | `React.ReactNode` |  | Solo en ConfirmActionPopover: rótulo al pasar por encima cuando el disparador es un icono desnudo. |
| `icon / label / tone / blockedReason` | `RailButton props` |  | Solo en RailConfirmButton: el botón de la barra que dispara la pregunta. `tone` colorea el botón, no la confirmación. |
| `railButtonClass(variant, iconOnly)` | `("ghost" \| "primary" \| "warning" \| "danger", boolean) => string` |  | Las clases del botón con rótulo de un drawer, para un `<button>` crudo que hace de trigger. |

## Guías

- Sí: Pregunta solo cuando la acción es irreversible o afecta a varias filas; para el resto, actúa y ofrece deshacer.
- Sí: Pon el número de filas en el título: «¿Eliminar 3 encuestas?» dice más que «¿Estás seguro?».
- Sí: Cierra el popover en `onConfirm`; el componente no lo cierra por ti.
- No: No envuelvas el `trigger` en un Tooltip propio: usa la prop `tooltip`, o el popover nunca abrirá.
- No: No uses `confirmTone="primary"` para borrar: el color anuncia la gravedad.
- No: No abras un ConfirmDialog centrado desde la barra; la decisión es sobre lo que ya está marcado y no necesita tapar la tabla.

Relacionados: rail-button, action-rail-shell, drawer-action-rail, confirm-dialog

## Ejemplos

### Confirmar sobre la selección

El motivo de bloqueo cambia con la selección y el título cuenta las filas: la pregunta se hace con el contexto bajo el puntero.

```tsx
<RailConfirmButton
  icon={<Trash2 />}
  label="Eliminar"
  tone="danger"
  blockedReason={count === 0 ? "Marca al menos una encuesta" : null}
  open={open}
  onOpenChange={setOpen}
  title={`¿Eliminar ${count} encuestas?`}
  description="Se borran sus respuestas y no se pueden recuperar."
  confirmLabel="Eliminar"
  confirmTone="destructive"
  onConfirm={() => { removeSelected(); setOpen(false); }}
/>
```

### Disparador propio con railButtonClass

Para un botón con rótulo (el pie de un drawer) usa ConfirmActionPopover directo: el `trigger` debe ser un solo elemento del DOM, por eso va un `<button>` crudo con las clases compartidas.

```tsx
<ConfirmActionPopover
  open={open}
  onOpenChange={setOpen}
  title="¿Publicar la encuesta?"
  description="Los participantes recibirán la invitación de inmediato."
  confirmLabel="Publicar"
  tone="primary"
  onConfirm={publish}
  trigger={
    <button type="button" className={railButtonClass("primary", false)}>
      <Send className="size-4" /> Publicar
    </button>
  }
/>
```

### De pie, el popover abre hacia la izquierda

Sin `side`, el popover y el tooltip usan `useRailPopoutSide`: arriba en una barra tumbada, a la izquierda en una vertical.

```tsx
// Dentro de una barra vertical no hace falta pasar side:
<RailConfirmButton icon={<Trash2 />} label="Eliminar" tone="danger" confirmTone="destructive" … />
```
