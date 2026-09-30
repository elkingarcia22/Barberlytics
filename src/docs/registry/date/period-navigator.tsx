import * as React from "react";
import { PeriodNavigator, formatPeriodLabel, periodRange, toIsoDate, type PeriodGranularity } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "./_shared";

const LABELS = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  today: "Ir a hoy",
  previous: "Periodo anterior",
  next: "Periodo siguiente",
  aria: "Periodo",
};

const LABELS_SNIPPET = `const labels = {
  day: "Día", week: "Semana", month: "Mes",
  today: "Ir a hoy", previous: "Periodo anterior", next: "Periodo siguiente", aria: "Periodo",
};`;

function Demo({ initial = "month", locale = "es-CO", clampToToday = true }: { initial?: PeriodGranularity; locale?: string; clampToToday?: boolean }) {
  const [granularity, setGranularity] = React.useState<PeriodGranularity>(initial);
  const [date, setDate] = React.useState(() => new Date());
  const range = periodRange(date, granularity);
  return (
    <div className="w-full space-y-3">
      <PeriodNavigator
        granularity={granularity}
        onGranularityChange={setGranularity}
        date={date}
        onDateChange={setDate}
        labels={LABELS}
        locale={locale}
        clampToToday={clampToToday}
      />
      <ValueReadout label="Consulta" value={`granularity=${granularity} · from=${toIsoDate(range.from)} · to=${toIsoDate(range.to)}`} />
    </div>
  );
}

const GRANULARITIES = ["day", "week", "month"] as const;

export const periodNavigatorEntry = defineEntry({
  id: "period-navigator",
  name: "PeriodNavigator",
  group: "date",
  description:
    "La barra de tiempo de un tablero: el grano (día, semana, mes), el periodo que se está mirando y las flechas para moverlo. Cambiar de grano conserva la fecha ancla, el rótulo sale de Intl con el idioma que se le pase y el salto adelante se frena en hoy. Trae en periodRange las utilidades que calculan el rango y el periodo anterior, para que la consulta y la barra digan lo mismo.",
  importPath: 'import { PeriodNavigator, periodRange, previousPeriodRange } from "@/components/date"',
  sourcePath: "src/components/date/PeriodNavigator.tsx",
  status: "stable",
  tags: ["periodo", "fecha", "dashboard", "filtro"],
  playground: definePlayground({
    controls: {
      granularity: { type: "select", label: "Grano inicial", options: GRANULARITIES, default: "month" },
      locale: { type: "select", label: "Idioma", options: ["es-CO", "en-US"], default: "es-CO" },
      clampToToday: { type: "boolean", label: "Frenar en hoy", default: true },
    },
    layout: "start",
    // El grano inicial remonta la demo (`key`) en vez de sincronizarse con un efecto.
    render: ({ granularity, locale, clampToToday }) => <Demo key={granularity} initial={granularity as PeriodGranularity} locale={locale} clampToToday={clampToToday} />,
    code: ({ granularity, locale, clampToToday }) => `${LABELS_SNIPPET}

<PeriodNavigator
  granularity={granularity}   // "${granularity}"
  onGranularityChange={setGranularity}
  date={date}
  onDateChange={setDate}
  labels={labels}
  locale="${locale}"${clampToToday ? "" : "\n  clampToToday={false}"}
/>`,
  }),
  examples: [
    {
      id: "consulta",
      title: "De la barra a la consulta",
      description:
        "`periodRange(date, granularity)` devuelve el rango que la barra está enseñando y `previousPeriodRange` el de comparar. La pantalla guarda solo la fecha ancla y el grano (en la URL) y deriva el resto: así el backend, la píldora de variación y el rótulo hablan del mismo periodo.",
      layout: "start",
      code: `const { from, to } = periodRange(date, granularity);
const previous = previousPeriodRange(date, granularity);
// GET /metrics/business?granularity=week&date=2026-09-28

<PeriodNavigator granularity={granularity} onGranularityChange={setGranularity} date={date} onDateChange={setDate} labels={labels} />`,
      render: () => <Demo initial="week" />,
    },
    {
      id: "rotulos",
      title: "Los rótulos que escribe",
      description: "Un día, una semana y un mes con el mismo ancla, en español y en inglés. La primera letra va en mayúscula; el resto respeta la convención del idioma.",
      layout: "start",
      code: `formatPeriodLabel(date, "day", "es-CO")   // "Lunes, 28 de septiembre"
formatPeriodLabel(date, "week", "es-CO")  // "28 sept – 4 oct 2026"
formatPeriodLabel(date, "month", "en-US") // "September 2026"`,
      render: () => {
        const anchor = new Date(2026, 8, 28);
        return (
          <ul className="space-y-1 text-sm text-text-primary">
            {GRANULARITIES.map((granularity) => (
              <li key={granularity} className="flex gap-3">
                <span className="w-16 text-text-muted">{granularity}</span>
                <span>{formatPeriodLabel(anchor, granularity, "es-CO")}</span>
                <span className="text-text-secondary">{formatPeriodLabel(anchor, granularity, "en-US")}</span>
              </li>
            ))}
          </ul>
        );
      },
    },
  ],
  props: [
    { name: "granularity", type: '"day" | "week" | "month"', description: "El grano del periodo. Es controlado." },
    { name: "onGranularityChange", type: "(granularity) => void", description: "Al cambiar de grano. La fecha ancla se conserva." },
    { name: "date", type: "Date", description: "La fecha ancla: cualquier día dentro del periodo que se mira." },
    { name: "onDateChange", type: "(date: Date) => void", description: "Al pulsar una flecha o «ir a hoy». Devuelve un nuevo `Date`, nunca muta el que recibió." },
    { name: "labels", type: "PeriodNavigatorLabels", description: "Los rótulos traducidos: los tres granos, «ir a hoy», anterior, siguiente y el aria del grupo." },
    { name: "locale", type: "string", default: '"es-CO"', description: "Con qué idioma escribe el periodo." },
    { name: "clampToToday", type: "boolean", default: "true", description: "Desactiva la flecha de avance cuando el periodo ya incluye hoy." },
  ],
  guidelines: {
    do: [
      "Guarda el grano y la fecha ancla en la URL (`?period=week&date=2026-09-28`) y deriva el rango con `periodRange`.",
      "Pasa el idioma activo (`useLocale().current.intl`), no uno escrito a mano.",
      "Mantén la consulta y la comparación sobre `periodRange` y `previousPeriodRange`: si divergen, la píldora de variación miente.",
    ],
    dont: [
      "No lo uses para elegir un rango libre; para eso está `DateRangePicker`.",
      "No dejes avanzar al futuro en un tablero de lo que ya pasó: enseñaría un periodo vacío como si fuera un dato.",
    ],
  },
  related: ["date-filter-bar", "period-selector", "date-range-picker", "segmented-control"],
});
