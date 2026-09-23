import * as React from "react";
import { ChevronDown, ChevronsUpDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { defineEntry, definePlayground } from "../types";

const DETAILS = [
  ["Documento", "CC 1.032.456.789"],
  ["Fecha de ingreso", "14 mar 2022"],
  ["Contrato", "Indefinido · Tiempo completo"],
  ["Centro de costo", "CC-0412 Operaciones"],
] as const;

function MoreDetails() {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm rounded-xl border border-border/60 bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-primary">Ana Lucía Torres</span>
          <span className="text-xs text-text-secondary">Analista de nómina · Bogotá</span>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {open ? "Ver menos" : "Ver más detalles"}
            <ChevronDown data-icon="inline-end" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border/60 px-4 py-3 text-sm">
          {DETAILS.map(([term, value]) => (
            <React.Fragment key={term}>
              <dt className="text-text-muted">{term}</dt>
              <dd className="text-text-primary">{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}

const PENDING = ["Carlos Mejía · Contrato", "Diana Ruiz · Certificado EPS", "Jorge Salas · Foto de perfil", "Renata Pinto · Referencias"];

function PendingList() {
  const [open, setOpen] = React.useState(false);
  const [first, ...rest] = PENDING;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm">
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2">
        <span className="text-sm text-text-primary">{first}</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={open ? "Ocultar pendientes" : `Mostrar ${rest.length} pendientes más`}>
            <ChevronsUpDown />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-col gap-2 pt-2">
        {rest.map((item) => (
          <div key={item} className="rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-text-primary">
            {item}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function AdvancedFilters() {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Filter className="size-4 text-text-muted" />
          Filtros avanzados
          <Badge variant="secondary" className="ml-1">
            2
          </Badge>
          <ChevronDown className={`ml-auto size-4 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-2 px-2 pt-2">
          {["Área: Operaciones", "Estado: Activo", "Ciudad", "Antigüedad"].map((filter, index) => (
            <span
              key={filter}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${index < 2 ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 bg-surface text-text-secondary"}`}
            >
              {filter}
            </span>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const collapsibleEntry = defineEntry({
  id: "collapsible",
  name: "Collapsible",
  group: "ui",
  description:
    "Muestra u oculta un bloque de contenido desde un trigger, sin la lista de ítems de Accordion. Úsalo para «Ver más detalles», filtros avanzados o listas que se pliegan para dejar solo el primer elemento.",
  importPath: 'import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"',
  sourcePath: "src/components/ui/collapsible.tsx",
  status: "stable",
  tags: ["radix", "animación"],
  playground: definePlayground({
    controls: {
      defaultOpen: { type: "boolean", label: "Abierto al inicio", default: false },
      disabled: { type: "boolean", default: false },
      triggerLabel: { type: "text", label: "Texto del trigger", default: "Ver más detalles" },
    },
    render: ({ defaultOpen, disabled, triggerLabel }) => (
      <Collapsible key={String(defaultOpen)} defaultOpen={defaultOpen} disabled={disabled} className="w-full max-w-sm">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            {triggerLabel}
            <ChevronsUpDown data-icon="inline-end" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-3 text-sm text-text-secondary">
            Contrato indefinido a tiempo completo desde marzo de 2022, adscrito al centro de costo CC-0412 Operaciones.
          </p>
        </CollapsibleContent>
      </Collapsible>
    ),
    code: ({ defaultOpen, disabled, triggerLabel }) => {
      const attrs = [defaultOpen ? "defaultOpen" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `<Collapsible${attrs ? ` ${attrs}` : ""}>
  <CollapsibleTrigger asChild>
    <Button variant="outline" size="sm">${triggerLabel} <ChevronsUpDown data-icon="inline-end" /></Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p className="pt-3 text-sm text-text-secondary">…</p>
  </CollapsibleContent>
</Collapsible>`;
    },
  }),
  examples: [
    {
      id: "more-details",
      title: "«Ver más detalles» en una ficha",
      description: "Controlado con `open` para que el texto del trigger y la flecha reflejen el estado.",
      code: `const [open, setOpen] = React.useState(false);

<Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-surface">
  <div className="flex items-center justify-between px-4 py-3">
    <span>Ana Lucía Torres</span>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm">
        {open ? "Ver menos" : "Ver más detalles"}
        <ChevronDown data-icon="inline-end" className={open ? "rotate-180" : ""} />
      </Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent>
    <dl className="border-t px-4 py-3">…</dl>
  </CollapsibleContent>
</Collapsible>`,
      render: () => <MoreDetails />,
    },
    {
      id: "collapsed-list",
      title: "Lista plegada al primer elemento",
      description: "El primer ítem queda fuera de CollapsibleContent para que siempre se vea; el trigger de icono despliega el resto.",
      code: `<Collapsible open={open} onOpenChange={setOpen}>
  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
    <span>{first}</span>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Mostrar pendientes"><ChevronsUpDown /></Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent className="flex flex-col gap-2 pt-2">
    {rest.map((item) => <div key={item} className="rounded-lg border px-3 py-2">{item}</div>)}
  </CollapsibleContent>
</Collapsible>`,
      render: () => <PendingList />,
    },
    {
      id: "advanced-filters",
      title: "Filtros avanzados abiertos por defecto",
      description: "El trigger es una fila completa clicable; un Badge cuenta los filtros activos aunque el bloque esté cerrado.",
      code: `<Collapsible defaultOpen>
  <CollapsibleTrigger asChild>
    <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted">
      <Filter className="size-4" /> Filtros avanzados <Badge variant="secondary">2</Badge>
      <ChevronDown className="ml-auto size-4" />
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="grid grid-cols-2 gap-2 pt-2">…</div>
  </CollapsibleContent>
</Collapsible>`,
      render: () => <AdvancedFilters />,
    },
  ],
  props: [
    { name: "open / defaultOpen", type: "boolean", description: "Estado controlado o inicial." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Se dispara al abrir o cerrar." },
    { name: "disabled", type: "boolean", default: "false", description: "El trigger deja de responder." },
    { name: "CollapsibleTrigger.asChild", type: "boolean", description: "Aplica el rol y `aria-expanded` al hijo (normalmente un Button)." },
    { name: "CollapsibleContent.forceMount", type: "boolean", description: "Mantiene el contenido en el DOM aunque esté cerrado (p. ej. para formularios)." },
  ],
  guidelines: {
    do: [
      "Di en el trigger qué se va a mostrar («Ver más detalles», «3 pendientes más»), no solo «Más».",
      "Gira la flecha con el estado para que se entienda que se puede volver a plegar.",
      "Deja fuera del contenido lo imprescindible: el título, el primer ítem, el contador.",
    ],
    dont: [
      "No lo uses para varias secciones seguidas: eso es Accordion.",
      "No escondas dentro campos obligatorios de un formulario sin indicarlo.",
      "No anides collapsibles; el usuario pierde la referencia de qué abrió.",
    ],
  },
  related: ["accordion", "drawer-section", "button"],
});
