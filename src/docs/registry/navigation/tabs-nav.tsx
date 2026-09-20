import * as React from "react";
import { TabsNav } from "@/components/navigation";
import type { Tab } from "@/components/navigation";
import { defineEntry, definePlayground } from "../types";

const PERIOD_TABS: Tab[] = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "quarter", label: "Trimestre" },
  { id: "year", label: "Año" },
];

const SECTION_TABS: Tab[] = [
  { id: "overview", label: "Resumen" },
  { id: "team", label: "Equipo" },
  { id: "goals", label: "Objetivos" },
  { id: "history", label: "Historial" },
];

const COPY: Record<string, string> = {
  overview: "Indicadores del ciclo actual y avance global.",
  team: "Las 14 personas del equipo y su estado de evaluación.",
  goals: "Objetivos vigentes con su porcentaje de cumplimiento.",
  history: "Ciclos anteriores y comparativas.",
};

function PlaygroundDemo({ count, compact }: { count: number; compact: boolean }) {
  const tabs = PERIOD_TABS.slice(0, count);
  const [active, setActive] = React.useState(tabs[0].id);
  return <TabsNav tabs={tabs} activeTabId={active} onTabChange={setActive} className={compact ? "w-auto rounded-full border border-border/60 px-2 py-1.5" : undefined} />;
}

function PanelDemo() {
  const [active, setActive] = React.useState("overview");
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/60 bg-surface">
      <TabsNav tabs={SECTION_TABS} activeTabId={active} onTabChange={setActive} className="border-b border-border/60" />
      <div className="p-6">
        <h3 className="text-base font-semibold text-text-primary">{SECTION_TABS.find((tab) => tab.id === active)?.label}</h3>
        <p className="mt-1 text-[13px] text-text-secondary">{COPY[active]}</p>
      </div>
    </div>
  );
}

function CompactDemo() {
  const [active, setActive] = React.useState("month");
  return (
    <div className="flex items-center gap-4">
      <span className="text-[13px] font-medium text-text-secondary">Periodo</span>
      <TabsNav tabs={PERIOD_TABS} activeTabId={active} onTabChange={setActive} className="w-auto rounded-full border border-border/60 px-2 py-1.5" />
    </div>
  );
}

export const tabsNavEntry = defineEntry({
  id: "tabs-nav",
  name: "TabsNav",
  group: "navigation",
  description:
    "Una fila de píldoras para cambiar de vista: la activa se rellena en primario y las demás quedan en texto apagado. Es la versión más ligera de tabs del sistema, sin track ni animación, pensada para filtros y periodos.",
  importPath: 'import { TabsNav } from "@/components/navigation"',
  sourcePath: "src/components/navigation/TabsNav.tsx",
  status: "stable",
  tags: ["controlled", "pills"],
  playground: definePlayground({
    controls: {
      count: { type: "number", label: "Pestañas", default: 4, min: 2, max: 4, step: 1 },
      compact: { type: "boolean", label: "Compacto", default: false },
    },
    layout: "stretch",
    render: ({ count, compact }) => <PlaygroundDemo key={count} count={count} compact={compact} />,
    code: ({ count, compact }) => {
      const tabs = PERIOD_TABS.slice(0, count)
        .map((tab) => `  { id: "${tab.id}", label: "${tab.label}" },`)
        .join("\n");
      const cls = compact ? `\n  className="w-auto rounded-full border border-border/60 px-2 py-1.5"` : "";
      return `const tabs: Tab[] = [\n${tabs}\n];\nconst [active, setActive] = React.useState("${PERIOD_TABS[0].id}");\n\n<TabsNav tabs={tabs} activeTabId={active} onTabChange={setActive}${cls} />`;
    },
  }),
  examples: [
    {
      id: "panel",
      title: "Cabecera de un panel",
      description: "La barra a todo el ancho, con el contenido que cambia debajo.",
      layout: "stretch",
      code: `const [active, setActive] = React.useState("overview");

<TabsNav tabs={tabs} activeTabId={active} onTabChange={setActive} className="border-b border-border/60" />
<div className="p-6">{content[active]}</div>`,
      render: () => <PanelDemo />,
    },
    {
      id: "compact",
      title: "Selector compacto",
      description: "Con `w-auto` y un borde redondeado se convierte en un segmented control para filtros.",
      code: `<TabsNav
  tabs={periods}
  activeTabId={active}
  onTabChange={setActive}
  className="w-auto rounded-full border border-border/60 px-2 py-1.5"
/>`,
      render: () => <CompactDemo />,
    },
  ],
  props: [
    { name: "tabs", type: "Tab[]", description: "Lista de `{ id, label }`." },
    { name: "activeTabId", type: "string", description: "Id de la pestaña activa (controlado)." },
    { name: "onTabChange", type: "(id: string) => void", description: "Se llama con el id de la pestaña pulsada." },
    { name: "className", type: "string", description: "Clases para el contenedor; trae `w-full bg-surface px-8 py-3`." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Cualquier atributo nativo del contenedor." },
  ],
  guidelines: {
    do: ["Úsalo para filtros y periodos donde el cambio es inmediato y sin carga.", "Limita el grupo a cinco píldoras; más allá, pasa a `UbitsTabs` o a un select."],
    dont: ["No lo uses como navegación principal de página: para eso está `UbitsTabs` en variante `page`.", "No mezcles iconos: el componente solo pinta la etiqueta."],
  },
  related: ["ubits-tabs", "tabs", "ubits-sub-nav"],
});
