import * as React from "react";
import { Copy, Info, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { defineEntry, definePlayground } from "../types";

const SIDES = ["top", "right", "bottom", "left"] as const;
type Side = (typeof SIDES)[number];
const ALIGNS = ["center", "start", "end"] as const;
type Align = (typeof ALIGNS)[number];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd data-slot="kbd" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-background/20 px-1 font-mono text-[10px] font-medium">
      {children}
    </kbd>
  );
}

const ACTIONS = [
  { label: "Editar", icon: Pencil },
  { label: "Duplicar", icon: Copy },
  { label: "Eliminar", icon: Trash2 },
];

function IconActions() {
  return (
    <div className="flex items-center gap-1">
      {ACTIONS.map(({ label, icon: Icon }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={label}>
              <Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function ControlledTooltip() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex items-center gap-3">
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Button variant="outline">Publicar</Button>
        </TooltipTrigger>
        <TooltipContent>Se enviará a 412 personas</TooltipContent>
      </Tooltip>
      <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)}>
        {open ? "Ocultar" : "Mostrar"} desde fuera
      </Button>
    </div>
  );
}

export const tooltipEntry = defineEntry({
  id: "tooltip",
  name: "Tooltip",
  group: "ui",
  description:
    "Etiqueta flotante de Radix en fondo oscuro con flecha, que aparece tras 200ms al pasar el cursor o enfocar. Úsalo para nombrar botones de solo icono o dar un dato breve; nunca para contenido que la persona necesite leer para continuar.",
  importPath: 'import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"',
  sourcePath: "src/components/ui/tooltip.tsx",
  status: "stable",
  tags: ["radix", "popper"],
  playground: definePlayground({
    controls: {
      side: { type: "select", label: "Lado", options: SIDES, default: "top" },
      align: { type: "select", label: "Alineación", options: ALIGNS, default: "center" },
      sideOffset: { type: "number", label: "Separación", default: 0, min: 0, max: 16, step: 2 },
      content: { type: "text", label: "Contenido", default: "Guardar cambios" },
    },
    render: ({ side, align, sideOffset, content }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Pasa el cursor</Button>
        </TooltipTrigger>
        <TooltipContent side={side as Side} align={align as Align} sideOffset={sideOffset}>
          {content}
        </TooltipContent>
      </Tooltip>
    ),
    code: ({ side, align, sideOffset, content }) => {
      const attrs = [side !== "top" ? `side="${side}"` : "", align !== "center" ? `align="${align}"` : "", sideOffset !== 0 ? `sideOffset={${sideOffset}}` : ""]
        .filter(Boolean)
        .join(" ");
      return `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Pasa el cursor</Button>
  </TooltipTrigger>
  <TooltipContent${attrs ? ` ${attrs}` : ""}>${content}</TooltipContent>
</Tooltip>`;
    },
  }),
  examples: [
    {
      id: "icon-buttons",
      title: "Botones de solo icono",
      description: "El caso principal: el tooltip nombra la acción y el `aria-label` la cubre para lectores de pantalla.",
      code: `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil /></Button>
  </TooltipTrigger>
  <TooltipContent>Editar</TooltipContent>
</Tooltip>`,
      render: () => <IconActions />,
    },
    {
      id: "shortcut",
      title: "Con atajo de teclado",
      description: "Un `<kbd data-slot=\"kbd\">` dentro del contenido ajusta el padding derecho automáticamente.",
      code: `<TooltipContent>
  Guardar <kbd data-slot="kbd">⌘S</kbd>
</TooltipContent>`,
      render: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Guardar</Button>
          </TooltipTrigger>
          <TooltipContent>
            Guardar <Kbd>⌘S</Kbd>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "disabled",
      title: "Sobre un botón deshabilitado",
      description: "Un botón `disabled` no emite eventos de puntero; envuélvelo en un `<span>` que sí los reciba.",
      code: `<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0} className="inline-flex">
      <Button disabled>Exportar</Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>Disponible cuando cierre la encuesta</TooltipContent>
</Tooltip>`,
      render: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex">
              <Button disabled>Exportar</Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Disponible cuando cierre la encuesta</TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "controlled",
      title: "Controlado",
      description: "Con `open` y `onOpenChange` se puede abrir desde otra parte de la interfaz.",
      code: `const [open, setOpen] = React.useState(false);

<Tooltip open={open} onOpenChange={setOpen}>
  <TooltipTrigger asChild><Button variant="outline">Publicar</Button></TooltipTrigger>
  <TooltipContent>Se enviará a 412 personas</TooltipContent>
</Tooltip>`,
      render: () => <ControlledTooltip />,
    },
    {
      id: "delay",
      title: "Sin retardo",
      description: "Un `TooltipProvider` local cambia el `delayDuration` solo para sus hijos; la app ya monta uno global con 200ms.",
      code: `<TooltipProvider delayDuration={0}>
  <Tooltip>
    <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Ayuda"><Info /></Button></TooltipTrigger>
    <TooltipContent>Aparece al instante</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
      render: () => (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Ayuda">
                <Info />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aparece al instante</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ],
  props: [
    { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "En `TooltipContent`. Lado preferido; Radix lo invierte si no cabe." },
    { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "En `TooltipContent`. Alineación sobre el trigger." },
    { name: "sideOffset", type: "number", default: "0", description: "En `TooltipContent`. Separación en px; la flecha ya aporta la suya." },
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "En `Tooltip`. Estado controlado." },
    { name: "delayDuration", type: "number", default: "200", description: "En `TooltipProvider`. Milisegundos antes de mostrarse. La app monta un provider global." },
    { name: "asChild", type: "boolean", description: "En `TooltipTrigger`. Usa el hijo como trigger sin añadir un botón extra." },
  ],
  guidelines: {
    do: ["Nombra los botones de solo icono con tooltip y `aria-label`.", "Una línea corta; si necesitas más, usa HoverCard o Popover.", "Envuelve los triggers deshabilitados en un `<span tabIndex={0}>`."],
    dont: ["No pongas información imprescindible solo en un tooltip: en móvil no hay hover.", "No metas enlaces ni botones dentro; el contenido no es interactivo.", "No montes otro `TooltipProvider` global; ya existe en la app.", "No añadas un tooltip a mano para enseñar un texto cortado con elipsis: lo hace `TruncationTooltip` en toda la app."],
  },
  related: ["hover-card", "popover", "button"],
});
