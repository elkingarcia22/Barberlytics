# TimeSlotGroups

Las horas libres de un día repartidas por franja —mañana, tarde, noche—, cada una una pastilla que se toca para elegirla. La elegida se queda a la vista con su check y cada hora puede llevar algo a la derecha, como las caras de los barberos que pueden atender. Quien llama arma las franjas; el componente solo las pinta.

Familia: Agenda · Doc: `/docs#/components/time-slot-groups` · Fuente: `src/components/scheduling/TimeSlotGroups.tsx`

```ts
import { TimeSlotGroups } from "@/components/scheduling"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `groups` | `TimeSlotGroup[]` |  | Las franjas: `id`, `label` y sus `options`. |
| `groups[].options` | `TimeSlotOption[]` |  | Cada hora: `time` (lo que vuelve), `label` (lo que se lee), `selected`, `disabled`, `ariaLabel` y `trailing`. |
| `onPick` | `(time: string) => void` |  | Se llama con el `time` de la hora tocada. |
| `size` | `"default" \| "lg"` | `"default"` | `lg` para el dedo (tablet, kiosco). |

## Guías

- Sí: Pásale solo las franjas que tienen horas: una franja vacía no se dibuja.
- Sí: Usa `ariaLabel` cuando la hora necesita contexto («9:00 a. m. con Emilio»).
- No: No lo uses para elegir fecha: para eso, DayStrip.
- No: No pongas texto largo en `trailing`: es para caras o iconos.

Relacionados: day-strip, time-slot-picker

## Ejemplos

### Solo horas

Sin `trailing`, la pastilla es solo la hora.

```tsx
<TimeSlotGroups groups={groups} onPick={setPicked} />
```
