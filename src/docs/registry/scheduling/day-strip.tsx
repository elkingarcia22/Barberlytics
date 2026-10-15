import * as React from "react";
import { addDays } from "date-fns";
import { DayStrip } from "@/components/scheduling";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "../date/_shared";
import { DAY } from "./_shared";

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function PlaygroundDemo({ count, size, withMarks }: { count: number; size: "default" | "lg"; withMarks: boolean }) {
  const [value, setValue] = React.useState<Date>(DAY);
  const marked = React.useMemo(() => new Set(withMarks ? [dayKey(addDays(DAY, 2)), dayKey(addDays(DAY, 4))] : []), [withMarks]);
  return (
    <div className="w-full max-w-md space-y-3">
      <DayStrip first={DAY} count={count} value={value} onChange={setValue} size={size} marked={marked} />
      <ValueReadout label="Día" value={value.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} />
    </div>
  );
}

function MarkedDemo() {
  const [value, setValue] = React.useState<Date>(addDays(DAY, 2));
  return (
    <div className="w-full max-w-md">
      <DayStrip first={DAY} count={14} value={value} onChange={setValue} marked={new Set([dayKey(addDays(DAY, 2)), dayKey(addDays(DAY, 5))])} />
    </div>
  );
}

export const dayStripEntry = defineEntry({
  id: "day-strip",
  name: "DayStrip",
  group: "scheduling",
  description:
    "La tira de días de la reserva: el día de la semana arriba y el número grande, en fila y deslizable con el dedo, arrastrando con el ratón o con la rueda. Elegir uno cambia lo de debajo —las horas libres de ese día—. El de hoy se llama «Hoy» y un punto señala los días con algo ya apartado.",
  importPath: 'import { DayStrip } from "@/components/scheduling"',
  sourcePath: "src/components/scheduling/DayStrip.tsx",
  status: "stable",
  tags: ["calendar", "day", "booking", "strip"],
  playground: definePlayground({
    controls: {
      count: { type: "number", label: "Días", default: 14, min: 3, max: 30 },
      size: { type: "select", label: "Tamaño", options: ["default", "lg"], default: "default" },
      withMarks: { type: "boolean", label: "Días con punto", default: true },
    },
    render: ({ count, size, withMarks }) => <PlaygroundDemo count={count} size={size as "default" | "lg"} withMarks={withMarks} />,
    code: ({ count, size, withMarks }) => `const [day, setDay] = React.useState(new Date());

<DayStrip first={new Date()} count={${count}} value={day} onChange={setDay}${size === "lg" ? ' size="lg"' : ""}${withMarks ? "\n  marked={new Set([\"2026-10-17\", \"2026-10-19\"])}" : ""} />`,
  }),
  examples: [
    {
      id: "marked",
      title: "Con días marcados",
      description: "`marked` lleva las fechas (AAAA-MM-DD) que ya tienen una cita en el carrito: un punto bajo el número.",
      layout: "start",
      code: `<DayStrip first={firstBookableDay} count={21} value={day} onChange={setDay} marked={daysWithAppointments} />`,
      render: () => <MarkedDemo />,
    },
  ],
  props: [
    { name: "first", type: "Date", description: "El primer día que se ofrece (hoy, o mañana si hoy ya cerró)." },
    { name: "count", type: "number", description: "Cuántos días hacia delante." },
    { name: "value", type: "Date", description: "El día elegido." },
    { name: "onChange", type: "(day: Date) => void", description: "Se llama con el día tocado." },
    { name: "marked", type: "ReadonlySet<string>", description: "Fechas AAAA-MM-DD que llevan un punto." },
    { name: "size", type: '"default" | "lg"', default: '"default"', description: "`lg` para el dedo (tablet, kiosco)." },
    { name: "ariaLabel", type: "string", description: "El nombre del grupo para el lector de pantalla; por defecto «Elige el día»." },
  ],
  guidelines: {
    do: ["Pon debajo lo que depende del día (las horas libres) y recárgalo al cambiar.", "Dale a `first` el primer día reservable: si hoy ya cerró, mañana."],
    dont: ["No lo uses para meses ni rangos: para eso están DatePicker y Calendar.", "No lo metas dentro de otra tira con scroll horizontal."],
  },
  related: ["time-slot-groups", "time-slot-picker", "date-picker"],
});
