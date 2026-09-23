import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Stepper, type StepperStep } from "@/components/navigation/Stepper";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const ORIENTATIONS = ["horizontal", "vertical"] as const;
const SIZES = ["default", "sm"] as const;

const VACANCY_STEPS: StepperStep[] = [
  { id: "datos", label: "Datos de la vacante", description: "Título, área y ubicación" },
  { id: "requisitos", label: "Requisitos", description: "Experiencia y competencias" },
  { id: "evaluacion", label: "Evaluación", description: "Pruebas y entrevistas" },
  { id: "publicacion", label: "Publicación", description: "Canales y fecha de cierre" },
];

const IMPORT_STEPS: StepperStep[] = [
  { id: "archivo", label: "Subir archivo" },
  { id: "columnas", label: "Mapear columnas" },
  { id: "revision", label: "Revisar" },
  { id: "importar", label: "Importar" },
];

function VacancyWizard() {
  const [current, setCurrent] = React.useState(1);
  const isLast = current === VACANCY_STEPS.length - 1;
  return (
    <div className="flex w-full flex-col gap-6">
      <Stepper steps={VACANCY_STEPS} current={current} onStepClick={setCurrent} />
      <div className="rounded-xl border border-border/60 bg-surface-subtle p-4 text-sm text-text-secondary">
        Paso {current + 1} de {VACANCY_STEPS.length}: <span className="font-medium text-text-primary">{VACANCY_STEPS[current].label}</span>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((step) => step - 1)}>
          <ArrowLeft /> Anterior
        </Button>
        <Button size="sm" disabled={isLast} onClick={() => setCurrent((step) => step + 1)}>
          Siguiente <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export const stepperEntry = defineEntry({
  id: "stepper",
  name: "Stepper",
  group: "navigation",
  description:
    "Flujo por pasos con círculo numerado, etiqueta y conector. Marca el paso activo con `aria-current=\"step\"` y deriva el estado de cada paso de `current`; un `status` explícito (p. ej. `error`) lo sobrescribe. Úsalo en asistentes de alta, importaciones y procesos con un orden fijo.",
  importPath: 'import { Stepper } from "@/components/navigation/Stepper"',
  sourcePath: "src/components/navigation/Stepper.tsx",
  status: "stable",
  tags: ["wizard", "a11y"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      size: { type: "select", options: SIZES, default: "default" },
      current: { type: "number", label: "Paso actual", default: 1, min: 0, max: 3, step: 1 },
      withDescription: { type: "boolean", label: "Con descripción", default: true },
      clickable: { type: "boolean", label: "Clicable", default: false },
    },
    layout: "stretch",
    render: ({ orientation, size, current, withDescription, clickable }) => (
      <Stepper
        steps={withDescription ? VACANCY_STEPS : VACANCY_STEPS.map(({ id, label }) => ({ id, label }))}
        current={current}
        orientation={orientation as (typeof ORIENTATIONS)[number]}
        size={size as (typeof SIZES)[number]}
        onStepClick={clickable ? () => {} : undefined}
      />
    ),
    code: ({ orientation, size, current, clickable }) => {
      const attrs = [
        "steps={steps}",
        `current={${current}}`,
        orientation !== "horizontal" ? `orientation="${orientation}"` : "",
        size !== "default" ? `size="${size}"` : "",
        clickable ? "onStepClick={setCurrent}" : "",
      ].filter(Boolean);
      return `<Stepper ${attrs.join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "wizard",
      title: "Alta de vacante en 4 pasos",
      description: "El estado vive fuera: `current` avanza con los botones y `onStepClick` permite volver a un paso ya completado. Los pendientes quedan deshabilitados.",
      layout: "stretch",
      code: `const [current, setCurrent] = React.useState(1);

<Stepper steps={steps} current={current} onStepClick={setCurrent} />
<Button onClick={() => setCurrent((s) => s + 1)}>Siguiente</Button>`,
      render: () => <VacancyWizard />,
    },
    {
      id: "vertical",
      title: "Vertical con descripción",
      description: "En paneles laterales o resúmenes, la orientación vertical deja sitio a una línea de ayuda bajo cada etiqueta.",
      layout: "start",
      code: `<Stepper orientation="vertical" current={2} steps={[
  { id: "datos", label: "Datos de la vacante", description: "Título, área y ubicación" },
  { id: "requisitos", label: "Requisitos", description: "Experiencia y competencias" },
  { id: "evaluacion", label: "Evaluación", description: "Pruebas y entrevistas" },
  { id: "publicacion", label: "Publicación", description: "Canales y fecha de cierre" },
]} />`,
      render: () => <Stepper orientation="vertical" current={2} steps={VACANCY_STEPS} className="w-72" />,
    },
    {
      id: "error",
      title: "Paso con error",
      description: "Una importación de usuarios donde el mapeo de columnas falló: `status: \"error\"` pinta el círculo y la etiqueta en destructivo sin mover el paso actual.",
      layout: "stretch",
      code: `<Stepper
  current={2}
  steps={[
    { id: "archivo", label: "Subir archivo" },
    { id: "columnas", label: "Mapear columnas", status: "error" },
    { id: "revision", label: "Revisar" },
    { id: "importar", label: "Importar" },
  ]}
/>`,
      render: () => <Stepper current={2} steps={IMPORT_STEPS.map((step) => (step.id === "columnas" ? { ...step, status: "error" as const } : step))} />,
    },
    {
      id: "compact",
      title: "Tamaño sm",
      description: "Círculos de 24px para cabeceras de drawer o barras de progreso secundarias.",
      layout: "stretch",
      code: `<Stepper size="sm" current={3} steps={steps} />`,
      render: () => <Stepper size="sm" current={3} steps={IMPORT_STEPS} />,
    },
  ],
  props: [
    { name: "steps", type: "StepperStep[]", description: "`{ id, label, description?, status? }`. El `status` explícito sobrescribe el derivado de `current`." },
    { name: "current", type: "number", description: "Índice (base 0) del paso activo. Los anteriores se marcan como completados." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Horizontal reparte los pasos a lo ancho; vertical los apila con el conector a la izquierda." },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "Círculo de 24px o 28px." },
    { name: "onStepClick", type: "(index: number) => void", description: "Vuelve clicables los pasos completados, el actual y los que tienen error. Los pendientes quedan `disabled`." },
    { name: "...props", type: 'React.HTMLAttributes<"ol">', description: "Atributos nativos del `<ol>` (lleva `aria-label=\"Progreso\"` por defecto)." },
  ],
  guidelines: {
    do: ["Usa entre 3 y 6 pasos; con más, agrúpalos o cambia a una lista de tareas.", "Etiqueta cada paso con un sustantivo corto («Requisitos»), no con una frase.", "Permite volver atrás con `onStepClick`; avanzar debe pasar por la validación del paso actual."],
    dont: ["No lo uses como navegación entre secciones sin orden: ahí van Tabs.", "No marques `error` en un paso pendiente; solo en uno que ya se intentó completar.", "No ocultes el stepper en móvil sin dejar un indicador «Paso 2 de 4»."],
  },
  related: ["tabs-nav", "thema-tabs", "progress", "breadcrumbs"],
});
