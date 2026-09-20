import * as React from "react";
import { Sparkles } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defineEntry, definePlayground } from "../types";

function BeamFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-full max-w-sm rounded-2xl border border-border/60 bg-surface p-6 shadow-card ${className ?? ""}`}>
      {children}
    </div>
  );
}

function ToggleBeam() {
  const [active, setActive] = React.useState(false);
  return (
    <Card className="relative w-full max-w-sm">
      <CardHeader>
        <CardTitle>Plan Enterprise</CardTitle>
        <CardDescription>Analítica avanzada, SSO y soporte dedicado.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant={active ? "outline" : "default"} size="sm" onClick={() => setActive((value) => !value)}>
          <Sparkles /> {active ? "Quitar destacado" : "Destacar plan"}
        </Button>
      </CardContent>
      {active && <BorderBeam duration={8} />}
    </Card>
  );
}

export const borderBeamEntry = defineEntry({
  id: "border-beam",
  name: "BorderBeam",
  group: "ui",
  description:
    "Haz de luz que recorre el borde de su contenedor en bucle, sin afectar al layout. Úsalo con moderación para destacar una tarjeta, un plan recomendado o un panel de IA; el padre debe ser `relative` y tener radio de borde.",
  importPath: 'import { BorderBeam } from "@/components/ui/border-beam"',
  sourcePath: "src/components/ui/border-beam.tsx",
  status: "stable",
  tags: ["custom", "animation"],
  playground: definePlayground({
    controls: {
      duration: { type: "number", label: "Duración (s)", default: 8, min: 2, max: 30, step: 1 },
      borderWidth: { type: "number", label: "Grosor (px)", default: 1.5, min: 1, max: 6, step: 0.5 },
      anchor: { type: "number", label: "Ángulo inicial", default: 90, min: 0, max: 360, step: 15 },
      colorFrom: { type: "text", label: "Color inicial", default: "#ffaa40" },
      colorTo: { type: "text", label: "Color final", default: "#9c40ff" },
    },
    render: ({ duration, borderWidth, anchor, colorFrom, colorTo }) => (
      <BeamFrame>
        <p className="text-sm font-semibold text-text-primary">Ruta recomendada</p>
        <p className="mt-1 text-[13px] text-text-secondary">Liderazgo para nuevos managers · 6 módulos</p>
        <BorderBeam duration={duration} borderWidth={borderWidth} anchor={anchor} colorFrom={colorFrom} colorTo={colorTo} />
      </BeamFrame>
    ),
    code: ({ duration, borderWidth, anchor, colorFrom, colorTo }) => {
      const attrs = [
        duration !== 15 ? `duration={${duration}}` : "",
        borderWidth !== 1.5 ? `borderWidth={${borderWidth}}` : "",
        anchor !== 90 ? `anchor={${anchor}}` : "",
        colorFrom !== "#ffaa40" ? `colorFrom="${colorFrom}"` : "",
        colorTo !== "#9c40ff" ? `colorTo="${colorTo}"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<div className="relative rounded-2xl border bg-surface p-6">
  <p className="text-sm font-semibold">Ruta recomendada</p>
  <p className="text-[13px] text-text-secondary">Liderazgo para nuevos managers · 6 módulos</p>
  <BorderBeam${attrs ? ` ${attrs}` : ""} />
</div>`;
    },
  }),
  examples: [
    {
      id: "brand",
      title: "Con los colores de marca",
      description: "Pasa cualquier color CSS; aquí se usan las variables del tema para que siga al modo claro/oscuro.",
      code: `<Card className="relative">
  <CardHeader>
    <CardTitle>Asistente UBITS</CardTitle>
    <CardDescription>Pregunta sobre tu progreso o pide una recomendación.</CardDescription>
  </CardHeader>
  <BorderBeam duration={10} colorFrom="var(--primary)" colorTo="var(--info)" />
</Card>`,
      render: () => (
        <Card className="relative w-full max-w-sm">
          <CardHeader>
            <CardTitle>Asistente UBITS</CardTitle>
            <CardDescription>Pregunta sobre tu progreso o pide una recomendación.</CardDescription>
          </CardHeader>
          <BorderBeam duration={10} colorFrom="var(--primary)" colorTo="var(--info)" />
        </Card>
      ),
    },
    {
      id: "double",
      title: "Dos haces desfasados",
      description: "Un segundo haz con `delay` igual a la mitad de la duración reparte la luz en lados opuestos.",
      code: `<div className="relative rounded-2xl border bg-surface p-6">
  …
  <BorderBeam duration={12} />
  <BorderBeam duration={12} delay={6} colorFrom="#22d3ee" colorTo="#6366f1" />
</div>`,
      render: () => (
        <BeamFrame>
          <p className="text-sm font-semibold text-text-primary">Doble recorrido</p>
          <p className="mt-1 text-[13px] text-text-secondary">Dos haces, mismo ciclo, desfasados medio periodo.</p>
          <BorderBeam duration={12} />
          <BorderBeam duration={12} delay={6} colorFrom="#22d3ee" colorTo="#6366f1" />
        </BeamFrame>
      ),
    },
    {
      id: "toggle",
      title: "Condicional",
      description: "Al ser un hijo absoluto se puede montar y desmontar sin mover nada alrededor.",
      code: `const [active, setActive] = React.useState(false);

<Card className="relative">
  …
  <Button onClick={() => setActive((value) => !value)}>Destacar plan</Button>
  {active && <BorderBeam duration={8} />}
</Card>`,
      render: () => <ToggleBeam />,
    },
  ],
  props: [
    { name: "duration", type: "number", default: "15", description: "Segundos que tarda el haz en dar una vuelta completa." },
    { name: "size", type: "number", default: "200", description: "Tamaño de referencia del haz (variable CSS `--size`)." },
    { name: "borderWidth", type: "number", default: "1.5", description: "Grosor del borde iluminado, en px." },
    { name: "anchor", type: "number", default: "90", description: "Ángulo inicial del gradiente cónico, en grados." },
    { name: "colorFrom", type: "string", default: '"#ffaa40"', description: "Color al inicio del haz. Acepta cualquier valor CSS, incluidas variables." },
    { name: "colorTo", type: "string", default: '"#9c40ff"', description: "Color en la cola del haz." },
    { name: "delay", type: "number", default: "0", description: "Desfase de la animación en segundos (útil con varios haces)." },
    { name: "className", type: "string", description: "Clases extra para el contenedor absoluto." },
  ],
  guidelines: {
    do: ["Asegúrate de que el padre sea `relative` y tenga `rounded-*`; el haz hereda el radio.", "Resérvalo para un solo elemento destacado por vista.", "Usa variables del tema en los colores para respetar el modo oscuro."],
    dont: ["No lo apliques a listas o tablas: satura y cuesta rendimiento.", "No lo uses sobre contenedores con `overflow: visible` intencionado; el haz recorta al borde.", "No lo combines con otros efectos animados de borde en el mismo elemento."],
  },
  related: ["card", "ai-panel"],
});
