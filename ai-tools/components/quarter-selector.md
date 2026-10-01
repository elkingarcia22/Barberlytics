# QuarterSelector

Selector de trimestre y año con cuatro botones (Q1–Q4) y navegación por año. Devuelve `{ year, quarter }` y se formatea como `Q2 2026` con las utilidades de fecha.

Familia: Fechas y rangos · Doc: `/docs#/components/quarter-selector` · Fuente: `src/components/date/QuarterSelector.tsx`

```ts
import { QuarterSelector } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `{ year: number; quarter: 1 \| 2 \| 3 \| 4 }` |  | Trimestre seleccionado. |
| `onChange` | `(value: { year: number; quarter: 1 \| 2 \| 3 \| 4 }) => void` |  | Se dispara al elegir un trimestre. |
| `minYear` | `number` | `1900` | Primer año navegable. |
| `maxYear` | `number` | `2100` | Último año navegable. |
| `label` | `string` |  | Etiqueta visible. |
| `description` | `string` |  | Ayuda bajo el campo; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `placeholder` | `string` | `"Select quarter"` | Texto del campo sin valor. |
| `disabled` | `boolean` | `false` | Desactiva el campo. |
| `className` | `string` |  | Clases extra para el contenedor y el botón. |

## Guías

- Sí: Úsalo en objetivos, OKR y reportes trimestrales.
- Sí: Traduce el trimestre a fechas reales con `getQuarterFromDate` y `formatQuarter` para mantener una sola fuente de verdad.
- No: No lo uses para rangos arbitrarios: usa DateRangePicker.
- No: No dejes `minYear`/`maxYear` en sus valores por defecto (1900–2100) en pantallas de producto.

Relacionados: month-picker, period-selector, date-utils, popover

## Ejemplos

### Controlado

```tsx
const [value, setValue] = React.useState<{ year: number; quarter: 1 | 2 | 3 | 4 }>()

<QuarterSelector value={value} onChange={setValue} label="Trimestre fiscal" placeholder="Elige un trimestre" />
```

### Trimestre en curso por defecto

`getQuarterFromDate` calcula el trimestre de cualquier fecha; aquí inicializa el valor.

```tsx
const now = new Date()
const [value, setValue] = React.useState({ year: now.getFullYear(), quarter: getQuarterFromDate(now) })

<QuarterSelector
  value={value}
  onChange={setValue}
  label="Trimestre en curso"
  minYear={now.getFullYear() - 3}
  maxYear={now.getFullYear()}
/>
```

### Error y deshabilitado

```tsx
<QuarterSelector label="Con error" error="Selecciona un trimestre." />
<QuarterSelector label="Deshabilitado" disabled />
```
