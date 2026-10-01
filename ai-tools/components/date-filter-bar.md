# DateFilterBar

Barra horizontal que compone PeriodSelector, DatePicker y DateRangePicker detrás de un select de modo. Todo el estado es controlado por el padre, que decide qué hacer con periodo, fecha o rango.

Familia: Fechas y rangos · Doc: `/docs#/components/date-filter-bar` · Fuente: `src/components/date/DateFilterBar.tsx`

```ts
import { DateFilterBar } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `mode` | `"period" \| "date" \| "range"` | `"period"` | Modo activo; decide qué control se muestra. |
| `onModeChange` | `(mode: DateFilterMode) => void` |  | Se dispara al cambiar el select de modo. |
| `period` | `string` |  | Valor del PeriodSelector (modo `period`). |
| `onPeriodChange` | `(value: string) => void` |  | Cambio de periodo. |
| `date` | `Date` |  | Fecha del DatePicker (modo `date`). |
| `onDateChange` | `(date?: Date) => void` |  | Cambio de fecha. |
| `range` | `{ from?: Date; to?: Date }` |  | Rango del DateRangePicker (modo `range`). |
| `onRangeChange` | `(range?: { from?: Date; to?: Date }) => void` |  | Cambio de rango. |
| `disabled` | `boolean` | `false` | Desactiva toda la barra. |
| `className` | `string` |  | Clases extra para el contenedor flex. |

## Guías

- Sí: Úsala como cabecera de filtros en dashboards e informes.
- Sí: Conserva los tres valores en el padre para que cambiar de modo no pierda lo elegido.
- No: No la uses en formularios: sus etiquetas fijas y su disposición horizontal son de filtro.
- No: No la coloques en contenedores estrechos (<420px): los controles se apilan y pierden la lectura horizontal.

Relacionados: period-selector, date-picker, date-range-picker, select, date-utils

## Ejemplos

### Totalmente controlada

Cambia el modo y verás cómo el padre conserva cada valor por separado.

```tsx
const [mode, setMode] = React.useState<DateFilterMode>("period")
const [period, setPeriod] = React.useState<string>("last_30_days")
const [date, setDate] = React.useState<Date>()
const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateFilterBar
  mode={mode}
  onModeChange={setMode}
  period={period}
  onPeriodChange={setPeriod}
  date={date}
  onDateChange={setDate}
  range={range}
  onRangeChange={setRange}
/>
```

### Arrancando en modo rango

El modo inicial lo fija el padre; aquí se resume el rango con `formatDateRange`.

```tsx
const [mode, setMode] = React.useState<DateFilterMode>("range")

<DateFilterBar mode={mode} onModeChange={setMode} range={range} onRangeChange={setRange} /* ... */ />
<p>{formatDateRange(range?.from, range?.to, "es-ES")}</p>
```

### Deshabilitada

`disabled` bloquea el selector de modo y el control activo a la vez.

```tsx
<DateFilterBar mode="date" date={new Date(2026, 8, 9)} disabled />
```
