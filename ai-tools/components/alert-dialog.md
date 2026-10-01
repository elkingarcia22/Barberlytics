# AlertDialog

Diálogo modal que exige una decisión explícita antes de continuar: no se cierra al hacer clic fuera ni con Escape sin pasar por Cancelar. Úsalo para confirmar acciones destructivas o irreversibles; para formularios y contenido general usa Dialog.

Familia: Primitivos · Doc: `/docs#/components/alert-dialog` · Fuente: `src/components/ui/alert-dialog.tsx`

```ts
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / defaultOpen` | `boolean` |  | Estado de apertura. Usa `open` + `onOpenChange` para controlarlo. |
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar. |
| `AlertDialogContent.size` | `"default" \| "sm"` | `"default"` | `sm` centra el texto y muestra los botones en dos columnas. |
| `AlertDialogAction.variant` | `ButtonProps["variant"]` | `"default"` | Variante del botón de confirmación. |
| `AlertDialogCancel.variant` | `ButtonProps["variant"]` | `"outline"` | Variante del botón de cancelar. |
| `AlertDialogMedia` | `React.ComponentProps<"div">` |  | Contenedor de 40px para un icono ilustrativo dentro del header. |

## Guías

- Sí: Formula el título como pregunta y nombra el objeto afectado.
- Sí: Explica la consecuencia en la descripción («no se puede deshacer»).
- Sí: Etiqueta la acción con el verbo concreto: «Eliminar», no «Aceptar».
- No: No lo uses para formularios ni contenido navegable; usa Dialog.
- No: No lo abras automáticamente al cargar una página.
- No: No encadenes dos confirmaciones seguidas.

Relacionados: dialog, button, sheet

## Ejemplos

### Confirmar una acción destructiva

La acción hereda las variantes de Button; usa `destructive` para dejar claro el riesgo.

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive"><Trash2 /> Eliminar curso</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
      <AlertDialogDescription>
        Los 230 colaboradores inscritos perderán su progreso. Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Compacto con icono

`size="sm"` centra el contenido y reparte los botones en dos columnas; `AlertDialogMedia` añade un icono de contexto.

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline"><LogOut /> Cerrar sesión</Button>
  </AlertDialogTrigger>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogMedia><LogOut /></AlertDialogMedia>
      <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
      <AlertDialogDescription>Los cambios sin guardar se perderán.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Quedarme</AlertDialogCancel>
      <AlertDialogAction>Salir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Controlado con acción asíncrona

Con `open`/`onOpenChange` el diálogo espera a que termine la petición antes de cerrarse; `preventDefault` evita el cierre automático.

```tsx
const [open, setOpen] = React.useState(false);
const [pending, setPending] = React.useState(false);

const confirm = async (event: React.MouseEvent) => {
  event.preventDefault(); // evita que Radix cierre antes de terminar
  setPending(true);
  await deleteTeam();
  setPending(false);
  setOpen(false);
};

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive"><Trash2 /> Eliminar equipo</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    …
    <AlertDialogFooter>
      <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Eliminando…" : "Sí, eliminar"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
