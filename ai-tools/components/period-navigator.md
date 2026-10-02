# PeriodNavigator

La barra de tiempo de un tablero: el grano (día, semana, mes), el periodo que se está mirando y las flechas para moverlo. Cambiar de grano conserva la fecha ancla, el rótulo sale de Intl con el idioma que se le pase y el salto adelante se frena en hoy. Trae en periodRange las utilidades que calculan el rango y el periodo anterior, para que la consulta y la barra digan lo mismo.

Familia: Fechas y rangos · Doc: `/docs#/components/period-navigator` · Fuente: `src/components/date/PeriodNavigator.tsx`

```ts
import { PeriodNavigator, periodRange, previousPeriodRange } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `granularity` | `"day" \| "week" \| "month"` |  | El grano del periodo. Es controlado. |
| `onGranularityChange` | `(granularity) => void` |  | Al cambiar de grano. La fecha ancla se conserva. |
| `date` | `Date` |  | La fecha ancla: cualquier día dentro del periodo que se mira. |
| `onDateChange` | `(date: Date) => void` |  | Al pulsar una flecha o «ir a hoy». Devuelve un nuevo `Date`, nunca muta el que recibió. |
| `labels` | `PeriodNavigatorLabels` |  | Los rótulos traducidos: los tres granos, «ir a hoy», anterior, siguiente y el aria del grupo. |
| `locale` | `string` | `"es-CO"` | Con qué idioma escribe el periodo. |
| `clampToToday` | `boolean` | `true` | Desactiva la flecha de avance cuando el periodo ya incluye hoy. |

## Guías

- Sí: Guarda el grano y la fecha ancla en la URL (`?period=week&date=2026-09-28`) y deriva el rango con `periodRange`.
- Sí: Pasa el idioma activo (`useLocale().current.intl`), no uno escrito a mano.
- Sí: Mantén la consulta y la comparación sobre `periodRange` y `previousPeriodRange`: si divergen, la píldora de variación miente.
- No: No lo uses para elegir un rango libre; para eso está `DateRangePicker`.
- No: No dejes avanzar al futuro en un tablero de lo que ya pasó: enseñaría un periodo vacío como si fuera un dato.

Relacionados: date-filter-bar, period-selector, date-range-picker, segmented-control

## Ejemplos

### De la barra a la consulta

`periodRange(date, granularity)` devuelve el rango que la barra está enseñando y `previousPeriodRange` el de comparar. La pantalla guarda solo la fecha ancla y el grano (en la URL) y deriva el resto: así el backend, la píldora de variación y el rótulo hablan del mismo periodo.

```tsx
const { from, to } = periodRange(date, granularity);
const previous = previousPeriodRange(date, granularity);
// GET /metrics/business?granularity=week&date=2026-09-28

<PeriodNavigator granularity={granularity} onGranularityChange={setGranularity} date={date} onDateChange={setDate} labels={labels} />
```

### Los rótulos que escribe

Un día, una semana y un mes con el mismo ancla, en español y en inglés. La primera letra va en mayúscula; el resto respeta la convención del idioma.

```tsx
formatPeriodLabel(date, "day", "es-CO")   // "Lunes, 28 de septiembre"
formatPeriodLabel(date, "week", "es-CO")  // "28 sept – 4 oct 2026"
formatPeriodLabel(date, "month", "en-US") // "September 2026"
```
