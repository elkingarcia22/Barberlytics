import * as React from "react";
import { TimeSlotPicker, isWorkingAt, minutesOfDay } from "@/components/scheduling";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "../date/_shared";
import { at, DAY } from "./_shared";

const WORKING = [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }];
const TAKEN = [at(25, 10), at(25, 10, 30), at(25, 15)];

const label = (date: Date | null) => (date ? date.toLocaleString("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");

function PlaygroundDemo({ startHour, endHour, step, withHours }: { startHour: number; endHour: number; step: number; withHours: boolean }) {
  const [value, setValue] = React.useState<Date | null>(at(25, 11));
  return (
    <div className="w-full max-w-lg space-y-3">
      <TimeSlotPicker
        value={value}
        onChange={setValue}
        startDate={DAY}
        startHour={startHour}
        endHour={endHour}
        slotMinutes={step}
        isSlotDisabled={withHours ? (date) => !isWorkingAt(WORKING, minutesOfDay(date)) : undefined}
      />
      <ValueReadout label="Elegido" value={label(value)} />
    </div>
  );
}

function BasicDemo() {
  const [value, setValue] = React.useState<Date | null>(null);
  return (
    <div className="w-full max-w-lg space-y-3">
      <TimeSlotPicker value={value} onChange={setValue} startDate={DAY} startHour={8} endHour={22} />
      <ValueReadout label="Elegido" value={label(value)} />
    </div>
  );
}

function AvailabilityDemo() {
  const [value, setValue] = React.useState<Date | null>(at(25, 11));
  return (
    <div className="w-full max-w-lg space-y-3">
      <TimeSlotPicker
        value={value}
        onChange={setValue}
        startDate={DAY}
        startHour={8}
        endHour={20}
        isSlotDisabled={(date) => !isWorkingAt(WORKING, minutesOfDay(date)) || TAKEN.some((taken) => taken.getTime() === date.getTime())}
      />
      <ValueReadout label="Elegido" value={label(value)} />
    </div>
  );
}

export const timeSlotPickerEntry = defineEntry({
  id: "time-slot-picker",
  name: "TimeSlotPicker",
  group: "scheduling",
  description:
    "Elegir cuándo: una tira de días para la fecha y, debajo, las horas repartidas en mañana, tarde y noche como chips. Es el «Fecha & Hora» de crear una cita: se ven el día y la hora de una vez, sin abrir un calendario y luego un reloj. Las horas que no sirven se apagan con `isSlotDisabled`.",
  importPath: 'import { TimeSlotPicker } from "@/components/scheduling"',
  sourcePath: "src/components/scheduling/TimeSlotPicker.tsx",
  status: "beta",
  tags: ["agenda", "fecha", "hora", "formulario"],
  playground: definePlayground({
    layout: "start",
    controls: {
      startHour: { type: "number", label: "Hora inicial", default: 8, min: 0, max: 22, step: 1 },
      endHour: { type: "number", label: "Hora final", default: 24, min: 1, max: 24, step: 1 },
      step: { type: "select", label: "Paso", options: ["15", "30", "60"], default: "30" },
      withHours: { type: "boolean", label: "Solo horario del barbero", default: true },
    },
    render: ({ startHour, endHour, step, withHours }) => <PlaygroundDemo startHour={startHour} endHour={endHour} step={Number(step)} withHours={withHours} />,
    code: ({ startHour, endHour, step, withHours }) =>
      `<TimeSlotPicker
  value={fechaHora}
  onChange={setFechaHora}
  startHour={${startHour}}
  endHour={${endHour}}
  slotMinutes={${step}}${withHours ? "\n  isSlotDisabled={(fecha) => !isWorkingAt(horarioDelBarbero, minutesOfDay(fecha))}" : ""}
/>`,
  }),
  examples: [
    {
      id: "basic",
      title: "Día y hora de una vez",
      description: "La tira arranca en `startDate` y avanza por semanas. Las horas van de media en media hora y se agrupan en mañana, tarde y noche.",
      layout: "start",
      code: `const [value, setValue] = React.useState<Date | null>(null);

<TimeSlotPicker value={value} onChange={setValue} startHour={8} endHour={22} />`,
      render: () => <BasicDemo />,
    },
    {
      id: "availability",
      title: "Solo lo disponible",
      description: "`isSlotDisabled` apaga lo que no sirve: fuera del horario del barbero y las horas ya ocupadas. El selector no sabe por qué, solo lo pinta tachado.",
      layout: "start",
      code: `<TimeSlotPicker
  value={value}
  onChange={setValue}
  isSlotDisabled={(fecha) => !isWorkingAt(horario, minutesOfDay(fecha)) || ocupadas.includes(fecha.getTime())}
/>`,
      render: () => <AvailabilityDemo />,
    },
  ],
  props: [
    { name: "value", type: "Date | null", description: "La fecha y hora elegidas." },
    { name: "onChange", type: "(date: Date) => void", description: "Se llama al tocar una hora; el día es el marcado en la tira." },
    { name: "startDate", type: "Date", default: "hoy", description: "Primer día de la tira." },
    { name: "daysCount", type: "number", default: "28", description: "Cuántos días se pueden recorrer hacia delante." },
    { name: "startHour / endHour", type: "number", default: "8 / 24", description: "Primera y última hora ofrecidas (la última exclusiva)." },
    { name: "slotMinutes", type: "number", default: "30", description: "Minutos entre una hora y la siguiente." },
    { name: "isSlotDisabled", type: "(date: Date) => boolean", description: "Qué horas se apagan (fuera de horario, ocupadas, pasadas)." },
    { name: "locale", type: "Locale", description: "Locale de date-fns; sin él, el idioma de la aplicación." },
  ],
  guidelines: {
    do: [
      "Apaga las horas pasadas de hoy y las que caen fuera del horario de quien atiende.",
      "Envuélvelo en un `Field` con `error` cuando el formulario exija la fecha.",
      "Deja que el paso siga al catálogo: si los servicios se agendan cada 15 minutos, `slotMinutes={15}`.",
    ],
    dont: [
      "No lo uses para rangos ni para fechas sin hora: para eso están `DateRangePicker` y `DatePicker`.",
      "No ofrezcas 24 horas si la barbería abre 12: la tira de chips se hace larga sin motivo.",
    ],
  },
  related: ["resource-day-grid", "date-picker", "segmented-control", "field"],
});
