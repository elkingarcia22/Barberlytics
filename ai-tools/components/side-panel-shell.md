# SidePanelShell (beta)

Un panel de trabajo que se abre al lado del contenido en vez de encima: entra por la derecha y empuja la página, que se estrecha y sigue usable. Es el gesto del panel del Agente IA, para tareas que se hacen mirando lo de atrás —el detalle de una cita con la agenda al lado, un cobro, un bloqueo—. Misma anatomía y props que DrawerShell, y cae sola a una hoja que sube desde abajo cuando no hay sitio para dos columnas (celular y tablet) o no hay shell alrededor, como las ventanas de la reserva en línea.

Familia: Overlays · Doc: `/docs#/components/side-panel-shell` · Fuente: `src/components/overlays/SidePanelShell.tsx`

```ts
import { SidePanelShell } from "@/components/overlays"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del panel. Escape y la X llaman a `onOpenChange(false)`. |
| `title / description` | `string` |  | Cabecera; el título es también el nombre accesible del panel. |
| `leading` | `React.ReactNode` |  | Avatar o icono a la izquierda del título: quién o qué se abrió (el cliente de una cita, por ejemplo). |
| `headerActions` | `React.ReactNode` |  | Botones de icono en la cabecera, antes del cierre: terciarios (`ghost`, `icon-sm`) y con su tooltip. El panel de una cita pone aquí la actividad y Clipper. |
| `children` | `React.ReactNode` |  | Cuerpo con scroll propio. Solo se monta mientras está abierto. |
| `actions` | `React.ReactNode` |  | Botones del pie, alineados a la derecha. |
| `footer` | `React.ReactNode` |  | Pie completamente personalizado; reemplaza a `actions`. |
| `size` | `"sm" … "full"` | `"md"` | Solo cuenta cuando cae a `DrawerShell`; al lado el ancho es fijo (460px, o 42% de la ventana), pegado al borde y separado de la página por una línea. |
| `showCloseButton` | `boolean` | `true` | Muestra la X de la cabecera. |
| `disablePadding` | `boolean` | `false` | Quita el padding del cuerpo. |

## Guías

- Sí: Úsalo cuando la tarea necesita ver la página de atrás: una agenda, una lista, un tablero.
- Sí: Mantén un solo panel abierto a la vez: abrir otro cierra el anterior y el hueco no salta.
- Sí: Compón el cuerpo con `DrawerSection`, igual que en un drawer.
- Sí: Envuelve la acción principal en `PanelFooter`: queda fija abajo, como pie, aunque viva dentro de una página del cuerpo.
- No: No lo uses para un formulario que pide toda la atención: ahí va `DrawerShell` o `ModalShell`.
- No: No pongas dentro confirmaciones destructivas: abre un `ConfirmDialog` encima.
- No: No fijes anchos propios: el panel decide cuánto le quita a la página.
- No: No dejes el botón principal al final del cuerpo con scroll: se pierde de vista.

Relacionados: drawer-shell, drawer-section, ai-agent-drawer, confirm-dialog

## Ejemplos

### Panel al lado

Mismo uso que `DrawerShell`: estado controlado, cabecera, cuerpo y pie.

```tsx
const [open, setOpen] = React.useState(false);

<SidePanelShell
  open={open}
  onOpenChange={setOpen}
  title="Martín Martínez"
  description="Jueves 1 de octubre"
  actions={<Button onClick={() => setOpen(false)}>Ingresar</Button>}
>
  …
</SidePanelShell>
```
