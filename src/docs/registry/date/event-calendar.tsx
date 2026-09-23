import * as React from "react";
import { EventCalendar } from "@/components/date";
import type { CalendarEvent, CalendarView } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "./_shared";

/**
 * Todas las fechas de la doc salen de esta base fija (martes 15 de septiembre
 * de 2026). Con `new Date()` suelto el preview cambiaría cada día y los
 * ejemplos dejarían de coincidir con el código que muestran.
 */
const YEAR = 2026;
const SEPTEMBER = 8;
const at = (day: number, hour = 0, minute = 0) => new Date(YEAR, SEPTEMBER, day, hour, minute);

const BASE = at(15, 9);

/** Marco alto: el calendario necesita sitio para las seis semanas. */
const MONTH_FRAME = "min-h-[640px] items-start";
const TIME_FRAME = "min-h-[560px] items-start";

/** Agenda de formación del mes: sesiones, entrevistas y un cierre de encuesta. */
const MONTH_EVENTS: readonly CalendarEvent[] = [
  { id: "induccion", title: "Inducción operativa", start: at(15, 9), end: at(15, 10, 30), tone: "primary", location: "Sala Bogotá" },
  { id: "liderazgo-1", title: "Liderazgo cercano · módulo 1", start: at(2, 8), end: at(2, 10), tone: "primary" },
  { id: "liderazgo-2", title: "Liderazgo cercano · módulo 2", start: at(9, 8), end: at(9, 10), tone: "primary" },
  { id: "datos", title: "Analítica para no analistas", start: at(9, 14), end: at(9, 16), tone: "info" },
  { id: "seguridad", title: "Seguridad en planta", start: at(9, 16, 30), end: at(9, 18), tone: "warning" },
  { id: "refuerzo", title: "Refuerzo de servicio", start: at(9, 11), end: at(9, 12), tone: "positive" },
  { id: "clima", title: "Cierra encuesta de clima", start: at(18), allDay: true, tone: "warning" },
  { id: "evaluacion", title: "Cierra evaluación 360°", start: at(30), allDay: true, tone: "negative" },
  { id: "comite", title: "Comité de talento", start: at(23, 15), end: at(23, 16), tone: "neutral", meta: "Mensual" },
  { id: "onboarding", title: "Onboarding comercial", start: at(24, 9), end: at(24, 12, 30), tone: "primary" },
];

/** Semana de entrevistas de una vacante, con dos franjas que se solapan. */
const WEEK_EVENTS: readonly CalendarEvent[] = [
  { id: "e1", title: "Entrevista · Renata Peña", start: at(14, 9), end: at(14, 10), tone: "primary", meta: "Analista de datos" },
  { id: "e2", title: "Entrevista · Juan Ortiz", start: at(14, 11), end: at(14, 12), tone: "primary", meta: "Analista de datos" },
  { id: "e3", title: "Prueba técnica", start: at(15, 9), end: at(15, 11), tone: "info" },
  { id: "e4", title: "Entrevista · Sara Muñoz", start: at(15, 10), end: at(15, 11, 30), tone: "primary" },
  { id: "e5", title: "Panel con el equipo", start: at(16, 14), end: at(16, 16), tone: "positive" },
  { id: "e6", title: "Cierre de terna", start: at(17, 16), end: at(17, 17), tone: "warning" },
  { id: "e7", title: "Oferta y negociación", start: at(18, 10), end: at(18, 11), tone: "positive" },
];

/** Un día apretado: la vista de día es la que respira peor y la que hay que mirar. */
const DAY_EVENTS: readonly CalendarEvent[] = [
  { id: "d0", title: "Cierra la convocatoria interna", start: at(15), allDay: true, tone: "warning" },
  { id: "d1", title: "Inducción operativa", start: at(15, 8), end: at(15, 9, 30), tone: "primary", location: "Sala Bogotá", meta: "12 asistentes" },
  { id: "d2", title: "Sincronización con RR. HH.", start: at(15, 9, 30), end: at(15, 10), tone: "neutral", location: "Meet" },
  { id: "d3", title: "Taller de feedback", start: at(15, 10, 30), end: at(15, 12, 30), tone: "info", location: "Auditorio" },
  { id: "d4", title: "Entrevista · Sara Muñoz", start: at(15, 13), end: at(15, 14), tone: "primary", location: "Sala Medellín" },
  { id: "d5", title: "Calibración de evaluadores", start: at(15, 14), end: at(15, 15, 30), tone: "positive", location: "Sala Cali" },
  { id: "d6", title: "Cierre de encuesta de clima", start: at(15, 17), end: at(15, 18), tone: "negative", location: "Automático" },
];

function PlaygroundDemo({
  view,
  dayStart,
  dayEnd,
  withEvents,
}: {
  view: string;
  dayStart: number;
  dayEnd: number;
  withEvents: boolean;
}) {
  const [last, setLast] = React.useState("—");
  return (
    <div className="w-full space-y-3">
      <EventCalendar
        view={view as CalendarView}
        date={BASE}
        now={BASE}
        dayStart={dayStart}
        dayEnd={dayEnd}
        events={withEvents ? MONTH_EVENTS : []}
        onEventClick={(event) => setLast(event.title)}
        onSlotClick={(date) => setLast(`Hueco: ${date.toLocaleString("es-CO")}`)}
      />
      <ValueReadout label="Último clic" value={last} />
    </div>
  );
}

function MonthAgendaDemo() {
  const [view, setView] = React.useState<CalendarView>("month");
  const [date, setDate] = React.useState<Date>(BASE);
  return (
    <EventCalendar
      events={MONTH_EVENTS}
      view={view}
      onViewChange={setView}
      date={date}
      onDateChange={setDate}
      now={BASE}
    />
  );
}

function WeekInterviewsDemo() {
  return (
    <EventCalendar
      events={WEEK_EVENTS}
      defaultView="week"
      defaultDate={BASE}
      now={at(15, 11, 20)}
      dayStart={8}
      dayEnd={18}
    />
  );
}

function BusyDayDemo() {
  return (
    <EventCalendar
      events={DAY_EVENTS}
      defaultView="day"
      defaultDate={BASE}
      now={at(15, 11, 20)}
      dayStart={8}
      dayEnd={19}
    />
  );
}

function EmptyDemo() {
  return <EventCalendar events={[]} defaultDate={BASE} now={BASE} />;
}

export const eventCalendarEntry = defineEntry({
  id: "event-calendar",
  name: "EventCalendar",
  group: "date",
  description:
    "La agenda del producto en una rejilla: sesiones de formación, entrevistas de una vacante y fechas de cierre de encuestas, en vista de mes, semana o día. Los pickers eligen una fecha; este componente muestra qué pasa en ella.",
  importPath: 'import { EventCalendar } from "@/components/date"',
  sourcePath: "src/components/date/EventCalendar.tsx",
  status: "beta",
  tags: ["date-fns", "agenda", "teclado"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      view: { type: "select", options: ["month", "week", "day"], default: "month" },
      dayStart: { type: "number", label: "Hora inicial", default: 7, min: 0, max: 22, step: 1 },
      dayEnd: { type: "number", label: "Hora final", default: 20, min: 1, max: 24, step: 1 },
      withEvents: { type: "boolean", label: "Con eventos", default: true },
    },
    render: ({ view, dayStart, dayEnd, withEvents }) => (
      <PlaygroundDemo view={view} dayStart={dayStart} dayEnd={dayEnd} withEvents={withEvents} />
    ),
    code: ({ view, dayStart, dayEnd, withEvents }) =>
      `<EventCalendar
  events={${withEvents ? "eventos" : "[]"}}
  view="${view}"
  date={fecha}
  dayStart={${dayStart}}
  dayEnd={${dayEnd}}
  onEventClick={(evento) => abrirDetalle(evento)}
  onSlotClick={(fecha) => crearSesion(fecha)}
/>`,
  }),
  examples: [
    {
      id: "month-agenda",
      title: "Agenda de formación del mes",
      description:
        "La vista por defecto. Hasta tres eventos por día; el cuarto y los siguientes se recogen en «+N más», que abre la lista completa del día en un popover.",
      layout: "stretch",
      frameClassName: MONTH_FRAME,
      code: `const [view, setView] = React.useState<CalendarView>("month");
const [date, setDate] = React.useState(new Date(2026, 8, 15));

<EventCalendar
  events={sesiones}
  view={view}
  onViewChange={setView}
  date={date}
  onDateChange={setDate}
/>`,
      render: () => <MonthAgendaDemo />,
    },
    {
      id: "week-interviews",
      title: "Semana de entrevistas de una vacante",
      description:
        "Con `dayStart` y `dayEnd` la franja se recorta a la jornada real. Dos entrevistas a la misma hora se reparten el ancho de la columna, y la línea roja marca «ahora» si hoy cae dentro de la semana.",
      layout: "stretch",
      frameClassName: TIME_FRAME,
      code: `<EventCalendar
  events={entrevistas}
  defaultView="week"
  defaultDate={new Date(2026, 8, 15)}
  dayStart={8}
  dayEnd={18}
/>`,
      render: () => <WeekInterviewsDemo />,
    },
    {
      id: "busy-day",
      title: "Día con franjas ocupadas",
      description:
        "La misma franja horaria a una sola columna: al haber sitio, cada bloque suma ubicación y contexto. Los eventos de todo el día suben a la tira superior en vez de ocupar una hora falsa.",
      layout: "stretch",
      frameClassName: TIME_FRAME,
      code: `<EventCalendar
  events={jornada}
  defaultView="day"
  defaultDate={new Date(2026, 8, 15)}
  dayStart={8}
  dayEnd={19}
/>`,
      render: () => <BusyDayDemo />,
    },
    {
      id: "empty",
      title: "Periodo sin nada agendado",
      description:
        "Cuando el periodo visible no tiene eventos, el calendario cede el sitio al `EmptyState` del sistema y deja la cabecera para cambiar de mes o de vista.",
      layout: "stretch",
      frameClassName: "min-h-[360px] items-start",
      code: `<EventCalendar events={[]} defaultDate={new Date(2026, 8, 15)} />`,
      render: () => <EmptyDemo />,
    },
  ],
  props: [
    { name: "events", type: "readonly CalendarEvent[]", description: "Los eventos a pintar: `id`, `title`, `start`, y opcionalmente `end`, `allDay`, `tone`, `location` y `meta`." },
    { name: "view", type: '"month" | "week" | "day"', description: "Vista controlada. Sin ella el componente lleva su propio estado." },
    { name: "defaultView", type: '"month" | "week" | "day"', default: '"month"', description: "Vista inicial cuando el componente no está controlado." },
    { name: "onViewChange", type: "(view: CalendarView) => void", description: "Se dispara al usar el conmutador de la cabecera." },
    { name: "date", type: "Date", description: "Día o mes visible, controlado." },
    { name: "defaultDate", type: "Date", default: "hoy", description: "Periodo inicial cuando el componente no está controlado." },
    { name: "onDateChange", type: "(date: Date) => void", description: "Se dispara con anterior, siguiente, «Hoy» y al navegar con el teclado fuera del mes." },
    { name: "onEventClick", type: "(event: CalendarEvent) => void", description: "Clic en un chip o bloque de evento." },
    { name: "onSlotClick", type: "(date: Date) => void", description: "Clic en un hueco libre: el día en la vista de mes, el día y la hora en semana y día." },
    { name: "dayStart", type: "number", default: "7", description: "Primera hora visible en semana y día." },
    { name: "dayEnd", type: "number", default: "20", description: "Última hora visible en semana y día." },
    { name: "locale", type: "Locale", default: "es", description: "Locale de date-fns para los nombres de mes y día." },
    { name: "now", type: "Date", default: "new Date()", description: "El «ahora» de la línea roja. Fíjalo en pruebas y documentación para que el resultado no cambie cada día." },
    { name: "className", type: "string", description: "Clases del contenedor externo (ancho, márgenes)." },
  ],
  guidelines: {
    do: [
      "Usa el tono para decir qué es cada cosa: `primary` para sesiones, `positive` para lo confirmado, `warning` y `negative` para cierres que se acercan o vencen.",
      "Pasa `onSlotClick` cuando el usuario pueda crear algo: el hueco vacío es el sitio natural para empezar.",
      "Recorta la franja con `dayStart` y `dayEnd` a la jornada real; catorce horas vacías no informan de nada.",
      "Fija `now` y las fechas de ejemplo en pruebas y documentación para que el resultado no dependa del día.",
    ],
    dont: [
      "No metas más de una línea de texto en `title`: el chip trunca y la etiqueta accesible ya lleva la hora completa.",
      "No uses la vista de mes para agendas con decenas de eventos diarios; ahí la semana o el día leen mejor.",
      "No dependas solo del color para distinguir tipos de evento: el título tiene que decirlo también.",
      "No pases `end` anterior a `start`; el bloque se asume de una hora y la duración queda mal.",
    ],
  },
  related: ["date-picker", "date-range-picker", "period-selector", "empty-state"],
});
