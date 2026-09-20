import * as React from "react";
import { DateFilterBar, formatDate, formatDateRange } from "@/components/date";
import type { DateFilterMode } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "./_shared";

type Range = { from?: Date; to?: Date } | undefined;
const MODES = ["period", "date", "range"] as const;

function useFilterState(initialMode: DateFilterMode = "period") {
  const [mode, setMode] = React.useState<DateFilterMode>(initialMode);
  const [period, setPeriod] = React.useState<string | undefined>("last_30_days");
  const [date, setDate] = React.useState<Date | undefined>();
  const [range, setRange] = React.useState<Range>();
  return { mode, setMode, period, setPeriod, date, setDate, range, setRange };
}

function summary(s: ReturnType<typeof useFilterState>) {
  if (s.mode === "period") return s.period ?? "";
  if (s.mode === "date") return formatDate(s.date, "es-ES");
  return formatDateRange(s.range?.from, s.range?.to, "es-ES");
}

function PlaygroundDemo({ mode, disabled }: { mode: string; disabled: boolean }) {
  const s = useFilterState(mode as DateFilterMode);
  React.useEffect(() => s.setMode(mode as DateFilterMode), [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="w-full space-y-3">
      <DateFilterBar mode={s.mode} onModeChange={s.setMode} period={s.period} onPeriodChange={s.setPeriod} date={s.date} onDateChange={s.setDate} range={s.range} onRangeChange={s.setRange} disabled={disabled} />
      <ValueReadout label="Filtro activo" value={`${s.mode} · ${summary(s)}`} />
    </div>
  );
}

function BasicDemo() {
  const s = useFilterState();
  return (
    <div className="w-full space-y-3">
      <DateFilterBar mode={s.mode} onModeChange={s.setMode} period={s.period} onPeriodChange={s.setPeriod} date={s.date} onDateChange={s.setDate} range={s.range} onRangeChange={s.setRange} />
      <ValueReadout label="Filtro activo" value={`${s.mode} · ${summary(s)}`} />
    </div>
  );
}

function RangeFirstDemo() {
  const s = useFilterState("range");
  return (
    <div className="w-full space-y-3">
      <DateFilterBar mode={s.mode} onModeChange={s.setMode} period={s.period} onPeriodChange={s.setPeriod} date={s.date} onDateChange={s.setDate} range={s.range} onRangeChange={s.setRange} />
      <ValueReadout label="Rango" value={formatDateRange(s.range?.from, s.range?.to, "es-ES")} />
    </div>
  );
}

function DisabledDemo() {
  return <DateFilterBar mode="date" date={new Date(2026, 8, 9)} disabled />;
}

export const dateFilterBarEntry = defineEntry({
  id: "date-filter-bar",
  name: "DateFilterBar",
  group: "date",
  description:
    "Barra horizontal que compone PeriodSelector, DatePicker y DateRangePicker detrás de un select de modo. Todo el estado es controlado por el padre, que decide qué hacer con periodo, fecha o rango.",
  importPath: 'import { DateFilterBar } from "@/components/date"',
  sourcePath: "src/components/date/DateFilterBar.tsx",
  status: "stable",
  tags: ["compuesto", "controlado", "filtros"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      mode: { type: "select", label: "Modo", options: MODES, default: "period" },
      disabled: { type: "boolean", default: false },
    },
    render: ({ mode, disabled }) => <PlaygroundDemo key={mode} mode={mode} disabled={disabled} />,
    code: ({ mode, disabled }) => `const [mode, setMode] = React.useState<DateFilterMode>("${mode}")

<DateFilterBar
  mode={mode}
  onModeChange={setMode}
  period={period}
  onPeriodChange={setPeriod}
  date={date}
  onDateChange={setDate}
  range={range}
  onRangeChange={setRange}${disabled ? "\n  disabled" : ""}
/>`,
  }),
  examples: [
    {
      id: "basic",
      title: "Totalmente controlada",
      description: "Cambia el modo y verás cómo el padre conserva cada valor por separado.",
      layout: "stretch",
      frameClassName: "min-h-[420px] items-start pt-8",
      code: `const [mode, setMode] = React.useState<DateFilterMode>("period")
const [period, setPeriod] = React.useState<string>("last_30_days")
const [date, setDate] = React.useState<Date>()
const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateFilterBar
  mode={mode}
  onModeChange={setMode}
  period={period}
  onPeriodChange={setPeriod}
  date={date}
  onDateChange={setDate}
  range={range}
  onRangeChange={setRange}
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "range-first",
      title: "Arrancando en modo rango",
      description: "El modo inicial lo fija el padre; aquí se resume el rango con `formatDateRange`.",
      layout: "stretch",
      frameClassName: "min-h-[460px] items-start pt-8",
      code: `const [mode, setMode] = React.useState<DateFilterMode>("range")

<DateFilterBar mode={mode} onModeChange={setMode} range={range} onRangeChange={setRange} /* ... */ />
<p>{formatDateRange(range?.from, range?.to, "es-ES")}</p>`,
      render: () => <RangeFirstDemo />,
    },
    {
      id: "disabled",
      title: "Deshabilitada",
      description: "`disabled` bloquea el selector de modo y el control activo a la vez.",
      layout: "stretch",
      code: `<DateFilterBar mode="date" date={new Date(2026, 8, 9)} disabled />`,
      render: () => <DisabledDemo />,
    },
  ],
  props: [
    { name: "mode", type: '"period" | "date" | "range"', default: '"period"', description: "Modo activo; decide qué control se muestra." },
    { name: "onModeChange", type: "(mode: DateFilterMode) => void", description: "Se dispara al cambiar el select de modo." },
    { name: "period", type: "string", description: "Valor del PeriodSelector (modo `period`)." },
    { name: "onPeriodChange", type: "(value: string) => void", description: "Cambio de periodo." },
    { name: "date", type: "Date", description: "Fecha del DatePicker (modo `date`)." },
    { name: "onDateChange", type: "(date?: Date) => void", description: "Cambio de fecha." },
    { name: "range", type: "{ from?: Date; to?: Date }", description: "Rango del DateRangePicker (modo `range`)." },
    { name: "onRangeChange", type: "(range?: { from?: Date; to?: Date }) => void", description: "Cambio de rango." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva toda la barra." },
    { name: "className", type: "string", description: "Clases extra para el contenedor flex." },
  ],
  guidelines: {
    do: ["Úsala como cabecera de filtros en dashboards e informes.", "Conserva los tres valores en el padre para que cambiar de modo no pierda lo elegido."],
    dont: ["No la uses en formularios: sus etiquetas fijas y su disposición horizontal son de filtro.", "No la coloques en contenedores estrechos (<420px): los controles se apilan y pierden la lectura horizontal."],
  },
  related: ["period-selector", "date-picker", "date-range-picker", "select", "date-utils"],
});
