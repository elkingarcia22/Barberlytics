# ConfirmDialog

El diálogo de confirmación del sistema sobre `AlertDialog`: título, aviso, cancelar y confirmar, con variante destructiva, estado de carga, un tercer botón opcional y una confirmación escrita para acciones irreversibles. En modo controlado no se cierra solo: el consumidor pone `open` en false cuando la operación termina.

Familia: Overlays · Doc: `/docs#/components/confirm-dialog` · Fuente: `src/components/overlays/ConfirmDialog.tsx`

```ts
import { ConfirmDialog } from "@/components/overlays"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado. Recomendado siempre: el diálogo no se cierra solo tras `onConfirm`. |
| `trigger` | `React.ReactNode` |  | Elemento que abre el diálogo; se envuelve con `asChild`. |
| `title` | `string` |  | Pregunta o acción a confirmar. |
| `description` | `string` |  | Consecuencia de la acción, en una frase. |
| `variant` | `"default" \| "warning" \| "destructive"` | `"default"` | `destructive` pinta el título y el botón de confirmar en rojo. |
| `confirmLabel / cancelLabel` | `string` | `"Confirmar" / "Cancelar"` | Textos de los botones. |
| `confirmationText` | `string` |  | Si se indica, hay que escribirlo exactamente para habilitar confirmar. |
| `onConfirm / onCancel` | `() => void` |  | Callbacks de cada botón. `onConfirm` evita el cierre automático. |
| `loading` | `boolean` | `false` | Muestra el spinner en confirmar y bloquea todos los botones. |
| `disabled` | `boolean` | `false` | Bloquea los botones sin spinner. |
| `secondaryLabel / secondaryVariant / onSecondary` | `string / "default" \| "destructive" \| "outline" / () => void` |  | Tercer botón entre cancelar y confirmar. |
| `className` | `string` |  | Clases para el contenido del diálogo. |

## Guías

- Sí: Nombra la acción en el botón («Eliminar», «Archivar»), nunca «Aceptar».
- Sí: Usa `confirmationText` solo para borrados irreversibles con nombre propio.
- Sí: Cierra el diálogo tú mismo después de que la operación asíncrona termine.
- No: No lo uses para informar: si no hay decisión, es un toast o un `ModalShell`.
- No: No pongas formularios dentro; para eso está `ModalShell` o `DrawerShell`.

Relacionados: alert-dialog, modal-shell, drawer-shell, button

## Ejemplos

### Con carga asíncrona

`loading` bloquea los botones y muestra el spinner; el diálogo se cierra cuando el consumidor lo decide.

```tsx
const [open, setOpen] = React.useState(false);
const [loading, setLoading] = React.useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={(next) => { if (!loading) setOpen(next); }}
  trigger={<Button variant="outline"><Archive /> Archivar ciclo</Button>}
  title="¿Archivar el ciclo 2026-Q1?"
  description="Dejará de aparecer en el listado activo."
  confirmLabel="Archivar"
  loading={loading}
  onConfirm={async () => {
    setLoading(true);
    await archive();
    setLoading(false);
    setOpen(false);
  }}
/>
```

### Confirmación escrita

Con `confirmationText` el botón queda deshabilitado hasta que se escribe el texto exacto. Para borrados con nombre.

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  trigger={<Button variant="destructive"><Trash2 /> Eliminar encuesta</Button>}
  variant="destructive"
  title="Eliminar «Clima laboral 2026»"
  description="Se borrarán las 312 respuestas recibidas."
  confirmationText="Clima laboral 2026"
  confirmLabel="Eliminar definitivamente"
  onConfirm={() => { remove(); setOpen(false); }}
/>
```

### Tres botones

El tercer botón va entre cancelar y confirmar; aquí una salida destructiva junto a un «Guardar y salir» primario.

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  trigger={<Button variant="outline">Salir del editor</Button>}
  variant="warning"
  title="Tienes cambios sin guardar"
  cancelLabel="Seguir editando"
  secondaryLabel="Salir sin guardar"
  secondaryVariant="destructive"
  onSecondary={() => { discard(); setOpen(false); }}
  confirmLabel="Guardar y salir"
  onConfirm={() => { save(); setOpen(false); }}
/>
```
