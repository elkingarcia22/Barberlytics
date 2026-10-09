import * as React from "react";
import { AIButton, type AIButtonSize, type AIButtonVariant } from "@/components/ai-interaction";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["primary", "secondary", "subtle", "outline"] as const;
const SIZES = ["xs", "sm", "md", "lg"] as const;
const GENERATE_DELAY_MS = 1800;

function GenerateFlow() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      setResult("Resumen generado: 3 fortalezas y 2 áreas de mejora detectadas.");
    }, GENERATE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [loading]);
  return (
    <div className="flex flex-col items-center gap-3">
      <AIButton
        label={result ? "Regenerar resumen" : "Generar resumen"}
        loading={loading}
        helperText="Usa las respuestas abiertas de la encuesta."
        onClick={() => {
          setResult(null);
          setLoading(true);
        }}
      />
      {result && <p className="max-w-xs text-center text-xs text-text-secondary">{result}</p>}
    </div>
  );
}

export const aiButtonEntry = defineEntry({
  id: "ai-button",
  name: "AIButton",
  group: "ai",
  description:
    "El botón que dispara una acción de IA. Envuelve a Button con forma de píldora, la chispa como icono por defecto, el degradado de IA en la variante primaria y un estado de carga con texto propio.",
  importPath: 'import { AIButton } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/AIButton.tsx",
  status: "stable",
  tags: ["ia", "degradado"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "primary" },
      size: { type: "select", options: SIZES, default: "md" },
      label: { type: "text", default: "Generar con Clipper" },
      helperText: { type: "text", label: "Texto de ayuda", default: "" },
      loading: { type: "boolean", label: "Cargando", default: false },
      disabled: { type: "boolean", default: false },
      withRightIcon: { type: "boolean", label: "Icono derecho", default: false },
    },
    render: ({ variant, size, label, helperText, loading, disabled, withRightIcon }) => (
      <AIButton
        variant={variant as AIButtonVariant}
        size={size as AIButtonSize}
        label={label}
        helperText={helperText || undefined}
        loading={loading}
        disabled={disabled}
        rightIcon={withRightIcon ? "arrowRight" : undefined}
      />
    ),
    code: ({ variant, size, label, helperText, loading, disabled, withRightIcon }) => {
      const attrs = [
        `label="${label}"`,
        variant !== "primary" ? `variant="${variant}"` : "",
        size !== "md" ? `size="${size}"` : "",
        helperText ? `helperText="${helperText}"` : "",
        withRightIcon ? 'rightIcon="arrowRight"' : "",
        loading ? "loading" : "",
        disabled ? "disabled" : "",
      ].filter(Boolean);
      return attrs.length > 1 ? `<AIButton\n  ${attrs.join("\n  ")}\n/>` : `<AIButton ${attrs[0]} />`;
    },
  }),
  examples: [
    {
      id: "variants",
      title: "Variantes",
      description: "Solo `primary` lleva el degradado relleno; `secondary` y `outline` usan el borde con degradado y `subtle` es fantasma.",
      code: `<AIButton label="Generar" />
<AIButton label="Generar" variant="secondary" />
<AIButton label="Generar" variant="subtle" />
<AIButton label="Generar" variant="outline" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <AIButton label="Generar" />
          <AIButton label="Generar" variant="secondary" />
          <AIButton label="Generar" variant="subtle" />
          <AIButton label="Generar" variant="outline" />
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Tamaños",
      description: "De xs (28px) a lg (48px). En `xs` el icono baja a 14px.",
      code: `<AIButton label="Sugerir" size="xs" />
<AIButton label="Sugerir" size="sm" />
<AIButton label="Sugerir" />
<AIButton label="Sugerir" size="lg" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <AIButton label="Sugerir" size="xs" />
          <AIButton label="Sugerir" size="sm" />
          <AIButton label="Sugerir" />
          <AIButton label="Sugerir" size="lg" />
        </div>
      ),
    },
    {
      id: "generate-flow",
      title: "Flujo de generación",
      description: "Al pulsar, `loading` bloquea el botón y muestra el spinner con el mismo texto; al terminar vuelve a la chispa.",
      code: `const [loading, setLoading] = React.useState(false);

<AIButton
  label="Generar resumen"
  loading={loading}
  helperText="Usa las respuestas abiertas de la encuesta."
  onClick={() => setLoading(true)}
/>`,
      render: () => <GenerateFlow />,
    },
    {
      id: "icons",
      title: "Iconos personalizados",
      description: "`leftIcon` reemplaza la chispa por defecto; `rightIcon` añade uno al final. Ambos son nombres del registro ThemaIcon.",
      code: `<AIButton label="Analizar resultados" leftIcon="analytics" />
<AIButton label="Continuar" variant="outline" rightIcon="arrowRight" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <AIButton label="Analizar resultados" leftIcon="analytics" />
          <AIButton label="Continuar" variant="outline" rightIcon="arrowRight" />
        </div>
      ),
    },
  ],
  props: [
    { name: "label", type: "string", description: "Texto del botón. Alternativamente se puede pasar como `children`." },
    { name: "variant", type: '"primary" | "secondary" | "subtle" | "outline"', default: '"primary"', description: "Intención visual. `primary` rellena con el degradado de IA; `secondary` y `outline` bordean con él." },
    { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "Altura de 28, 32, 40 o 48px." },
    { name: "loading", type: "boolean", default: "false", description: "Muestra el spinner, desactiva el botón y marca `aria-busy`." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el botón." },
    { name: "leftIcon", type: "IconName", default: '"sparkles"', description: "Icono a la izquierda del texto." },
    { name: "rightIcon", type: "IconName", description: "Icono a la derecha del texto." },
    { name: "helperText", type: "string", description: "Línea pequeña en cursiva bajo el botón para explicar qué hará la IA." },
    { name: "onClick", type: "() => void", description: "Callback al pulsar." },
    { name: "type", type: '"button" | "submit" | "reset"', default: '"button"', description: "Tipo nativo del botón." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Úsalo solo para acciones que invocan a la IA: generar, resumir, sugerir.", "Añade `helperText` cuando el usuario necesite saber qué datos usará la IA.", "Refleja el proceso con `loading` en vez de deshabilitar sin explicación."],
    dont: ["No lo uses para acciones normales: el degradado de IA está reservado para superficies de IA.", "No pongas más de un AIButton primario por vista.", "No cambies el texto durante `loading` a algo que no describa lo que pasa."],
  },
  related: ["button", "ai-loader", "chip"],
});
