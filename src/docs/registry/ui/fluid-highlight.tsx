import * as React from "react";
import { Archive, ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FluidHighlight } from "@/components/ui/fluid-highlight";
import { cn } from "@/lib/utils";
import { defineEntry } from "../types";

const OPTIONS = ["Todos los equipos", "Ventas LATAM", "Producto", "Operaciones", "Soporte"] as const;

const ITEM_CLASS =
  "relative z-[1] flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none transition-colors [&_svg]:size-4";

/** Lista custom: el foco real del DOM marca el ítem activo (estrategia de Select). */
function FocusList() {
  return (
    <div className="relative w-64 rounded-xl bg-popover p-2 ring-1 ring-foreground/10 shadow-drawer" role="listbox" aria-label="Equipos">
      <FluidHighlight />
      {OPTIONS.map((option) => (
        <button key={option} type="button" role="option" aria-selected={false} data-radix-collection-item="" className={ITEM_CLASS}>
          {option}
        </button>
      ))}
    </div>
  );
}

/** Lista custom: el atributo `data-highlighted` marca el ítem activo (estrategia de DropdownMenu). */
function HoverList() {
  const [active, setActive] = React.useState<number | null>(null);
  const ACTIONS = [
    { icon: <Pencil />, label: "Editar", variant: "default" },
    { icon: <Copy />, label: "Duplicar", variant: "default" },
    { icon: <Archive />, label: "Archivar", variant: "default" },
    { icon: <Trash2 />, label: "Eliminar", variant: "destructive" },
  ] as const;
  return (
    <div className="relative w-56 rounded-xl bg-popover p-2 ring-1 ring-foreground/10 shadow-drawer" onPointerLeave={() => setActive(null)}>
      <FluidHighlight />
      {ACTIONS.map((action, index) => (
        <div
          key={action.label}
          data-highlighted={active === index ? "" : undefined}
          data-variant={action.variant}
          onPointerEnter={() => setActive(index)}
          className={cn(ITEM_CLASS, action.variant === "destructive" && "text-destructive [&_svg]:text-destructive")}
        >
          {action.icon} {action.label}
        </div>
      ))}
    </div>
  );
}

export const fluidHighlightEntry = defineEntry({
  id: "fluid-highlight",
  name: "FluidHighlight",
  group: "ui",
  description:
    "Píldora de fondo que persigue al ítem activo de una lista en lugar de pintar cada ítem por separado, de modo que recorrer el menú se lee como un movimiento continuo. Ya viene integrada en DropdownMenu, Select y Command; úsala directamente solo al construir una lista propia.",
  importPath: 'import { FluidHighlight } from "@/components/ui/fluid-highlight"',
  sourcePath: "src/components/ui/fluid-highlight.tsx",
  status: "stable",
  tags: ["custom", "animation"],
  examples: [
    {
      id: "built-in",
      title: "Integrada en DropdownMenu",
      description: "Abre el menú y mueve el ratón o usa las flechas: el fondo se desliza entre ítems y se tiñe de rojo en el destructivo.",
      code: `// No hay que hacer nada: DropdownMenuContent ya monta <FluidHighlight /> como primer hijo.
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Acciones <ChevronDown /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-48">
    <DropdownMenuItem><Pencil /> Editar</DropdownMenuItem>
    <DropdownMenuItem><Copy /> Duplicar</DropdownMenuItem>
    <DropdownMenuItem><Archive /> Archivar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><Trash2 /> Eliminar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      render: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Acciones <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive /> Archivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      id: "focus",
      title: "Lista propia guiada por el foco",
      description: "Pulsa Tab o haz clic en las opciones. Los ítems llevan `data-radix-collection-item` y el contenedor es `relative`; la píldora sigue al elemento enfocado.",
      code: `<div className="relative rounded-xl bg-popover p-2 ring-1 ring-foreground/10" role="listbox">
  <FluidHighlight />
  {OPTIONS.map((option) => (
    <button
      key={option}
      type="button"
      role="option"
      data-radix-collection-item=""
      className="relative z-[1] flex w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
    >
      {option}
    </button>
  ))}
</div>`,
      render: () => <FocusList />,
    },
    {
      id: "hover",
      title: "Lista propia guiada por atributo",
      description: "Pasa el ratón. `data-highlighted` marca el ítem activo y `data-variant=\"destructive\"` tiñe la píldora; el radio se copia del propio ítem.",
      code: `const [active, setActive] = React.useState<number | null>(null);

<div className="relative rounded-xl bg-popover p-2 ring-1 ring-foreground/10" onPointerLeave={() => setActive(null)}>
  <FluidHighlight />
  {ACTIONS.map((action, index) => (
    <div
      key={action.label}
      data-highlighted={active === index ? "" : undefined}
      data-variant={action.variant}
      onPointerEnter={() => setActive(index)}
      className="relative z-[1] flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm"
    >
      {action.icon} {action.label}
    </div>
  ))}
</div>`,
      render: () => <HoverList />,
    },
  ],
  props: [
    { name: "className", type: "string", description: "Clases extra para la píldora (p. ej. cambiar el color `bg-accent`)." },
    { name: "Contenedor padre", type: "requisito", description: "Debe ser `position: relative` y ser el elemento con scroll; monta la píldora como PRIMER hijo." },
    { name: "Ítem activo", type: "requisito", description: "Se detecta por `[data-highlighted]`, `[cmdk-item][data-selected=\"true\"]` o por el foco dentro de `[data-radix-collection-item]` / `[cmdk-item]`." },
    { name: "data-variant", type: '"destructive"', description: "En el ítem activo: la píldora se tiñe con `bg-destructive/10`." },
    { name: "Ítems", type: "requisito", description: "Deben llevar `relative z-[1]` para quedar por encima de la píldora y no pintar su propio fondo de hover/focus." },
  ],
  guidelines: {
    do: ["Deja que DropdownMenu, Select y Command la monten por ti; no la dupliques dentro de ellos.", "En listas propias, quita `hover:bg-*` / `focus:bg-*` de los ítems para que se vea el recorrido.", "Mantén el `border-radius` en el ítem: la píldora lo copia."],
    dont: ["No la montes fuera de un contenedor `relative`; se posicionaría respecto a otro ancestro.", "No la uses en listas virtualizadas con ítems que se desmontan mientras están activos.", "No la coloques después de los ítems en el DOM: quedaría por encima del texto."],
  },
  related: ["dropdown-menu", "select", "command"],
});
