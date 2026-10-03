# Dialog

Ventana modal centrada para tareas cortas que requieren atención sin abandonar la pantalla: editar un campo, compartir, ver un detalle. Para confirmaciones destructivas usa AlertDialog; para flujos largos, un Sheet.

Familia: Primitivos · Doc: `/docs#/components/dialog` · Fuente: `src/components/ui/dialog.tsx`

```ts
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / defaultOpen` | `boolean` |  | Estado de apertura. Usa `open` + `onOpenChange` para controlarlo. |
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar (X, Escape, clic fuera o DialogClose). |
| `modal` | `boolean` | `true` | Bloquea la interacción con el resto de la página. |
| `DialogContent.showCloseButton` | `boolean` | `true` | Muestra la X en la esquina superior derecha. |
| `DialogContent.className` | `string` |  | Sobrescribe el ancho (`sm:max-w-*`) u otros estilos del panel. |
| `DialogFooter.showCloseButton` | `boolean` | `false` | Añade un botón outline «Close» que cierra el diálogo. |
| `DialogClose` | `Radix Close` |  | Cualquier elemento con `asChild` que cierra el diálogo al hacer clic. |

## Guías

- Sí: Incluye siempre `DialogTitle` (y `DialogDescription` si aporta contexto) para accesibilidad.
- Sí: Mantén el contenido en una sola columna y sin scroll interno cuando sea posible.
- Sí: Devuelve el foco al trigger al cerrar; Radix lo hace por ti si usas `DialogTrigger`.
- No: No abras un diálogo desde otro diálogo.
- No: No lo uses para confirmaciones destructivas; usa AlertDialog.
- No: No metas flujos de varios pasos; usa un Sheet o una página.

Relacionados: alert-dialog, sheet, command, popover

## Ejemplos

### Formulario controlado

El diálogo se cierra desde el estado del padre cuando termina el guardado; `DialogClose` cancela sin lógica extra.

```tsx
const [open, setOpen] = React.useState(false);

const submit = async (event: React.FormEvent) => {
  event.preventDefault();
  await saveProfile();
  setOpen(false);
};

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm"><Pencil /> Editar</Button>
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>Los cambios se verán en toda la plataforma.</DialogDescription>
      </DialogHeader>
      <Label htmlFor="name">Nombre completo</Label>
      <Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Solo lectura

Sin pie ni acciones: el usuario cierra con la X, Escape o clic fuera.

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost">Ver detalles del plan</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Plan Growth</DialogTitle>
      <DialogDescription>Facturación mensual por colaborador activo.</DialogDescription>
    </DialogHeader>
    <ul className="list-disc space-y-1 pl-5 text-text-secondary">
      <li>Catálogo completo de cursos</li>
      <li>Rutas de aprendizaje ilimitadas</li>
      <li>Reportes de progreso por equipo</li>
    </ul>
  </DialogContent>
</Dialog>
```

### Ancho personalizado

Sobrescribe `sm:max-w-*` en `DialogContent` para contenido más amplio.

```tsx
<DialogContent className="sm:max-w-2xl">…</DialogContent>
```
