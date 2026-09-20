import type * as React from "react";
import { ThemaLogo } from "@/components/ui/ThemaLogo";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const COLORS = ["white", "currentColor", "#0F172A"] as const;
const SIZES = [16, 24, 32, 48];

function DarkCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-center gap-6 rounded-xl bg-neutral-900 p-6", className)}>{children}</div>;
}

export const themaLogoEntry = defineEntry({
  id: "thema-logo",
  name: "ThemaLogo",
  group: "ui",
  description:
    "El isotipo Thema como SVG inline, blanco por defecto y con una leve escala al pasar el cursor. Pensado para superficies oscuras (sidebar, header, pantallas de acceso); en fondos claros pásale un color explícito o `currentColor`.",
  importPath: 'import { ThemaLogo } from "@/components/ui/ThemaLogo"',
  sourcePath: "src/components/ui/ThemaLogo.tsx",
  status: "stable",
  tags: ["marca", "svg"],
  playground: definePlayground({
    controls: {
      size: { type: "number", label: "Tamaño", default: 32, min: 12, max: 96, step: 4 },
      color: { type: "select", options: COLORS, default: "white" },
    },
    render: ({ size, color }) => (
      <DarkCard className={cn(color !== "white" && "bg-surface border border-border/60 text-primary")}>
        <ThemaLogo size={size} color={color} />
      </DarkCard>
    ),
    code: ({ size, color }) => {
      const attrs = [size !== 24 ? `size={${size}}` : "", color !== "white" ? `color="${color}"` : ""].filter(Boolean).join(" ");
      const wrapper = color === "white" ? 'bg-neutral-900' : 'bg-surface text-primary';
      return `<div className="${wrapper} p-6">
  <ThemaLogo${attrs ? ` ${attrs}` : ""} />
</div>`;
    },
  }),
  examples: [
    {
      id: "sizes",
      title: "Tamaños",
      description: "`size` fija el ancho; el alto se deriva de la proporción 24:25 del isotipo.",
      code: `<ThemaLogo size={16} />
<ThemaLogo size={24} />
<ThemaLogo size={32} />
<ThemaLogo size={48} />`,
      render: () => (
        <DarkCard>
          {SIZES.map((size) => (
            <ThemaLogo key={size} size={size} />
          ))}
        </DarkCard>
      ),
    },
    {
      id: "wordmark",
      title: "Con nombre de marca",
      description: "Isotipo más texto: el patrón del sidebar y del header de producto.",
      code: `<div className="flex items-center gap-2 text-white">
  <ThemaLogo size={20} />
  <span className="text-sm font-semibold tracking-tight">Thema</span>
</div>`,
      render: () => (
        <DarkCard>
          <div className="flex items-center gap-2 text-white">
            <ThemaLogo size={20} />
            <span className="text-sm font-semibold tracking-tight">Thema</span>
          </div>
        </DarkCard>
      ),
    },
    {
      id: "brand",
      title: "En superficie clara",
      description: "Con `color=\"currentColor\"` hereda el color del texto: aquí, el primario.",
      code: `<div className="text-primary">
  <ThemaLogo size={32} color="currentColor" />
</div>`,
      render: () => (
        <div className="flex items-center gap-6 rounded-xl border border-border/60 bg-surface p-6">
          <span className="text-primary">
            <ThemaLogo size={32} color="currentColor" />
          </span>
          <span className="text-text-primary">
            <ThemaLogo size={32} color="currentColor" />
          </span>
          <span className="text-text-muted">
            <ThemaLogo size={32} color="currentColor" />
          </span>
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: "number", default: "24", description: "Ancho en px; el alto es `size × 25 / 24`." },
    { name: "color", type: "string", default: '"white"', description: "Relleno de los trazos. Acepta cualquier color CSS o `currentColor`." },
    { name: "className", type: "string", description: "Clases del contenedor (flex centrado con hover:scale-110)." },
  ],
  guidelines: {
    do: ["Úsalo sobre fondos oscuros o pásale un color con contraste suficiente.", "Respeta la proporción: cambia solo `size`, nunca estires el SVG.", "Deja aire alrededor: al menos la mitad del tamaño del isotipo."],
    dont: ["No lo recolorees con degradados ni sombras.", "No lo uses como botón sin envolverlo en un enlace o botón real."],
  },
  related: ["thema-icon", "thema-product-header"],
});
