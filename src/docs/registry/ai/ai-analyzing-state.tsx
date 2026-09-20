import * as React from "react";
import { AiAnalyzingState } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["panel", "inline"] as const;
const STEPS = [
  { title: "Leyendo el archivo", detail: "participantes.xlsx" },
  { title: "Detectando columnas", detail: "Nombre, correo, área" },
  { title: "Validando correos", detail: "482 filas" },
  { title: "Preparando la importación", detail: "Casi listo" },
] as const;
const TICK_MS = 500;
const STEP_PCT = 8;

function useSequence() {
  const [progress, setProgress] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + STEP_PCT);
        if (next === 100) setRunning(false);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [running]);
  const stepIndex = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));
  const restart = () => {
    setProgress(0);
    setRunning(true);
  };
  return { progress, step: STEPS[stepIndex], restart };
}

function SequencePanel() {
  const { progress, step, restart } = useSequence();
  return (
    <div className="flex w-full flex-col gap-3">
      <AiAnalyzingState
        title={progress >= 100 ? "Importación lista" : step.title}
        detail={step.detail}
        progress={progress}
        caption="La IA revisa el archivo antes de crear los participantes."
      />
      <Button variant="outline" size="sm" className="self-end" onClick={restart}>
        Reiniciar
      </Button>
    </div>
  );
}

function SequenceInline() {
  const { step, restart } = useSequence();
  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-card">
      <AiAnalyzingState variant="inline" title={step.title} />
      <Button variant="ghost" size="xs" onClick={restart}>
        Reiniciar
      </Button>
    </div>
  );
}

export const aiAnalyzingStateEntry = defineEntry({
  id: "ai-analyzing-state",
  name: "AiAnalyzingState",
  group: "ai",
  description:
    "La forma única en que la IA dice «dame un momento» en toda la plataforma. Un panel con la chispa latiendo, barra de progreso opcional y un titular que entra con fundido cada vez que cambia; la versión inline reduce lo mismo a una línea.",
  importPath: 'import { AiAnalyzingState } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/AiAnalyzingState.tsx",
  status: "stable",
  tags: ["ia", "framer-motion", "loading"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "panel" },
      title: { type: "text", default: "Analizando participantes" },
      detail: { type: "text", label: "Detalle (panel)", default: "482 filas" },
      caption: { type: "text", label: "Pie (panel)", default: "Puedes seguir editando mientras tanto." },
      withProgress: { type: "boolean", label: "Con progreso", default: true },
      progress: { type: "number", default: 62, min: 0, max: 100, step: 2 },
    },
    layout: "stretch",
    render: ({ variant, title, detail, caption, withProgress, progress }) =>
      variant === "inline" ? (
        <div className="flex items-center justify-center">
          <AiAnalyzingState variant="inline" title={title} />
        </div>
      ) : (
        <AiAnalyzingState title={title} detail={detail || undefined} caption={caption || undefined} progress={withProgress ? progress : undefined} />
      ),
    code: ({ variant, title, detail, caption, withProgress, progress }) => {
      if (variant === "inline") return `<AiAnalyzingState variant="inline" title="${title}" />`;
      const attrs = [
        `title="${title}"`,
        withProgress ? `progress={${progress}}` : "",
        detail ? `detail="${detail}"` : "",
        caption ? `caption="${caption}"` : "",
      ].filter(Boolean);
      return `<AiAnalyzingState\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "sequence",
      title: "Secuencia de pasos",
      description: "El titular cambia según el avance y cada cambio entra con un fundido: así el trabajo se lee como pasos y no como una barra que sube sola.",
      layout: "stretch",
      code: `const STEPS = ["Leyendo el archivo", "Detectando columnas", "Validando correos", "Preparando la importación"];
const [progress, setProgress] = React.useState(0);
const step = STEPS[Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))];

<AiAnalyzingState
  title={progress >= 100 ? "Importación lista" : step}
  detail="participantes.xlsx"
  progress={progress}
  caption="La IA revisa el archivo antes de crear los participantes."
/>`,
      render: () => <SequencePanel />,
    },
    {
      id: "indeterminate",
      title: "Sin progreso conocido",
      description: "Sin `progress` no hay barra: la chispa y el titular bastan para esperas cortas de duración desconocida.",
      layout: "stretch",
      code: `<AiAnalyzingState title="Generando recomendaciones" caption="Suele tardar unos segundos." />`,
      render: () => <AiAnalyzingState title="Generando recomendaciones" caption="Suele tardar unos segundos." />,
    },
    {
      id: "inline",
      title: "Inline",
      description: "Para huecos donde el panel no cabe, como una tarjeta que se está rehaciendo.",
      code: `<AiAnalyzingState variant="inline" title="Reescribiendo la pregunta" />`,
      render: () => <SequenceInline />,
    },
  ],
  props: [
    { name: "title", type: "string", description: "Titular. Cada cambio de valor entra con un fundido (framer-motion, `AnimatePresence`)." },
    { name: "progress", type: "number", description: "0–100. Si se omite, la barra no se muestra y la espera se lee como indeterminada." },
    { name: "detail", type: "string", description: "Línea sobre la barra, a la izquierda: qué se está produciendo. Solo en `panel`." },
    { name: "caption", type: "string", description: "Frase bajo la barra: qué está pasando en una línea. Solo en `panel`." },
    { name: "variant", type: '"panel" | "inline"', default: '"panel"', description: "`panel` es el bloque grande (300px mínimo); `inline` reduce la chispa y el título a una línea." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Cambia `title` conforme avanza el proceso: es lo que convierte la espera en una secuencia.", "Usa `panel` cuando la espera ocupa la pantalla y `inline` cuando ocupa un hueco.", "Pasa `progress` solo si conoces el avance real."],
    dont: ["No crees otra versión del mismo momento: es la única forma en que la IA pide tiempo en el producto.", "No lo uses para cargas normales de datos; el degradado de IA es exclusivo de superficies de IA.", "No animes el porcentaje con saltos ficticios."],
  },
  related: ["ai-loader", "ai-spark-glyph", "empty-state"],
});
