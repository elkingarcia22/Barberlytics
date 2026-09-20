import * as React from "react";
import { addDays, startOfToday } from "date-fns";
import {
  DatePicker,
  compareDates,
  endOfDay,
  formatDate,
  formatDateRange,
  formatMonthYear,
  formatQuarter,
  getQuarterFromDate,
  isDateInRange,
  isValidDate,
  startOfDay,
} from "@/components/date";
import { defineEntry } from "../types";
import { PICKER_FRAME } from "./_shared";

function ResultTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="w-full text-[13px]">
      <tbody>
        {rows.map(([expr, result]) => (
          <tr key={expr} className="border-b border-border/40 last:border-0">
            <td className="py-1.5 pr-4 font-mono text-[12px] text-text-secondary">{expr}</td>
            <td className="py-1.5 font-mono text-[12px] font-medium text-text-primary">{result}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FormattingDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 8, 9));
  const to = date ? addDays(date, 14) : undefined;
  return (
    <div className="w-full max-w-xl space-y-4">
      <DatePicker value={date} onChange={setDate} label="Fecha de referencia" locale="es-ES" className="w-64" />
      <ResultTable
        rows={[
          ['formatDate(date, "es-ES")', formatDate(date, "es-ES")],
          ['formatDate(date, "en-US")', formatDate(date, "en-US")],
          ['formatDate(date, "de-DE")', formatDate(date, "de-DE")],
          ['formatDateRange(date, addDays(date, 14), "es-ES")', formatDateRange(date, to, "es-ES")],
          ["formatDateRange(date, undefined)", formatDateRange(date, undefined)],
          ["formatDate(undefined)", JSON.stringify(formatDate(undefined))],
        ]}
      />
    </div>
  );
}

function PeriodsDemo() {
  const now = new Date();
  return (
    <div className="w-full max-w-xl">
      <ResultTable
        rows={[
          [`formatMonthYear(${now.getFullYear()}, ${now.getMonth()}, "es-ES")`, formatMonthYear(now.getFullYear(), now.getMonth(), "es-ES")],
          ["formatMonthYear(2026, 0)", formatMonthYear(2026, 0)],
          ["getQuarterFromDate(new Date())", String(getQuarterFromDate(now))],
          [`formatQuarter(${now.getFullYear()}, getQuarterFromDate(now))`, formatQuarter(now.getFullYear(), getQuarterFromDate(now))],
          ["getQuarterFromDate(new Date(2026, 11, 31))", String(getQuarterFromDate(new Date(2026, 11, 31)))],
        ]}
      />
    </div>
  );
}

function ComparisonDemo() {
  const today = startOfToday();
  const [date, setDate] = React.useState<Date | undefined>(addDays(today, 5));
  const min = addDays(today, -7);
  const max = addDays(today, 7);
  return (
    <div className="w-full max-w-xl space-y-4">
      <DatePicker value={date} onChange={setDate} label="Fecha a comparar" description="La ventana es hoy ± 7 días." locale="es-ES" className="w-64" />
      <ResultTable
        rows={[
          ["isValidDate(date)", String(isValidDate(date))],
          ['isValidDate(new Date("nope"))', String(isValidDate(new Date("nope")))],
          ["isDateInRange(date, hoy - 7, hoy + 7)", date ? String(isDateInRange(date, min, max)) : "—"],
          ["compareDates(date, hoy)", date ? String(compareDates(date, today)) : "—"],
          ["startOfDay(date).toISOString()", date ? startOfDay(date).toISOString() : "—"],
          ["endOfDay(date).toISOString()", date ? endOfDay(date).toISOString() : "—"],
        ]}
      />
    </div>
  );
}

export const dateUtilsEntry = defineEntry({
  id: "date-utils",
  name: "Utilidades de fecha",
  group: "date",
  description:
    "Funciones puras sobre Date nativo e Intl.DateTimeFormat que usan todos los pickers: formateo por locale, rangos, comparación sin hora y límites de día. No dependen de ninguna librería externa.",
  importPath: 'import { formatDate, formatDateRange, isDateInRange } from "@/components/date"',
  sourcePath: "src/components/date/dateUtils.ts",
  status: "stable",
  tags: ["intl", "sin dependencias", "puro"],
  examples: [
    {
      id: "formatting",
      title: "Formateo por locale",
      description: "`formatDate` devuelve día, mes y año numéricos en el orden del locale; con valores vacíos devuelve cadena vacía.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `formatDate(date, "es-ES")                 // "09/09/2026"
formatDate(date, "en-US")                 // "09/09/2026" (MM/DD/YYYY)
formatDate(date, "de-DE")                 // "09.09.2026"
formatDateRange(from, to, "es-ES")        // "09/09/2026 - 23/09/2026"
formatDateRange(from, undefined)          // solo el inicio
formatDate(undefined)                     // ""`,
      render: () => <FormattingDemo />,
    },
    {
      id: "periods",
      title: "Meses y trimestres",
      description: "Las mismas funciones que muestran el valor en MonthPicker y QuarterSelector.",
      layout: "start",
      code: `formatMonthYear(2026, 8, "es-ES")   // "septiembre de 2026" (mes base cero)
formatMonthYear(2026, 0)            // "January 2026"
getQuarterFromDate(new Date())      // 1 | 2 | 3 | 4
formatQuarter(2026, 3)              // "Q3 2026"`,
      render: () => <PeriodsDemo />,
    },
    {
      id: "comparison",
      title: "Validación, rango y límites de día",
      description: "`compareDates` ignora la hora; `startOfDay`/`endOfDay` devuelven copias nuevas sin mutar la entrada.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `isValidDate(date)                       // true si es Date y no es NaN
isDateInRange(date, min, max)           // ambos límites inclusivos y opcionales
compareDates(a, b)                      // -1 | 0 | 1, solo por fecha
startOfDay(date)                        // 00:00:00.000 local
endOfDay(date)                          // 23:59:59.999 local`,
      render: () => <ComparisonDemo />,
    },
  ],
  props: [
    { name: "isValidDate", type: "(value: unknown) => value is Date", description: "Type guard: `Date` real cuyo tiempo no es NaN." },
    { name: "formatDate", type: "(date?: Date | null, locale?: string) => string", default: 'locale "en-US"', description: "Fecha numérica corta según el locale; cadena vacía si no hay fecha." },
    { name: "formatDateRange", type: "(from?: Date | null, to?: Date | null, locale?: string) => string", default: 'locale "en-US"', description: "`from - to`; si falta un extremo devuelve solo el otro." },
    { name: "isDateInRange", type: "(date: Date, min?: Date, max?: Date) => boolean", description: "Comprueba límites inclusivos; los límites inválidos se ignoran." },
    { name: "compareDates", type: "(a: Date, b: Date) => -1 | 0 | 1", description: "Compara solo año, mes y día." },
    { name: "startOfDay", type: "(date: Date) => Date", description: "Copia a las 00:00:00.000." },
    { name: "endOfDay", type: "(date: Date) => Date", description: "Copia a las 23:59:59.999." },
    { name: "formatMonthYear", type: "(year: number, month: number, locale?: string) => string", default: 'locale "en-US"', description: "Mes largo y año; `month` es base cero." },
    { name: "formatQuarter", type: "(year: number, quarter: 1 | 2 | 3 | 4, locale?: string) => string", description: "Devuelve `Q<n> <año>`; el locale se reserva para futuro." },
    { name: "getQuarterFromDate", type: "(date: Date) => 1 | 2 | 3 | 4", description: "Trimestre natural de la fecha." },
  ],
  guidelines: {
    do: ["Formatea siempre con estas funciones para que pickers y tablas coincidan.", "Pasa el mismo `locale` que usas en los pickers.", "Usa `startOfDay`/`endOfDay` al construir filtros de rango para incluir el día completo."],
    dont: ["No compares fechas con `===`; usa `compareDates`.", "No reimplementes el formateo con `toLocaleDateString` suelto por la app."],
  },
  related: ["date-picker", "date-range-picker", "month-picker", "quarter-selector"],
});
