# Label

Etiqueta accesible para controles de formulario, en 14px medium. Asóciala por `htmlFor` a un Input, Checkbox, Switch o Select para ampliar el área de clic y que los lectores de pantalla anuncien el campo.

Familia: Primitivos · Doc: `/docs#/components/label` · Fuente: `src/components/ui/label.tsx`

```ts
import { Label } from "@/components/ui/label"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `htmlFor` | `string` |  | `id` del control asociado. Obligatorio salvo que el control esté dentro del label. |
| `children` | `React.ReactNode` |  | Texto de la etiqueta; puede incluir un asterisco o un icono. |
| `className` | `string` |  | Clases extra (color, tamaño). |
| `...props` | `React.ComponentProps<"label">` |  | Cualquier atributo nativo de <label>. |

## Guías

- Sí: Usa frases cortas en forma de sustantivo: «Correo», «Fecha de inicio».
- Sí: Marca los campos obligatorios de forma consistente en todo el formulario.
- Sí: Coloca la etiqueta a la izquierda para Checkbox y Switch, encima para Input y Select.
- No: No termines las etiquetas con dos puntos.
- No: No uses el label para instrucciones largas; usa un texto de ayuda debajo del campo.
- No: No dejes controles sin etiqueta aunque tengan placeholder.

Relacionados: input, checkbox, switch, select

## Ejemplos

### Con Input

El patrón base: etiqueta encima, campo debajo, 6px de separación.

```tsx
<div className="space-y-1.5">
  <Label htmlFor="email">Correo</Label>
  <Input id="email" type="email" placeholder="nombre@empresa.com" />
</div>
```

### Con Checkbox

Hacer clic en el texto también marca la casilla.

```tsx
<div className="flex items-center gap-2">
  <Checkbox id="remember" />
  <Label htmlFor="remember">Recordar este dispositivo</Label>
</div>
```

### Con Switch

```tsx
const [enabled, setEnabled] = React.useState(true);

<div className="flex items-center gap-3">
  <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
  <Label htmlFor="notifications">Notificaciones por correo</Label>
</div>
```

### Deshabilitado por el control

Con la clase `peer` en el control, la etiqueta que le sigue se atenúa sola (`peer-disabled`).

```tsx
<div className="flex items-center gap-2">
  <Checkbox id="locked" disabled className="peer" />
  <Label htmlFor="locked">Opción bloqueada por el administrador</Label>
</div>
```
