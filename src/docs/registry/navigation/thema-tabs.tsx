import * as React from "react";
import { BarChart3, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { ThemaTabs } from "@/components/navigation";
import type { TabItem } from "@/components/navigation";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["view", "page"] as const;

const PAGE_TABS: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="size-4" /> },
  { id: "reports", label: "Reportes", icon: <FileText className="size-4" /> },
];

const STATUS_TABS: TabItem[] = [
  { id: "pending", label: "Pendientes", icon: <Clock className="size-4" />, badge: 12, badgeTone: "warning" },
  { id: "approved", label: "Aprobadas", icon: <CheckCircle2 className="size-4" />, badge: 48, badgeTone: "positive" },
  { id: "rejected", label: "Rechazadas", icon: <XCircle className="size-4" />, badge: 3, badgeTone: "negative" },
];

const PLAIN_TABS: TabItem[] = [
  { id: "summary", label: "Resumen" },
  { id: "detail", label: "Detalle" },
  { id: "history", label: "Historial" },
];

function TabsDemo({ tabs, variant = "view", fitContent = false }: { tabs: TabItem[]; variant?: "view" | "page"; fitContent?: boolean }) {
  const [active, setActive] = React.useState(tabs[0].id);
  const label = tabs.find((tab) => tab.id === active)?.label;
  return (
    <div className="w-full space-y-4">
      <ThemaTabs tabs={tabs} activeTabId={active} onTabChange={setActive} variant={variant} fitContent={fitContent} className="mb-0" />
      <div className="rounded-xl border border-border/60 bg-surface p-4 text-[13px] text-text-secondary">
        Mostrando <span className="font-semibold text-text-primary">{label}</span>.
      </div>
    </div>
  );
}

function PlaygroundDemo({ variant, fitContent, withBadges, count }: { variant: "view" | "page"; fitContent: boolean; withBadges: boolean; count: number }) {
  const tabs = STATUS_TABS.slice(0, count).map((tab) => (withBadges ? tab : { ...tab, badge: undefined }));
  return <TabsDemo key={count} tabs={tabs} variant={variant} fitContent={fitContent} />;
}

export const themaTabsEntry = defineEntry({
  id: "thema-tabs",
  name: "ThemaTabs",
  group: "navigation",
  description:
    "Las dos únicas tiras de pestañas de la app, sobre el primitivo `ui/tabs`: `view` cambia un panel dentro de la página con un track hundido, `page` cambia la pantalla entera con la píldora rellena. Cada pestaña admite icono y un contador con tono.",
  importPath: 'import { ThemaTabs } from "@/components/navigation"',
  sourcePath: "src/components/navigation/ThemaTabs.tsx",
  status: "stable",
  tags: ["radix-tabs", "framer-motion", "badge"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "view" },
      count: { type: "number", label: "Pestañas", default: 3, min: 2, max: 3, step: 1 },
      fitContent: { type: "boolean", label: "Ajustar al contenido", default: false },
      withBadges: { type: "boolean", label: "Con contadores", default: true },
    },
    layout: "stretch",
    render: ({ variant, count, fitContent, withBadges }) => (
      <PlaygroundDemo variant={variant as "view" | "page"} count={count} fitContent={fitContent} withBadges={withBadges} />
    ),
    code: ({ variant, count, fitContent, withBadges }) => {
      const rows = STATUS_TABS.slice(0, count).map((tab) => {
        const badge = withBadges ? `, badge: ${tab.badge}, badgeTone: "${tab.badgeTone}"` : "";
        return `  { id: "${tab.id}", label: "${tab.label}", icon: <Icon />${badge} },`;
      });
      const attrs = ["tabs={tabs}", "activeTabId={active}", "onTabChange={setActive}", variant !== "view" ? `variant="${variant}"` : "", fitContent ? "fitContent" : ""].filter(Boolean);
      return `const tabs: TabItem[] = [\n${rows.join("\n")}\n];\nconst [active, setActive] = React.useState("pending");\n\n<ThemaTabs ${attrs.join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "view",
      title: "Variante view",
      description: "Pestañas de panel: track hundido y superficie elevada sobre la activa. Ocupa todo el ancho.",
      layout: "stretch",
      code: `const [active, setActive] = React.useState("summary");

<ThemaTabs
  tabs={[{ id: "summary", label: "Resumen" }, { id: "detail", label: "Detalle" }, { id: "history", label: "Historial" }]}
  activeTabId={active}
  onTabChange={setActive}
/>`,
      render: () => <TabsDemo tabs={PLAIN_TABS} />,
    },
    {
      id: "page",
      title: "Variante page",
      description: "Para cambiar lo que muestra toda la pantalla: píldora primaria rellena. Con dos pestañas conviene `fitContent`.",
      layout: "stretch",
      code: `<ThemaTabs
  variant="page"
  fitContent
  tabs={[
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="size-4" /> },
    { id: "reports", label: "Reportes", icon: <FileText className="size-4" /> },
  ]}
  activeTabId={active}
  onTabChange={setActive}
/>`,
      render: () => <TabsDemo tabs={PAGE_TABS} variant="page" fitContent />,
    },
    {
      id: "badges",
      title: "Contadores con tono",
      description: "Cuando las pestañas son estados, cada contador lleva el tono de su estado. Sin `badgeTone` el contador es sólido en primario.",
      layout: "stretch",
      code: `<ThemaTabs
  tabs={[
    { id: "pending", label: "Pendientes", icon: <Clock />, badge: 12, badgeTone: "warning" },
    { id: "approved", label: "Aprobadas", icon: <CheckCircle2 />, badge: 48, badgeTone: "positive" },
    { id: "rejected", label: "Rechazadas", icon: <XCircle />, badge: 3, badgeTone: "negative" },
  ]}
  activeTabId={active}
  onTabChange={setActive}
/>`,
      render: () => <TabsDemo tabs={STATUS_TABS} />,
    },
  ],
  props: [
    { name: "tabs", type: "TabItem[]", description: "Pestañas: `id`, `label` y opcionalmente `icon`, `badge` (número, oculto si es 0) y `badgeTone`." },
    { name: "activeTabId", type: "string", description: "Id de la pestaña activa (controlado)." },
    { name: "onTabChange", type: "(id: string) => void", description: "Se llama al cambiar de pestaña." },
    { name: "variant", type: '"view" | "page"', default: '"view"', description: "`view` para paneles dentro de la página; `page` para cambiar la pantalla entera." },
    { name: "fitContent", type: "boolean", default: "false", description: "Ajusta la tira a sus etiquetas en vez de repartir el ancho." },
    { name: "className", type: "string", description: "Clases para el <Tabs>; trae `mb-8 w-full`." },
  ],
  guidelines: {
    do: ["Una sola tira `page` por pantalla, arriba del todo.", "Usa `fitContent` con dos o tres pestañas; con cinco o seis deja que repartan el ancho.", "Da `badgeTone` a los contadores solo cuando la pestaña es un estado."],
    dont: ["No anides una tira `page` dentro de un panel `view`.", "No pongas un contador en cero: el componente lo oculta, pero mejor no lo mandes."],
  },
  related: ["tabs", "tabs-nav", "thema-sub-nav", "badge"],
});
