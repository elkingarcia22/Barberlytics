import * as React from "react";
import { UserRound, Ban } from "lucide-react";
import { findConflicts, ResourceDayGrid, SCHEDULE_DENSITIES, type ScheduleEvent } from "@/components/scheduling";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "../date/_shared";
import { DAY, EVENTS, GROUPED_EVENTS, SEGMENTED_EVENTS, NOW, PROPOSALS, RESOURCES, RESOURCES_WITH_ALERT } from "./_shared";

const FRAME = "min-h-[36rem] items-start";

function PlaygroundDemo({ startHour, endHour, withNow, draggable }: { startHour: number; endHour: number; withNow: boolean; draggable: boolean }) {
  const [events, setEvents] = React.useState<readonly ScheduleEvent[]>(EVENTS);
  const [last, setLast] = React.useState("—");
  return (
    <div className="w-full space-y-3">
      <ResourceDayGrid
        date={DAY}
        resources={RESOURCES}
        events={events}
        startHour={startHour}
        endHour={endHour}
        now={withNow ? NOW : new Date(2000, 0, 1)}
        height="28rem"
        onSlotClick={(slot) => setLast(`Hueco: ${slot.resourceId} · ${slot.start.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}${slot.isWorking ? "" : " (fuera de horario)"}`)}
        onEventClick={(event) => setLast(`Abrir: ${event.title}`)}
        onEventMove={
          draggable
            ? (event, drop) => {
                setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, resourceId: drop.resourceId, start: drop.start, end: drop.end } : item)));
                setLast(`Movida: ${event.title} → ${drop.resourceId}`);
              }
            : undefined
        }
        onEventResize={
          draggable
            ? (event, drop) => {
                setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, end: drop.end } : item)));
                setLast(`Estirada: ${event.title}`);
              }
            : undefined
        }
        resourceActions={() => [
          { id: "view", label: "Ver barbero", icon: <UserRound className="size-4" />, onSelect: () => setLast("Ver barbero") },
          { id: "block", label: "Crear bloque de tiempo", icon: <Ban className="size-4" />, onSelect: () => setLast("Crear bloque") },
        ]}
      />
      <ValueReadout label="Último gesto" value={last} />
    </div>
  );
}

function BasicDemo() {
  return <ResourceDayGrid date={DAY} resources={RESOURCES} events={EVENTS} now={NOW} startHour={8} endHour={20} height="30rem" />;
}

function DragDemo() {
  const [events, setEvents] = React.useState<readonly ScheduleEvent[]>(EVENTS);
  return (
    <ResourceDayGrid
      date={DAY}
      resources={RESOURCES.slice(0, 3)}
      events={events}
      now={NOW}
      startHour={8}
      endHour={17}
      height="30rem"
      onEventClick={() => undefined}
      onEventMove={(event, drop) => setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, resourceId: drop.resourceId, start: drop.start, end: drop.end } : item)))}
      onEventResize={(event, drop) => setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, end: drop.end } : item)))}
    />
  );
}

function GroupedDemo() {
  return <ResourceDayGrid date={DAY} resources={RESOURCES.slice(0, 2)} events={GROUPED_EVENTS} now={NOW} startHour={9} endHour={13} height="22rem" onEventClick={() => undefined} />;
}

function SegmentedDemo() {
  return <ResourceDayGrid date={DAY} resources={RESOURCES.slice(0, 2)} events={SEGMENTED_EVENTS} now={NOW} startHour={9} endHour={12} height="20rem" onEventClick={() => undefined} />;
}

function NobodyWorksDemo() {
  return <ResourceDayGrid date={DAY} resources={[RESOURCES[3]]} events={[]} now={NOW} startHour={8} endHour={14} height="20rem" />;
}

function ProposalsDemo() {
  const [last, setLast] = React.useState("—");
  return (
    <div className="w-full space-y-3">
      <ResourceDayGrid
        date={DAY}
        resources={RESOURCES_WITH_ALERT.slice(0, 2)}
        events={[...EVENTS, ...PROPOSALS]}
        now={NOW}
        startHour={8}
        endHour={15}
        height="26rem"
        onEventClick={(event) => setLast(event.ghost ? `Aceptada: ${event.title}` : `Abrir: ${event.title}`)}
      />
      <ValueReadout label="Último gesto" value={last} />
    </div>
  );
}

function ValidateDemo() {
  const [events, setEvents] = React.useState<readonly ScheduleEvent[]>(EVENTS);
  const [last, setLast] = React.useState("—");
  return (
    <div className="w-full space-y-3">
      <ResourceDayGrid
        date={DAY}
        resources={RESOURCES.slice(0, 3)}
        events={events}
        now={NOW}
        startHour={8}
        endHour={17}
        height="26rem"
        slotHeight={SCHEDULE_DENSITIES.compact}
        onEventClick={() => undefined}
        validateDrop={(event, drop) => {
          const clash = findConflicts(events, drop.resourceId, drop.start, drop.end, event.id)[0];
          return clash ? `Se pisa con ${clash.title}` : null;
        }}
        onDropRejected={(_event, _drop, reason) => setLast(`Rechazada: ${reason}`)}
        onEventMove={(event, drop) => {
          setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, resourceId: drop.resourceId, start: drop.start, end: drop.end } : item)));
          setLast(`Movida: ${event.title}`);
        }}
      />
      <ValueReadout label="Último gesto" value={last} />
    </div>
  );
}

export const resourceDayGridEntry = defineEntry({
  id: "resource-day-grid",
  name: "ResourceDayGrid",
  group: "scheduling",
  description:
    "El día de una barbería: una columna por barbero, las horas hacia abajo y cada cita como tarjeta en la columna de quien la atiende. Sombrea las horas en que alguien no trabaja, dibuja la línea de «ahora», ofrece cada hueco libre como botón para agendar y deja mover y estirar las tarjetas arrastrándolas. Es su propia región de scroll, así la fila de barberos y la columna de horas se quedan fijas.",
  importPath: 'import { ResourceDayGrid } from "@/components/scheduling"',
  sourcePath: "src/components/scheduling/ResourceDayGrid.tsx",
  status: "beta",
  tags: ["agenda", "arrastrar", "teclado", "barbería"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      startHour: { type: "number", label: "Hora inicial", default: 8, min: 0, max: 22, step: 1 },
      endHour: { type: "number", label: "Hora final", default: 20, min: 1, max: 24, step: 1 },
      withNow: { type: "boolean", label: "Línea de ahora", default: true },
      draggable: { type: "boolean", label: "Arrastrar y estirar", default: true },
    },
    render: ({ startHour, endHour, withNow, draggable }) => <PlaygroundDemo startHour={startHour} endHour={endHour} withNow={withNow} draggable={draggable} />,
    code: ({ startHour, endHour, draggable }) =>
      `<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={citas}
  startHour={${startHour}}
  endHour={${endHour}}
  onSlotClick={(hueco) => crearCita(hueco)}
  onEventClick={(cita) => abrirDetalle(cita)}${draggable ? "\n  onEventMove={(cita, destino) => moverCita(cita, destino)}\n  onEventResize={(cita, destino) => cambiarDuracion(cita, destino)}" : ""}
/>`,
  }),
  examples: [
    {
      id: "basic",
      title: "El día por barbero",
      description:
        "Cada recurso trae sus franjas de trabajo; fuera de ellas la columna se oscurece y se raya. Tomás no tiene horario y su columna lo dice. Las citas cuentan el cliente, el servicio y el siguiente paso; el bloqueo del almuerzo va tachado y no se toca.",
      layout: "stretch",
      frameClassName: FRAME,
      code: `<ResourceDayGrid
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
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "drag",
      title: "Mover y estirar",
      description:
        "Con `onEventMove` la tarjeta se arrastra a otra hora o a otra columna (la sombra punteada enseña dónde caerá) y con `onEventResize` se estira desde el tirador de abajo. La rejilla no guarda nada: avisa y quien la monta decide. Solo con ratón o lápiz; con el dedo la agenda se desplaza.",
      layout: "stretch",
      frameClassName: FRAME,
      code: `<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={citas}
  onEventMove={(cita, { resourceId, start, end }) => moverCita(cita.id, resourceId, start)}
  onEventResize={(cita, { end }) => cambiarDuracion(cita.id, end)}
/>`,
      render: () => <DragDemo />,
    },
    {
      id: "nobody",
      title: "Sin horario",
      description: "Un recurso sin franjas ese día se pinta entero sombreado con el aviso. La pantalla decide si en vez de la rejilla muestra «Nadie trabaja este día».",
      layout: "stretch",
      frameClassName: "min-h-[22rem] items-start",
      code: `<ResourceDayGrid date={hoy} resources={[{ id: "tomas", name: "Tomás Peña", workingHours: [] }]} events={[]} />`,
      render: () => <NobodyWorksDemo />,
    },
    {
      id: "grouped",
      title: "Citas enlazadas",
      description:
        "Las citas que salieron de un mismo agendamiento (varias personas o varias citas de una vez) o que se enlazaron a mano. Cada una va en su hueco, como cita aparte, con `group` ({ id, index, size, color, highlight }): un icono de enlace con «1/2» en el `color` del grupo (paleta categórica), para distinguir un grupo de otro. Con `highlight` cada tarjeta se rodea además de un borde discontinuo de ese color: así se ve qué va con qué (la pantalla apaga las sueltas). `joinTop`/`joinBottom` siguen pegando dos de la misma columna si la pantalla lo quiere.",
      layout: "stretch",
      frameClassName: "min-h-[24rem] items-start",
      code: `<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={[
    { id: "g1", resourceId: "andres", start, end, title: "Laura Rincón", group: { id: "laura", index: 1, size: 3, color: 1, highlight: true } },
    { id: "g2", resourceId: "andres", start, end, title: "Laura Rincón", group: { id: "laura", index: 2, size: 3, color: 1, highlight: true } },
    { id: "g3", resourceId: "nicolas", start, end, title: "Sofía Rincón (hija)", group: { id: "laura", index: 3, size: 3, color: 1, highlight: true } },
    { id: "g4", resourceId: "nicolas", start, end, title: "Pedro Gil", group: { id: "pedro", index: 1, size: 2, color: 2, highlight: true } },
  ]}
/>`,
      render: () => <GroupedDemo />,
    },
    {
      id: "segments",
      title: "Una cita con varios servicios",
      description:
        "No es lo mismo que un grupo. Una sola cita con varios servicios ocupa un solo hueco: con `segments` ({ id, label, minutes, color }[]) una línea punteada marca por dentro dónde empieza cada servicio, a la altura de su minuto, y cada tramo lleva su nombre; `meta` pone el total en la fila de abajo (cede si ya van estado y acción). Cada tramo lleva el círculo del color de su servicio y el nombre del cliente ninguno. Un grupo, en cambio, son citas aparte enlazadas: cada una en su hueco, con su icono de enlace «1/2».",
      layout: "stretch",
      frameClassName: "min-h-[22rem] items-start",
      code: `<ResourceDayGrid
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
/>`,
      render: () => <SegmentedDemo />,
    },
    {
      id: "proposals",
      title: "Propuestas, marcadores y avisos",
      description:
        "La tarjeta dice quién (el nombre y su `badge`), en qué va (`status`: una píldora con punto de color) y qué se hace ahora (`action`); su color (`tone`) lo decide quien la monta —en la barbería, el servicio—. El borde discontinuo marca lo que se puede mover sin preguntar (`flexible`). Una propuesta (`ghost`) se dibuja translúcida y punteada con su porqué (`note`): un hueco sugerido o a dónde iría una cita en un reacomodo; tocarla es aceptar. El `alert` de un recurso sale como chip bajo su nombre.",
      layout: "stretch",
      frameClassName: "min-h-[32rem] items-start",
      code: `<ResourceDayGrid
  date={hoy}
  resources={[{ id: "nicolas", name: "Nicolás Duarte", workingHours, alert: { label: "Hueco 12:00 · 2 en espera", tone: "warning", onClick: ofrecer } }]}
  events={[
    { id: "e3", resourceId: "andres", start, end, title: "Mariana López", flexible: true, markers: [{ id: "online", icon: "online", label: "Reservó online" }] },
    { id: "p1", resourceId: "nicolas", start, end, title: "Hueco para Mariana", note: "Sin dejar hueco entre citas", badge: { label: "Sugerido" }, ghost: true },
  ]}
  onEventClick={(event) => (event.ghost ? aceptar(event) : abrir(event))}
/>`,
      render: () => <ProposalsDemo />,
    },
    {
      id: "validate",
      title: "Validar al arrastrar y densidad compacta",
      description:
        "Con `validateDrop` la rejilla pregunta antes de soltar: si devuelve un motivo, la sombra se pone roja con el texto y al soltar no se mueve nada (avisa por `onDropRejected`). `slotHeight` cambia la densidad: `SCHEDULE_DENSITIES` trae compacta (40 px), normal (56 px) y amplia (72 px) por media hora. Lo que ya pasó hoy se atenúa.",
      layout: "stretch",
      frameClassName: FRAME,
      code: `<ResourceDayGrid
  date={hoy}
  resources={barberos}
  events={citas}
  slotHeight={SCHEDULE_DENSITIES.compact}
  validateDrop={(cita, destino) => {
    const choque = findConflicts(citas, destino.resourceId, destino.start, destino.end, cita.id)[0];
    return choque ? \`Se pisa con \${choque.title}\` : null;
  }}
  onDropRejected={(cita, destino, motivo) => avisar(motivo)}
  onEventMove={(cita, destino) => moverCita(cita, destino)}
/>`,
      render: () => <ValidateDemo />,
    },
  ],
  props: [
    { name: "date", type: "Date", description: "El día que se muestra." },
    { name: "resources", type: "ScheduleResource[]", description: "Una columna por elemento: id, nombre, avatar, subtítulo y sus franjas de trabajo («HH:mm»). `progress` (0 a 1) pinta una barra de ocupación bajo el nombre; `alert` ({ label, tone?, onClick? }) un chip de aviso debajo." },
    { name: "events", type: "ScheduleEvent[]", description: "Citas y bloqueos con `resourceId`, `start`, `end`, título, tono, badge, acción y aviso. `tone` es el color de la tarjeta y `status` ({ label, tone }) la píldora que dice en qué va. `kind: \"block\"` tacha la franja; `locked` impide arrastrar; `flexible` pone el borde discontinuo; `markers` ({ id, icon, label }[]) son iconos de detalle que salen junto al nombre desde dos líneas de alto; `hideTime` quita la línea de la hora; `ghost` dibuja una propuesta translúcida con su `note` y tocarla llama a `onEventClick`; `group` ({ id, index, size, color, highlight, joinTop, joinBottom }) marca las citas enlazadas con un icono de su color y, resaltadas, un borde discontinuo de ese color; `segments` ({ id, label, minutes }[]) parte por dentro una sola cita de varios servicios y `meta` pone su total en la fila de abajo. `urgent` («12 min tarde») sale como pastilla roja —un punto en las tarjetas cortas— y `faded` apaga la tarjeta cuando queda fuera de un filtro. `fill` decide el relleno: `neutral` (sobrio, el `color` solo en el punto), `category` (el pastel de `color`) o `tone` (el pastel de `tone`); los pasteles mezclan el color con la card del tema según `--schedule-pastel-strength` y `--schedule-chroma`, que da cada tema." },
    { name: "startHour / endHour", type: "number", default: "6 / 24", description: "Primera y última hora visibles (la última exclusiva)." },
    { name: "slotMinutes", type: "number", default: "30", description: "Minutos por franja; también el paso al arrastrar." },
    { name: "slotHeight", type: "number", default: "56", description: "Alto de cada franja en píxeles: la densidad. `SCHEDULE_DENSITIES` trae compact, normal y wide." },
    { name: "now", type: "Date", description: "El «ahora» de la línea roja. Sin él, el reloj real. Hoy, lo que ya pasó se atenúa." },
    { name: "onSlotClick", type: "(slot: { resourceId; start; isWorking }) => void", description: "Clic en un hueco libre: dónde y a qué hora, y si el recurso trabaja ahí." },
    { name: "onEventClick", type: "(event: ScheduleEvent) => void", description: "Abrir una tarjeta, o aceptar una propuesta si es `ghost`. Sin él las tarjetas no son botones." },
    { name: "onEventMove", type: "(event, drop: { resourceId; start; end }) => void", description: "Se soltó la tarjeta en otra hora o columna. Sin él no se arrastra." },
    { name: "onEventResize", type: "(event, drop) => void", description: "Se estiró la tarjeta desde abajo. Sin él no hay tirador." },
    { name: "eventActions", type: "(event) => RowAction[]", description: "El clic derecho sobre una tarjeta: sus acciones (abrir, el siguiente paso, cancelar…), con `RowContextMenu`. Las propuestas (`ghost`) y la tarjeta que se arrastra no tienen menú." },
    { name: "validateDrop", type: "(event, drop) => string | null", description: "Si un destino vale. El motivo que devuelva se enseña mientras se arrastra y al soltar no se mueve nada." },
    { name: "onDropRejected", type: "(event, drop, reason) => void", description: "Se soltó donde `validateDrop` dijo que no." },
    { name: "columnWidths", type: "Record<string, number>", description: "El ancho en píxeles de cada columna que se ajustó, por id de recurso (entre `SCHEDULE_COLUMN_MIN_PX` y `SCHEDULE_COLUMN_MAX_PX`). Las que no salen miden 11rem y se reparten lo que sobra." },
    { name: "onColumnResize", type: "(resourceId, width: number | null) => void", description: "Con él, cada cabecera lleva un asa en su borde derecho, como en una tabla: se arrastra para ensanchar o estrechar la columna, se mueve con las flechas (Mayús, de 64 en 64) y con doble clic avisa `null`: volver al ancho de siempre. Durante el arrastre la rejilla pinta en vivo y solo avisa al soltar; guardar es de quien la monta. En una columna estrecha las tarjetas sueltan primero los iconos y luego la etiqueta, y el texto termina en «…»." },
    { name: "resourceActions", type: "(resource) => ScheduleResourceAction[]", description: "El menú al tocar el nombre de un recurso (ver perfil, bloquear…)." },
    { name: "height", type: "string", default: '"max(28rem, calc(100dvh - 17rem))"', description: "Alto de la región con scroll." },
    { name: "fill", type: "boolean", default: "false", description: "Ocupa el alto que le deje su contenedor flex en vez de medir la ventana: la rejilla es lo único que se desplaza y la página no suma una segunda barra." },
  ],
  guidelines: {
    do: [
      "Pasa `now` fijo en pruebas y en la doc; en producto déjalo vacío para que la línea siga al reloj.",
      "Traduce tus citas a `ScheduleEvent` en un módulo aparte: la rejilla no sabe de clientes ni de precios.",
      "Con `onSlotClick` abre el formulario con el barbero y la hora ya puestos: es la forma más rápida de agendar.",
      "Acepta el `drop` de `onEventMove` en el servidor y revierte si dice que no; la rejilla solo avisa.",
    ],
    dont: [
      "No pintes la agenda de varios días aquí: es la rejilla de un día. Para la semana está `EventCalendar`.",
      "No metas más de una acción en cada tarjeta; el siguiente paso es uno.",
      "No ocultes recursos sin horario en silencio: enséñalos sombreados o explica por qué no están.",
    ],
  },
  related: ["month-occupancy-grid", "time-slot-picker", "event-calendar", "drawer-shell"],
});
