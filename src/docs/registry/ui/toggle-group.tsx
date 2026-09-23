import * as React from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, KanbanSquare, List, Table2, Underline } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["default", "outline"] as const;
type Variant = (typeof VARIANTS)[number];
const SIZES = ["sm", "default", "lg"] as const;
type Size = (typeof SIZES)[number];

const VIEWS = [
  { value: "table", label: "Tabla", icon: Table2 },
  { value: "board", label: "Tablero", icon: KanbanSquare },
  { value: "list", label: "Lista", icon: List },
] as const;

function ViewSwitcher() {
  const [view, setView] = React.useState("table");
  const current = VIEWS.find((item) => item.value === view);
  return (
    <div className="flex items-center gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        value={view}
        onValueChange={(value) => {
          if (value) setView(value);
        }}
        aria-label="Vista de colaboradores"
      >
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <ToggleGroupItem key={value} value={value} aria-label={label}>
            <Icon />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="text-xs text-text-muted">Viendo: {current?.label}</span>
    </div>
  );
}

function FormatBar() {
  const [format, setFormat] = React.useState<string[]>(["bold"]);
  return (
    <div className="flex items-center gap-3">
      <ToggleGroup type="multiple" value={format} onValueChange={setFormat} aria-label="Formato del texto">
        <ToggleGroupItem value="bold" aria-label="Negrita">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Cursiva">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Subrayado">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>
      <span className="text-xs text-text-muted">{format.length ? format.join(" + ") : "sin formato"}</span>
    </div>
  );
}

const DAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

function WorkingDays() {
  const [days, setDays] = React.useState<string[]>(["L", "M", "X", "J", "V"]);
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-xs font-medium text-text-secondary">Días laborables del turno</span>
      <ToggleGroup type="multiple" variant="outline" size="sm" value={days} onValueChange={setDays} aria-label="Días laborables">
        {DAYS.map((day) => (
          <ToggleGroupItem key={day} value={day} aria-label={day} className="w-8 px-0">
            {day}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export const toggleGroupEntry = defineEntry({
  id: "toggle-group",
  name: "ToggleGroup",
  group: "ui",
  description:
    "Conjunto de Toggle pegados que comparten variante y tamaño por contexto. En modo `single` funciona como selector exclusivo (vista tabla o tablero); en `multiple`, como barra de opciones combinables (negrita + cursiva).",
  importPath: 'import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"',
  sourcePath: "src/components/ui/toggle-group.tsx",
  status: "stable",
  tags: ["radix", "cva", "context"],
  playground: definePlayground({
    controls: {
      type: { type: "select", label: "Tipo", options: ["single", "multiple"], default: "single" },
      variant: { type: "select", options: VARIANTS, default: "outline" },
      size: { type: "select", options: SIZES, default: "default" },
      withLabels: { type: "boolean", label: "Con texto", default: false },
      disabled: { type: "boolean", default: false },
    },
    render: ({ type, variant, size, withLabels, disabled }) =>
      type === "single" ? (
        <ToggleGroup type="single" defaultValue="left" variant={variant as Variant} size={size as Size} disabled={disabled} aria-label="Alineación">
          <ToggleGroupItem value="left" aria-label="Izquierda">
            <AlignLeft />
            {withLabels && "Izquierda"}
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centro">
            <AlignCenter />
            {withLabels && "Centro"}
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Derecha">
            <AlignRight />
            {withLabels && "Derecha"}
          </ToggleGroupItem>
        </ToggleGroup>
      ) : (
        <ToggleGroup type="multiple" defaultValue={["bold"]} variant={variant as Variant} size={size as Size} disabled={disabled} aria-label="Formato">
          <ToggleGroupItem value="bold" aria-label="Negrita">
            <Bold />
            {withLabels && "Negrita"}
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Cursiva">
            <Italic />
            {withLabels && "Cursiva"}
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Subrayado">
            <Underline />
            {withLabels && "Subrayado"}
          </ToggleGroupItem>
        </ToggleGroup>
      ),
    code: ({ type, variant, size, withLabels, disabled }) => {
      const attrs = [
        `type="${type}"`,
        type === "single" ? 'defaultValue="left"' : 'defaultValue={["bold"]}',
        variant !== "default" ? `variant="${variant}"` : "",
        size !== "default" ? `size="${size}"` : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const items =
        type === "single"
          ? [
              ["left", "AlignLeft", "Izquierda"],
              ["center", "AlignCenter", "Centro"],
              ["right", "AlignRight", "Derecha"],
            ]
          : [
              ["bold", "Bold", "Negrita"],
              ["italic", "Italic", "Cursiva"],
              ["underline", "Underline", "Subrayado"],
            ];
      const body = items
        .map(([value, icon, label]) => `  <ToggleGroupItem value="${value}" aria-label="${label}"><${icon} />${withLabels ? ` ${label}` : ""}</ToggleGroupItem>`)
        .join("\n");
      return `<ToggleGroup ${attrs}>\n${body}\n</ToggleGroup>`;
    },
  }),
  examples: [
    {
      id: "single-view",
      title: "Selector de vista (single)",
      description: "Una sola opción activa. Radix permite deseleccionar al volver a pulsar y emite `\"\"`; el ejemplo lo ignora para que siempre haya una vista.",
      code: `const [view, setView] = React.useState("table");

<ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => { if (v) setView(v); }} aria-label="Vista de colaboradores">
  <ToggleGroupItem value="table" aria-label="Tabla"><Table2 /> Tabla</ToggleGroupItem>
  <ToggleGroupItem value="board" aria-label="Tablero"><KanbanSquare /> Tablero</ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista"><List /> Lista</ToggleGroupItem>
</ToggleGroup>`,
      render: () => <ViewSwitcher />,
    },
    {
      id: "multiple-format",
      title: "Barra de formato (multiple)",
      description: "Varias opciones activas a la vez; el valor es un array de strings.",
      code: `const [format, setFormat] = React.useState<string[]>(["bold"]);

<ToggleGroup type="multiple" value={format} onValueChange={setFormat} aria-label="Formato del texto">
  <ToggleGroupItem value="bold" aria-label="Negrita"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Cursiva"><Italic /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Subrayado"><Underline /></ToggleGroupItem>
</ToggleGroup>`,
      render: () => <FormatBar />,
    },
    {
      id: "working-days",
      title: "Días laborables (sm, outline)",
      description: "Siete ítems de ancho fijo con `className=\"w-8 px-0\"`; el tamaño `sm` lo fija el grupo una sola vez.",
      code: `<ToggleGroup type="multiple" variant="outline" size="sm" value={days} onValueChange={setDays} aria-label="Días laborables">
  {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
    <ToggleGroupItem key={day} value={day} aria-label={day} className="w-8 px-0">{day}</ToggleGroupItem>
  ))}
</ToggleGroup>`,
      render: () => <WorkingDays />,
    },
    {
      id: "disabled",
      title: "Deshabilitado",
      description: "`disabled` en el grupo bloquea todos los ítems; también se puede poner en un ítem suelto.",
      code: `<ToggleGroup type="single" defaultValue="left" variant="outline" disabled>
  …
</ToggleGroup>

<ToggleGroup type="single" defaultValue="left" variant="outline">
  <ToggleGroupItem value="left" aria-label="Izquierda"><AlignLeft /></ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centro" disabled><AlignCenter /></ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Derecha"><AlignRight /></ToggleGroupItem>
</ToggleGroup>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-6">
          <ToggleGroup type="single" defaultValue="left" variant="outline" disabled aria-label="Alineación deshabilitada">
            <ToggleGroupItem value="left" aria-label="Izquierda">
              <AlignLeft />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Centro">
              <AlignCenter />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Derecha">
              <AlignRight />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" defaultValue="left" variant="outline" aria-label="Alineación con un ítem deshabilitado">
            <ToggleGroupItem value="left" aria-label="Izquierda">
              <AlignLeft />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Centro" disabled>
              <AlignCenter />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Derecha">
              <AlignRight />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ),
    },
  ],
  props: [
    { name: "type", type: '"single" | "multiple"', description: "Obligatorio. `single` guarda un string; `multiple`, un array." },
    { name: "value / defaultValue", type: "string | string[]", description: "Estado controlado o inicial, según `type`." },
    { name: "onValueChange", type: "(value: string | string[]) => void", description: "En `single`, al deseleccionar llega `\"\"`." },
    { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Se propaga a todos los ítems por contexto." },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Se propaga a todos los ítems por contexto." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita el grupo completo." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Solo afecta a la navegación con flechas; el layout sigue siendo en fila." },
    { name: "ToggleGroupItem.value", type: "string", description: "Obligatorio. Identificador del ítem." },
  ],
  guidelines: {
    do: [
      "Usa `single` para vistas o alineaciones (exclusivas) y `multiple` para atributos combinables.",
      "Pon `aria-label` en el grupo y en cada ítem que solo lleve icono.",
      "Fija `variant` y `size` en el grupo, no ítem por ítem.",
    ],
    dont: [
      "No lo uses como navegación entre páginas: eso es Tabs.",
      "No pases de cinco o seis ítems; a partir de ahí, Select.",
      "No dejes un `single` sin valor si la interfaz necesita siempre una opción activa: filtra el `\"\"`.",
    ],
  },
  related: ["toggle", "segmented-control", "tabs", "button-group"],
});
