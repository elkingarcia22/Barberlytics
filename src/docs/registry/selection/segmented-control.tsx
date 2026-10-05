import * as React from "react";
import { Calendar, LayoutGrid, List, Table2 } from "lucide-react";
import { SegmentedControl, type SelectionOption } from "@/components/selection";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["solid", "outline", "underline"] as const;
const SIZES = ["sm", "md"] as const;

const VIEWS: SelectionOption[] = [
  { value: "grid", label: "Cuadrícula", icon: LayoutGrid },
  { value: "list", label: "Lista", icon: List },
  { value: "table", label: "Tabla", icon: Table2 },
];

const PERIODS: SelectionOption[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "custom", label: "Personalizado", icon: Calendar, disabled: true },
];

const STATUSES: SelectionOption[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "archived", label: "Archivados" },
];

function PlaygroundDemo({ variant, size, fullWidth, disabled, withIcons }: { variant: "solid" | "outline" | "underline"; size: "sm" | "md"; fullWidth: boolean; disabled: boolean; withIcons: boolean }) {
  const [value, setValue] = React.useState<string | undefined>("grid");
  const options = withIcons ? VIEWS : VIEWS.map((option) => ({ ...option, icon: undefined }));
  return (
    <div className="w-full max-w-md">
      <SegmentedControl options={options} value={value} onChange={setValue} variant={variant} size={size} fullWidth={fullWidth} disabled={disabled} ariaLabel="Vista" />
    </div>
  );
}

function ViewDemo() {
  const [value, setValue] = React.useState<string | undefined>("list");
  return (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl options={VIEWS} value={value} onChange={setValue} ariaLabel="Modo de vista" />
      <p className="text-xs text-text-muted">Mostrando en modo: {value}</p>
    </div>
  );
}

function PeriodDemo() {
  const [value, setValue] = React.useState<string | undefined>("30d");
  return <SegmentedControl options={PERIODS} value={value} onChange={setValue} variant="outline" size="sm" ariaLabel="Periodo" />;
}

function UnderlineDemo() {
  const [value, setValue] = React.useState<string | undefined>("all");
  return (
    <div className="w-full max-w-md">
      <SegmentedControl options={STATUSES} value={value} onChange={setValue} variant="underline" fullWidth label="Estado" description="Filtra la tabla de programas." />
    </div>
  );
}

export const segmentedControlEntry = defineEntry({
  id: "segmented-control",
  name: "SegmentedControl",
  group: "selection",
  description:
    "Un grupo de botones pegados para alternar entre pocas opciones excluyentes, en tres variantes (sólido, contorno y subrayado) y dos tamaños. Úsalo para cambiar de vista, de periodo o de estado sin abrir un menú.",
  importPath: 'import { SegmentedControl } from "@/components/selection"',
  sourcePath: "src/components/selection/SegmentedControl.tsx",
  status: "stable",
  tags: ["toggle", "radiogroup"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "solid" },
      size: { type: "select", options: SIZES, default: "md" },
      fullWidth: { type: "boolean", label: "Ancho completo", default: false },
      withIcons: { type: "boolean", label: "Con iconos", default: true },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ variant, size, fullWidth, withIcons, disabled }) => (
      <PlaygroundDemo variant={variant as (typeof VARIANTS)[number]} size={size as (typeof SIZES)[number]} fullWidth={fullWidth} withIcons={withIcons} disabled={disabled} />
    ),
    code: ({ variant, size, fullWidth, withIcons, disabled }) => {
      const attrs = [variant !== "solid" ? `variant="${variant}"` : "", size !== "md" ? `size="${size}"` : "", fullWidth ? "fullWidth" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      const icon = (name: string) => (withIcons ? `, icon: ${name}` : "");
      return `const [value, setValue] = React.useState<string>("grid");

<SegmentedControl
  ariaLabel="Vista"
  options={[
    { value: "grid", label: "Cuadrícula"${icon("LayoutGrid")} },
    { value: "list", label: "Lista"${icon("List")} },
    { value: "table", label: "Tabla"${icon("Table2")} },
  ]}
  value={value}
  onChange={setValue}${attrs ? `\n  ${attrs}` : ""}
/>`;
    },
  }),
  examples: [
    {
      id: "views",
      title: "Cambio de vista (solid)",
      description: "El segmento activo se eleva sobre el fondo muted.",
      code: `<SegmentedControl
  ariaLabel="Modo de vista"
  options={[
    { value: "grid", label: "Cuadrícula", icon: LayoutGrid },
    { value: "list", label: "Lista", icon: List },
    { value: "table", label: "Tabla", icon: Table2 },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <ViewDemo />,
    },
    {
      id: "periods",
      title: "Periodos (outline, sm) con opción deshabilitada",
      code: `<SegmentedControl
  variant="outline"
  size="sm"
  ariaLabel="Periodo"
  options={[
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
    { value: "90d", label: "90 días" },
    { value: "custom", label: "Personalizado", icon: Calendar, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <PeriodDemo />,
    },
    {
      id: "underline",
      title: "Subrayado a ancho completo, con etiqueta",
      description: "La variante underline se comporta como pestañas de filtro; label y description vienen del Field interno.",
      code: `<SegmentedControl
  variant="underline"
  fullWidth
  label="Estado"
  description="Filtra la tabla de programas."
  options={[
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "archived", label: "Archivados" },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <UnderlineDemo />,
    },
  ],
  props: [
    { name: "options", type: "SelectionOption[]", description: "Se usan value, label, icon y disabled; description, eyebrow y badge se ignoran." },
    { name: "value", type: "string", description: "Segmento activo (controlado)." },
    { name: "onChange", type: "(value: string) => void", description: "Se llama al pulsar un segmento." },
    { name: "variant", type: '"solid" | "outline" | "underline"', default: '"solid"', description: "Estilo del contenedor y del segmento activo." },
    { name: "size", type: '"sm" | "md"', default: '"md"', description: "Altura y tipografía de los segmentos." },
    { name: "fullWidth", type: "boolean", default: "false", description: "Reparte el ancho del contenedor entre los segmentos." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita todos los segmentos." },
    { name: "label", type: "string", description: "Etiqueta del Field envolvente." },
    { name: "description", type: "string", description: "Ayuda bajo el control." },
    { name: "error", type: "string", description: "Mensaje de error del Field." },
    { name: "ariaLabel", type: "string", description: "aria-label del radiogroup cuando no hay label visible." },
    { name: "className", type: "string", description: "Clases para el contenedor." },
  ],
  guidelines: {
    do: [
      "Úsalo con 2 a 5 opciones de label corto.",
      "Pasa `ariaLabel` siempre que no haya `label` visible.",
      "Usa underline cuando el control actúa como filtro de una tabla o lista.",
      "En los menús del marco (Personalización, selector de tema) envuélvelo en `SegmentedGroup` de `@/components/ui/segmented-group`: pone la etiqueta en versalitas de 11px encima. En una pantalla, el título de la sección va en la escala normal, sin mayúsculas.",
    ],
    dont: [
      "No lo uses para navegar entre páginas: para eso están Tabs.",
      "No pongas labels largos: el segmento trunca y pierde sentido.",
      "No pintes otro grupo de botones a mano para elegir una opción: el sólido ya comparte pista y activo con las pestañas `view`.",
      "No lo metas, ni metas otras pestañas, dentro de una pestaña para filtrar una lista: ahí van chips (`Chip` con `selected` y `count`).",
    ],
  },
  related: ["tabs", "radio-group", "option-tile", "card-selection"],
});
