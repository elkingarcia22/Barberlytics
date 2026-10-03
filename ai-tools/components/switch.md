# Switch

Interruptor de dos estados con efecto inmediato, en dos tamaños (32px y 24px de ancho). Úsalo para preferencias que se aplican al instante; para opciones que se envían con un formulario, prefiere Checkbox.

Familia: Primitivos · Doc: `/docs#/components/switch` · Fuente: `src/components/ui/switch.tsx`

```ts
import { Switch } from "@/components/ui/switch"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"default" \| "sm"` | `"default"` | 32×18px o 24×14px. El pulgar se ajusta solo. |
| `checked / defaultChecked` | `boolean` |  | Estado controlado o inicial. |
| `onCheckedChange` | `(checked: boolean) => void` |  | Se dispara al conmutar. |
| `disabled` | `boolean` | `false` | Cursor not-allowed y opacidad al 50%. |
| `aria-invalid` | `boolean` |  | Pinta el borde y el anillo en destructivo. |
| `...props` | `React.ComponentProps<SwitchPrimitive.Root>` |  | Incluye `name` y `value` para formularios nativos. |

## Guías

- Sí: Aplica el cambio al instante; si necesita «Guardar», usa Checkbox.
- Sí: Etiqueta siempre: Label con `htmlFor` o `aria-label` en listas densas.
- Sí: Escribe la etiqueta en positivo («Recordatorios»), no en negativo («No enviar»).
- No: No lo uses como selector entre dos opciones equivalentes: ahí va SegmentedControl.
- No: No agrupes varios switches que dependan entre sí sin explicarlo en la ayuda.

Relacionados: checkbox, label, segmented-control

## Ejemplos

### Controlado con etiqueta

El Label con `htmlFor` hace que el texto también conmute el interruptor.

```tsx
const [checked, setChecked] = React.useState(true);

<Switch id="notify" checked={checked} onCheckedChange={setChecked} />
<Label htmlFor="notify">Notificarme por correo</Label>
```

### Lista de preferencias

Título, línea de ayuda y el interruptor alineado a la derecha; cada fila es independiente.

```tsx
<div className="divide-y rounded-xl border bg-surface">
  {settings.map((s) => (
    <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex flex-col">
        <Label htmlFor={s.id}>{s.title}</Label>
        <span className="text-xs text-text-secondary">{s.hint}</span>
      </div>
      <Switch id={s.id} checked={enabled[s.id]} onCheckedChange={(v) => setEnabled({ ...enabled, [s.id]: v })} />
    </div>
  ))}
</div>
```

### Tamaño sm en listas densas

El tamaño pequeño encaja en popovers y paneles de configuración de columnas.

```tsx
<label className="flex items-center justify-between text-[13px]">
  {column}
  <Switch size="sm" checked={visible.includes(column)} onCheckedChange={toggle(column)} aria-label={`Mostrar ${column}`} />
</label>
```

### Deshabilitado

```tsx
<Switch checked disabled />
<Switch disabled />
```
