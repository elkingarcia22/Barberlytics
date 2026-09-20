import * as React from "react";
import { ChevronDown, Copy, Download, LogOut, MoreHorizontal, Pencil, Settings, Trash2, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defineEntry, definePlayground } from "../types";

const ALIGNS = ["start", "center", "end"] as const;
const SIDES = ["bottom", "top", "left", "right"] as const;

function ColumnsMenu() {
  const [columns, setColumns] = React.useState({ progress: true, manager: false, deadline: true });
  const visible = Object.entries(columns)
    .filter(([, on]) => on)
    .map(([key]) => key);
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Columnas <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={columns.progress} onCheckedChange={(on) => setColumns((c) => ({ ...c, progress: on }))}>
            Progreso
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={columns.manager} onCheckedChange={(on) => setColumns((c) => ({ ...c, manager: on }))}>
            Manager
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={columns.deadline} onCheckedChange={(on) => setColumns((c) => ({ ...c, deadline: on }))}>
            Fecha límite
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-[13px] text-text-secondary">{visible.length ? visible.join(", ") : "Ninguna"}</p>
    </div>
  );
}

function SortMenu() {
  const [sort, setSort] = React.useState("recent");
  const labels: Record<string, string> = { recent: "Más recientes", name: "Nombre", progress: "Progreso" };
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Ordenar: {labels[sort]} <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            <DropdownMenuRadioItem value="recent">Más recientes</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">Nombre</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="progress">Progreso</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const dropdownMenuEntry = defineEntry({
  id: "dropdown-menu",
  name: "DropdownMenu",
  group: "ui",
  description:
    "Menú contextual anclado a un botón con ítems, grupos, atajos, casillas, radios y submenús; el resaltado se desliza entre ítems con FluidHighlight. Úsalo para acciones secundarias sobre un elemento o para menús de cuenta.",
  importPath: 'import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"',
  sourcePath: "src/components/ui/dropdown-menu.tsx",
  status: "stable",
  tags: ["radix", "fluid-highlight"],
  playground: definePlayground({
    controls: {
      align: { type: "select", options: ALIGNS, default: "start" },
      side: { type: "select", options: SIDES, default: "bottom" },
      withShortcuts: { type: "boolean", label: "Con atajos", default: true },
      withDestructive: { type: "boolean", label: "Ítem destructivo", default: true },
    },
    render: ({ align, side, withShortcuts, withDestructive }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Acciones <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align as (typeof ALIGNS)[number]} side={side as (typeof SIDES)[number]} className="w-52">
          <DropdownMenuLabel>Curso</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil /> Editar {withShortcuts && <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy /> Duplicar {withShortcuts && <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download /> Exportar
          </DropdownMenuItem>
          {withDestructive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 /> Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    code: ({ align, side, withShortcuts, withDestructive }) => {
      const attrs = [align !== "start" ? `align="${align}"` : "", side !== "bottom" ? `side="${side}"` : ""].filter(Boolean).join(" ");
      const sc = (key: string) => (withShortcuts ? ` <DropdownMenuShortcut>${key}</DropdownMenuShortcut>` : "");
      return `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Acciones <ChevronDown /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent${attrs ? ` ${attrs}` : ""} className="w-52">
    <DropdownMenuLabel>Curso</DropdownMenuLabel>
    <DropdownMenuItem><Pencil /> Editar${sc("⌘E")}</DropdownMenuItem>
    <DropdownMenuItem><Copy /> Duplicar${sc("⌘D")}</DropdownMenuItem>
    <DropdownMenuItem><Download /> Exportar</DropdownMenuItem>${
      withDestructive ? '\n    <DropdownMenuSeparator />\n    <DropdownMenuItem variant="destructive"><Trash2 /> Eliminar</DropdownMenuItem>' : ""
    }
  </DropdownMenuContent>
</DropdownMenu>`;
    },
  }),
  examples: [
    {
      id: "account",
      title: "Menú de cuenta con submenú",
      description: "Grupos, separadores y un `DropdownMenuSub` para acciones anidadas.",
      code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Más opciones"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Ana Torres</DropdownMenuLabel>
    <DropdownMenuGroup>
      <DropdownMenuItem><User /> Perfil <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem><Settings /> Ajustes <DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger><UserPlus /> Invitar</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Por correo</DropdownMenuItem>
        <DropdownMenuItem>Por enlace</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><LogOut /> Cerrar sesión</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      render: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Más opciones">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ana Torres</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User /> Perfil <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings /> Ajustes <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserPlus /> Invitar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Por correo</DropdownMenuItem>
                <DropdownMenuItem>Por enlace</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      id: "checkbox",
      title: "Casillas",
      description: "`DropdownMenuCheckboxItem` mantiene el menú abierto entre cambios; ideal para visibilidad de columnas.",
      code: `const [columns, setColumns] = React.useState({ progress: true, manager: false, deadline: true });

<DropdownMenuContent className="w-48">
  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
  <DropdownMenuCheckboxItem checked={columns.progress} onCheckedChange={(on) => setColumns((c) => ({ ...c, progress: on }))}>
    Progreso
  </DropdownMenuCheckboxItem>
  …
</DropdownMenuContent>`,
      render: () => <ColumnsMenu />,
    },
    {
      id: "radio",
      title: "Radio group",
      description: "Una sola opción activa; el trigger refleja el valor elegido.",
      code: `const [sort, setSort] = React.useState("recent");

<DropdownMenuContent className="w-48">
  <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
    <DropdownMenuRadioItem value="recent">Más recientes</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="name">Nombre</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="progress">Progreso</DropdownMenuRadioItem>
  </DropdownMenuRadioGroup>
</DropdownMenuContent>`,
      render: () => <SortMenu />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Estado de apertura controlado." },
    { name: "DropdownMenuContent.align", type: '"start" | "center" | "end"', default: '"start"', description: "Alineación respecto al trigger." },
    { name: "DropdownMenuContent.side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Lado preferido; cambia si no cabe." },
    { name: "DropdownMenuContent.sideOffset", type: "number", default: "4", description: "Separación con el trigger en px." },
    { name: "DropdownMenuItem.variant", type: '"default" | "destructive"', default: '"default"', description: "Tiñe el ítem y la píldora de resaltado en rojo." },
    { name: "DropdownMenuItem.inset", type: "boolean", description: "Añade sangría izquierda para alinear con ítems que tienen indicador." },
    { name: "DropdownMenuItem.onSelect", type: "(event) => void", description: "Se dispara al elegir; `event.preventDefault()` mantiene el menú abierto." },
    { name: "DropdownMenuCheckboxItem.checked / onCheckedChange", type: "boolean / (checked) => void", description: "Estado de la casilla." },
    { name: "DropdownMenuRadioGroup.value / onValueChange", type: "string / (value) => void", description: "Valor activo del grupo de radios." },
  ],
  guidelines: {
    do: ["Ordena los ítems por frecuencia y separa lo destructivo al final.", "Usa `align=\"end\"` cuando el trigger está en el borde derecho.", "Añade `aria-label` al trigger si es solo un icono."],
    dont: ["No superes ~10 ítems sin agrupar; considera Command con búsqueda.", "No uses el menú para navegación principal.", "No anides más de un nivel de submenú."],
  },
  related: ["command", "popover", "select", "fluid-highlight"],
});
