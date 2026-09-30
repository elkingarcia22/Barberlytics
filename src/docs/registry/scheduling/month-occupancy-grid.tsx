import * as React from "react";
import { MonthOccupancyGrid, type MonthOccupancyDay } from "@/components/scheduling";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "../date/_shared";
import { at, DAY } from "./_shared";

const FRAME = "min-h-[40rem] items-start";

/** Un mes de un barbero que descansa los domingos y tiene una semana de vacaciones. */
function buildDays(busy: number): MonthOccupancyDay[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = at(index + 1);
    const weekday = date.getDay();
    const vacation = index + 1 >= 7 && index + 1 <= 11;
    if (weekday === 0 || vacation) return { date, occupancy: null, count: 0 };
    const wave = 0.35 + 0.3 * Math.sin(index / 3) + (weekday === 6 ? 0.25 : 0);
    const occupancy = Math.min(1, Math.max(0.05, wave * busy));
    return { date, occupancy, count: Math.round(occupancy * 14) };
  });
}

function PlaygroundDemo({ busy, withSelection }: { busy: number; withSelection: boolean }) {
  const [selected, setSelected] = React.useState<Date | null>(withSelection ? DAY : null);
  const days = React.useMemo(() => buildDays(busy), [busy]);
  return (
    <div className="w-full space-y-3">
      <MonthOccupancyGrid month={DAY} days={days} selected={withSelection ? selected : null} today={DAY} onSelectDay={setSelected} />
      <ValueReadout label="Día elegido" value={selected ? selected.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) : "—"} />
    </div>
  );
}

function BasicDemo() {
  const [selected, setSelected] = React.useState<Date | null>(DAY);
  return <MonthOccupancyGrid month={DAY} days={buildDays(1)} selected={selected} today={DAY} onSelectDay={setSelected} />;
}

export const monthOccupancyGridEntry = defineEntry({
  id: "month-occupancy-grid",
  name: "MonthOccupancyGrid",
  group: "scheduling",
  description:
    "El mes de un barbero (o del equipo) día por día: cuánta de la jornada está reservada, en porcentaje y en barra, y cuántas citas hay. Un día sin jornada se atenúa y lo dice; a partir del 80 % el porcentaje avisa en naranja. Cada día es un botón para abrir esa fecha en la rejilla.",
  importPath: 'import { MonthOccupancyGrid } from "@/components/scheduling"',
  sourcePath: "src/components/scheduling/MonthOccupancyGrid.tsx",
  status: "beta",
  tags: ["agenda", "ocupación", "mes"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      busy: { type: "number", label: "Qué tan lleno (×)", default: 1, min: 0.2, max: 1.6, step: 0.2 },
      withSelection: { type: "boolean", label: "Con día elegido", default: true },
    },
    render: ({ busy, withSelection }) => <PlaygroundDemo busy={busy} withSelection={withSelection} />,
    code: () => `<MonthOccupancyGrid
  month={mes}
  days={dias.map((d) => ({ date: d.fecha, occupancy: d.reservado / d.jornada, count: d.citas }))}
  selected={fecha}
  onSelectDay={(dia) => abrirDia(dia)}
/>`,
  }),
  examples: [
    {
      id: "basic",
      title: "Septiembre de un barbero",
      description: "Descansa los domingos y estuvo de vacaciones del 7 al 11: esos días no tienen jornada. Los sábados van más llenos y el porcentaje lo avisa.",
      layout: "stretch",
      frameClassName: FRAME,
      code: `const [selected, setSelected] = React.useState<Date | null>(hoy);

<MonthOccupancyGrid month={hoy} days={dias} selected={selected} onSelectDay={setSelected} />`,
      render: () => <BasicDemo />,
    },
  ],
  props: [
    { name: "month", type: "Date", description: "Cualquier día del mes a mostrar." },
    { name: "days", type: "{ date: Date; occupancy: number | null; count: number }[]", description: "Un elemento por día: `occupancy` de 0 a 1, o `null` si no trabaja; `count` de citas." },
    { name: "selected", type: "Date | null", description: "El día marcado." },
    { name: "onSelectDay", type: "(date: Date) => void", description: "Se llama al tocar un día del mes." },
    { name: "today", type: "Date", description: "Qué día lleva el círculo de «hoy». Inyectable para la doc y las pruebas." },
    { name: "locale", type: "Locale", description: "Locale de date-fns; sin él, el idioma de la aplicación." },
  ],
  guidelines: {
    do: [
      "Calcula la ocupación como minutos reservados sobre minutos de jornada, no sobre 24 horas.",
      "Al tocar un día, cambia a la vista Día en esa fecha: es lo que quien mira espera.",
      "Manda `occupancy: null` para los días sin jornada; un 0 % se lee como «libre», no como «no trabaja».",
    ],
    dont: [
      "No lo uses como selector de fecha: para eso están `DatePicker` y `Calendar`.",
      "No pintes aquí las citas una a una; para eso está la vista de mes de `EventCalendar`.",
    ],
  },
  related: ["resource-day-grid", "event-calendar", "progress", "kpi-card"],
});
