# TimeSlotPicker (beta)

Elegir cuándo: una tira de días para la fecha y, debajo, las horas repartidas en mañana, tarde y noche como chips. Es el «Fecha & Hora» de crear una cita: se ven el día y la hora de una vez, sin abrir un calendario y luego un reloj. Las horas que no sirven se apagan con `isSlotDisabled`.

Familia: Agenda · Doc: `/docs#/components/time-slot-picker` · Fuente: `src/components/scheduling/TimeSlotPicker.tsx`

```ts
import { TimeSlotPicker } from "@/components/scheduling"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `Date \| null` |  | La fecha y hora elegidas. |
| `onChange` | `(date: Date) => void` |  | Se llama al tocar una hora; el día es el marcado en la tira. |
| `startDate` | `Date` | `hoy` | Primer día de la tira. |
| `daysCount` | `number` | `28` | Cuántos días se pueden recorrer hacia delante. |
| `startHour / endHour` | `number` | `8 / 24` | Primera y última hora ofrecidas (la última exclusiva). |
| `slotMinutes` | `number` | `30` | Minutos entre una hora y la siguiente. |
| `isSlotDisabled` | `(date: Date) => boolean` |  | Qué horas se apagan (fuera de horario, ocupadas, pasadas). |
| `locale` | `Locale` |  | Locale de date-fns; sin él, el idioma de la aplicación. |

## Guías

- Sí: Apaga las horas pasadas de hoy y las que caen fuera del horario de quien atiende.
- Sí: Envuélvelo en un `Field` con `error` cuando el formulario exija la fecha.
- Sí: Deja que el paso siga al catálogo: si los servicios se agendan cada 15 minutos, `slotMinutes={15}`.
- No: No lo uses para rangos ni para fechas sin hora: para eso están `DateRangePicker` y `DatePicker`.
- No: No ofrezcas 24 horas si la barbería abre 12: la tira de chips se hace larga sin motivo.

Relacionados: resource-day-grid, date-picker, segmented-control, field

## Ejemplos

### Día y hora de una vez

La tira arranca en `startDate` y avanza por semanas. Las horas van de media en media hora y se agrupan en mañana, tarde y noche.

```tsx
const [value, setValue] = React.useState<Date | null>(null);

<TimeSlotPicker value={value} onChange={setValue} startHour={8} endHour={22} />
```

### Solo lo disponible

`isSlotDisabled` apaga lo que no sirve: fuera del horario del barbero y las horas ya ocupadas. El selector no sabe por qué, solo lo pinta tachado.

```tsx
<TimeSlotPicker
  value={value}
  onChange={setValue}
  isSlotDisabled={(fecha) => !isWorkingAt(horario, minutesOfDay(fecha)) || ocupadas.includes(fecha.getTime())}
/>
```
