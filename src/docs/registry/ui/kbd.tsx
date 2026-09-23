import { ArrowUp, Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["default", "sm"] as const;
type KbdSize = (typeof SIZES)[number];

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "Buscar en toda la plataforma" },
  { keys: ["⌘", "N"], action: "Nuevo colaborador" },
  { keys: ["⌘", "⇧", "E"], action: "Exportar la vista actual" },
  { keys: ["Esc"], action: "Cerrar el panel lateral" },
] as const;

export const kbdEntry = defineEntry({
  id: "kbd",
  name: "Kbd",
  group: "ui",
  description:
    "Tecla de atajo en un `<kbd>` real, con aspecto de tecla física (20px o 16px de alto). Úsalo para indicar atajos en menús, tooltips, campos de búsqueda y páginas de ayuda; KbdGroup encadena varias teclas con «+».",
  importPath: 'import { Kbd, KbdGroup } from "@/components/ui/kbd"',
  sourcePath: "src/components/ui/kbd.tsx",
  status: "stable",
  tags: ["cva", "a11y"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "default" },
      keys: { type: "text", label: "Teclas (separadas por espacio)", default: "⌘ K" },
      separator: { type: "boolean", label: "Con separador «+»", default: true },
    },
    render: ({ size, keys, separator }) => {
      const parts = keys.split(" ").filter(Boolean);
      return (
        <KbdGroup separator={separator ? "+" : null}>
          {parts.map((key, index) => (
            <Kbd key={`${key}-${index}`} size={size as KbdSize}>
              {key}
            </Kbd>
          ))}
        </KbdGroup>
      );
    },
    code: ({ size, keys, separator }) => {
      const sizeAttr = size !== "default" ? ` size="${size}"` : "";
      const items = keys
        .split(" ")
        .filter(Boolean)
        .map((key) => `  <Kbd${sizeAttr}>${key}</Kbd>`)
        .join("\n");
      const open = separator ? "<KbdGroup>" : "<KbdGroup separator={null}>";
      return `${open}\n${items}\n</KbdGroup>`;
    },
  }),
  examples: [
    {
      id: "search-hint",
      title: "Pista en un campo de búsqueda",
      description: "El atajo global ⌘K vive dentro del campo, alineado a la derecha, y no captura clics (`pointer-events-none`).",
      code: `<button type="button" className="flex h-9 w-72 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted">
  <Search className="size-4" />
  <span className="flex-1 text-left">Buscar colaboradores, cursos…</span>
  <KbdGroup>
    <Kbd>⌘</Kbd>
    <Kbd>K</Kbd>
  </KbdGroup>
</button>`,
      render: () => (
        <button
          type="button"
          className="flex h-9 w-72 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Buscar colaboradores, cursos…</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>
      ),
    },
    {
      id: "in-tooltip",
      title: "Dentro de un tooltip",
      description: "Con `size=\"sm\"` la tecla encaja en la línea de texto del tooltip sin agrandarlo.",
      code: `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Guardar</Button>
  </TooltipTrigger>
  <TooltipContent className="flex items-center gap-2">
    Guardar cambios
    <KbdGroup>
      <Kbd size="sm">⌘</Kbd>
      <Kbd size="sm">S</Kbd>
    </KbdGroup>
  </TooltipContent>
</Tooltip>`,
      render: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Guardar</Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            Guardar cambios
            <KbdGroup>
              <Kbd size="sm">⌘</Kbd>
              <Kbd size="sm">S</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "shortcut-list",
      title: "Lista de atajos",
      description: "Acción a la izquierda, combinación a la derecha; cada fila es un `<dl>` implícito que se lee bien de corrido.",
      code: `{shortcuts.map(({ keys, action }) => (
  <div key={action} className="flex items-center justify-between py-2 text-sm">
    <span className="text-text-primary">{action}</span>
    <KbdGroup>
      {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
    </KbdGroup>
  </div>
))}`,
      render: () => (
        <div className="w-full max-w-sm divide-y divide-border/60 rounded-xl border border-border/60 bg-surface px-4">
          {SHORTCUTS.map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-text-primary">{action}</span>
              <KbdGroup>
                {keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </KbdGroup>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "with-icon",
      title: "Con icono",
      description: "Un SVG dentro de la tecla se fija a 12px; útil para ⌘ o flechas cuando el símbolo tipográfico no se ve claro en la fuente.",
      code: `<KbdGroup>
  <Kbd><Command /></Kbd>
  <Kbd><ArrowUp /></Kbd>
  <Kbd>P</Kbd>
</KbdGroup>`,
      render: () => (
        <KbdGroup>
          <Kbd aria-label="Comando">
            <Command />
          </Kbd>
          <Kbd aria-label="Mayúsculas">
            <ArrowUp />
          </Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      ),
    },
  ],
  props: [
    { name: "size", type: '"default" | "sm"', default: '"default"', description: "20px de alto con texto de 11px, o 16px con texto de 10px." },
    { name: "...props", type: 'React.ComponentProps<"kbd">', description: "Atributos nativos del elemento kbd." },
    { name: "KbdGroup.separator", type: "React.ReactNode | null", default: '"+"', description: "Se intercala entre teclas y queda oculto para lectores de pantalla. `null` las pega sin separador." },
  ],
  guidelines: {
    do: [
      "Usa el símbolo del sistema del usuario (⌘ en macOS, Ctrl en el resto) y resuélvelo en tiempo de ejecución.",
      "Una tecla por Kbd; la combinación la arma KbdGroup.",
      "Añade `aria-label` cuando la tecla solo lleva un icono.",
    ],
    dont: [
      "No uses Kbd como botón: no es interactivo y anula los eventos de puntero.",
      "No documentes un atajo que no exista de verdad en la aplicación.",
      "No mezcles tamaños dentro de un mismo grupo.",
    ],
  },
  related: ["tooltip", "command", "dropdown-menu", "context-menu"],
});
