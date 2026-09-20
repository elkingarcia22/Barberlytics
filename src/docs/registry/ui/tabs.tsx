import * as React from "react";
import { BarChart3, ListChecks, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsVariant } from "@/components/ui/tabs";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["view", "page"] as const;
const TAB_LABELS = ["Resumen", "Personas", "Resultados", "Ajustes", "Historial"];

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border/60 bg-surface px-4 py-3 text-[13px] text-text-secondary">{children}</div>;
}

const SECTIONS = [
  { value: "overview", label: "Resumen", icon: BarChart3, body: "Participación del 82% y eNPS de +31 en el último ciclo." },
  { value: "people", label: "Personas", icon: Users, body: "412 personas invitadas, 338 respuestas completas." },
  { value: "tasks", label: "Acciones", icon: ListChecks, body: "5 planes de acción abiertos, 2 vencidos." },
  { value: "settings", label: "Ajustes", icon: Settings, body: "Recordatorios cada 3 días; cierre el 30 de octubre." },
];

function IconTabs({ variant }: { variant: TabsVariant }) {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
      <TabsList variant={variant}>
        {SECTIONS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon className="size-4" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SECTIONS.map(({ value, body }) => (
        <TabsContent key={value} value={value}>
          <Panel>{body}</Panel>
        </TabsContent>
      ))}
    </Tabs>
  );
}

const STEPS = ["datos", "preguntas", "envio"] as const;

function ControlledTabs() {
  const [step, setStep] = React.useState<string>("datos");
  const index = STEPS.indexOf(step as (typeof STEPS)[number]);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Tabs value={step} onValueChange={setStep}>
        <TabsList variant="page">
          <TabsTrigger value="datos">1. Datos</TabsTrigger>
          <TabsTrigger value="preguntas">2. Preguntas</TabsTrigger>
          <TabsTrigger value="envio">3. Envío</TabsTrigger>
        </TabsList>
        <TabsContent value="datos">
          <Panel>Nombre, objetivo y responsable de la encuesta.</Panel>
        </TabsContent>
        <TabsContent value="preguntas">
          <Panel>12 preguntas en 4 dimensiones.</Panel>
        </TabsContent>
        <TabsContent value="envio">
          <Panel>Se enviará a 412 personas el lunes a las 9:00.</Panel>
        </TabsContent>
      </Tabs>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setStep(STEPS[index - 1])}>
          Anterior
        </Button>
        <Button size="sm" disabled={index === STEPS.length - 1} onClick={() => setStep(STEPS[index + 1])}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export const tabsEntry = defineEntry({
  id: "tabs",
  name: "Tabs",
  group: "ui",
  description:
    "Pestañas de Radix con un indicador que se desliza entre triggers gracias a `layoutId` de framer-motion. Dos variantes: `view` (por defecto, píldora blanca sobre la pista, texto primario) para cambiar de vista dentro de una sección, y `page` (relleno primario, 40px) para las secciones principales de una página.",
  importPath: 'import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"',
  sourcePath: "src/components/ui/tabs.tsx",
  status: "stable",
  tags: ["radix", "framer-motion"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "view" },
      count: { type: "number", label: "Pestañas", default: 3, min: 2, max: 5, step: 1 },
      disableLast: { type: "boolean", label: "Última deshabilitada", default: false },
    },
    render: ({ variant, count, disableLast }) => {
      const labels = TAB_LABELS.slice(0, count);
      return (
        <Tabs key={`${variant}-${count}`} defaultValue={labels[0]} className="w-full max-w-lg">
          <TabsList variant={variant as TabsVariant}>
            {labels.map((label, index) => (
              <TabsTrigger key={label} value={label} disabled={disableLast && index === labels.length - 1}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {labels.map((label) => (
            <TabsContent key={label} value={label}>
              <Panel>Contenido de «{label}».</Panel>
            </TabsContent>
          ))}
        </Tabs>
      );
    },
    code: ({ variant, count, disableLast }) => {
      const labels = TAB_LABELS.slice(0, count);
      const triggers = labels
        .map((label, index) => `    <TabsTrigger value="${label.toLowerCase()}"${disableLast && index === labels.length - 1 ? " disabled" : ""}>${label}</TabsTrigger>`)
        .join("\n");
      const contents = labels.map((label) => `  <TabsContent value="${label.toLowerCase()}">…</TabsContent>`).join("\n");
      return `<Tabs defaultValue="${labels[0].toLowerCase()}">
  <TabsList${variant !== "view" ? ` variant="${variant}"` : ""}>
${triggers}
  </TabsList>
${contents}
</Tabs>`;
    },
  }),
  examples: [
    {
      id: "view",
      title: "Variante view (por defecto)",
      description: "Píldora blanca con sombra sobre la pista; el texto activo se pinta en primario. Para alternar vistas dentro de una sección.",
      code: `<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview"><BarChart3 /> Resumen</TabsTrigger>
    <TabsTrigger value="people"><Users /> Personas</TabsTrigger>
    <TabsTrigger value="tasks"><ListChecks /> Acciones</TabsTrigger>
    <TabsTrigger value="settings"><Settings /> Ajustes</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  …
</Tabs>`,
      render: () => <IconTabs variant="view" />,
    },
    {
      id: "page",
      title: "Variante page",
      description: "Relleno primario y 40px de alto, a juego con Input y Select. Para las secciones principales de una página.",
      code: `<Tabs defaultValue="overview">
  <TabsList variant="page">
    <TabsTrigger value="overview"><BarChart3 /> Resumen</TabsTrigger>
    <TabsTrigger value="people"><Users /> Personas</TabsTrigger>
    …
  </TabsList>
  …
</Tabs>`,
      render: () => <IconTabs variant="page" />,
    },
    {
      id: "controlled",
      title: "Controlado desde fuera",
      description: "Con `value` y `onValueChange` los botones Anterior/Siguiente mueven el indicador igual que un clic.",
      code: `const [step, setStep] = React.useState("datos");

<Tabs value={step} onValueChange={setStep}>
  <TabsList variant="page">
    <TabsTrigger value="datos">1. Datos</TabsTrigger>
    <TabsTrigger value="preguntas">2. Preguntas</TabsTrigger>
    <TabsTrigger value="envio">3. Envío</TabsTrigger>
  </TabsList>
  …
</Tabs>
<Button onClick={() => setStep("preguntas")}>Siguiente</Button>`,
      render: () => <ControlledTabs />,
    },
  ],
  props: [
    { name: "value / defaultValue", type: "string", description: "En `Tabs`. Pestaña activa controlada o inicial." },
    { name: "onValueChange", type: "(value: string) => void", description: "En `Tabs`. Se dispara al cambiar de pestaña." },
    { name: "variant", type: '"view" | "page"', default: '"view"', description: "En `TabsList`. Cambia la altura (36/40px), el radio y el estilo del indicador; los triggers lo leen por contexto." },
    { name: "value", type: "string", description: "En `TabsTrigger` y `TabsContent`. Debe coincidir entre ambos." },
    { name: "disabled", type: "boolean", description: "En `TabsTrigger`. Opacidad al 50% y sin eventos." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "En `Tabs`. Cambia la navegación por teclado; los estilos están pensados para horizontal." },
  ],
  guidelines: {
    do: ["Una sola `page` por pantalla; dentro de cada sección usa `view`.", "Mantén las etiquetas cortas (1–2 palabras) y, si llevan icono, en todas.", "Renderiza un `TabsContent` por cada trigger, con el mismo `value`."],
    dont: ["No uses Tabs para navegar entre rutas: para eso está ThemaTabs / ThemaSubNav.", "No anides dos niveles de Tabs con la misma variante.", "No pongas más de 5–6 pestañas; agrupa o usa Select."],
  },
  related: ["thema-tabs", "thema-sub-nav", "segmented-control"],
});
