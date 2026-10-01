# DateRangePicker

Selector de rango en un solo campo: abre un calendario de dos meses y cierra al completar inicio y fin. Ideal para filtros de informes donde el rango se lee de un vistazo.

Familia: Fechas y rangos · Doc: `/docs#/components/date-range-picker` · Fuente: `src/components/date/DateRangePicker.tsx`

```ts
import { DateRangePicker } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `{ from?: Date; to?: Date } \| null` |  | Rango seleccionado; cualquiera de los extremos puede faltar mientras se elige. |
| `onChange` | `(range: { from?: Date; to?: Date } \| undefined) => void` |  | Se dispara en cada clic sobre el calendario. |
| `placeholder` | `string` | `"Select a date range"` | Texto del campo sin valor. |
| `label` | `string` |  | Etiqueta visible enlazada al botón. |
| `description` | `string` |  | Texto de ayuda bajo el campo. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `minDate` | `Date` |  | Primer día seleccionable (inclusive). |
| `maxDate` | `Date` |  | Último día seleccionable (inclusive). |
| `disabled` | `boolean` | `false` | Desactiva el campo. |
| `locale` | `string` | `"en-US"` | Código Intl para formatear `from - to` en el campo. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Úsalo en filtros donde el rango cabe en un solo campo compacto.
- Sí: Combínalo con PeriodSelector para ofrecer atajos (últimos 7 días, mes actual).
- Sí: Muestra el rango resultante en la cabecera del informe con `formatDateRange`.
- No: No lo uses en formularios de creación donde inicio y fin necesitan validación propia: usa DualDateRangePicker.
- No: No cambies `value` desde fuera mientras el usuario está eligiendo el segundo extremo.

Relacionados: date-picker, dual-date-range-picker, date-filter-bar, calendar, date-utils

## Ejemplos

### Controlado

El primer clic fija `from`, el segundo fija `to` y cierra el popover.

```tsx
const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateRangePicker
  value={range}
  onChange={setRange}
  label="Periodo del informe"
  placeholder="Elige un rango"
  locale="es-ES"
/>
```

### Con valor inicial

Un rango precargado (aquí, el mes en curso) se muestra formateado y marcado en el calendario.

```tsx
const today = startOfToday()
const [range, setRange] = React.useState({ from: startOfMonth(today), to: endOfMonth(today) })

<DateRangePicker value={range} onChange={setRange} label="Mes en curso" locale="es-ES" />
```

### Con límites

`minDate` y `maxDate` deshabilitan los días fuera de ventana.

```tsx
<DateRangePicker
  value={range}
  onChange={setRange}
  label="Últimos 90 días"
  minDate={subDays(today, 90)}
  maxDate={today}
  locale="es-ES"
/>
```

### Error y deshabilitado

```tsx
<DateRangePicker label="Con error" error="Selecciona un rango válido." locale="es-ES" />
<DateRangePicker label="Deshabilitado" disabled locale="es-ES" />
```
