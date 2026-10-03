# EventCalendar (beta)

La agenda del producto en una rejilla: sesiones de formación, entrevistas de una vacante y fechas de cierre de encuestas, en vista de mes, semana o día. Los pickers eligen una fecha; este componente muestra qué pasa en ella.

Familia: Fechas y rangos · Doc: `/docs#/components/event-calendar` · Fuente: `src/components/date/EventCalendar.tsx`

```ts
import { EventCalendar } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `events` | `readonly CalendarEvent[]` |  | Los eventos a pintar: `id`, `title`, `start`, y opcionalmente `end`, `allDay`, `tone`, `location` y `meta`. |
| `view` | `"month" \| "week" \| "day"` |  | Vista controlada. Sin ella el componente lleva su propio estado. |
| `defaultView` | `"month" \| "week" \| "day"` | `"month"` | Vista inicial cuando el componente no está controlado. |
| `onViewChange` | `(view: CalendarView) => void` |  | Se dispara al usar el conmutador de la cabecera. |
| `date` | `Date` |  | Día o mes visible, controlado. |
| `defaultDate` | `Date` | `hoy` | Periodo inicial cuando el componente no está controlado. |
| `onDateChange` | `(date: Date) => void` |  | Se dispara con anterior, siguiente, «Hoy» y al navegar con el teclado fuera del mes. |
| `onEventClick` | `(event: CalendarEvent) => void` |  | Clic en un chip o bloque de evento. |
| `onSlotClick` | `(date: Date) => void` |  | Clic en un hueco libre: el día en la vista de mes, el día y la hora en semana y día. |
| `dayStart` | `number` | `7` | Primera hora visible en semana y día. |
| `dayEnd` | `number` | `20` | Última hora visible en semana y día. |
| `locale` | `Locale` | `es` | Locale de date-fns para los nombres de mes y día. |
| `now` | `Date` | `new Date()` | El «ahora» de la línea roja. Fíjalo en pruebas y documentación para que el resultado no cambie cada día. |
| `className` | `string` |  | Clases del contenedor externo (ancho, márgenes). |

## Guías

- Sí: Usa el tono para decir qué es cada cosa: `primary` para sesiones, `positive` para lo confirmado, `warning` y `negative` para cierres que se acercan o vencen.
- Sí: Pasa `onSlotClick` cuando el usuario pueda crear algo: el hueco vacío es el sitio natural para empezar.
- Sí: Recorta la franja con `dayStart` y `dayEnd` a la jornada real; catorce horas vacías no informan de nada.
- Sí: Fija `now` y las fechas de ejemplo en pruebas y documentación para que el resultado no dependa del día.
- No: No metas más de una línea de texto en `title`: el chip trunca y la etiqueta accesible ya lleva la hora completa.
- No: No uses la vista de mes para agendas con decenas de eventos diarios; ahí la semana o el día leen mejor.
- No: No dependas solo del color para distinguir tipos de evento: el título tiene que decirlo también.
- No: No pases `end` anterior a `start`; el bloque se asume de una hora y la duración queda mal.

Relacionados: date-picker, date-range-picker, period-selector, empty-state

## Ejemplos

### Agenda de formación del mes

La vista por defecto. Hasta tres eventos por día; el cuarto y los siguientes se recogen en «+N más», que abre la lista completa del día en un popover.

```tsx
const [view, setView] = React.useState<CalendarView>("month");
const [date, setDate] = React.useState(new Date(2026, 8, 15));

<EventCalendar
  events={sesiones}
  view={view}
  onViewChange={setView}
  date={date}
  onDateChange={setDate}
/>
```

### Semana de entrevistas de una vacante

Con `dayStart` y `dayEnd` la franja se recorta a la jornada real. Dos entrevistas a la misma hora se reparten el ancho de la columna, y la línea roja marca «ahora» si hoy cae dentro de la semana.

```tsx
<EventCalendar
  events={entrevistas}
  defaultView="week"
  defaultDate={new Date(2026, 8, 15)}
  dayStart={8}
  dayEnd={18}
/>
```

### Día con franjas ocupadas

La misma franja horaria a una sola columna: al haber sitio, cada bloque suma ubicación y contexto. Los eventos de todo el día suben a la tira superior en vez de ocupar una hora falsa.

```tsx
<EventCalendar
  events={jornada}
  defaultView="day"
  defaultDate={new Date(2026, 8, 15)}
  dayStart={8}
  dayEnd={19}
/>
```

### Periodo sin nada agendado

Cuando el periodo visible no tiene eventos, el calendario cede el sitio al `EmptyState` del sistema y deja la cabecera para cambiar de mes o de vista.

```tsx
<EventCalendar events={[]} defaultDate={new Date(2026, 8, 15)} />
```
