import * as React from "react";
import { ClipboardList, MessageSquare, Sparkles, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import type { Tone } from "@/lib/tone";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["primary", "ai"] as const;
const TONES = ["ninguno", "brand", "positive", "warning", "negative", "neutral"] as const;

interface ToneOption {
  id: string;
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  hint: string;
}

const TONE_OPTIONS: ToneOption[] = [
  { id: "pulse", tone: "brand", icon: <ClipboardList className="size-4" />, title: "Pulso", hint: "Cinco preguntas, cada semana." },
  { id: "climate", tone: "positive", icon: <Users className="size-4" />, title: "Clima", hint: "La foto completa del equipo." },
  { id: "feedback", tone: "warning", icon: <MessageSquare className="size-4" />, title: "Feedback", hint: "Abierta, sin estructura." },
];

function ToneOptions() {
  const [selected, setSelected] = React.useState("pulse");
  return (
    <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
      {TONE_OPTIONS.map((option) => (
        <MagicCard
          key={option.id}
          tone={option.tone}
          isSelected={selected === option.id}
          onClick={() => setSelected(option.id)}
          contentClassName="flex-col items-start gap-2"
        >
          <span className="tone-reveal-chip flex size-8 items-center justify-center rounded-lg">{option.icon}</span>
          <span className="text-sm font-semibold">{option.title}</span>
          <span className="text-xs text-text-secondary">{option.hint}</span>
        </MagicCard>
      ))}
    </div>
  );
}

function YesNoPair() {
  const [answer, setAnswer] = React.useState<"yes" | "no" | null>(null);
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-3">
      <MagicCard isSelected={answer === "yes"} onClick={() => setAnswer("yes")} contentClassName="items-center gap-2">
        <ThumbsUp className="size-4" />
        <span className="text-sm font-medium">Sí</span>
      </MagicCard>
      <MagicCard isSelected={answer === "no"} onClick={() => setAnswer("no")} contentClassName="items-center gap-2">
        <ThumbsDown className="size-4" />
        <span className="text-sm font-medium">No</span>
      </MagicCard>
    </div>
  );
}

function AiCard() {
  const [selected, setSelected] = React.useState(false);
  return (
    <MagicCard variant="ai" isSelected={selected} onClick={() => setSelected((value) => !value)} className="w-72" contentClassName="flex-col gap-1.5">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4" /> Generar con IA
      </span>
      <span className="text-xs text-text-secondary">Redactamos las preguntas a partir de tu objetivo.</span>
    </MagicCard>
  );
}

export const magicCardEntry = defineEntry({
  id: "magic-card",
  name: "MagicCard",
  group: "ui",
  description:
    "Tarjeta seleccionable con barrido de luz al pasar el cursor, leve elevación y un estado seleccionado que no mueve el contenido. Úsala cuando la persona elige una opción entre varias tarjetas (tipos de encuesta, formas de convocar) o en pares sí/no.",
  importPath: 'import { MagicCard } from "@/components/ui/magic-card"',
  sourcePath: "src/components/ui/magic-card.tsx",
  status: "stable",
  tags: ["tone", "css-sweep"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "primary" },
      tone: { type: "select", options: TONES, default: "ninguno" },
      isSelected: { type: "boolean", label: "Seleccionada", default: false },
      title: { type: "text", label: "Título", default: "Encuesta de clima" },
    },
    render: ({ variant, tone, isSelected, title }) => (
      <MagicCard
        variant={variant as (typeof VARIANTS)[number]}
        tone={tone === "ninguno" ? undefined : (tone as Tone)}
        isSelected={isSelected}
        className="w-64"
        contentClassName="flex-col gap-1"
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-text-secondary">Pasa el cursor para ver el barrido.</span>
      </MagicCard>
    ),
    code: ({ variant, tone, isSelected, title }) => {
      const attrs = [
        variant !== "primary" ? `variant="${variant}"` : "",
        tone !== "ninguno" ? `tone="${tone}"` : "",
        isSelected ? "isSelected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<MagicCard ${attrs ? `${attrs} ` : ""}onClick={select} contentClassName="flex-col gap-1">
  <span className="text-sm font-semibold">${title}</span>
  <span className="text-xs text-text-secondary">Pasa el cursor para ver el barrido.</span>
</MagicCard>`;
    },
  }),
  examples: [
    {
      id: "toned-set",
      title: "Conjunto con tonos",
      description: "Cada tarjeta se selecciona en su propio color; el chip revela el tono al pasar el cursor.",
      code: `const [selected, setSelected] = React.useState("pulse");

<MagicCard tone="brand" isSelected={selected === "pulse"} onClick={() => setSelected("pulse")} contentClassName="flex-col items-start gap-2">
  <span className="tone-reveal-chip flex size-8 items-center justify-center rounded-lg"><ClipboardList className="size-4" /></span>
  <span className="text-sm font-semibold">Pulso</span>
  <span className="text-xs text-text-secondary">Cinco preguntas, cada semana.</span>
</MagicCard>
<MagicCard tone="positive" isSelected={selected === "climate"} onClick={() => setSelected("climate")}>…</MagicCard>
<MagicCard tone="warning" isSelected={selected === "feedback"} onClick={() => setSelected("feedback")}>…</MagicCard>`,
      render: () => <ToneOptions />,
    },
    {
      id: "yes-no",
      title: "Par sí / no",
      description: "Sin tono: la selección se pinta en azul de marca.",
      code: `const [answer, setAnswer] = React.useState<"yes" | "no" | null>(null);

<MagicCard isSelected={answer === "yes"} onClick={() => setAnswer("yes")} contentClassName="items-center gap-2">
  <ThumbsUp className="size-4" /> <span className="text-sm font-medium">Sí</span>
</MagicCard>
<MagicCard isSelected={answer === "no"} onClick={() => setAnswer("no")} contentClassName="items-center gap-2">
  <ThumbsDown className="size-4" /> <span className="text-sm font-medium">No</span>
</MagicCard>`,
      render: () => <YesNoPair />,
    },
    {
      id: "ai",
      title: "Variante IA",
      description: "Malla de color y anillo degradado al seleccionar. Reservada a la superficie de IA del producto.",
      code: `<MagicCard variant="ai" isSelected={selected} onClick={toggle} contentClassName="flex-col gap-1.5">
  <span className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4" /> Generar con IA</span>
  <span className="text-xs text-text-secondary">Redactamos las preguntas a partir de tu objetivo.</span>
</MagicCard>`,
      render: () => <AiCard />,
    },
  ],
  props: [
    { name: "isSelected", type: "boolean", default: "false", description: "Pinta el borde, el fondo y el texto en el acento; el borde de 1.5px ya está reservado, así que el contenido no salta." },
    { name: "variant", type: '"primary" | "ai"', default: '"primary"', description: "La variante `ai` usa la malla degradada y el anillo de IA; ignora `tone`." },
    { name: "tone", type: "Tone", description: "Acento con el que se selecciona y hace hover (`brand`, `positive`, `warning`, `negative`, `neutral`, `ai`). Sin tono, azul de marca." },
    { name: "contentClassName", type: "string", description: "Clases del contenedor interno (`flex w-full`). Útil para apilar en columna." },
    { name: "...props", type: "React.HTMLAttributes<HTMLButtonElement>", description: "Se renderiza como <button type=\"button\">; acepta onClick, aria-*, etc." },
  ],
  guidelines: {
    do: ["Usa `tone` cuando cada opción ya tiene su propio color en el producto.", "Deja el contenido corto: un icono, un título y una línea de ayuda.", "Mantén un solo elemento seleccionado por grupo (o usa un par sí/no)."],
    dont: ["No la uses como tarjeta informativa sin acción: para eso está Card.", "No combines `variant=\"ai\"` con `tone`; la variante lo ignora.", "No metas controles interactivos dentro: ya es un botón."],
  },
  related: ["card", "button", "radio-group"],
});
