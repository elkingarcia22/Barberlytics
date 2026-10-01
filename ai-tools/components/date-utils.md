# Utilidades de fecha

Funciones puras sobre Date nativo e Intl.DateTimeFormat que usan todos los pickers: formateo por locale, rangos, comparación sin hora y límites de día. No dependen de ninguna librería externa.

Familia: Fechas y rangos · Doc: `/docs#/components/date-utils` · Fuente: `src/components/date/dateUtils.ts`

```ts
import { formatDate, formatDateRange, isDateInRange } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `isValidDate` | `(value: unknown) => value is Date` |  | Type guard: `Date` real cuyo tiempo no es NaN. |
| `formatDate` | `(date?: Date \| null, locale?: string) => string` | `locale "en-US"` | Fecha numérica corta según el locale; cadena vacía si no hay fecha. |
| `formatDateRange` | `(from?: Date \| null, to?: Date \| null, locale?: string) => string` | `locale "en-US"` | `from - to`; si falta un extremo devuelve solo el otro. |
| `isDateInRange` | `(date: Date, min?: Date, max?: Date) => boolean` |  | Comprueba límites inclusivos; los límites inválidos se ignoran. |
| `compareDates` | `(a: Date, b: Date) => -1 \| 0 \| 1` |  | Compara solo año, mes y día. |
| `startOfDay` | `(date: Date) => Date` |  | Copia a las 00:00:00.000. |
| `endOfDay` | `(date: Date) => Date` |  | Copia a las 23:59:59.999. |
| `formatMonthYear` | `(year: number, month: number, locale?: string) => string` | `locale "en-US"` | Mes largo y año; `month` es base cero. |
| `formatQuarter` | `(year: number, quarter: 1 \| 2 \| 3 \| 4, locale?: string) => string` |  | Devuelve `Q<n> <año>`; el locale se reserva para futuro. |
| `getQuarterFromDate` | `(date: Date) => 1 \| 2 \| 3 \| 4` |  | Trimestre natural de la fecha. |

## Guías

- Sí: Formatea siempre con estas funciones para que pickers y tablas coincidan.
- Sí: Pasa el mismo `locale` que usas en los pickers.
- Sí: Usa `startOfDay`/`endOfDay` al construir filtros de rango para incluir el día completo.
- No: No compares fechas con `===`; usa `compareDates`.
- No: No reimplementes el formateo con `toLocaleDateString` suelto por la app.

Relacionados: date-picker, date-range-picker, month-picker, quarter-selector

## Ejemplos

### Formateo por locale

`formatDate` devuelve día, mes y año numéricos en el orden del locale; con valores vacíos devuelve cadena vacía.

```tsx
formatDate(date, "es-ES")                 // "09/09/2026"
formatDate(date, "en-US")                 // "09/09/2026" (MM/DD/YYYY)
formatDate(date, "de-DE")                 // "09.09.2026"
formatDateRange(from, to, "es-ES")        // "09/09/2026 - 23/09/2026"
formatDateRange(from, undefined)          // solo el inicio
formatDate(undefined)                     // ""
```

### Meses y trimestres

Las mismas funciones que muestran el valor en MonthPicker y QuarterSelector.

```tsx
formatMonthYear(2026, 8, "es-ES")   // "septiembre de 2026" (mes base cero)
formatMonthYear(2026, 0)            // "January 2026"
getQuarterFromDate(new Date())      // 1 | 2 | 3 | 4
formatQuarter(2026, 3)              // "Q3 2026"
```

### Validación, rango y límites de día

`compareDates` ignora la hora; `startOfDay`/`endOfDay` devuelven copias nuevas sin mutar la entrada.

```tsx
isValidDate(date)                       // true si es Date y no es NaN
isDateInRange(date, min, max)           // ambos límites inclusivos y opcionales
compareDates(a, b)                      // -1 | 0 | 1, solo por fecha
startOfDay(date)                        // 00:00:00.000 local
endOfDay(date)                          // 23:59:59.999 local
```
