import * as React from "react";
import { ArrowUpRight, CheckCircle2, Clock, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["default", "secondary", "outline", "neutral", "destructive", "ghost", "link"] as const;
type Variant = (typeof VARIANTS)[number];

const FILTERS = ["Diseño", "Liderazgo", "Datos", "Ventas"] as const;

function RemovableFilters() {
  const [active, setActive] = React.useState<string[]>([...FILTERS]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map((filter) => (
        <Badge key={filter} variant="secondary" className="pr-1">
          {filter}
          <button
            type="button"
            aria-label={`Quitar ${filter}`}
            className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => setActive((items) => items.filter((item) => item !== filter))}
          >
            <X />
          </button>
        </Badge>
      ))}
      {active.length < FILTERS.length && (
        <Button variant="ghost" size="xs" onClick={() => setActive([...FILTERS])}>
          Restablecer
        </Button>
      )}
    </div>
  );
}

export const badgeEntry = defineEntry({
  id: "badge",
  name: "Badge",
  group: "ui",
  description:
    "Etiqueta compacta de 20px para clasificar, contar o señalar el estado de un elemento. Úsalo junto a títulos, filas de tabla o tarjetas cuando una palabra basta para dar contexto.",
  importPath: 'import { Badge } from "@/components/ui/badge"',
  sourcePath: "src/components/ui/badge.tsx",
  status: "stable",
  tags: ["cva", "radix-slot"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "default" },
      label: { type: "text", default: "Nuevo" },
      withIcon: { type: "boolean", label: "Con icono", default: false },
    },
    render: ({ variant, label, withIcon }) => (
      <Badge variant={variant as Variant}>
        {withIcon && <Sparkles />}
        {label}
      </Badge>
    ),
    code: ({ variant, label, withIcon }) => {
      const open = variant === "default" ? "<Badge>" : `<Badge variant="${variant}">`;
      return `${open}${withIcon ? "<Sparkles /> " : ""}${label}</Badge>`;
    },
  }),
  examples: [
    {
      id: "variants",
      title: "Variantes",
      description: "`default` y `secondary` para categorías; `outline` y `neutral` para metadatos; `destructive` para errores.",
      code: `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="neutral">Neutral</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="link">Link</Badge>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      title: "Estados con icono",
      description: "El SVG se fija a 12px; combínalo con colores semánticos por `className` cuando la variante no baste.",
      code: `<Badge variant="outline" className="border-success/40 text-success"><CheckCircle2 /> Completado</Badge>
<Badge variant="outline" className="border-warning/40 text-warning"><Clock /> Pendiente</Badge>
<Badge variant="destructive"><X /> Vencido</Badge>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-success/40 text-success">
            <CheckCircle2 /> Completado
          </Badge>
          <Badge variant="outline" className="border-warning/40 text-warning">
            <Clock /> Pendiente
          </Badge>
          <Badge variant="destructive">
            <X /> Vencido
          </Badge>
        </div>
      ),
    },
    {
      id: "as-link",
      title: "Como enlace (asChild)",
      description: "Con `asChild` el badge envuelve un `<a>` real y activa sus estados hover.",
      code: `<Badge asChild variant="secondary">
  <a href="#/components/button">Ver botón <ArrowUpRight /></a>
</Badge>`,
      render: () => (
        <Badge asChild variant="secondary">
          <a href="#/components/button">
            Ver botón <ArrowUpRight />
          </a>
        </Badge>
      ),
    },
    {
      id: "removable",
      title: "Filtros removibles",
      description: "Un botón interno con `aria-label` convierte el badge en un chip de filtro.",
      code: `const [active, setActive] = React.useState(["Diseño", "Liderazgo", "Datos"]);

{active.map((filter) => (
  <Badge key={filter} variant="secondary" className="pr-1">
    {filter}
    <button type="button" aria-label={\`Quitar \${filter}\`} onClick={() => setActive((items) => items.filter((item) => item !== filter))}>
      <X />
    </button>
  </Badge>
))}`,
      render: () => <RemovableFilters />,
    },
  ],
  props: [
    { name: "variant", type: '"default" | "secondary" | "outline" | "neutral" | "destructive" | "ghost" | "link"', default: '"default"', description: "Estilo visual del badge." },
    { name: "asChild", type: "boolean", default: "false", description: "Aplica los estilos al hijo (p. ej. un <a>) en lugar de renderizar un <span>." },
    { name: "...props", type: 'React.ComponentProps<"span">', description: "Atributos nativos del span." },
  ],
  guidelines: {
    do: ["Usa una o dos palabras; el badge no envuelve texto.", "Mantén un significado fijo por color en toda la aplicación.", "Acompaña los estados con icono para no depender solo del color."],
    dont: ["No uses badges como botones sin `asChild` y un control real.", "No pongas más de tres badges seguidos en la misma fila.", "No lo uses para contadores grandes; a partir de 99 muestra «99+»."],
  },
  related: ["button", "alert", "avatar"],
});
