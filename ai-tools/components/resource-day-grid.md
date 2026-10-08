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
| `resources` | `ScheduleResource[]` |  | Una columna por elemento: id, nombre, avatar, subtítulo y sus franjas de trabajo («HH:mm»). `progress` (0 a 1) pinta una barra de ocupación bajo el nombre; `alert` ({ label, tone?, onClick? }) un chip de aviso debajo. |
| `events` | `ScheduleEvent[]` |  | Citas y bloqueos con `resourceId`, `start`, `end`, título, tono, badge, acción y aviso. `tone` es el color de la tarjeta y `status` ({ label, tone }) la píldora que dice en qué va. `kind: "block"` tacha la franja; `locked` impide arrastrar; `flexible` pone el borde discontinuo; `markers` ({ id, icon, label }[]) son iconos de detalle que salen junto al nombre desde dos líneas de alto; `hideTime` quita la línea de la hora; `ghost` dibuja una propuesta translúcida con su `note` y tocarla llama a `onEventClick`; `group` ({ id, index, size, color, highlight, joinTop, joinBottom }) marca las citas enlazadas con un icono de su color y, resaltadas, un borde discontinuo de ese color; `segments` ({ id, label, minutes }[]) parte por dentro una sola cita de varios servicios y `meta` pone su total en la fila de abajo. `urgent` («12 min tarde») sale como pastilla roja —un punto en las tarjetas cortas— y `faded` apaga la tarjeta cuando queda fuera de un filtro. `fill` decide el relleno: `neutral` (sobrio, el `color` solo en el punto), `category` (el pastel de `color`) o `tone` (el pastel de `tone`); los pasteles mezclan el color con la card del tema según `--schedule-pastel-strength` y `--schedule-chroma`, que da cada tema. |
| `startHour / endHour` | `number` | `6 / 24` | Primera y última hora visibles (la última exclusiva). |
| `slotMinutes` | `number` | `30` | Minutos por franja; también el paso al arrastrar. |
| `slotHeight` | `number` | `56` | Alto de cada franja en píxeles: la densidad. `SCHEDULE_DENSITIES` trae compact, normal y wide. |
| `now` | `Date` |  | El «ahora» de la línea roja. Sin él, el reloj real. Hoy, lo que ya pasó se atenúa. |
| `onSlotClick` | `(slot: { resourceId; start; isWorking }) => void` |  | Clic en un hueco libre: dónde y a qué hora, y si el recurso trabaja ahí. |
| `onEventClick` | `(event: ScheduleEvent) => void` |  | Abrir una tarjeta, o aceptar una propuesta si es `ghost`. Sin él las tarjetas no son botones. |
| `onEventMove` | `(event, drop: { resourceId; start; end }) => void` |  | Se soltó la tarjeta en otra hora o columna. Sin él no se arrastra. |
| `onEventResize` | `(event, drop) => void` |  | Se estiró la tarjeta desde abajo. Sin él no hay tirador. |
| `eventActions` | `(event) => RowAction[]` |  | El clic derecho sobre una tarjeta: sus acciones (abrir, el siguiente paso, cancelar…), con `RowContextMenu`. Las propuestas (`ghost`) y la tarjeta que se arrastra no tienen menú. |
| `validateDrop` | `(event, drop) => string \| null` |  | Si un destino vale. El motivo que devuelva se enseña mientras se arrastra y al soltar no se mueve nada. |
| `onDropRejected` | `(event, drop, reason) => void` |  | Se soltó donde `validateDrop` dijo que no. |
| `resourceActions` | `(resource) => ScheduleResourceAction[]` |  | El menú al tocar el nombre de un recurso (ver perfil, bloquear…). |
| `height` | `string` | `"max(28rem, calc(100dvh - 17rem))"` | Alto de la región con scroll. |
| `fill` | `boolean` | `false` | Ocupa el alto que le deje su contenedor flex en vez de medir la ventana: la rejilla es lo único que se desplaza y la página no suma una segunda barra. |

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

Cada recurso trae sus franjas de trabajo; fuera de ellas la columna se oscurece y se raya. Tomás no tiene horario y su columna lo dice. Las citas cuentan el cliente, el servicio y el siguiente paso; el bloqueo del almuerzo va tachado y no se toca.

```tsx
<ResourceDayGrid
  date={hoy}
  resources={[
    { id: "andres", name: "Andrés Beltrán", workingHours: [{ start: "09:00", end: "19:00" }] },
    { id: "tomas", name: "Tomás Peña", workingHours: [] },
  ]}
  events={[
    { id: "e1", resourceId: "andres", start, end, title: "Marcela Gómez", subtitle: "Corte clásico · US$ 35", badge: { label: "VIP", tone: "warning" }, action: { label: "Ingresar", onClick } },
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

### Citas enlazadas

Las citas que salieron de un mismo agendamiento (varias personas o varias citas de una vez) o que se enlazaron a mano. Cada una va en su hueco, como cita aparte, con `group` ({ id, index, size, color, highlight }): un icono de enlace con «1/2» en el `color` del grupo (paleta categórica), para distinguir un grupo de otro. Con `highlight` cada tarjeta se rodea además de un borde discontinuo de ese color: así se ve qué va con qué (la pantalla apaga las sueltas). `joinTop`/`joinBottom` siguen pegando dos de la misma columna si la pantalla lo quiere.

```tsx
<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={[
    { id: "g1", resourceId: "andres", start, end, title: "Laura Rincón", group: { id: "laura", index: 1, size: 3, color: 1, highlight: true } },
    { id: "g2", resourceId: "andres", start, end, title: "Laura Rincón", group: { id: "laura", index: 2, size: 3, color: 1, highlight: true } },
    { id: "g3", resourceId: "nicolas", start, end, title: "Sofía Rincón (hija)", group: { id: "laura", index: 3, size: 3, color: 1, highlight: true } },
    { id: "g4", resourceId: "nicolas", start, end, title: "Pedro Gil", group: { id: "pedro", index: 1, size: 2, color: 2, highlight: true } },
  ]}
/>
```

### Una cita con varios servicios

No es lo mismo que un grupo. Una sola cita con varios servicios ocupa un solo hueco: con `segments` ({ id, label, minutes, color }[]) una línea punteada marca por dentro dónde empieza cada servicio, a la altura de su minuto, y cada tramo lleva su nombre; `meta` pone el total en la fila de abajo (cede si ya van estado y acción). Cada tramo lleva el círculo del color de su servicio y el nombre del cliente ninguno. Un grupo, en cambio, son citas aparte enlazadas: cada una en su hueco, con su icono de enlace «1/2».

```tsx
<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={[
    {
      id: "s1", resourceId: "andres", start, end, title: "Mariana Rodríguez",
      segments: [
        { id: "corte", label: "Corte clásico · 30 min", minutes: 30, color: 1 },
        { id: "barba", label: "Arreglo de barba · 30 min", minutes: 30, color: 2 },
      ],
      meta: "US$ 65",
    },
    { id: "s2", resourceId: "nicolas", start, end, title: "Laura Rincón", group: { id: "laura", index: 1, size: 2, color: 3 } },
    { id: "s3", resourceId: "nicolas", start, end, title: "Laura Rincón", group: { id: "laura", index: 2, size: 2, color: 3 } },
  ]}
/>
```

### Propuestas, marcadores y avisos

La tarjeta dice quién (el nombre y su `badge`), en qué va (`status`: una píldora con punto de color) y qué se hace ahora (`action`); su color (`tone`) lo decide quien la monta —en la barbería, el servicio—. El borde discontinuo marca lo que se puede mover sin preguntar (`flexible`). Una propuesta (`ghost`) se dibuja translúcida y punteada con su porqué (`note`): un hueco sugerido o a dónde iría una cita en un reacomodo; tocarla es aceptar. El `alert` de un recurso sale como chip bajo su nombre.

```tsx
<ResourceDayGrid
  date={hoy}
  resources={[{ id: "nicolas", name: "Nicolás Duarte", workingHours, alert: { label: "Hueco 12:00 · 2 en espera", tone: "warning", onClick: ofrecer } }]}
  events={[
    { id: "e3", resourceId: "andres", start, end, title: "Mariana López", flexible: true, markers: [{ id: "online", icon: "online", label: "Reservó online" }] },
    { id: "p1", resourceId: "nicolas", start, end, title: "Hueco para Mariana", note: "Sin dejar hueco entre citas", badge: { label: "Sugerido" }, ghost: true },
  ]}
  onEventClick={(event) => (event.ghost ? aceptar(event) : abrir(event))}
/>
```

### Validar al arrastrar y densidad compacta

Con `validateDrop` la rejilla pregunta antes de soltar: si devuelve un motivo, la sombra se pone roja con el texto y al soltar no se mueve nada (avisa por `onDropRejected`). `slotHeight` cambia la densidad: `SCHEDULE_DENSITIES` trae compacta (40 px), normal (56 px) y amplia (72 px) por media hora. Lo que ya pasó hoy se atenúa.

```tsx
<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={citas}
  slotHeight={SCHEDULE_DENSITIES.compact}
  validateDrop={(cita, destino) => {
    const choque = findConflicts(citas, destino.resourceId, destino.start, destino.end, cita.id)[0];
    return choque ? `Se pisa con ${choque.title}` : null;
  }}
  onDropRejected={(cita, destino, motivo) => avisar(motivo)}
  onEventMove={(cita, destino) => moverCita(cita, destino)}
/>
```
