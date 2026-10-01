# ActionRailShell

La barra de acciones flotante que comparten todas las pantallas: una sola pastilla que se abre, se recoge, se arrastra y recuerda su orientación. Recibe dos slots —acciones contextuales de la selección y acciones persistentes de la pantalla— y pone por su cuenta el asa, el menú de ajustes y las divisorias.

Familia: Action rail · Doc: `/docs#/components/action-rail-shell` · Fuente: `src/components/action-rail/ActionRailShell.tsx`

```ts
import { ActionRailShell, RailDivider, RailGroupShimmer, useContextChangeKey } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `persistent` | `React.ReactNode` |  | Acciones que la pantalla ofrece siempre. Van al final de la barra. |
| `contextual` | `React.ReactNode` | `null` | Acciones que dependen de la selección actual. Con `null` el grupo y su divisoria desaparecen del todo. |
| `keepOpen` | `boolean` | `false` | Mantiene la barra abierta aunque la preferencia sea auto-ocultar. Enciéndelo mientras exista una selección. |
| `isBlocked` | `boolean` | `false` | Recoge la barra a su pastilla y la deja inerte; para cuando un panel modal ocupa la pantalla. |
| `RailDivider` | `() => JSX.Element` |  | Regla fina entre grupos; lee la orientación del contexto del shell. |
| `RailGroupShimmer` | `{ animKey: number }` |  | Brillo que recorre la barra cuando cambia el grupo contextual. Necesita un ancestro `relative`. |
| `useContextChangeKey` | `(context: string) => number` |  | Devuelve una clave que sube cada vez que `context` cambia; alimenta `animKey`. |

## Guías

- Sí: Monta un solo shell por pantalla y cambia solo su contenido; para el lector es la misma barra en todas partes.
- Sí: Pasa `keepOpen` mientras haya selección: una acción que necesita filas marcadas no puede desaparecer al mover el cursor.
- Sí: Deriva `contextual` a `null` cuando no hay nada marcado; no dejes botones apagados colgando.
- No: No pongas ajustes de la barra (orientación, auto-ocultar) entre las acciones: ya viven en RailSettingsMenu.
- No: No reimplementes la pastilla, el asa o la divisoria en una pantalla; extiende el shell.
- No: No la renderices dentro de un contenedor que hace scroll: usa el anclaje `ShellRailSlot` del AdminShell.

Relacionados: rail-button, rail-selection-chip, rail-settings-menu, rail-drag-handle, admin-shell

## Ejemplos

### Barra completa con selección

Marca filas de la tabla: el grupo contextual entra con stagger (AnimatedActionItem), la barra brilla (RailGroupShimmer) y se queda abierta mientras haya selección (keepOpen). El botón primario abre un popover con RailCreateOption.

```tsx
const animKey = useContextChangeKey(hasSelection ? "selection" : "none");
const popoutSide = useRailPopoutSide();

<ActionRailShell
  keepOpen={hasSelection}
  contextual={
    hasSelection ? (
      <>
        <RailGroupShimmer animKey={animKey} />
        <AnimatedActionItem animKey={animKey} staggerIndex={0} skipColorFlash>
          <RailSelectionChip count={selected.length} onClear={clear} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={1}>
          <RailButton icon={<Copy />} label="Duplicar" onClick={duplicate} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={2}>
          <RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
        </AnimatedActionItem>
      </>
    ) : null
  }
  persistent={
    <>
      <RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
      <RailButton icon={<Filter />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={noop} />
      <Popover>
        <PopoverTrigger asChild>
          <RailPrimaryAction icon={<Plus />} label="Crear encuesta" />
        </PopoverTrigger>
        <PopoverContent side={popoutSide} align="end" className="w-72 bg-surface-nav p-2">
          <RailCreateOption icon={<FileText />} title="Desde cero" description="Una encuesta en blanco." onClick={createBlank} />
          <RailCreateOption icon={<Sparkles />} title="Con IA" description="La IA propone las preguntas." onClick={createWithAi} />
        </PopoverContent>
      </Popover>
    </>
  }
/>
```

### Bloqueada por un panel modal

Con `isBlocked` la barra se recoge a su pastilla y deja de responder al cursor, aunque haya selección. Al cerrar el panel vuelve sola.

```tsx
const [panelOpen, setPanelOpen] = React.useState(false);

<ActionRailShell
  contextual={<SelectionActions />}
  persistent={<ScreenActions />}
  keepOpen
  isBlocked={panelOpen}
/>
```

### useContextChangeKey y RailGroupShimmer

La clave sube cada vez que cambia el contexto que se le pasa; pásala como `animKey` para re-disparar el stagger y el brillo sin remontar la barra.

```tsx
const animKey = useContextChangeKey(context);

<RailGroupShimmer animKey={animKey} />
<AnimatedActionItem animKey={animKey} staggerIndex={0}>
  <RailButton icon={<Download />} label="Acción 1" onClick={run} />
</AnimatedActionItem>
```

### RailDivider

La regla fina entre grupos. Se dibuja en el eje que toque: vertical en una barra horizontal y viceversa.

```tsx
<RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
<RailDivider />
<RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
<RailDivider />
<RailPrimaryAction icon={<Plus />} label="Crear" />
```
