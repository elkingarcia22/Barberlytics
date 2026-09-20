import * as React from "react";
import { AILoader, type AILoaderStatus, type AILoaderVariant } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["block", "inline", "card"] as const;
const STATUSES = ["thinking", "generating", "analyzing", "complete", "error"] as const;
const TICK_MS = 400;
const STEP = 12;

function ProgressCard() {
  const [progress, setProgress] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + STEP);
        if (next === 100) setRunning(false);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [running]);
  const done = progress >= 100;
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <AILoader
        variant="card"
        status={done ? "complete" : "generating"}
        description={done ? "Puedes revisar el borrador." : "Redactando las preguntas de la sección 2"}
        progress={progress}
      />
      <Button
        variant="outline"
        size="sm"
        className="self-end"
        onClick={() => {
          setProgress(0);
          setRunning(true);
        }}
      >
        Reiniciar
      </Button>
    </div>
  );
}

export const aiLoaderEntry = defineEntry({
  id: "ai-loader",
  name: "AILoader",
  group: "ai",
  description:
    "Estado de espera mientras la IA trabaja, en tres formas: una línea con spinner, un bloque con esqueleto o una tarjeta con progreso. Cada estado trae su texto por defecto en español y anuncia con `aria-live`.",
  importPath: 'import { AILoader } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/AILoader.tsx",
  status: "stable",
  tags: ["ia", "loading", "skeleton"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "block" },
      status: { type: "select", options: STATUSES, default: "thinking" },
      label: { type: "text", default: "", placeholder: "Texto por defecto del estado" },
      description: { type: "text", label: "Descripción (card)", default: "Cruzando respuestas con el histórico" },
      withProgress: { type: "boolean", label: "Con progreso (card)", default: false },
      progress: { type: "number", default: 45, min: 0, max: 100, step: 5 },
    },
    layout: "stretch",
    render: ({ variant, status, label, description, withProgress, progress }) => (
      <div className="mx-auto w-full max-w-md">
        <AILoader
          variant={variant as AILoaderVariant}
          status={status as AILoaderStatus}
          label={label || undefined}
          description={variant === "card" && description ? description : undefined}
          progress={variant === "card" && withProgress ? progress : undefined}
        />
      </div>
    ),
    code: ({ variant, status, label, description, withProgress, progress }) => {
      const attrs = [
        variant !== "block" ? `variant="${variant}"` : "",
        status !== "thinking" ? `status="${status}"` : "",
        label ? `label="${label}"` : "",
        variant === "card" && description ? `description="${description}"` : "",
        variant === "card" && withProgress ? `progress={${progress}}` : "",
      ].filter(Boolean);
      return attrs.length ? `<AILoader ${attrs.join(" ")} />` : "<AILoader />";
    },
  }),
  examples: [
    {
      id: "variants",
      title: "Variantes",
      description: "`inline` cabe en una línea de texto, `block` sustituye a un párrafo y `card` ocupa el lugar de una tarjeta.",
      layout: "stretch",
      code: `<AILoader variant="inline" />
<AILoader />
<AILoader variant="card" status="generating" description="Redactando el resumen ejecutivo" />`,
      render: () => (
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <AILoader variant="inline" />
          <AILoader />
          <AILoader variant="card" status="generating" description="Redactando el resumen ejecutivo" />
        </div>
      ),
    },
    {
      id: "progress",
      title: "Tarjeta con progreso",
      description: "Con `progress` la tarjeta cambia el esqueleto por una barra con el degradado de IA.",
      layout: "stretch",
      code: `const [progress, setProgress] = React.useState(0);
// …un intervalo va sumando hasta 100

<AILoader
  variant="card"
  status={progress >= 100 ? "complete" : "generating"}
  description="Redactando las preguntas de la sección 2"
  progress={progress}
/>`,
      render: () => <ProgressCard />,
    },
    {
      id: "statuses",
      title: "Estados y textos por defecto",
      description: "Cada `status` trae su etiqueta; `label` la sobreescribe.",
      code: `<AILoader variant="inline" status="thinking" />
<AILoader variant="inline" status="generating" />
<AILoader variant="inline" status="analyzing" />
<AILoader variant="inline" status="complete" />
<AILoader variant="inline" status="error" />
<AILoader variant="inline" label="Buscando duplicados…" />`,
      render: () => (
        <div className="flex flex-col gap-2">
          {STATUSES.map((status) => (
            <AILoader key={status} variant="inline" status={status} />
          ))}
          <AILoader variant="inline" label="Buscando duplicados…" />
        </div>
      ),
    },
  ],
  props: [
    { name: "variant", type: '"inline" | "block" | "card"', default: '"block"', description: "Forma del loader." },
    { name: "status", type: '"thinking" | "generating" | "analyzing" | "complete" | "error"', default: '"thinking"', description: "Fase del proceso; define el texto por defecto y, en `card`, si se muestra el spinner." },
    { name: "label", type: "string", description: "Texto que reemplaza al del estado." },
    { name: "description", type: "string", description: "Segunda línea bajo el título. Solo en `card`." },
    { name: "progress", type: "number", description: "0–100. Solo en `card`: cambia el esqueleto por una barra de progreso." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Elige la variante según el hueco que ocupa el resultado: línea, párrafo o tarjeta.", "Pasa `progress` cuando conozcas el avance real; si no, deja el esqueleto.", "Cambia `status` a `complete` o `error` al terminar en vez de desmontar de golpe."],
    dont: ["No lo uses para cargas que no vienen de la IA: el degradado está reservado para superficies de IA.", "No inventes porcentajes: una barra que salta de 10 a 100 pierde credibilidad."],
  },
  related: ["ai-analyzing-state", "ai-button", "skeleton"],
});
