import * as React from "react";
import { Upload } from "lucide-react";
import { Spinner } from "@/components/feedback/Spinner";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["xs", "sm", "md", "lg"] as const;
type Size = (typeof SIZES)[number];
const TONES = ["default", "primary", "inverse"] as const;
type Tone = (typeof TONES)[number];

function ImportButton() {
  const [isImporting, setIsImporting] = React.useState(false);
  const start = () => {
    setIsImporting(true);
    window.setTimeout(() => setIsImporting(false), 2200);
  };
  return (
    <Button onClick={start} disabled={isImporting}>
      {isImporting ? <Spinner size="sm" tone="inverse" label="Importando usuarios" /> : <Upload />}
      {isImporting ? "Importando…" : "Importar usuarios"}
    </Button>
  );
}

export const spinnerEntry = defineEntry({
  id: "spinner",
  name: "Spinner",
  group: "feedback",
  description:
    "Indicador de carga indeterminado en cuatro tamaños (12, 16, 24 y 32px) y tres tonos. Anuncia el estado con `role=\"status\"` y un texto solo para lectores de pantalla; con `prefers-reduced-motion` el arco se queda quieto. Para cargas largas con progreso conocido, prefiere Progress.",
  importPath: 'import { Spinner } from "@/components/feedback/Spinner"',
  sourcePath: "src/components/feedback/Spinner.tsx",
  status: "stable",
  tags: ["cva", "loading", "a11y"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "md" },
      tone: { type: "select", options: TONES, default: "default" },
      label: { type: "text", label: "Etiqueta (aria)", default: "Cargando" },
    },
    render: ({ size, tone, label }) => (
      <div className={tone === "inverse" ? "rounded-lg bg-surface-nav p-4" : undefined}>
        <Spinner size={size as Size} tone={tone as Tone} label={label} />
      </div>
    ),
    code: ({ size, tone, label }) => {
      const attrs = [size !== "md" ? `size="${size}"` : "", tone !== "default" ? `tone="${tone}"` : "", label !== "Cargando" ? `label="${label}"` : ""].filter(Boolean);
      return attrs.length ? `<Spinner ${attrs.join(" ")} />` : "<Spinner />";
    },
  }),
  examples: [
    {
      id: "sizes",
      title: "Tamaños",
      description: "`xs` cabe en un badge, `sm` en un botón, `md` en una tarjeta y `lg` en un estado vacío o una página.",
      code: `<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />`,
      render: () => (
        <div className="flex items-center gap-6">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Spinner size={size} />
              <span className="text-xs text-text-muted">{size}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "in-button",
      title: "Dentro de un botón",
      description: "Al lanzar la importación de usuarios el icono se sustituye por el spinner en tono `inverse` y el botón se deshabilita. La etiqueta describe la acción, no «Cargando».",
      code: `<Button onClick={start} disabled={isImporting}>
  {isImporting ? <Spinner size="sm" tone="inverse" label="Importando usuarios" /> : <Upload />}
  {isImporting ? "Importando…" : "Importar usuarios"}
</Button>`,
      render: () => <ImportButton />,
    },
    {
      id: "inline",
      title: "En línea con texto",
      description: "Tono `primary` junto a un mensaje de estado; el texto visible y el `label` deben decir lo mismo.",
      code: `<div className="flex items-center gap-2 text-sm text-text-secondary">
  <Spinner size="sm" tone="primary" label="Calculando resultados" />
  Calculando resultados de la encuesta…
</div>`,
      render: () => (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Spinner size="sm" tone="primary" label="Calculando resultados" />
          Calculando resultados de la encuesta…
        </div>
      ),
    },
    {
      id: "panel",
      title: "Bloqueando un panel",
      description: "Centrado en el área que se está cargando, con una frase corta debajo. Mantén la altura del panel para evitar saltos.",
      layout: "stretch",
      code: `<div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-surface">
  <Spinner size="lg" tone="primary" label="Cargando el plan de formación" />
  <span className="text-sm text-text-secondary">Cargando el plan de formación…</span>
</div>`,
      render: () => (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-surface">
          <Spinner size="lg" tone="primary" label="Cargando el plan de formación" />
          <span className="text-sm text-text-secondary">Cargando el plan de formación…</span>
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "12, 16, 24 o 32px." },
    { name: "tone", type: '"default" | "primary" | "inverse"', default: '"default"', description: "Texto secundario, primario o blanco sobre fondos oscuros." },
    { name: "label", type: "string", default: '"Cargando"', description: "Texto para lectores de pantalla (`sr-only`)." },
    { name: "...props", type: 'React.HTMLAttributes<"span">', description: "Atributos del contenedor; ya lleva `role=\"status\"` y `aria-live=\"polite\"`." },
  ],
  guidelines: {
    do: ["Describe qué se carga en `label` («Importando usuarios»), no solo «Cargando».", "Reserva el espacio del contenido mientras carga para no provocar saltos.", "Muéstralo solo si la espera supera ~300ms; para menos, no hace falta feedback."],
    dont: ["No uses varios spinners a la vez en la misma vista: uno por zona que carga.", "No lo uses para progresos con porcentaje conocido; ahí va Progress.", "No lo pongas sobre texto que siga interactivo sin deshabilitarlo."],
  },
  related: ["progress", "skeleton", "button", "empty-state"],
});
