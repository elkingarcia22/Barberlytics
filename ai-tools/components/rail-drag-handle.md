# RailDragHandle

El asa con la que se recoloca la barra flotante, y el hook useDraggableRail que hace el trabajo: sigue al puntero, guarda el punto de soltado en un store compartido (useRailPosition) y limita la barra al viewport si la ventana se encoge. Doble clic en el asa devuelve la barra a su dock.

Familia: Action rail · Doc: `/docs#/components/rail-drag-handle` · Fuente: `src/components/action-rail/RailDragHandle.tsx`

```ts
import { RailDragHandle, useDraggableRail, useRailPosition } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `isDragging` | `boolean` |  | Estado del gesto; pinta el asa como agarrada. |
| `onPointerDown / onPointerMove / onPointerUp / onPointerCancel` | `(event: React.PointerEvent<HTMLButtonElement>) => void` |  | Los manejadores del gesto. Pásalos con `{...gripHandlers}`. |
| `onDoubleClick` | `() => void` |  | Devuelve la barra al dock; `gripHandlers` lo conecta con `resetPosition`. |
| `useDraggableRail()` | `{ barRef; position; isDragging; resetPosition; gripHandlers }` |  | `barRef` va en la caja que se recoloca; `position` es null hasta el primer arrastre. |
| `useRailPosition()` | `readonly [RailPosition \| null, (value) => void]` |  | El store compartido, sin persistencia. `x` es el centro de la barra, no su borde izquierdo. |

## Guías

- Sí: Mantén la barra abierta mientras `isDragging` sea true: el shell suspende su temporizador de auto-ocultar durante el gesto.
- Sí: Pon el asa en cabeza de la barra, junto al menú de ajustes: son los controles de la barra, no de la pantalla.
- Sí: Aplica `position` con `left` + `translateX(-50%)`; la barra cambia de ancho al recogerse y el centro es lo que la persona soltó.
- No: No persistas la posición en storage: una recarga debe devolver la barra a su dock.
- No: No montes dos barras arrastrables a la vez en la misma pantalla; comparten posición y se pisarían.
- No: No pongas el asa en un elemento sin `touch-action: none`; el componente ya lo trae, no lo sobrescribas.

Relacionados: action-rail-shell, rail-settings-menu, drawer-action-rail

## Ejemplos

### Barra arrastrable con useDraggableRail

`barRef` va en la caja que se mueve; cuando `position` deja de ser null, esa caja pasa a `fixed` y se ancla por su centro (`left` + `translateX(-50%)`), así recogerse a la pastilla no la desplaza. Al arrastrar, la barra sale del marco y flota sobre la página, como en la app.

```tsx
const { barRef, position, isDragging, gripHandlers } = useDraggableRail();
const isFloating = position != null;

<div
  ref={barRef}
  className={cn("flex flex-col items-center", isFloating && "fixed z-[60]")}
  style={position ? { left: position.x, top: position.y, transform: "translateX(-50%)" } : undefined}
>
  <RailBar>
    <RailDragHandle isDragging={isDragging} {...gripHandlers} />
    <RailDivider />
    <RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
  </RailBar>
</div>
```

### useRailPosition: un solo sitio para todas las barras

La posición vive fuera de React para que la barra de una pantalla y la del drawer sean, para la persona, la misma barra dejada en el mismo sitio.

```tsx
const [position, setPosition] = useRailPosition();
// position: { x, y } | null — x es el centro horizontal de la barra
setPosition(null); // de vuelta al dock
```
