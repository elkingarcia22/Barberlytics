# PeriodSelector

Select de periodos predefinidos (hoy, últimos 7 días, este mes…) con etiqueta, ayuda y error. Acepta opciones propias con descripción secundaria para ciclos o cohortes de negocio.

Familia: Fechas y rangos · Doc: `/docs#/components/period-selector` · Fuente: `src/components/date/PeriodSelector.tsx`

```ts
import { PeriodSelector } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `string` |  | `value` de la opción seleccionada. |
| `onChange` | `(value: string) => void` |  | Se dispara al elegir una opción. |
| `options` | `PeriodSelectorOption[]` | `9 periodos en inglés` | Lista de `{ label, value, description? }`. |
| `label` | `string` |  | Etiqueta visible. |
| `description` | `string` |  | Ayuda bajo el campo; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `placeholder` | `string` | `"Select period"` | Texto del trigger sin valor. |
| `disabled` | `boolean` | `false` | Desactiva el select. |
| `className` | `string` |  | Clases extra para el contenedor y el trigger. |

## Guías

- Sí: Ofrece siempre una opción `custom` que abra un DateRangePicker.
- Sí: Resuelve el `value` a fechas reales en un solo lugar (un helper) para que todos los informes coincidan.
- No: No mezcles periodos relativos (últimos 7 días) con fechas fijas en la misma lista sin separarlos visualmente.
- No: No dejes las opciones por defecto en inglés en interfaces en español.

Relacionados: select, date-range-picker, date-filter-bar, quarter-selector

## Ejemplos

### Periodos habituales

Las opciones por defecto vienen en inglés; en producto pásalas traducidas con `options`.

```tsx
const PERIODOS: PeriodSelectorOption[] = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "last_7_days" },
  { label: "Últimos 30 días", value: "last_30_days" },
  { label: "Este mes", value: "this_month" },
  { label: "Rango personalizado", value: "custom" },
]
const [value, setValue] = React.useState<string>("last_30_days")

<PeriodSelector value={value} onChange={setValue} options={PERIODOS} label="Periodo" />
```

### Opciones con descripción

```tsx
const CICLOS: PeriodSelectorOption[] = [
  { label: "Ciclo 2026-H1", value: "2026-h1", description: "Enero – junio" },
  { label: "Ciclo 2026-H2", value: "2026-h2", description: "Julio – diciembre" },
  { label: "Ciclo 2025-H2", value: "2025-h2", description: "Cerrado" },
]

<PeriodSelector value={value} onChange={setValue} options={CICLOS} label="Ciclo de evaluación" />
```

### Error y deshabilitado

```tsx
<PeriodSelector options={PERIODOS} label="Con error" error="Selecciona un periodo." />
<PeriodSelector options={PERIODOS} label="Deshabilitado" value="this_month" disabled />
```
