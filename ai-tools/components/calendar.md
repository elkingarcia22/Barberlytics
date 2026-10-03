# Calendar

Cuadrícula de fechas construida sobre react-day-picker con los tokens del sistema. Úsalo dentro de un Popover para los pickers o en línea cuando la fecha es el foco de la pantalla; pasa `locale={es}` para nombres en español.

Familia: Primitivos · Doc: `/docs#/components/calendar` · Fuente: `src/components/ui/calendar.tsx`

```ts
import { Calendar } from "@/components/ui/calendar"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `mode` | `"single" \| "multiple" \| "range"` |  | Tipo de selección. Determina la forma de `selected` y `onSelect`. |
| `selected / onSelect` | `Date \| Date[] \| DateRange` |  | Valor seleccionado y su callback, según el modo. |
| `locale` | `Locale` |  | Locale de date-fns (`es`) para nombres de meses y días. |
| `captionLayout` | `"label" \| "dropdown" \| "dropdown-months" \| "dropdown-years"` | `"label"` | Encabezado como texto o con selectores de mes/año. |
| `numberOfMonths` | `number` | `1` | Meses visibles a la vez. |
| `showOutsideDays` | `boolean` | `true` | Muestra atenuados los días de los meses vecinos. |
| `showWeekNumber` | `boolean` | `false` | Añade una columna con el número de semana. |
| `disabled` | `Matcher \| Matcher[]` |  | Fechas no seleccionables: rangos, días de la semana, funciones… |
| `buttonVariant` | `ButtonProps["variant"]` | `"ghost"` | Variante de los botones de navegación de mes. |
| `...props` | `DayPickerProps` |  | Cualquier otra prop de react-day-picker (defaultMonth, fromDate, toDate, etc.). |

## Guías

- Sí: Pasa siempre `locale={es}` en interfaces en español.
- Sí: Deshabilita explícitamente las fechas no válidas en lugar de validar después.
- Sí: Usa dos meses cuando el usuario elige rangos de más de una semana.
- No: No lo muestres en línea en formularios densos; envuélvelo en un Popover.
- No: No cambies `--cell-size` por componente; ajústalo con `className` solo si es imprescindible.
- No: No uses `dropdown` sin acotar el rango de años con `fromYear`/`toYear`.

Relacionados: popover, date-picker, date-range-picker

## Ejemplos

### Selección simple

Un solo día; el estado vive en el padre y se formatea con date-fns.

```tsx
import { format } from "date-fns";
import { es } from "date-fns/locale";

const [date, setDate] = React.useState<Date | undefined>(new Date());

<Calendar mode="single" locale={es} selected={date} onSelect={setDate} />
<p>{date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : "Sin fecha"}</p>
```

### Rango con dos meses

`mode="range"` devuelve `{ from, to }`; con `numberOfMonths={2}` el usuario ve el rango completo.

```tsx
import type { DateRange } from "react-day-picker";

const [range, setRange] = React.useState<DateRange | undefined>({ from: today, to: addDays(today, 6) });

<Calendar mode="range" locale={es} selected={range} onSelect={setRange} numberOfMonths={2} />
```

### Navegación por desplegables

`captionLayout="dropdown"` sustituye la etiqueta por selectores de mes y año; útil para fechas lejanas como cumpleaños.

```tsx
<Calendar mode="single" locale={es} captionLayout="dropdown" selected={date} onSelect={setDate} />
```

### Días deshabilitados

Los matchers de react-day-picker bloquean fechas pasadas y fines de semana.

```tsx
<Calendar
  mode="single"
  locale={es}
  selected={date}
  onSelect={setDate}
  disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
/>
```
