# ResourceDayGrid (beta)

El día de una barbería: una columna por barbero, las horas hacia abajo y cada cita como tarjeta en la columna de quien la atiende. Sombrea las horas en que alguien no trabaja, dibuja la línea de «ahora», ofrece cada hueco libre como botón para agendar y deja mover y estirar las tarjetas arrastrándolas. Es su propia región de scroll, así la fila de barberos y la columna de horas se quedan fijas.

Familia: Agenda · Doc: `/docs#/components/resource-day-grid` · Fuente: `src/components/scheduling/ResourceDayGrid.tsx`

```ts
import { ResourceDayGrid } from "@/components/scheduling"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `date` | `Date` |  | El día que se muestra. |
| `resources` | `ScheduleResource[]` |  | Una columna por elemento: id, nombre, avatar, subtítulo y sus franjas de trabajo («HH:mm»). |
| `events` | `ScheduleEvent[]` |  | Citas y bloqueos con `resourceId`, `start`, `end`, título, tono, badge, acción y aviso. `kind: "block"` tacha la franja; `locked` impide arrastrar. |
| `startHour / endHour` | `number` | `6 / 24` | Primera y última hora visibles (la última exclusiva). |
| `slotMinutes` | `number` | `30` | Minutos por franja; también el paso al arrastrar. |
| `now` | `Date` |  | El «ahora» de la línea roja. Sin él, el reloj real. |
| `onSlotClick` | `(slot: { resourceId; start; isWorking }) => void` |  | Clic en un hueco libre: dónde y a qué hora, y si el recurso trabaja ahí. |
| `onEventClick` | `(event: ScheduleEvent) => void` |  | Abrir una tarjeta. Sin él las tarjetas no son botones. |
| `onEventMove` | `(event, drop: { resourceId; start; end }) => void` |  | Se soltó la tarjeta en otra hora o columna. Sin él no se arrastra. |
| `onEventResize` | `(event, drop) => void` |  | Se estiró la tarjeta desde abajo. Sin él no hay tirador. |
| `resourceActions` | `(resource) => ScheduleResourceAction[]` |  | El menú al tocar el nombre de un recurso (ver perfil, bloquear…). |
| `height` | `string` | `"max(28rem, calc(100dvh - 17rem))"` | Alto de la región con scroll. |

## Guías

- Sí: Pasa `now` fijo en pruebas y en la doc; en producto déjalo vacío para que la línea siga al reloj.
- Sí: Traduce tus citas a `ScheduleEvent` en un módulo aparte: la rejilla no sabe de clientes ni de precios.
- Sí: Con `onSlotClick` abre el formulario con el barbero y la hora ya puestos: es la forma más rápida de agendar.
- Sí: Acepta el `drop` de `onEventMove` en el servidor y revierte si dice que no; la rejilla solo avisa.
- No: No pintes la agenda de varios días aquí: es la rejilla de un día. Para la semana está `EventCalendar`.
- No: No metas más de una acción en cada tarjeta; el siguiente paso es uno.
- No: No ocultes recursos sin horario en silencio: enséñalos sombreados o explica por qué no están.

Relacionados: month-occupancy-grid, time-slot-picker, event-calendar, drawer-shell

## Ejemplos

### El día por barbero

Cada recurso trae sus franjas de trabajo; fuera de ellas la columna se sombrea. Tomás no tiene horario y su columna lo dice. Las citas cuentan el cliente, el servicio y el siguiente paso; el bloqueo del almuerzo va tachado y no se toca.

```tsx
<ResourceDayGrid
  date={hoy}
  resources={[
    { id: "andres", name: "Andrés Beltrán", workingHours: [{ start: "09:00", end: "19:00" }] },
    { id: "tomas", name: "Tomás Peña", workingHours: [] },
  ]}
  events={[
    { id: "e1", resourceId: "andres", start, end, title: "Laura Gómez", subtitle: "Corte clásico · US$ 35", badge: { label: "VIP", tone: "warning" }, action: { label: "Ingresar", onClick } },
    { id: "b1", resourceId: "andres", start, end, title: "Almuerzo", kind: "block", locked: true },
  ]}
  startHour={8}
  endHour={20}
/>
```

### Mover y estirar

Con `onEventMove` la tarjeta se arrastra a otra hora o a otra columna (la sombra punteada enseña dónde caerá) y con `onEventResize` se estira desde el tirador de abajo. La rejilla no guarda nada: avisa y quien la monta decide. Solo con ratón o lápiz; con el dedo la agenda se desplaza.

```tsx
<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={citas}
  onEventMove={(cita, { resourceId, start, end }) => moverCita(cita.id, resourceId, start)}
  onEventResize={(cita, { end }) => cambiarDuracion(cita.id, end)}
/>
```

### Sin horario

Un recurso sin franjas ese día se pinta entero sombreado con el aviso. La pantalla decide si en vez de la rejilla muestra «Nadie trabaja este día».

```tsx
<ResourceDayGrid date={hoy} resources={[{ id: "tomas", name: "Tomás Peña", workingHours: [] }]} events={[]} />
```
