# MonthOccupancyGrid (beta)

El mes de un barbero (o del equipo) día por día: cuánta de la jornada está reservada, en porcentaje y en barra, y cuántas citas hay. Un día sin jornada se atenúa y lo dice; a partir del 80 % el porcentaje avisa en naranja. Cada día es un botón para abrir esa fecha en la rejilla.

Familia: Agenda · Doc: `/docs#/components/month-occupancy-grid` · Fuente: `src/components/scheduling/MonthOccupancyGrid.tsx`

```ts
import { MonthOccupancyGrid } from "@/components/scheduling"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `month` | `Date` |  | Cualquier día del mes a mostrar. |
| `days` | `{ date: Date; occupancy: number \| null; count: number; marker?: ReactNode }[]` |  | Un elemento por día: `occupancy` de 0 a 1, o `null` si no trabaja; `count` de citas; `marker`, una marca pequeña en la esquina (en la agenda, «día pesado» o «día suave» con su tooltip). |
| `selected` | `Date \| null` |  | El día marcado. |
| `onSelectDay` | `(date: Date) => void` |  | Se llama al tocar un día del mes. |
| `today` | `Date` |  | Qué día lleva el círculo de «hoy». Inyectable para la doc y las pruebas. |
| `locale` | `Locale` |  | Locale de date-fns; sin él, el idioma de la aplicación. |

## Guías

- Sí: Calcula la ocupación como minutos reservados sobre minutos de jornada, no sobre 24 horas.
- Sí: Al tocar un día, cambia a la vista Día en esa fecha: es lo que quien mira espera.
- Sí: Manda `occupancy: null` para los días sin jornada; un 0 % se lee como «libre», no como «no trabaja».
- No: No lo uses como selector de fecha: para eso están `DatePicker` y `Calendar`.
- No: No pintes aquí las citas una a una; para eso está la vista de mes de `EventCalendar`.

Relacionados: resource-day-grid, event-calendar, progress, kpi-card

## Ejemplos

### Septiembre de un barbero

Descansa los domingos y estuvo de vacaciones del 7 al 11: esos días no tienen jornada. Los sábados van más llenos y el porcentaje lo avisa.

```tsx
const [selected, setSelected] = React.useState<Date | null>(hoy);

<MonthOccupancyGrid month={hoy} days={dias} selected={selected} onSelectDay={setSelected} />
```
