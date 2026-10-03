# Checkbox

Casilla de 16px para elegir una o varias opciones de un conjunto, con estado indeterminado para selecciones parciales. Úsalo en formularios y listas seleccionables; para una preferencia on/off usa Switch.

Familia: Primitivos · Doc: `/docs#/components/checkbox` · Fuente: `src/components/ui/checkbox.tsx`

```ts
import { Checkbox } from "@/components/ui/checkbox"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `checked / defaultChecked` | `boolean \| "indeterminate"` |  | Estado de la casilla. `indeterminate` muestra un guion para selecciones parciales. |
| `onCheckedChange` | `(checked: boolean \| "indeterminate") => void` |  | Se dispara al cambiar el estado. |
| `disabled` | `boolean` | `false` | Desactiva la casilla y baja la opacidad. |
| `required` | `boolean` | `false` | Marca el control como obligatorio en formularios nativos. |
| `name / value` | `string` |  | Se envían con el formulario como un input oculto. |
| `aria-invalid` | `boolean` |  | Aplica el borde y anillo destructivos. |

## Guías

- Sí: Coloca siempre una etiqueta visible o `aria-label`.
- Sí: Usa `indeterminate` solo en casillas que resumen un grupo.
- Sí: Alinea la casilla con la primera línea del texto cuando la etiqueta es larga.
- No: No lo uses para acciones inmediatas; para eso está Switch.
- No: No hagas depender el envío del formulario de una única casilla sin explicar por qué.
- No: No lo hagas más pequeño de 16px: el área táctil ya es mínima.

Relacionados: switch, radio-group, label

## Ejemplos

### Con etiqueta y descripción

Asocia el `id` con `htmlFor` para que la etiqueta también active la casilla.

```tsx
const [accepted, setAccepted] = React.useState(false);

<div className="flex items-start gap-3">
  <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
  <div className="grid gap-1">
    <Label htmlFor="terms">Acepto los términos y la política de privacidad</Label>
    <p className="text-[13px] text-text-muted">Es necesario para crear la cuenta.</p>
  </div>
</div>
```

### Seleccionar todo con estado indeterminado

La casilla del encabezado refleja el conjunto: vacía, parcial (`indeterminate`) o completa.

```tsx
const all = selected.length === MODULES.length;
const some = selected.length > 0 && !all;

<Checkbox
  checked={all ? true : some ? "indeterminate" : false}
  onCheckedChange={(checked) => setSelected(checked === true ? [...MODULES] : [])}
  aria-label="Seleccionar todos"
/>
{MODULES.map((name) => (
  <label key={name} className="flex items-center gap-3">
    <Checkbox checked={selected.includes(name)} onCheckedChange={(checked) => toggle(name, checked)} />
    {name}
  </label>
))}
```

### Deshabilitado e inválido

```tsx
<Checkbox disabled />
<Checkbox disabled checked />
<Checkbox aria-invalid />
```
