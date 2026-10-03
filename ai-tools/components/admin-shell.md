# AdminShell

El cascarón del panel de administración: AppSidebar plegable (se recoge solo a los dos segundos), AppHeader, pie legal y un diálogo de feedback, todo en un `h-dvh` con margen de 8px. Expone tres anclas por portal —ShellHeaderSlot, ShellRailSlot y ShellAgentPanelSlot— para que una pantalla ponga su identidad, su barra flotante y su panel lateral sin levantar estado al router.

Familia: Layout y shell · Doc: `/docs#/components/admin-shell` · Fuente: `src/components/app-shell/AdminShell.tsx`

```ts
import { AdminShell, ShellHeaderSlot, ShellRailSlot, ShellAgentPanelSlot } from "@/components/app-shell"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `children` | `React.ReactNode` |  | La pantalla. Con `scrollContent` va dentro de un scroller; sin él, en una caja `overflow-hidden` que debe llenar con `h-full`. |
| `config.contentWidth` | `"narrow" \| "normal" \| "wide" \| "full"` | `"normal"` | Ancho máximo de la columna de contenido, con los tres anchos del sistema: 720px para formularios, 1140px por defecto y 1600px para tableros densos. `full` deja el lienzo entero. Lo pone el marco una vez; ninguna pantalla vuelve a fijar su ancho. |
| `scrollContent` | `boolean` | `true` | El shell hace scroll del contenido y muestra el pie. Las pantallas tipo app pasan `false` y gestionan su scroll. |
| `showFooter` | `boolean` | `scrollContent \|\| modo agente` | Fuerza el pie legal aunque `scrollContent` sea false. |
| `onNavigateHome` | `() => void` |  | Se dispara al pulsar «Objetivos» en el sidebar: la vuelta a la lista. |
| `ShellHeaderSlot` | `{ children }` |  | Portala junto al toggle del header: identidad viva de la pantalla (nombre, estado, autosave). |
| `ShellRailSlot` | `{ children }` |  | Portala al ancla inferior centrada del `main`, fuera del scroller; para ActionRailShell. |
| `ShellAgentPanelSlot` | `{ children }` |  | Portala al ancla lateral, hermana de la columna de contenido; el hijo trae su ancho. |

## Guías

- Sí: Una pantalla con tabla y barra flotante pasa `scrollContent={false}` y monta su barra en ShellRailSlot.
- Sí: Pon en ShellHeaderSlot solo identidad que la pantalla ya posee; el shell no debe conocerla.
- Sí: Deja que el shell escriba la clase `dark` en `<html>`; no lo hagas también desde la pantalla.
- Sí: Si la pantalla necesita más aire, cambia `contentWidth` en el marco; no le pongas un `max-w-` propio.
- No: No rendericen los slots fuera de AdminShell: sin proveedor devuelven null en silencio.
- No: No pongas un panel lateral como overlay sobre la columna; usa ShellAgentPanelSlot para que la columna ceda ancho.
- No: No anides AdminShell dentro de otro cascarón de pantalla completa.

Relacionados: app-sidebar, app-header, action-rail-shell, ai-agent-drawer

## Ejemplos

### Pantalla tipo app con los tres slots

`scrollContent={false}`: la pantalla gestiona su scroll. ShellHeaderSlot pone el nombre y el estado junto al header; ShellRailSlot deja la barra flotante fuera del scroller, así no se va con la tabla.

```tsx
<AdminShell scrollContent={false} onNavigateHome={goHome}>
  <ShellHeaderSlot>
    <span className="text-sm font-semibold">Ciclo de desempeño 2026</span>
    <Badge variant="secondary">Borrador</Badge>
  </ShellHeaderSlot>

  <div className="flex h-full flex-col">{/* contenido con su propio overflow-y-auto */}</div>

  <ShellRailSlot>
    <ActionRailShell persistent={<ScreenActions />} />
  </ShellRailSlot>
</AdminShell>
```

### ShellAgentPanelSlot

El ancla del panel lateral es un hermano flex de la columna de contenido. Lo que se portala ahí trae su propio ancho y estrecha la columna en vez de flotar encima; es lo que usa AiAgentDrawer.

```tsx
{open && (
  <ShellAgentPanelSlot>
    <aside className="h-full w-72 rounded-2xl border bg-surface p-4 shadow-card">…</aside>
  </ShellAgentPanelSlot>
)}
```

### Dashboard con scroll del shell

Con `scrollContent` (por defecto) el shell hace scroll del contenido y muestra el pie legal. Espera dos segundos: el sidebar se pliega solo.

```tsx
<AdminShell>
  <Stats />
  <Sections />
</AdminShell>
```
