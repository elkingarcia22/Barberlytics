# DrawerShell

El panel lateral del producto sobre `Sheet`: cabecera con título, cuerpo con scroll propio y pie con acciones, en once tamaños y desde cualquier lado. Admite modo no modal y recorte del velo para convivir con paneles externos como el del Agente IA.

Familia: Overlays · Doc: `/docs#/components/drawer-shell` · Fuente: `src/components/overlays/DrawerShell.tsx`

```ts
import { DrawerShell } from "@/components/overlays"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del panel. |
| `trigger` | `React.ReactNode` |  | Elemento que abre el drawer (`asChild`). |
| `title / description` | `string` |  | Cabecera con borde inferior; si ambos faltan, no se pinta. |
| `leading` | `React.ReactNode` |  | Avatar o icono a la izquierda del título: quién o qué se abrió (el cliente de una cita, por ejemplo). |
| `children` | `React.ReactNode` |  | Cuerpo con scroll propio y `scrollbar-gutter: stable`. |
| `actions` | `React.ReactNode` |  | Botones del pie, en un `SheetFooter` con borde superior. |
| `footer` | `React.ReactNode` |  | Pie completamente personalizado; reemplaza a `actions`. |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | Lado desde el que entra. |
| `size` | `"sm" … "7xl" \| "full"` | `"md"` | Ancho máximo en `sm+` (de 384px a 1280px o completo). No aplica a top/bottom. |
| `showCloseButton` | `boolean` | `true` | Muestra la X en la esquina. |
| `disablePadding / disableScrollbarGutter` | `boolean` | `false` | Quitan el padding del cuerpo o la reserva de la barra de scroll. |
| `modal` | `boolean` | `true` | En `false` el fondo sigue vivo (para convivir con un panel externo); el velo se sigue dibujando. |
| `overlayClassName / overlayStyle` | `string / CSSProperties` |  | Recortan o animan el velo. |
| `contentStyle` | `CSSProperties` |  | Estilo en línea del cajón, para sincronizar su movimiento con otro panel. |
| `onInteractOutside` | `(e: Event) => void` |  | Intercepta el clic fuera; llama a `e.preventDefault()` para no cerrar. |

## Guías

- Sí: Compón el cuerpo con `DrawerSection` para que todos los paneles se lean igual.
- Sí: Una acción primaria en el pie y la secundaria como `outline`.
- Sí: Usa `lg` o más solo para vistas de detalle con varias columnas.
- Sí: Si la pantalla vive dentro de otra (un marco de celular, el panel de un widget), envuélvela en `PortalContainerProvider` de `@/components/ui/portal-container` con un contenedor que tenga `[transform:translateZ(0)]`: el drawer se abre dentro y no en la ventana.
- No: No apagues `modal` salvo para convivir con un panel fuera del portal.
- No: No pongas la confirmación de borrado dentro del drawer: abre un `ConfirmDialog` encima.

Relacionados: sheet, drawer-section, modal-shell, confirm-dialog

## Ejemplos

### Formulario con acciones

`actions` va al pie con fondo atenuado; ambos botones cierran desde el estado del padre.

```tsx
const [open, setOpen] = React.useState(false);

<DrawerShell
  open={open}
  onOpenChange={setOpen}
  trigger={<Button>Nuevo objetivo</Button>}
  title="Nuevo objetivo"
  description="Define qué se quiere lograr y quién responde por ello."
  actions={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button onClick={() => { create(); setOpen(false); }}>Crear objetivo</Button>
  </>}
>
  <Field label="Nombre" />
  <Field label="Responsable" />
</DrawerShell>
```

### Con DrawerSection

Un drawer de detalle: fondo sutil y tarjetas apiladas, cada una con su tono.

```tsx
<DrawerShell open={open} onOpenChange={setOpen} trigger={<Button variant="outline">Ver detalle</Button>} size="lg" title="…" className="bg-surface-subtle">
  <div className="space-y-3">
    <DrawerSection icon={Target} tone="brand" title="Resultado clave" hint="…">…</DrawerSection>
    <DrawerSection icon={Users} tone="neutral" title="Equipo" hint="…" badge="3">…</DrawerSection>
  </div>
</DrawerShell>
```

### Hoja inferior

`side="bottom"` para una lista corta de opciones en móvil; elegir una cierra la hoja.

```tsx
<DrawerShell open={open} onOpenChange={setOpen} trigger={<Button variant="outline"><Filter /> Ordenar</Button>} side="bottom" title="Ordenar por">
  {options.map((option) => (
    <button onClick={() => { setSort(option); setOpen(false); }}>{option}</button>
  ))}
</DrawerShell>
```
