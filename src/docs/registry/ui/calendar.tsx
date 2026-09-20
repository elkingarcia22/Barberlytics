import * as React from "react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { defineEntry, definePlayground } from "../types";

const CAPTION_LAYOUTS = ["label", "dropdown", "dropdown-months", "dropdown-years"] as const;
type CaptionLayout = (typeof CAPTION_LAYOUTS)[number];

const TODAY = new Date();

function formatDay(date: Date) {
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

function SingleCalendar({ captionLayout = "label", numberOfMonths = 1, showOutsideDays = true, showWeekNumber = false }: {
  captionLayout?: CaptionLayout;
  numberOfMonths?: number;
  showOutsideDays?: boolean;
  showWeekNumber?: boolean;
}) {
  const [date, setDate] = React.useState<Date | undefined>(TODAY);
  return (
    <div className="flex flex-col items-center gap-3">
      <Calendar
        mode="single"
        locale={es}
        selected={date}
        onSelect={setDate}
        captionLayout={captionLayout}
        numberOfMonths={numberOfMonths}
        showOutsideDays={showOutsideDays}
        showWeekNumber={showWeekNumber}
        className="rounded-xl border border-border/60 bg-surface shadow-card"
      />
      <p className="text-[13px] text-text-secondary">{date ? formatDay(date) : "Sin fecha seleccionada"}</p>
    </div>
  );
}

function RangeCalendar() {
  const [range, setRange] = React.useState<DateRange | undefined>({ from: TODAY, to: addDays(TODAY, 6) });
  const label = range?.from
    ? range.to
      ? `${format(range.from, "d MMM", { locale: es })} – ${format(range.to, "d MMM yyyy", { locale: es })}`
      : format(range.from, "d MMM yyyy", { locale: es })
    : "Elige un rango";
  return (
    <div className="flex flex-col items-center gap-3">
      <Calendar mode="range" locale={es} selected={range} onSelect={setRange} numberOfMonths={2} className="rounded-xl border border-border/60 bg-surface shadow-card" />
      <p className="text-[13px] text-text-secondary">{label}</p>
    </div>
  );
}

function DisabledCalendar() {
  const [date, setDate] = React.useState<Date | undefined>();
  return (
    <Calendar
      mode="single"
      locale={es}
      selected={date}
      onSelect={setDate}
      disabled={[{ before: TODAY }, { dayOfWeek: [0, 6] }]}
      className="rounded-xl border border-border/60 bg-surface shadow-card"
    />
  );
}

export const calendarEntry = defineEntry({
  id: "calendar",
  name: "Calendar",
  group: "ui",
  description:
    "Cuadrícula de fechas construida sobre react-day-picker con los tokens del sistema. Úsalo dentro de un Popover para los pickers o en línea cuando la fecha es el foco de la pantalla; pasa `locale={es}` para nombres en español.",
  importPath: 'import { Calendar } from "@/components/ui/calendar"',
  sourcePath: "src/components/ui/calendar.tsx",
  status: "stable",
  tags: ["react-day-picker", "date-fns"],
  playground: definePlayground({
    controls: {
      captionLayout: { type: "select", label: "Encabezado", options: CAPTION_LAYOUTS, default: "label" },
      numberOfMonths: { type: "select", label: "Meses", options: ["1", "2"], default: "1" },
      showOutsideDays: { type: "boolean", label: "Días de meses vecinos", default: true },
      showWeekNumber: { type: "boolean", label: "Número de semana", default: false },
    },
    render: ({ captionLayout, numberOfMonths, showOutsideDays, showWeekNumber }) => (
      <SingleCalendar
        key={`${captionLayout}-${numberOfMonths}`}
        captionLayout={captionLayout as CaptionLayout}
        numberOfMonths={Number(numberOfMonths)}
        showOutsideDays={showOutsideDays}
        showWeekNumber={showWeekNumber}
      />
    ),
    code: ({ captionLayout, numberOfMonths, showOutsideDays, showWeekNumber }) => {
      const attrs = [
        captionLayout !== "label" ? `captionLayout="${captionLayout}"` : "",
        numberOfMonths !== "1" ? `numberOfMonths={${numberOfMonths}}` : "",
        !showOutsideDays ? "showOutsideDays={false}" : "",
        showWeekNumber ? "showWeekNumber" : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `const [date, setDate] = React.useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  locale={es}
  selected={date}
  onSelect={setDate}${attrs}
/>`;
    },
  }),
  examples: [
    {
      id: "single",
      title: "Selección simple",
      description: "Un solo día; el estado vive en el padre y se formatea con date-fns.",
      frameClassName: "min-h-[380px]",
      code: `import { format } from "date-fns";
import { es } from "date-fns/locale";

const [date, setDate] = React.useState<Date | undefined>(new Date());

<Calendar mode="single" locale={es} selected={date} onSelect={setDate} />
<p>{date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : "Sin fecha"}</p>`,
      render: () => <SingleCalendar />,
    },
    {
      id: "range",
      title: "Rango con dos meses",
      description: "`mode=\"range\"` devuelve `{ from, to }`; con `numberOfMonths={2}` el usuario ve el rango completo.",
      layout: "stretch",
      frameClassName: "min-h-[380px]",
      code: `import type { DateRange } from "react-day-picker";

const [range, setRange] = React.useState<DateRange | undefined>({ from: today, to: addDays(today, 6) });

<Calendar mode="range" locale={es} selected={range} onSelect={setRange} numberOfMonths={2} />`,
      render: () => <RangeCalendar />,
    },
    {
      id: "dropdown",
      title: "Navegación por desplegables",
      description: "`captionLayout=\"dropdown\"` sustituye la etiqueta por selectores de mes y año; útil para fechas lejanas como cumpleaños.",
      frameClassName: "min-h-[380px]",
      code: `<Calendar mode="single" locale={es} captionLayout="dropdown" selected={date} onSelect={setDate} />`,
      render: () => <SingleCalendar captionLayout="dropdown" />,
    },
    {
      id: "disabled",
      title: "Días deshabilitados",
      description: "Los matchers de react-day-picker bloquean fechas pasadas y fines de semana.",
      frameClassName: "min-h-[380px]",
      code: `<Calendar
  mode="single"
  locale={es}
  selected={date}
  onSelect={setDate}
  disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
/>`,
      render: () => <DisabledCalendar />,
    },
  ],
  props: [
    { name: "mode", type: '"single" | "multiple" | "range"', description: "Tipo de selección. Determina la forma de `selected` y `onSelect`." },
    { name: "selected / onSelect", type: "Date | Date[] | DateRange", description: "Valor seleccionado y su callback, según el modo." },
    { name: "locale", type: "Locale", description: "Locale de date-fns (`es`) para nombres de meses y días." },
    { name: "captionLayout", type: '"label" | "dropdown" | "dropdown-months" | "dropdown-years"', default: '"label"', description: "Encabezado como texto o con selectores de mes/año." },
    { name: "numberOfMonths", type: "number", default: "1", description: "Meses visibles a la vez." },
    { name: "showOutsideDays", type: "boolean", default: "true", description: "Muestra atenuados los días de los meses vecinos." },
    { name: "showWeekNumber", type: "boolean", default: "false", description: "Añade una columna con el número de semana." },
    { name: "disabled", type: "Matcher | Matcher[]", description: "Fechas no seleccionables: rangos, días de la semana, funciones…" },
    { name: "buttonVariant", type: "ButtonProps[\"variant\"]", default: '"ghost"', description: "Variante de los botones de navegación de mes." },
    { name: "...props", type: "DayPickerProps", description: "Cualquier otra prop de react-day-picker (defaultMonth, fromDate, toDate, etc.)." },
  ],
  guidelines: {
    do: ["Pasa siempre `locale={es}` en interfaces en español.", "Deshabilita explícitamente las fechas no válidas en lugar de validar después.", "Usa dos meses cuando el usuario elige rangos de más de una semana."],
    dont: ["No lo muestres en línea en formularios densos; envuélvelo en un Popover.", "No cambies `--cell-size` por componente; ajústalo con `className` solo si es imprescindible.", "No uses `dropdown` sin acotar el rango de años con `fromYear`/`toYear`."],
  },
  related: ["popover", "date-picker", "date-range-picker"],
});
