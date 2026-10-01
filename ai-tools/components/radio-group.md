# RadioGroup

Grupo de opciones excluyentes con navegación por flechas y un punto de 16px que se rellena en primario. Úsalo cuando hay de dos a cinco opciones que deben verse todas a la vez; con más, prefiere un Select.

Familia: Primitivos · Doc: `/docs#/components/radio-group` · Fuente: `src/components/ui/radio-group.tsx`

```ts
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `string` |  | Opción seleccionada (controlado / inicial), en `RadioGroup`. |
| `onValueChange` | `(value: string) => void` |  | Se dispara al elegir otra opción. |
| `disabled` | `boolean` | `false` | En el grupo desactiva todo; en un ítem, solo esa opción. |
| `orientation` | `"horizontal" \| "vertical"` |  | Solo afecta a la navegación por teclado; la disposición se cambia con `className`. |
| `RadioGroupItem.value` | `string` |  | Valor del ítem. Requerido. |

## Guías

- Sí: Asocia cada ítem a un Label con `htmlFor`.
- Sí: Elige una opción por defecto cuando exista una razonable.
- Sí: Ordena las opciones de forma predecible (frecuencia, tamaño, alfabético).
- No: No lo uses para más de ~5 opciones.
- No: No lo uses para activar/desactivar algo: es un Switch.

Relacionados: checkbox, switch, select, label, magic-card

## Ejemplos

### Controlado

`value` + `onValueChange`; cada ítem se asocia a su Label por id.

```tsx
const [value, setValue] = React.useState("biweekly");

<RadioGroup value={value} onValueChange={setValue}>
  {options.map((option) => (
    <div key={option.value} className="flex items-center gap-2">
      <RadioGroupItem id={option.value} value={option.value} />
      <Label htmlFor={option.value}>{option.label}</Label>
    </div>
  ))}
</RadioGroup>
```

### Opciones como tarjetas

El Label envuelve toda la fila, así la tarjeta completa es clicable.

```tsx
<RadioGroup value={value} onValueChange={setValue}>
  {options.map((option) => (
    <Label key={option.value} htmlFor={option.value}
      className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3",
        value === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
      <RadioGroupItem id={option.value} value={option.value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{option.title}</span>
        <span className="text-xs font-normal text-text-secondary">{option.hint}</span>
      </span>
    </Label>
  ))}
</RadioGroup>
```

### Opción deshabilitada

```tsx
<RadioGroup defaultValue="es">
  <div className="flex items-center gap-2">
    <RadioGroupItem id="es" value="es" />
    <Label htmlFor="es">Español</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="pt" value="pt" disabled />
    <Label htmlFor="pt">Portugués (próximamente)</Label>
  </div>
</RadioGroup>
```
