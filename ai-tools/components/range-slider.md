# RangeSlider

Slider de dos manejadores para acotar un rango numérico, con etiqueta, valores visibles y formateador propio. Envuelve el Slider base y reporta siempre una tupla `[min, max]`.

Familia: Fechas y rangos · Doc: `/docs#/components/range-slider` · Fuente: `src/components/range/RangeSlider.tsx`

```ts
import { RangeSlider } from "@/components/range"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `[number, number]` | `[0, 100]` | Rango seleccionado como tupla `[inicio, fin]`. |
| `onChange` | `(value: [number, number]) => void` |  | Se dispara mientras se arrastra cualquiera de los manejadores. |
| `min` | `number` | `0` | Valor mínimo de la pista. |
| `max` | `number` | `100` | Valor máximo de la pista. |
| `step` | `number` | `1` | Incremento entre posiciones. |
| `label` | `string` |  | Etiqueta visible enlazada por `aria-labelledby`. |
| `description` | `string` |  | Ayuda bajo el slider; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; tiñe pista y manejadores de destructivo. |
| `showValue` | `boolean` | `true` | Muestra `inicio — fin` a la derecha de la etiqueta. |
| `valueFormatter` | `(value: number) => string` | `String` | Formatea cada valor mostrado. |
| `disabled` | `boolean` | `false` | Desactiva el slider. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Úsalo para acotar filtros numéricos continuos (salario, edad, porcentaje).
- Sí: Formatea con unidad o moneda para que el rango se lea sin contexto adicional.
- Sí: Mantén `value` dentro de `[min, max]` al cambiar los límites desde fuera.
- No: No lo uses para fechas: existen los pickers de rango.
- No: No lo uses cuando el usuario necesita escribir un valor exacto; ofrece inputs numéricos junto al slider.

Relacionados: slider, input, date-range-picker

## Ejemplos

### Controlado

Arrastra cualquiera de los dos manejadores; `onChange` recibe la tupla ordenada.

```tsx
const [value, setValue] = React.useState<[number, number]>([20, 80])

<RangeSlider value={value} onChange={setValue} label="Porcentaje de avance" />
```

### Con formateador

`valueFormatter` solo afecta al texto mostrado; el valor sigue siendo numérico.

```tsx
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

<RangeSlider
  value={value}
  onChange={setValue}
  label="Rango salarial"
  min={1_000_000}
  max={10_000_000}
  step={250_000}
  valueFormatter={(v) => currency.format(v)}
/>
```

### Con límites y unidad

```tsx
<RangeSlider value={value} onChange={setValue} label="Edad" min={18} max={65} valueFormatter={(v) => `${v} años`} />
```

### Sin valores, error y deshabilitado

```tsx
<RangeSlider value={[10, 90]} label="Sin valor visible" showValue={false} />
<RangeSlider value={[70, 75]} label="Con error" error="El rango es demasiado estrecho." />
<RangeSlider value={[30, 60]} label="Deshabilitado" disabled />
```
