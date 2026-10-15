# DayStrip

La tira de días de la reserva: el día de la semana arriba y el número grande, en fila y deslizable con el dedo, arrastrando con el ratón o con la rueda. Elegir uno cambia lo de debajo —las horas libres de ese día—. El de hoy se llama «Hoy» y un punto señala los días con algo ya apartado.

Familia: Agenda · Doc: `/docs#/components/day-strip` · Fuente: `src/components/scheduling/DayStrip.tsx`

```ts
import { DayStrip } from "@/components/scheduling"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `first` | `Date` |  | El primer día que se ofrece (hoy, o mañana si hoy ya cerró). |
| `count` | `number` |  | Cuántos días hacia delante. |
| `value` | `Date` |  | El día elegido. |
| `onChange` | `(day: Date) => void` |  | Se llama con el día tocado. |
| `marked` | `ReadonlySet<string>` |  | Fechas AAAA-MM-DD que llevan un punto. |
| `size` | `"default" \| "lg"` | `"default"` | `lg` para el dedo (tablet, kiosco). |
| `ariaLabel` | `string` |  | El nombre del grupo para el lector de pantalla; por defecto «Elige el día». |

## Guías

- Sí: Pon debajo lo que depende del día (las horas libres) y recárgalo al cambiar.
- Sí: Dale a `first` el primer día reservable: si hoy ya cerró, mañana.
- No: No lo uses para meses ni rangos: para eso están DatePicker y Calendar.
- No: No lo metas dentro de otra tira con scroll horizontal.

Relacionados: time-slot-groups, time-slot-picker, date-picker

## Ejemplos

### Con días marcados

`marked` lleva las fechas (AAAA-MM-DD) que ya tienen una cita en el carrito: un punto bajo el número.

```tsx
<DayStrip first={firstBookableDay} count={21} value={day} onChange={setDay} marked={daysWithAppointments} />
```
