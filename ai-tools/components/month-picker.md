# MonthPicker

Selector de mes y año con una cuadrícula de doce meses y navegación por año. Devuelve `{ year, month }` con el mes indexado desde cero, listo para construir fechas nativas.

Familia: Fechas y rangos · Doc: `/docs#/components/month-picker` · Fuente: `src/components/date/MonthPicker.tsx`

```ts
import { MonthPicker } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `{ year: number; month: number }` |  | Mes seleccionado; `month` va de 0 (enero) a 11 (diciembre). |
| `onChange` | `(value: { year: number; month: number }) => void` |  | Se dispara al elegir un mes. |
| `minYear` | `number` | `1900` | Primer año navegable. |
| `maxYear` | `number` | `2100` | Último año navegable. |
| `label` | `string` |  | Etiqueta visible. |
| `description` | `string` |  | Ayuda bajo el campo; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `placeholder` | `string` | `"Select month"` | Texto del campo sin valor. |
| `disabled` | `boolean` | `false` | Desactiva el campo. |
| `className` | `string` |  | Clases extra para el contenedor y el botón. |

## Guías

- Sí: Úsalo para periodos mensuales: nóminas, cierres contables, informes.
- Sí: Acota los años al rango con datos reales para evitar navegación inútil.
- No: No lo uses si el usuario necesita un día concreto: usa DatePicker.
- No: No olvides que `month` es base cero al construir un `Date`.

Relacionados: quarter-selector, date-picker, period-selector, popover

## Ejemplos

### Controlado

Las flechas cambian el año visible; el clic sobre un mes selecciona y cierra.

```tsx
const [value, setValue] = React.useState<{ year: number; month: number }>()

<MonthPicker value={value} onChange={setValue} label="Mes de cierre" placeholder="Elige un mes" />
```

### Con valor inicial y años acotados

`minYear`/`maxYear` deshabilitan las flechas en los extremos.

```tsx
const now = new Date()
const [value, setValue] = React.useState({ year: now.getFullYear(), month: now.getMonth() })

<MonthPicker
  value={value}
  onChange={setValue}
  label="Periodo contable"
  minYear={now.getFullYear() - 2}
  maxYear={now.getFullYear()}
/>
```

### Error y deshabilitado

```tsx
<MonthPicker label="Con error" error="Elige un mes." />
<MonthPicker label="Deshabilitado" disabled placeholder="Sin acceso" />
```
