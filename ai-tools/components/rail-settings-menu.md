# RailSettingsMenu

Los ajustes propios de la barra —en qué eje se tiende y si se oculta sola— detrás de un solo botón, para no gastar dos huecos de icono en cosas que no tocan el contenido. En una barra de pantalla (`DataListActionRail`) suma «Editar acciones»: la persona elige la acción principal y hasta tres a la vista, de entre todas las acciones de la pantalla y sus filtros rápidos, y la elección se guarda por pantalla. Escribe en las preferencias compartidas que exponen useRailOrientation y useRailAutoHide, persistidas en localStorage para que la barra sea la misma en todas las pantallas.

Familia: Action rail · Doc: `/docs#/components/rail-settings-menu` · Fuente: `src/components/action-rail/RailSettingsMenu.tsx`

```ts
import { RailSettingsMenu, useRailOrientation, useRailAutoHide, useRailPosition } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `RailSettingsMenu` | `() => JSX.Element` |  | Sin props. Lee y escribe las preferencias compartidas; ActionRailShell y DrawerActionRail lo montan solos al frente de la barra. |
| `useRailOrientation()` | `readonly ["horizontal" \| "vertical", (value) => void]` |  | Preferencia de eje, persistida en `thema.actionRail.orientation.v1`. |
| `setRailOrientation(value)` | `(value: RailOrientation) => void` |  | El setter suelto, para cambiar la preferencia fuera de un componente. |
| `useRailAutoHide()` | `readonly [boolean, (value: boolean) => void]` |  | Si la barra se recoge al salir el puntero, persistida en `thema.actionRail.autoHide.v1`. |
| `useRailPosition()` | `readonly [RailPosition \| null, (value) => void]` |  | Dónde se soltó la barra tras arrastrarla; `null` es el dock. No se persiste. |
| `useRailAxis() / useRailIsVertical()` | `() => RailOrientation / () => boolean` |  | El eje que ve una pieza: el del shell que la envuelve o, sin shell, la preferencia. |
| `«Editar acciones»` | `RailLayoutContext` |  | Sale solo dentro de una barra que lo provee (`DataListActionRail`). Abre `RailActionsEditor` en un drawer lateral: principal + hasta 3 a la vista; lo demás se pliega y los filtros no elegidos no salen. Se guarda en `thema.actionRail.layout.v1:<ruta>`; «Restablecer» vuelve a lo que declaró la pantalla. |
| `useRailPopoutSide()` | `() => "top" \| "left"` |  | Hacia dónde abrir tooltips y popovers, siempre lejos de la barra. |

## Guías

- Sí: Deja que el shell monte el menú; una pantalla solo aporta acciones.
- Sí: Declara bien el peso de serie (`primary`, `overflow`): es lo que ve quien nunca abre «Editar acciones» y a lo que vuelve «Restablecer».
- Sí: Lee la orientación con `useRailAxis` en las piezas nuevas, así funcionan dentro y fuera del shell.
- Sí: Enciende `keepOpen` en el shell mientras haya selección: auto-ocultar no debe esconder una acción que se está a punto de usar.
- No: No dupliques los ajustes como botones sueltos en la barra: costarían dos huecos y perderían el rótulo.
- No: No guardes la orientación en el estado de una pantalla; se perdería al cambiar de tab.
- No: No persistas la posición arrastrada: una barra que aparece en un rincón tras recargar parece perdida.

Relacionados: action-rail-shell, rail-drag-handle, rail-overflow-menu, drawer-action-rail

## Ejemplos

### El menú y lo que escribe

Dos grupos con la opción activa marcada. Elige «Vertical» y la barra se pone de pie; elige «Ocultar sola» y la preferencia cambia para cualquier barra montada.

```tsx
const [orientation] = useRailOrientation(); // "horizontal" | "vertical"
const [autoHide] = useRailAutoHide();       // boolean

<RailSettingsMenu />
```

### useRailOrientation, useRailAutoHide y useRailPosition

Las tres preferencias viven fuera de React en pequeños stores con listeners: una barra que se monta después de otra no ve un valor viejo. Orientación y auto-ocultar persisten en localStorage; la posición arrastrada no, y una recarga devuelve la barra a su dock.

```tsx
const [orientation, setOrientation] = useRailOrientation(); // localStorage
const [autoHide, setAutoHide] = useRailAutoHide();            // localStorage
const [position, setPosition] = useRailPosition();            // solo en memoria

// Para las piezas dentro de una barra:
const axis = useRailAxis();          // la del shell o, sin shell, la preferencia
const side = useRailPopoutSide();    // "top" tumbada · "left" de pie
```
