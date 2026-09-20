import * as React from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { defineEntry, definePlayground } from "../types";

const SIDES = ["top", "right", "bottom", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;

function DimensionsPopover() {
  const [width, setWidth] = React.useState("320");
  const [height, setHeight] = React.useState("180");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings2 /> Dimensiones
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 gap-3">
        <PopoverHeader>
          <PopoverTitle>Dimensiones</PopoverTitle>
          <PopoverDescription>Tamaño del bloque en píxeles.</PopoverDescription>
        </PopoverHeader>
        <div className="grid grid-cols-[64px_1fr] items-center gap-2">
          <Label htmlFor="pop-width">Ancho</Label>
          <Input id="pop-width" className="h-8" value={width} onChange={(event) => setWidth(event.target.value)} />
          <Label htmlFor="pop-height">Alto</Label>
          <Input id="pop-height" className="h-8" value={height} onChange={(event) => setHeight(event.target.value)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ControlledPopover() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex items-center gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">Archivar encuesta</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>¿Archivar "Clima Q3"?</PopoverTitle>
            <PopoverDescription>Dejará de recibir respuestas. Podrás restaurarla.</PopoverDescription>
          </PopoverHeader>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Archivar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <span className="text-xs text-text-secondary">{open ? "Abierto" : "Cerrado"}</span>
    </div>
  );
}

export const popoverEntry = defineEntry({
  id: "popover",
  name: "Popover",
  group: "ui",
  description:
    "Panel flotante anclado a un disparador, con entrada suave (fade + zoom + deslizamiento según el lado) y salida rápida. Úsalo para filtros, selectores y microformularios que no justifican un diálogo.",
  importPath: 'import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverAnchor } from "@/components/ui/popover"',
  sourcePath: "src/components/ui/popover.tsx",
  status: "stable",
  tags: ["radix", "overlay"],
  playground: definePlayground({
    controls: {
      side: { type: "select", options: SIDES, default: "bottom" },
      align: { type: "select", options: ALIGNS, default: "center" },
      sideOffset: { type: "number", default: 4, min: 0, max: 24, step: 2 },
    },
    layout: "center",
    render: ({ side, align, sideOffset }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir popover</Button>
        </PopoverTrigger>
        <PopoverContent side={side as (typeof SIDES)[number]} align={align as (typeof ALIGNS)[number]} sideOffset={sideOffset}>
          <PopoverHeader>
            <PopoverTitle>Título del panel</PopoverTitle>
            <PopoverDescription>
              Sale por <code>{side}</code>, alineado a <code>{align}</code>.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    ),
    code: ({ side, align, sideOffset }) => {
      const attrs = [side !== "bottom" ? `side="${side}"` : "", align !== "center" ? `align="${align}"` : "", sideOffset !== 4 ? `sideOffset={${sideOffset}}` : ""]
        .filter(Boolean)
        .join(" ");
      return `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Abrir popover</Button>
  </PopoverTrigger>
  <PopoverContent${attrs ? ` ${attrs}` : ""}>
    <PopoverHeader>
      <PopoverTitle>Título del panel</PopoverTitle>
      <PopoverDescription>Sale por ${side}, alineado a ${align}.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`;
    },
  }),
  examples: [
    {
      id: "form",
      title: "Microformulario",
      description: "Encabezado más un par de campos; el ancho se ajusta con `className`.",
      code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline"><Settings2 /> Dimensiones</Button>
  </PopoverTrigger>
  <PopoverContent className="w-64 gap-3">
    <PopoverHeader>
      <PopoverTitle>Dimensiones</PopoverTitle>
      <PopoverDescription>Tamaño del bloque en píxeles.</PopoverDescription>
    </PopoverHeader>
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <Label htmlFor="width">Ancho</Label>
      <Input id="width" className="h-8" value={width} onChange={(e) => setWidth(e.target.value)} />
      <Label htmlFor="height">Alto</Label>
      <Input id="height" className="h-8" value={height} onChange={(e) => setHeight(e.target.value)} />
    </div>
  </PopoverContent>
</Popover>`,
      render: () => <DimensionsPopover />,
    },
    {
      id: "controlled",
      title: "Controlado",
      description: "Con `open` y `onOpenChange` los botones internos pueden cerrarlo.",
      code: `const [open, setOpen] = React.useState(false);

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><Button variant="outline">Archivar encuesta</Button></PopoverTrigger>
  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>¿Archivar "Clima Q3"?</PopoverTitle>
      <PopoverDescription>Dejará de recibir respuestas. Podrás restaurarla.</PopoverDescription>
    </PopoverHeader>
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      <Button size="sm" onClick={() => setOpen(false)}>Archivar</Button>
    </div>
  </PopoverContent>
</Popover>`,
      render: () => <ControlledPopover />,
    },
  ],
  props: [
    { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Lado del disparador por el que sale; también decide la dirección del deslizamiento." },
    { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alineación respecto al disparador." },
    { name: "sideOffset", type: "number", default: "4", description: "Separación en px respecto al disparador." },
    { name: "collisionPadding", type: "number", default: "16", description: "Margen mínimo con los bordes del viewport antes de recolocarse." },
    { name: "container", type: "HTMLElement", description: "Nodo donde se monta el portal (por defecto, body)." },
    { name: "liquid", type: "boolean", default: "false", description: "Reservado a los paneles del header del shell: sustituye el zoom por un clip-path circular desde `--reveal-x`/`--reveal-y`." },
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Estado controlado, en `Popover`." },
  ],
  guidelines: {
    do: ["Usa `asChild` en el disparador para que el botón conserve su semántica.", "Mantén el contenido a una tarea: un filtro, un ajuste, una confirmación ligera.", "Cierra desde dentro con estado controlado cuando hay acciones."],
    dont: ["No lo uses para flujos largos o con scroll: usa Sheet o Dialog.", "No actives `liquid` fuera del header del shell."],
  },
  related: ["tooltip", "dialog", "sheet", "hover-card", "dropdown-menu"],
});
