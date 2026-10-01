# Sheet

Panel lateral (o inferior/superior) sobre un velo difuminado: entra recorriendo todo su ancho con curva expo-out en 500ms y sale en 300ms. Úsalo para editar un registro, navegar en móvil o mostrar acciones sin abandonar la página.

Familia: Primitivos · Doc: `/docs#/components/sheet` · Fuente: `src/components/ui/sheet.tsx`

```ts
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Lado de anclaje; fija posición, radio, borde y la animación de entrada/salida. |
| `showCloseButton` | `boolean` | `true` | Botón X fantasma en la esquina superior derecha. |
| `modal` | `boolean` | `true` | Debe coincidir con el `modal` de `Sheet`. En `false` el componente pinta su propio velo (z-40) para no dejar la página clicable. |
| `overlayClassName / overlayStyle` | `string / CSSProperties` |  | Recortan o desplazan el velo cuando el panel convive con algo fuera de él (p. ej. el Agente IA). |
| `open / onOpenChange` | `boolean / (open) => void` |  | Estado controlado, en `Sheet`. |
| `useBodyScrollLock(active)` | `hook` |  | Exportado del mismo archivo: bloquea el scroll del body en drawers no modales, con contador para varios a la vez. |

## Guías

- Sí: Usa `right` para editar, `left` para navegar y `bottom` para acciones en móvil.
- Sí: Cierra con SheetClose desde los botones del footer.
- Sí: Pon siempre SheetTitle: Radix lo exige para accesibilidad.
- No: No lo uses para confirmaciones cortas: usa Dialog o AlertDialog.
- No: No mezcles `modal={false}` en Sheet sin pasarlo también a SheetContent.

Relacionados: dialog, drawer-shell, popover, button

## Ejemplos

### Formulario de edición (right)

El caso más común: header, campos y un footer con las acciones al fondo (`mt-auto`).

```tsx
<Sheet>
  <SheetTrigger asChild><Button variant="outline">Editar encuesta</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Editar encuesta</SheetTitle>
      <SheetDescription>Los cambios se aplican al guardar.</SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 px-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </div>
    <SheetFooter className="flex-row justify-end">
      <SheetClose asChild><Button variant="ghost">Cancelar</Button></SheetClose>
      <SheetClose asChild><Button>Guardar</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### Navegación (left)

Cada enlace envuelto en SheetClose cierra el panel al elegir.

```tsx
<SheetContent side="left" className="sm:max-w-xs">
  <SheetHeader><SheetTitle>Navegación</SheetTitle></SheetHeader>
  <nav className="flex flex-col gap-1 px-2">
    {items.map(({ icon: Icon, label }) => (
      <SheetClose key={label} asChild>
        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
          <Icon className="size-4" /> {label}
        </button>
      </SheetClose>
    ))}
  </nav>
</SheetContent>
```

### Acciones (bottom)

Con `h-auto` el panel inferior mide lo que su contenido; sin botón de cerrar, se cierra tocando el velo.

```tsx
<SheetContent side="bottom" showCloseButton={false}>
  <SheetHeader>
    <SheetTitle>Clima Q3</SheetTitle>
    <SheetDescription>¿Qué quieres hacer con esta encuesta?</SheetDescription>
  </SheetHeader>
  <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
    <SheetClose asChild><Button variant="outline"><Share2 /> Compartir resultados</Button></SheetClose>
    <SheetClose asChild><Button variant="outline" className="text-destructive"><Trash2 /> Eliminar</Button></SheetClose>
  </div>
</SheetContent>
```
