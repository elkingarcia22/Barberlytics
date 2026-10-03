# ModalShell

El modal centrado del producto sobre `Dialog`: cabecera con título y descripción, cuerpo y un pie con acciones o completamente propio. Cuatro tamaños para tareas cortas que no justifican un drawer.

Familia: Overlays · Doc: `/docs#/components/modal-shell` · Fuente: `src/components/overlays/ModalShell.tsx`

```ts
import { ModalShell } from "@/components/overlays"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del modal. |
| `trigger` | `React.ReactNode` |  | Elemento que abre el modal (`asChild`). |
| `title / description` | `string` |  | Cabecera; si ambos faltan, no se pinta. |
| `children` | `React.ReactNode` |  | Cuerpo del modal. |
| `actions` | `React.ReactNode` |  | Botones del pie, en un `DialogFooter` alineado a la derecha. |
| `footer` | `React.ReactNode` |  | Pie completamente personalizado; reemplaza a `actions`. |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Ancho máximo en `sm+`: 384, 448, 512 o 576px. |
| `showCloseButton` | `boolean` | `true` | Muestra la X en la esquina. |
| `className` | `string` |  | Clases para el contenido del diálogo. |

## Guías

- Sí: Úsalo para tareas de uno o dos campos; si crece, pásate a `DrawerShell`.
- Sí: Pon `autoFocus` en el primer campo cuando el modal es de edición.
- Sí: Siempre un título: es lo que anuncia el lector de pantalla.
- No: No lo uses para confirmar acciones destructivas: para eso está `ConfirmDialog`.
- No: No apiles modales; abre un `ConfirmDialog` encima si hace falta, nunca otro `ModalShell`.

Relacionados: dialog, drawer-shell, confirm-dialog, button

## Ejemplos

### Edición corta

Un campo y dos acciones. El borrador se reinicia al abrir y se aplica solo al guardar.

```tsx
const [open, setOpen] = React.useState(false);
const [draft, setDraft] = React.useState(name);

<ModalShell
  open={open}
  onOpenChange={(next) => { if (next) setDraft(name); setOpen(next); }}
  trigger={<Button variant="outline">Renombrar</Button>}
  title="Renombrar plantilla"
  description="El nombre se muestra en el catálogo de plantillas."
  actions={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button disabled={!draft.trim()} onClick={() => { setName(draft); setOpen(false); }}>Guardar</Button>
  </>}
>
  <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
</ModalShell>
```

### Pie personalizado

`footer` reemplaza a `actions` para poner algo a la izquierda, como copiar un enlace.

```tsx
<ModalShell
  open={open}
  onOpenChange={setOpen}
  trigger={<Button variant="outline"><Share2 /> Compartir</Button>}
  size="lg"
  title="Compartir reporte"
  footer={
    <div className="-mx-4 -mb-4 flex items-center justify-between rounded-b-xl border-t bg-muted/40 p-4">
      <Button variant="link" size="sm"><Link2 /> Copiar enlace</Button>
      <Button onClick={() => setOpen(false)}>Listo</Button>
    </div>
  }
>
  …
</ModalShell>
```

### Solo información

Sin acciones ni descripción: título, texto y la X para cerrar.

```tsx
<ModalShell open={open} onOpenChange={setOpen} trigger={<Button variant="ghost">¿Cómo se calcula?</Button>} size="sm" title="Índice de avance">
  <p>Es el promedio ponderado del cumplimiento de cada resultado clave…</p>
</ModalShell>
```
