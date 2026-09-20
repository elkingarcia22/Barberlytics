import * as React from "react";
import { Loader2, Plus, Sparkles, Upload } from "lucide-react";
import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { defineEntry, definePlayground } from "../types";

function LoadingActionDemo() {
  const [isLoading, setIsLoading] = React.useState(false);
  const start = () => {
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 1500);
  };
  return (
    <EmptyStateActionButton icon={isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} disabled={isLoading} onClick={start}>
      {isLoading ? "Generando…" : "Sugerir con IA"}
    </EmptyStateActionButton>
  );
}

export const emptyStateActionButtonEntry = defineEntry({
  id: "empty-state-action-button",
  name: "EmptyStateActionButton",
  group: "feedback",
  description:
    "La acción secundaria dentro de un estado vacío: una píldora de contorno que invita a crear el primer elemento sin competir con la acción primaria de la página. Comparte el hover de borde y tinte con su alternativa de IA para que ambas se lean como un par.",
  importPath: 'import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton"',
  sourcePath: "src/components/feedback/EmptyStateActionButton.tsx",
  status: "stable",
  tags: ["button"],
  playground: definePlayground({
    controls: {
      label: { type: "text", default: "Crear objetivo" },
      withIcon: { type: "boolean", label: "Con icono", default: true },
      disabled: { type: "boolean", default: false },
    },
    render: ({ label, withIcon, disabled }) => (
      <EmptyStateActionButton icon={withIcon ? <Plus className="size-4" /> : undefined} disabled={disabled}>
        {label}
      </EmptyStateActionButton>
    ),
    code: ({ label, withIcon, disabled }) => {
      const attrs = [withIcon ? 'icon={<Plus className="size-4" />}' : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `<EmptyStateActionButton${attrs ? ` ${attrs}` : ""}>${label}</EmptyStateActionButton>`;
    },
  }),
  examples: [
    {
      id: "pair",
      title: "Par de opciones",
      description: "Dos botones con el mismo peso visual dentro de `EmptyState`.",
      layout: "stretch",
      code: `<EmptyState
  title="Aún no hay competencias"
  description="Crea la primera o importa tu catálogo."
  action={
    <div className="flex flex-wrap justify-center gap-2">
      <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear competencia</EmptyStateActionButton>
      <EmptyStateActionButton icon={<Upload className="size-4" />}>Importar catálogo</EmptyStateActionButton>
    </div>
  }
/>`,
      render: () => (
        <EmptyState
          title="Aún no hay competencias"
          description="Crea la primera o importa tu catálogo."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear competencia</EmptyStateActionButton>
              <EmptyStateActionButton icon={<Upload className="size-4" />}>Importar catálogo</EmptyStateActionButton>
            </div>
          }
        />
      ),
    },
    {
      id: "loading",
      title: "Cargando",
      description: "Es un `<button>` nativo: `disabled` y el icono se controlan desde fuera.",
      code: `const [isLoading, setIsLoading] = React.useState(false);

<EmptyStateActionButton
  icon={isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
  disabled={isLoading}
  onClick={start}
>
  {isLoading ? "Generando…" : "Sugerir con IA"}
</EmptyStateActionButton>`,
      render: () => <LoadingActionDemo />,
    },
    {
      id: "plain",
      title: "Sin icono",
      code: `<EmptyStateActionButton>Ver ejemplos</EmptyStateActionButton>`,
      render: () => <EmptyStateActionButton>Ver ejemplos</EmptyStateActionButton>,
    },
  ],
  props: [
    { name: "icon", type: "React.ReactNode", description: "Icono a la izquierda del texto; pásalo ya con su tamaño (`size-4`)." },
    { name: "children", type: "React.ReactNode", description: "El texto del botón." },
    { name: "className", type: "string", description: "Clases extra sobre el botón." },
    { name: "...props", type: "React.ButtonHTMLAttributes<HTMLButtonElement>", description: "`onClick`, `disabled` y cualquier atributo nativo de <button>." },
  ],
  guidelines: {
    do: ["Úsalo solo dentro de un estado vacío, como invitación a crear el primero.", "Combínalo en pares (manual + IA, crear + importar) con el mismo peso."],
    dont: ["No lo uses como acción primaria de una página; para eso está `Button`.", "No mezcles un `Button` relleno y este contorno en el mismo par: rompe la equivalencia."],
  },
  related: ["empty-state", "button", "ai-button"],
});
