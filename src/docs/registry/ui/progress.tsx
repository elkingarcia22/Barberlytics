import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { defineEntry, definePlayground } from "../types";

const COLORS = ["primary", "success", "warning", "destructive"] as const;
type ProgressColor = (typeof COLORS)[number];

const STEP_MS = 400;

function SimulatedUpload() {
  const [value, setValue] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setValue((current) => {
        if (current >= 100) {
          setIsRunning(false);
          return 100;
        }
        return Math.min(100, current + 7 + Math.round(Math.random() * 10));
      });
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const start = () => {
    setValue(0);
    setIsRunning(true);
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-primary">Subiendo respuestas.csv</span>
        <span className="tabular-nums text-text-secondary">{value}%</span>
      </div>
      <Progress value={value} color={value === 100 ? "success" : "primary"} />
      <Button size="sm" variant="outline" onClick={start} disabled={isRunning} className="self-start">
        {isRunning ? "Subiendo…" : value === 100 ? "Repetir" : "Iniciar"}
      </Button>
    </div>
  );
}

export const progressEntry = defineEntry({
  id: "progress",
  name: "Progress",
  group: "ui",
  description:
    "Barra de progreso determinada, de 2px de radio completo, que se desplaza con transform. Úsala cuando se conoce el avance de una tarea: cargas, pasos completados, cuotas.",
  importPath: 'import { Progress } from "@/components/ui/progress"',
  sourcePath: "src/components/ui/progress.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      value: { type: "number", default: 60, min: 0, max: 100, step: 5 },
      color: { type: "select", options: COLORS, default: "primary" },
    },
    layout: "stretch",
    render: ({ value, color }) => (
      <div className="mx-auto w-full max-w-sm self-center">
        <Progress value={value} color={color as ProgressColor} />
      </div>
    ),
    code: ({ value, color }) => `<Progress value={${value}}${color !== "primary" ? ` color="${color}"` : ""} />`,
  }),
  examples: [
    {
      id: "colors",
      title: "Colores semánticos",
      description: "El color dice algo del estado: verde al completar, ámbar cerca del límite, rojo al superarlo.",
      code: `<Progress value={45} />
<Progress value={100} color="success" />
<Progress value={85} color="warning" />
<Progress value={100} color="destructive" />`,
      layout: "stretch",
      render: () => (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 self-center">
          <Progress value={45} />
          <Progress value={100} color="success" />
          <Progress value={85} color="warning" />
          <Progress value={100} color="destructive" />
        </div>
      ),
    },
    {
      id: "simulated",
      title: "Carga simulada",
      description: "El valor cambia con un intervalo; la transición la pone el componente.",
      code: `const [value, setValue] = React.useState(0);
// …un setInterval que suma hasta 100

<div className="flex items-center justify-between text-xs">
  <span>Subiendo respuestas.csv</span>
  <span className="tabular-nums">{value}%</span>
</div>
<Progress value={value} color={value === 100 ? "success" : "primary"} />`,
      render: () => <SimulatedUpload />,
    },
    {
      id: "labelled",
      title: "Con etiqueta y cuota",
      description: "Combínala con un texto de contexto y altura mayor si necesita más presencia.",
      code: `<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="font-medium">Licencias usadas</span>
    <span className="text-text-secondary">184 / 250</span>
  </div>
  <Progress value={74} className="h-3" aria-label="Licencias usadas" />
</div>`,
      layout: "stretch",
      render: () => (
        <div className="mx-auto w-full max-w-sm space-y-2 self-center">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-text-primary">Licencias usadas</span>
            <span className="text-text-secondary">184 / 250</span>
          </div>
          <Progress value={74} className="h-3" aria-label="Licencias usadas" />
        </div>
      ),
    },
  ],
  props: [
    { name: "value", type: "number", default: "0", description: "Avance de 0 a 100." },
    { name: "color", type: '"primary" | "success" | "warning" | "destructive"', default: '"primary"', description: "Color del indicador." },
    { name: "className", type: "string", description: "Clases del riel; cambia `h-*` para otra altura." },
    { name: "...props", type: "React.ComponentProps<ProgressPrimitive.Root>", description: "Atributos Radix y nativos (aria-label, max…)." },
  ],
  guidelines: {
    do: ["Acompáñala de un porcentaje o un texto que diga qué avanza.", "Usa `success` al llegar al 100% de una tarea.", "Añade `aria-label` cuando no hay texto asociado."],
    dont: ["No la uses para esperas indeterminadas: usa un loader.", "No cambies el color solo por decoración."],
  },
  related: ["skeleton", "slider"],
});
