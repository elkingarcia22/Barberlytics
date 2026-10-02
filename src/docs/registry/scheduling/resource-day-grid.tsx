import * as React from "react";
import { UserRound, Ban } from "lucide-react";
import { ResourceDayGrid, type ScheduleEvent } from "@/components/scheduling";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "../date/_shared";
import { DAY, EVENTS, NOW, RESOURCES } from "./_shared";

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

function NobodyWorksDemo() {
  return <ResourceDayGrid date={DAY} resources={[RESOURCES[3]]} events={[]} now={NOW} startHour={8} endHour={14} height="20rem" />;
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
        "Cada recurso trae sus franjas de trabajo; fuera de ellas la columna se sombrea. Tomás no tiene horario y su columna lo dice. Las citas cuentan el cliente, el servicio y el siguiente paso; el bloqueo del almuerzo va tachado y no se toca.",
      layout: "stretch",
      frameClassName: FRAME,
      code: `<ResourceDayGrid
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
  ],
  props: [
    { name: "date", type: "Date", description: "El día que se muestra." },
    { name: "resources", type: "ScheduleResource[]", description: "Una columna por elemento: id, nombre, avatar, subtítulo y sus franjas de trabajo («HH:mm»)." },
    { name: "events", type: "ScheduleEvent[]", description: "Citas y bloqueos con `resourceId`, `start`, `end`, título, tono, badge, acción y aviso. `kind: \"block\"` tacha la franja; `locked` impide arrastrar." },
    { name: "startHour / endHour", type: "number", default: "6 / 24", description: "Primera y última hora visibles (la última exclusiva)." },
    { name: "slotMinutes", type: "number", default: "30", description: "Minutos por franja; también el paso al arrastrar." },
    { name: "now", type: "Date", description: "El «ahora» de la línea roja. Sin él, el reloj real." },
    { name: "onSlotClick", type: "(slot: { resourceId; start; isWorking }) => void", description: "Clic en un hueco libre: dónde y a qué hora, y si el recurso trabaja ahí." },
    { name: "onEventClick", type: "(event: ScheduleEvent) => void", description: "Abrir una tarjeta. Sin él las tarjetas no son botones." },
    { name: "onEventMove", type: "(event, drop: { resourceId; start; end }) => void", description: "Se soltó la tarjeta en otra hora o columna. Sin él no se arrastra." },
    { name: "onEventResize", type: "(event, drop) => void", description: "Se estiró la tarjeta desde abajo. Sin él no hay tirador." },
    { name: "resourceActions", type: "(resource) => ScheduleResourceAction[]", description: "El menú al tocar el nombre de un recurso (ver perfil, bloquear…)." },
    { name: "height", type: "string", default: '"max(28rem, calc(100dvh - 17rem))"', description: "Alto de la región con scroll." },
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
