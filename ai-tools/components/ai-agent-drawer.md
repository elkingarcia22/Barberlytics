# AiAgentDrawer

El panel lateral del Agente IA. Se porta al ancla que AdminShell reserva junto a la columna de contenido (ShellAgentPanelSlot), así abrirlo estrecha la pantalla en vez de taparla; el contexto define título, placeholder y sugerencias, o se entrega un panel a medida.

Familia: IA · Doc: `/docs#/components/ai-agent-drawer` · Fuente: `src/components/ai/AiAgentDrawer.tsx`

```ts
import { AiAgentDrawer } from "@/components/ai/AiAgentDrawer"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open` | `boolean` |  | Si el panel está abierto. Cerrado colapsa a 0px pero sigue montado. |
| `onOpenChange` | `(open: boolean) => void` |  | Se llama con `false` desde el botón de cerrar. |
| `context` | `"dashboard" \| "builder" \| "results" \| "demographics" \| "custom"` | `"dashboard"` | Define título, placeholder y sugerencias. `custom` desactiva la conversación genérica. |
| `customPanel` | `React.ReactNode` |  | UI a medida que reemplaza la conversación. Solo se usa con `context="custom"`. |

## Guías

- Sí: Renderízalo dentro de AdminShell (o provee el ancla como en el ejemplo) para que estreche la columna en vez de taparla.
- Sí: Usa `agentPanelShift` en los Sheets que convivan con el panel abierto.
- Sí: Elige el `context` de la pantalla para que las sugerencias tengan sentido.
- No: No lo montes como overlay fijo: perdería el gesto de «hacer sitio» que comparte con el cajón.
- No: No reutilices el degradado ni el fondo `ai-mesh-agent` en paneles que no son de IA.
- No: No animes con clases `duration-*`: las transiciones van en línea para que ganen a las del Sheet.

Relacionados: sheet, ai-panel, admin-shell

## Ejemplos

### Cómo funciona el ancla

Fuera de AdminShell hay que proveer el ancla a mano: un `ShellAgentPanelSlotProvider` con un div hermano de la columna de contenido. Sin proveedor el drawer no renderiza nada.

```tsx
const [open, setOpen] = React.useState(false);
const [host, setHost] = React.useState<HTMLDivElement | null>(null);

<div className="flex h-[480px] gap-2 overflow-hidden p-2">
  <ShellAgentPanelSlotProvider value={host}>
    <div className="flex min-w-0 flex-1 flex-col">
      <Button onClick={() => setOpen((v) => !v)}>Abrir Agente IA</Button>
      {/* contenido de la pantalla */}
    </div>
    <AiAgentDrawer open={open} onOpenChange={setOpen} context="results" />
  </ShellAgentPanelSlotProvider>
  {/* el ancla: hermano flex de la columna */}
  <div ref={setHost} className="relative flex h-full shrink-0" />
</div>
```

### Panel a medida

Con `context="custom"` y `customPanel` el drawer solo anima el hueco; el contenido aparece mientras se abre, no después.

```tsx
<AiAgentDrawer
  open={open}
  onOpenChange={setOpen}
  context="custom"
  customPanel={<ObjectiveComposer />}
/>
```

### Tokens de movimiento (agentPanelMotion)

Abrir el panel mueve tres cosas a la vez (panel, cajón y velo). Estas constantes viven en un solo sitio para que compartan duración y curva; `agentPanelShift(open)` devuelve los estilos con los que un Sheet se corre para dejarle sitio.

```tsx
import { agentPanelShift, agentPanelTransition } from "@/components/ai/agentPanelMotion";

const shift = agentPanelShift(agentOpen);
<SheetContent style={shift.content} overlayStyle={shift.overlay} />

// o para una propiedad suelta:
style={{ width: open ? AGENT_PANEL_WIDTH : 0, transition: agentPanelTransition("width") }}
```
