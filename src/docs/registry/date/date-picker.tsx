import * as React from "react";
import { addDays, format, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { DatePicker } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { PICKER_FRAME, ValueReadout } from "./_shared";

const readable = (date?: Date) => (date ? format(date, "PPP", { locale: es }) : "");

function PlaygroundDemo({ label, placeholder, description, error, disabled, onlyFuture }: { label: string; placeholder: string; description: string; error: string; disabled: boolean; onlyFuture: boolean }) {
  const [date, setDate] = React.useState<Date | undefined>();
  return (
    <div className="w-72 space-y-3">
      <DatePicker
        value={date}
        onChange={setDate}
        label={label || undefined}
        placeholder={placeholder}
        description={description || undefined}
        error={error || undefined}
        disabled={disabled}
        minDate={onlyFuture ? startOfToday() : undefined}
        locale="es-ES"
      />
      <ValueReadout value={readable(date)} />
    </div>
  );
}

function BasicDemo() {
  const [date, setDate] = React.useState<Date | undefined>();
  return (
    <div className="w-72 space-y-3">
      <DatePicker value={date} onChange={setDate} label="Fecha de entrega" placeholder="Elige una fecha" locale="es-ES" />
      <ValueReadout value={readable(date)} />
    </div>
  );
}

function BoundedDemo() {
  const today = startOfToday();
  const [date, setDate] = React.useState<Date | undefined>(addDays(today, 3));
  return (
    <div className="w-72 space-y-3">
      <DatePicker
        value={date}
        onChange={setDate}
        label="Fecha de inicio"
        description="Solo dentro de los próximos 30 días."
        minDate={today}
        maxDate={addDays(today, 30)}
        locale="es-ES"
      />
      <ValueReadout value={readable(date)} />
    </div>
  );
}

function StatesDemo() {
  const [date, setDate] = React.useState<Date | undefined>();
  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-3">
      <DatePicker value={date} onChange={setDate} label="Con descripción" description="Formato dd/mm/aaaa." locale="es-ES" />
      <DatePicker value={date} onChange={setDate} label="Con error" error="La fecha es obligatoria." locale="es-ES" />
      <DatePicker value={date} onChange={setDate} label="Deshabilitado" disabled locale="es-ES" />
    </div>
  );
}

function LocaleDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 8, 9));
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <DatePicker value={date} onChange={setDate} label="es-ES" locale="es-ES" />
      <DatePicker value={date} onChange={setDate} label="en-US (por defecto)" />
    </div>
  );
}

export const datePickerEntry = defineEntry({
  id: "date-picker",
  name: "DatePicker",
  group: "date",
  description:
    "Selector de una sola fecha que combina Popover y Calendar en un campo con etiqueta, ayuda y error. Trabaja con Date nativo y formatea el valor con Intl según el locale indicado.",
  importPath: 'import { DatePicker } from "@/components/date"',
  sourcePath: "src/components/date/DatePicker.tsx",
  status: "stable",
  tags: ["controlado", "popover", "calendar"],
  playground: definePlayground({
    layout: "start",
    controls: {
      label: { type: "text", default: "Fecha de entrega" },
      placeholder: { type: "text", default: "Elige una fecha" },
      description: { type: "text", label: "Descripción", default: "" },
      error: { type: "text", default: "" },
      disabled: { type: "boolean", default: false },
      onlyFuture: { type: "boolean", label: "Solo desde hoy (minDate)", default: false },
    },
    render: (values) => <PlaygroundDemo {...values} />,
    code: ({ label, placeholder, description, error, disabled, onlyFuture }) => {
      const attrs = [
        label ? `label="${label}"` : "",
        `placeholder="${placeholder}"`,
        description ? `description="${description}"` : "",
        error ? `error="${error}"` : "",
        disabled ? "disabled" : "",
        onlyFuture ? "minDate={startOfToday()}" : "",
        'locale="es-ES"',
      ].filter(Boolean);
      return `const [date, setDate] = React.useState<Date | undefined>()

<DatePicker
  value={date}
  onChange={setDate}
  ${attrs.join("\n  ")}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado",
      description: "El valor vive en el padre; el picker solo notifica la fecha elegida (o `undefined` al deseleccionar).",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `const [date, setDate] = React.useState<Date | undefined>()

<DatePicker
  value={date}
  onChange={setDate}
  label="Fecha de entrega"
  placeholder="Elige una fecha"
  locale="es-ES"
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "bounded",
      title: "Con fechas mínima y máxima",
      description: "Los días fuera de `minDate`/`maxDate` se deshabilitan en el calendario y se ignoran si llegan por props.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `const today = startOfToday()
const [date, setDate] = React.useState<Date | undefined>(addDays(today, 3))

<DatePicker
  value={date}
  onChange={setDate}
  label="Fecha de inicio"
  description="Solo dentro de los próximos 30 días."
  minDate={today}
  maxDate={addDays(today, 30)}
  locale="es-ES"
/>`,
      render: () => <BoundedDemo />,
    },
    {
      id: "states",
      title: "Descripción, error y deshabilitado",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `<DatePicker value={date} onChange={setDate} label="Con descripción" description="Formato dd/mm/aaaa." locale="es-ES" />
<DatePicker value={date} onChange={setDate} label="Con error" error="La fecha es obligatoria." locale="es-ES" />
<DatePicker value={date} onChange={setDate} label="Deshabilitado" disabled locale="es-ES" />`,
      render: () => <StatesDemo />,
    },
    {
      id: "locale",
      title: "Locale",
      description: "`locale` cambia el formato del campo y, si empieza por `es`, también los nombres de meses y días del calendario.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `<DatePicker value={date} onChange={setDate} label="es-ES" locale="es-ES" />
<DatePicker value={date} onChange={setDate} label="en-US (por defecto)" />`,
      render: () => <LocaleDemo />,
    },
  ],
  props: [
    { name: "value", type: "Date | null", description: "Fecha seleccionada. Las fechas inválidas o fuera de rango se muestran como vacías." },
    { name: "onChange", type: "(date: Date | undefined) => void", description: "Se dispara al elegir un día; `undefined` al deseleccionarlo." },
    { name: "placeholder", type: "string", default: '"Select a date"', description: "Texto del campo cuando no hay valor." },
    { name: "label", type: "string", description: "Etiqueta visible enlazada al botón por `aria-labelledby`." },
    { name: "description", type: "string", description: "Texto de ayuda bajo el campo." },
    { name: "error", type: "string", description: "Mensaje de error; activa el estado destructivo del campo." },
    { name: "minDate", type: "Date", description: "Primer día seleccionable (inclusive)." },
    { name: "maxDate", type: "Date", description: "Último día seleccionable (inclusive)." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el campo y baja la opacidad de la etiqueta." },
    { name: "locale", type: "string", default: '"en-US"', description: "Código Intl para formatear el valor; con `es*` el calendario también se traduce." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Pasa `locale=\"es-ES\"` en producto para que campo y calendario hablen el mismo idioma.", "Limita con `minDate`/`maxDate` cuando el dominio lo exige (fechas futuras, cierre de periodo).", "Usa `error` con un mensaje accionable, no solo un borde rojo."],
    dont: ["No lo uses para rangos: existe DateRangePicker.", "No mezcles el formato Intl del campo con otro formato en el resto de la pantalla."],
  },
  related: ["date-range-picker", "calendar", "popover", "date-utils"],
});
