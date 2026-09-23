import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Download, FileDown, FileUp, Mail, Minus, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defineEntry, definePlayground } from "../types";

const ORIENTATIONS = ["horizontal", "vertical"] as const;
type Orientation = (typeof ORIENTATIONS)[number];
const VARIANTS = ["outline", "secondary", "default", "ghost"] as const;
type Variant = (typeof VARIANTS)[number];
const SIZES = ["sm", "default", "lg"] as const;
type Size = (typeof SIZES)[number];

function SplitExport() {
  return (
    <ButtonGroup>
      <Button>
        <Download data-icon="inline-start" /> Exportar
      </Button>
      <ButtonGroupSeparator className="bg-primary-foreground/30" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label="Más formatos de exportación">
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem>
            <FileDown /> Exportar CSV
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileDown /> Exportar Excel
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail /> Enviar por correo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

function SeatsStepper() {
  const [seats, setSeats] = React.useState(12);
  return (
    <div className="flex items-center gap-3">
      <ButtonGroup aria-label="Cupos del curso">
        <Button variant="outline" size="icon" aria-label="Quitar un cupo" disabled={seats <= 1} onClick={() => setSeats((n) => n - 1)}>
          <Minus />
        </Button>
        <span className="flex min-w-12 items-center justify-center border border-border bg-surface text-sm tabular-nums text-text-primary">
          {seats}
        </span>
        <Button variant="outline" size="icon" aria-label="Añadir un cupo" onClick={() => setSeats((n) => n + 1)}>
          <Plus />
        </Button>
      </ButtonGroup>
      <span className="text-xs text-text-muted">cupos</span>
    </div>
  );
}

export const buttonGroupEntry = defineEntry({
  id: "button-group",
  name: "ButtonGroup",
  group: "ui",
  description:
    "Une varios Button (o un botón y un trigger) en un solo control: quita los radios internos y solapa los bordes un píxel. Úsalo para acciones hermanas (Exportar / Importar), botones divididos y paginadores compactos.",
  importPath: 'import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"',
  sourcePath: "src/components/ui/button-group.tsx",
  status: "stable",
  tags: ["cva", "composición"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      variant: { type: "select", label: "Variante de los botones", options: VARIANTS, default: "outline" },
      size: { type: "select", options: SIZES, default: "default" },
      withSeparator: { type: "boolean", label: "Con separador", default: false },
    },
    render: ({ orientation, variant, size, withSeparator }) => {
      const sep = withSeparator ? <ButtonGroupSeparator orientation={orientation === "vertical" ? "horizontal" : "vertical"} /> : null;
      return (
        <ButtonGroup orientation={orientation as Orientation}>
          <Button variant={variant as Variant} size={size as Size}>
            <Download data-icon="inline-start" /> Exportar
          </Button>
          {sep}
          <Button variant={variant as Variant} size={size as Size}>
            <Upload data-icon="inline-start" /> Importar
          </Button>
          {sep}
          <Button variant={variant as Variant} size={size as Size}>
            <Mail data-icon="inline-start" /> Enviar
          </Button>
        </ButtonGroup>
      );
    },
    code: ({ orientation, variant, size, withSeparator }) => {
      const groupAttrs = orientation !== "horizontal" ? ` orientation="${orientation}"` : "";
      const btnAttrs = [variant !== "default" ? `variant="${variant}"` : "", size !== "default" ? `size="${size}"` : ""].filter(Boolean).join(" ");
      const btn = (icon: string, label: string) => `  <Button${btnAttrs ? ` ${btnAttrs}` : ""}><${icon} data-icon="inline-start" /> ${label}</Button>`;
      const sep = withSeparator ? `\n  <ButtonGroupSeparator${orientation === "vertical" ? ' orientation="horizontal"' : ""} />` : "";
      return `<ButtonGroup${groupAttrs}>\n${btn("Download", "Exportar")}${sep}\n${btn("Upload", "Importar")}${sep}\n${btn("Mail", "Enviar")}\n</ButtonGroup>`;
    },
  }),
  examples: [
    {
      id: "split-button",
      title: "Botón dividido",
      description: "Acción principal más un trigger de DropdownMenu con los formatos secundarios. Con la variante `default` hace falta ButtonGroupSeparator, porque los botones sin borde no dibujan línea entre sí.",
      code: `<ButtonGroup>
  <Button><Download data-icon="inline-start" /> Exportar</Button>
  <ButtonGroupSeparator className="bg-primary-foreground/30" />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="icon" aria-label="Más formatos de exportación"><ChevronDown /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem><FileDown /> Exportar CSV</DropdownMenuItem>
      <DropdownMenuItem><FileDown /> Exportar Excel</DropdownMenuItem>
      <DropdownMenuItem><Mail /> Enviar por correo</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>`,
      render: () => <SplitExport />,
    },
    {
      id: "siblings",
      title: "Acciones hermanas",
      description: "Dos o tres acciones del mismo peso, con `outline`: el solape de bordes hace el trabajo sin separador.",
      code: `<ButtonGroup>
  <Button variant="outline"><Download data-icon="inline-start" /> Exportar</Button>
  <Button variant="outline"><Upload data-icon="inline-start" /> Importar</Button>
</ButtonGroup>`,
      render: () => (
        <ButtonGroup>
          <Button variant="outline">
            <Download data-icon="inline-start" /> Exportar
          </Button>
          <Button variant="outline">
            <Upload data-icon="inline-start" /> Importar
          </Button>
        </ButtonGroup>
      ),
    },
    {
      id: "stepper",
      title: "Contador con valor en medio",
      description: "Cualquier hijo entra en el grupo: aquí un `<span>` con borde propio entre dos botones de icono.",
      code: `<ButtonGroup aria-label="Cupos del curso">
  <Button variant="outline" size="icon" aria-label="Quitar un cupo" onClick={() => setSeats((n) => n - 1)}><Minus /></Button>
  <span className="flex min-w-12 items-center justify-center border border-border bg-surface text-sm tabular-nums">{seats}</span>
  <Button variant="outline" size="icon" aria-label="Añadir un cupo" onClick={() => setSeats((n) => n + 1)}><Plus /></Button>
</ButtonGroup>`,
      render: () => <SeatsStepper />,
    },
    {
      id: "pager-and-vertical",
      title: "Paginador compacto y orientación vertical",
      description: "Los botones de icono forman un paginador; en vertical, cada botón ocupa el ancho del grupo.",
      code: `<ButtonGroup aria-label="Paginación">
  <Button variant="outline" size="icon" aria-label="Anterior"><ChevronLeft /></Button>
  <Button variant="outline" size="icon" aria-label="Siguiente"><ChevronRight /></Button>
</ButtonGroup>

<ButtonGroup orientation="vertical">
  <Button variant="secondary" size="sm"><FileUp data-icon="inline-start" /> Subir plantilla</Button>
  <Button variant="secondary" size="sm"><FileDown data-icon="inline-start" /> Descargar ejemplo</Button>
</ButtonGroup>`,
      render: () => (
        <div className="flex flex-wrap items-start gap-8">
          <ButtonGroup aria-label="Paginación">
            <Button variant="outline" size="icon" aria-label="Anterior">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" aria-label="Siguiente">
              <ChevronRight />
            </Button>
          </ButtonGroup>
          <ButtonGroup orientation="vertical">
            <Button variant="secondary" size="sm">
              <FileUp data-icon="inline-start" /> Subir plantilla
            </Button>
            <ButtonGroupSeparator orientation="horizontal" />
            <Button variant="secondary" size="sm">
              <FileDown data-icon="inline-start" /> Descargar ejemplo
            </Button>
          </ButtonGroup>
        </div>
      ),
    },
  ],
  props: [
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Dirección del grupo. En vertical los hijos ocupan el ancho completo." },
    { name: "...props", type: 'React.ComponentProps<"div">', description: "Se renderiza con `role=\"group\"`; añade `aria-label` para nombrarlo." },
    { name: "ButtonGroupSeparator.orientation", type: '"horizontal" | "vertical"', default: '"vertical"', description: "Usa `horizontal` dentro de un grupo vertical. Es un Separator decorativo con color `border`." },
  ],
  guidelines: {
    do: [
      "Agrupa solo acciones relacionadas y del mismo tamaño.",
      "Usa `outline` o `secondary` para grupos de iguales; reserva `default` para el botón dividido.",
      "Nombra el grupo con `aria-label` cuando los botones sean solo iconos.",
    ],
    dont: [
      "No mezcles tamaños ni variantes dentro del grupo: el solape de bordes deja de cuadrar.",
      "No lo uses como selector de estado (vista tabla / tablero): eso es ToggleGroup.",
      "No pases de cuatro botones; a partir de ahí, un menú.",
    ],
  },
  related: ["button", "toggle-group", "dropdown-menu", "input-group"],
});
