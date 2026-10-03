# RailButton

Las piezas con las que una pantalla llena su barra flotante: el botón de icono (RailButton), la única acción rellena que admite la barra (RailPrimaryAction), la fila de un popover de creación (RailCreateOption) y el envoltorio que hace entrar cada acción escalonada (AnimatedActionItem). Todas leen la orientación del shell para saber si se ponen de pie y hacia dónde abrir su tooltip.

Familia: Action rail · Doc: `/docs#/components/rail-button` · Fuente: `src/components/action-rail/RailButton.tsx`

```ts
import { RailButton, RailPrimaryAction, RailCreateOption, AnimatedActionItem } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `React.ReactNode` |  | El icono del botón. Usa 20px con `strokeWidth={2}` para igualar el resto de la barra. |
| `label` | `string` |  | Rótulo accesible; se muestra en el tooltip. |
| `onClick` | `() => void` |  | La acción. No se dispara mientras haya `blockedReason`. |
| `blockedReason` | `string \| null` | `null` | Explica por qué la acción no está disponible; con valor, el botón se desactiva y el tooltip muestra el motivo. |
| `tone` | `"default" \| "danger"` | `"default"` | Color del botón; `danger` para acciones destructivas. |
| `RailPrimaryAction` | `{ icon; label } & ComponentProps<"button">` |  | La única acción rellena de la barra. Reenvía ref y props sueltas para poder ser trigger de un popover. De pie, el rótulo pasa al tooltip. |
| `RailCreateOption` | `{ icon; title; description; onClick }` |  | Fila de un popover de creación: icono en tile, título en negrita y una descripción corta. |
| `AnimatedActionItem` | `{ animKey: number; staggerIndex: number; skipColorFlash?: boolean }` |  | Entrada escalonada para una acción contextual. `skipColorFlash` evita el destello en chips y divisorias. |

## Guías

- Sí: Una sola RailPrimaryAction por barra: es el botón al que apunta la pantalla.
- Sí: Usa `blockedReason` en vez de ocultar el botón; la barra mantiene su forma y la persona entiende qué le falta.
- Sí: Envuelve solo las acciones contextuales con AnimatedActionItem; las persistentes no entran ni salen.
- No: No cambies el tamaño de icono por botón: 20px en todos, o la barra pierde su ritmo.
- No: No uses `tone="danger"` para acciones reversibles como limpiar una selección.
- No: No pongas RailCreateOption fuera de un popover oscuro: sus colores asumen el fondo `surface-nav`.

Relacionados: action-rail-shell, confirm-action-popover, rail-overflow-menu, rail-selection-chip

## Ejemplos

### Tonos y bloqueo

El tono `danger` es para acciones destructivas. Con `blockedReason` el botón se desactiva y el tooltip explica por qué en vez de repetir el rótulo.

```tsx
<RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
<RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
<RailButton icon={<Filter />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={noop} />
```

### RailPrimaryAction en cada eje

Tumbada, la acción primaria lleva su rótulo; de pie no hay sitio y el rótulo pasa al tooltip, pero sigue siendo el único botón relleno.

```tsx
<RailPrimaryAction icon={<Plus />} label="Crear encuesta" />
```

### Popover de creación con RailCreateOption

RailPrimaryAction reenvía su ref, así que puede ser el `PopoverTrigger asChild`. Cada RailCreateOption es una fila con icono, título y una línea de por qué.

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <RailPrimaryAction icon={<Plus />} label="Crear encuesta" />
  </PopoverTrigger>
  <PopoverContent side={popoutSide} align="end" className="w-72 bg-surface-nav p-2">
    <RailCreateOption icon={<FileText />} title="Desde cero" description="Una encuesta en blanco." onClick={createBlank} />
    <RailCreateOption icon={<Sparkles />} title="Con IA" description="La IA propone las preguntas." onClick={createWithAi} />
  </PopoverContent>
</Popover>
```

### AnimatedActionItem

Envuelve cada acción contextual: entra con un rebote escalonado por `staggerIndex` y un destello de color. Sube `animKey` para repetir la entrada.

```tsx
{actions.map((action, index) => (
  <AnimatedActionItem key={action.id} animKey={animKey} staggerIndex={index}>
    <RailButton icon={action.icon} label={action.label} onClick={action.run} />
  </AnimatedActionItem>
))}
```
