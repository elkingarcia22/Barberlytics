import * as React from "react";
import { addDays, format, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { DualDateRangePicker } from "@/components/date";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout, WIDE_PICKER_FRAME } from "./_shared";

type DualRange = { startDate: Date | undefined; endDate: Date | undefined };
const EMPTY: DualRange = { startDate: undefined, endDate: undefined };
const readable = (d?: Date) => (d ? format(d, "d MMM yyyy", { locale: es }) : "…");

function PlaygroundDemo({ startLabel, endLabel, disabled, autoCloseOnStartSelect, withErrors }: { startLabel: string; endLabel: string; disabled: boolean; autoCloseOnStartSelect: boolean; withErrors: boolean }) {
  const [range, setRange] = React.useState<DualRange>(EMPTY);
  return (
    <div className="w-full max-w-xl space-y-3">
      <DualDateRangePicker
        startDate={range.startDate}
        endDate={range.endDate}
        onChange={setRange}
        startLabel={startLabel}
        endLabel={endLabel}
        disabled={disabled}
        autoCloseOnStartSelect={autoCloseOnStartSelect}
        startError={withErrors ? "Indica la fecha de inicio." : undefined}
        endError={withErrors ? "Indica la fecha de cierre." : undefined}
      />
      <ValueReadout value={`${readable(range.startDate)} → ${readable(range.endDate)}`} />
    </div>
  );
}

function BasicDemo() {
  const [range, setRange] = React.useState<DualRange>(EMPTY);
  const [applied, setApplied] = React.useState(0);
  return (
    <div className="w-full max-w-xl space-y-3">
      <DualDateRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} onApply={() => setApplied((n) => n + 1)} />
      <ValueReadout value={`${readable(range.startDate)} → ${readable(range.endDate)}`} />
      <ValueReadout label="Veces aplicado" value={String(applied)} />
    </div>
  );
}

function PresetDemo() {
  const [range, setRange] = React.useState<DualRange>(EMPTY);
  const [open, setOpen] = React.useState(false);
  const applyPreset = (days: number) => {
    const start = startOfToday();
    setRange({ startDate: start, endDate: addDays(start, days) });
    setOpen(true);
  };
  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex flex-wrap gap-2" data-period-picker="">
        <Button size="sm" variant="outline" onClick={() => applyPreset(7)}>7 días</Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset(30)}>30 días</Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset(90)}>90 días</Button>
      </div>
      <DualDateRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} open={open} onOpenChange={setOpen} startLabel="Inicio de la campaña" endLabel="Cierre de la campaña" />
      <ValueReadout value={`${readable(range.startDate)} → ${readable(range.endDate)}`} />
    </div>
  );
}

function BoundedDemo() {
  const today = startOfToday();
  const [range, setRange] = React.useState<DualRange>(EMPTY);
  return (
    <div className="w-full max-w-xl space-y-3">
      <DualDateRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} minDate={today} maxDate={addDays(today, 60)} startPlaceholder="Desde hoy" endPlaceholder="Máx. 60 días" />
      <ValueReadout value={`${readable(range.startDate)} → ${readable(range.endDate)}`} />
    </div>
  );
}

export const dualDateRangePickerEntry = defineEntry({
  id: "dual-date-range-picker",
  name: "DualDateRangePicker",
  group: "date",
  description:
    "Dos campos (inicio y cierre) que comparten un calendario de dos meses con pasos guiados, previsualización al pasar el ratón y confirmación explícita con Aplicar. Pensado para crear campañas o programas donde ambos extremos son obligatorios.",
  importPath: 'import { DualDateRangePicker } from "@/components/date"',
  sourcePath: "src/components/date/DualDateRangePicker.tsx",
  status: "stable",
  tags: ["controlado", "popover", "calendar", "flujo por pasos"],
  playground: definePlayground({
    layout: "start",
    controls: {
      startLabel: { type: "text", label: "Etiqueta inicio", default: "Fecha de inicio" },
      endLabel: { type: "text", label: "Etiqueta cierre", default: "Fecha de cierre" },
      autoCloseOnStartSelect: { type: "boolean", label: "Cerrar al elegir inicio", default: false },
      withErrors: { type: "boolean", label: "Con errores", default: false },
      disabled: { type: "boolean", default: false },
    },
    render: (values) => <PlaygroundDemo {...values} />,
    code: ({ startLabel, endLabel, disabled, autoCloseOnStartSelect, withErrors }) => {
      const attrs = [
        `startLabel="${startLabel}"`,
        `endLabel="${endLabel}"`,
        autoCloseOnStartSelect ? "autoCloseOnStartSelect" : "",
        withErrors ? 'startError="Indica la fecha de inicio."\n  endError="Indica la fecha de cierre."' : "",
        disabled ? "disabled" : "",
      ].filter(Boolean);
      return `const [range, setRange] = React.useState({ startDate: undefined, endDate: undefined })

<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  ${attrs.join("\n  ")}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Flujo inicio → cierre",
      description: "Al elegir el inicio el calendario avanza solo al cierre; el popover se cierra con Aplicar o Borrar, no al hacer clic fuera.",
      layout: "start",
      frameClassName: WIDE_PICKER_FRAME,
      code: `const [range, setRange] = React.useState({ startDate: undefined, endDate: undefined })

<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  onApply={() => guardar(range)}
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "presets",
      title: "Apertura controlada desde un preset",
      description: "Con `open`/`onOpenChange` un botón de duración fija las fechas y abre el calendario para confirmarlas. Los presets llevan `data-period-picker` para que su clic no quede bloqueado por el popover.",
      layout: "start",
      frameClassName: WIDE_PICKER_FRAME,
      code: `const [open, setOpen] = React.useState(false)
const applyPreset = (days: number) => {
  const start = startOfToday()
  setRange({ startDate: start, endDate: addDays(start, days) })
  setOpen(true)
}

<div data-period-picker="">
  <Button onClick={() => applyPreset(7)}>7 días</Button>
</div>
<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  open={open}
  onOpenChange={setOpen}
/>`,
      render: () => <PresetDemo />,
    },
    {
      id: "bounded",
      title: "Con límites y placeholders",
      layout: "start",
      frameClassName: WIDE_PICKER_FRAME,
      code: `<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  minDate={today}
  maxDate={addDays(today, 60)}
  startPlaceholder="Desde hoy"
  endPlaceholder="Máx. 60 días"
/>`,
      render: () => <BoundedDemo />,
    },
  ],
  props: [
    { name: "startDate", type: "Date | null", description: "Fecha de inicio controlada." },
    { name: "endDate", type: "Date | null", description: "Fecha de cierre controlada." },
    { name: "onChange", type: "(range: { startDate?: Date; endDate?: Date }) => void", description: "Se dispara en cada clic de día y al borrar o aplicar." },
    { name: "onApply", type: "() => void", description: "Se dispara al pulsar Aplicar, después de `onChange`." },
    { name: "startLabel", type: "string", default: '"Fecha de inicio"', description: "Etiqueta del primer campo." },
    { name: "endLabel", type: "string", default: '"Fecha de cierre"', description: "Etiqueta del segundo campo." },
    { name: "startPlaceholder", type: "string", default: '"Selecciona fecha"', description: "Placeholder del campo de inicio." },
    { name: "endPlaceholder", type: "string", default: '"Selecciona fecha"', description: "Placeholder del campo de cierre." },
    { name: "startError", type: "string", description: "Error bajo el campo de inicio." },
    { name: "endError", type: "string", description: "Error bajo el campo de cierre." },
    { name: "minDate", type: "Date", description: "Primer día seleccionable." },
    { name: "maxDate", type: "Date", description: "Último día seleccionable." },
    { name: "autoCloseOnStartSelect", type: "boolean", default: "false", description: "Cierra el popover tras elegir el inicio en lugar de avanzar al cierre." },
    { name: "open", type: "boolean", description: "Estado abierto controlado; combínalo con `onOpenChange`." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Notifica aperturas y cierres del popover." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva ambos campos." },
    { name: "locale", type: "string", default: '"es"', description: "Locale para el formato `Mié. 9 sep. 2026` de los campos y el calendario." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Úsalo cuando inicio y cierre son campos de un formulario y cada uno puede tener su error.", "Dale al menos ~560px de ancho: el popover se alinea al ancho de los dos campos.", "Usa `onApply` para persistir y `onChange` solo para reflejar el estado."],
    dont: ["No lo uses como filtro rápido de tabla: ahí basta DateRangePicker.", "No cierres el popover desde fuera sin `open` controlado; el usuario espera confirmar con Aplicar."],
  },
  related: ["date-range-picker", "date-picker", "calendar", "popover"],
});
