import * as React from "react";
import { endOfMonth, format, startOfMonth, startOfToday, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { DateRangePicker } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout, WIDE_PICKER_FRAME } from "./_shared";

type Range = { from?: Date; to?: Date } | undefined;

const readable = (range: Range) => {
  if (!range?.from && !range?.to) return "";
  const fmt = (d?: Date) => (d ? format(d, "d MMM yyyy", { locale: es }) : "…");
  return `${fmt(range.from)} → ${fmt(range.to)}`;
};

function PlaygroundDemo({ label, placeholder, description, error, disabled }: { label: string; placeholder: string; description: string; error: string; disabled: boolean }) {
  const [range, setRange] = React.useState<Range>();
  return (
    <div className="w-80 space-y-3">
      <DateRangePicker
        value={range}
        onChange={setRange}
        label={label || undefined}
        placeholder={placeholder}
        description={description || undefined}
        error={error || undefined}
        disabled={disabled}
        locale="es-ES"
      />
      <ValueReadout value={readable(range)} />
    </div>
  );
}

function BasicDemo() {
  const [range, setRange] = React.useState<Range>();
  return (
    <div className="w-80 space-y-3">
      <DateRangePicker value={range} onChange={setRange} label="Periodo del informe" placeholder="Elige un rango" locale="es-ES" />
      <ValueReadout value={readable(range)} />
    </div>
  );
}

function PresetDemo() {
  const today = startOfToday();
  const [range, setRange] = React.useState<Range>({ from: startOfMonth(today), to: endOfMonth(today) });
  return (
    <div className="w-80 space-y-3">
      <DateRangePicker value={range} onChange={setRange} label="Mes en curso" description="Puedes ajustar el rango en el calendario." locale="es-ES" />
      <ValueReadout value={readable(range)} />
    </div>
  );
}

function BoundedDemo() {
  const today = startOfToday();
  const [range, setRange] = React.useState<Range>();
  return (
    <div className="w-80 space-y-3">
      <DateRangePicker
        value={range}
        onChange={setRange}
        label="Últimos 90 días"
        description="Solo fechas pasadas dentro de los últimos 90 días."
        minDate={subDays(today, 90)}
        maxDate={today}
        locale="es-ES"
      />
      <ValueReadout value={readable(range)} />
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6 sm:grid-cols-2">
      <DateRangePicker label="Con error" error="Selecciona un rango válido." locale="es-ES" />
      <DateRangePicker label="Deshabilitado" disabled locale="es-ES" />
    </div>
  );
}

export const dateRangePickerEntry = defineEntry({
  id: "date-range-picker",
  name: "DateRangePicker",
  group: "date",
  description:
    "Selector de rango en un solo campo: abre un calendario de dos meses y cierra al completar inicio y fin. Ideal para filtros de informes donde el rango se lee de un vistazo.",
  importPath: 'import { DateRangePicker } from "@/components/date"',
  sourcePath: "src/components/date/DateRangePicker.tsx",
  status: "stable",
  tags: ["controlado", "popover", "calendar"],
  playground: definePlayground({
    layout: "start",
    controls: {
      label: { type: "text", default: "Periodo del informe" },
      placeholder: { type: "text", default: "Elige un rango" },
      description: { type: "text", label: "Descripción", default: "" },
      error: { type: "text", default: "" },
      disabled: { type: "boolean", default: false },
    },
    render: (values) => <PlaygroundDemo {...values} />,
    code: ({ label, placeholder, description, error, disabled }) => {
      const attrs = [
        label ? `label="${label}"` : "",
        `placeholder="${placeholder}"`,
        description ? `description="${description}"` : "",
        error ? `error="${error}"` : "",
        disabled ? "disabled" : "",
        'locale="es-ES"',
      ].filter(Boolean);
      return `const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateRangePicker
  value={range}
  onChange={setRange}
  ${attrs.join("\n  ")}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado",
      description: "El primer clic fija `from`, el segundo fija `to` y cierra el popover.",
      layout: "start",
      frameClassName: WIDE_PICKER_FRAME,
      code: `const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateRangePicker
  value={range}
  onChange={setRange}
  label="Periodo del informe"
  placeholder="Elige un rango"
  locale="es-ES"
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "preset",
      title: "Con valor inicial",
      description: "Un rango precargado (aquí, el mes en curso) se muestra formateado y marcado en el calendario.",
      layout: "start",
      frameClassName: WIDE_PICKER_FRAME,
      code: `const today = startOfToday()
const [range, setRange] = React.useState({ from: startOfMonth(today), to: endOfMonth(today) })

<DateRangePicker value={range} onChange={setRange} label="Mes en curso" locale="es-ES" />`,
      render: () => <PresetDemo />,
    },
    {
      id: "bounded",
      title: "Con límites",
      description: "`minDate` y `maxDate` deshabilitan los días fuera de ventana.",
      layout: "start",
      frameClassName: WIDE_PICKER_FRAME,
      code: `<DateRangePicker
  value={range}
  onChange={setRange}
  label="Últimos 90 días"
  minDate={subDays(today, 90)}
  maxDate={today}
  locale="es-ES"
/>`,
      render: () => <BoundedDemo />,
    },
    {
      id: "states",
      title: "Error y deshabilitado",
      layout: "start",
      code: `<DateRangePicker label="Con error" error="Selecciona un rango válido." locale="es-ES" />
<DateRangePicker label="Deshabilitado" disabled locale="es-ES" />`,
      render: () => <StatesDemo />,
    },
  ],
  props: [
    { name: "value", type: "{ from?: Date; to?: Date } | null", description: "Rango seleccionado; cualquiera de los extremos puede faltar mientras se elige." },
    { name: "onChange", type: "(range: { from?: Date; to?: Date } | undefined) => void", description: "Se dispara en cada clic sobre el calendario." },
    { name: "placeholder", type: "string", default: '"Select a date range"', description: "Texto del campo sin valor." },
    { name: "label", type: "string", description: "Etiqueta visible enlazada al botón." },
    { name: "description", type: "string", description: "Texto de ayuda bajo el campo." },
    { name: "error", type: "string", description: "Mensaje de error; activa el estado destructivo." },
    { name: "minDate", type: "Date", description: "Primer día seleccionable (inclusive)." },
    { name: "maxDate", type: "Date", description: "Último día seleccionable (inclusive)." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el campo." },
    { name: "locale", type: "string", default: '"en-US"', description: "Código Intl para formatear `from - to` en el campo." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Úsalo en filtros donde el rango cabe en un solo campo compacto.", "Combínalo con PeriodSelector para ofrecer atajos (últimos 7 días, mes actual).", "Muestra el rango resultante en la cabecera del informe con `formatDateRange`."],
    dont: ["No lo uses en formularios de creación donde inicio y fin necesitan validación propia: usa DualDateRangePicker.", "No cambies `value` desde fuera mientras el usuario está eligiendo el segundo extremo."],
  },
  related: ["date-picker", "dual-date-range-picker", "date-filter-bar", "calendar", "date-utils"],
});
