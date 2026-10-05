import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { RowActionsMenu, RowContextMenu, type RowAction } from "@/components/data-display";
import { defineEntry } from "../types";

const ACTIONS: readonly RowAction[] = [
  { id: "edit", label: "Editar", icon: <Pencil className="size-4" /> },
  { id: "duplicate", label: "Duplicar", icon: <Copy className="size-4" /> },
  { id: "export", label: "Exportar", icon: <Download className="size-4" /> },
  { id: "delete", label: "Eliminar", icon: <Trash2 className="size-4" />, tone: "danger" },
];

const ROWS = ["Plan trimestral 2026", "Seguimiento mensual 2026", "Revisión semestral 2026"];

/** Tres filas con clic derecho y, a la vista, el mismo menú en el botón «⋯». */
function RowsDemo() {
  return (
    <ul className="w-full max-w-md divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
      {ROWS.map((name) => (
        <RowContextMenu key={name} rowLabel={name} actions={ACTIONS}>
          <li className="flex items-center justify-between gap-3 bg-surface px-4 py-3 hover:bg-surface-subtle">
            <span className="truncate text-sm text-text-primary">{name}</span>
            <RowActionsMenu rowLabel={name} actions={ACTIONS} />
          </li>
        </RowContextMenu>
      ))}
    </ul>
  );
}

export const rowContextMenuEntry = defineEntry({
  id: "row-context-menu",
  name: "RowContextMenu",
  group: "data-display",
  description:
    "El clic derecho sobre un registro —una fila de tabla, una tarjeta de la agenda—: el mismo menú de acciones que el botón «⋯», sin tener que apuntarle. Lo destructivo va al final y separado, y lo bloqueado sale apagado con su motivo. Es un atajo: lo que ofrece tiene que existir también a la vista.",
  importPath: 'import { RowContextMenu } from "@/components/data-display"',
  sourcePath: "src/components/data-display/RowContextMenu.tsx",
  status: "stable",
  tags: ["menú", "clic derecho", "contextual", "fila", "acciones"],
  examples: [
    {
      id: "basic",
      title: "Clic derecho en una fila",
      description: "Haz clic derecho en cualquier fila: sale el nombre de la fila arriba y sus acciones, con «Eliminar» separado al final. El botón «⋯» sigue ahí para táctil y teclado.",
      layout: "stretch",
      code: `<RowContextMenu rowLabel={row.name} actions={acciones}>
  <TableRow>…</TableRow>
</RowContextMenu>`,
      render: () => <RowsDemo />,
    },
  ],
  props: [
    { name: "actions", type: "RowAction[]", description: "Las mismas acciones que `RowActionsMenu`. Con la lista vacía no envuelve nada y el clic derecho vuelve a ser el del navegador." },
    { name: "rowLabel", type: "string", description: "Qué se opera; encabeza el menú para saber sobre qué se hizo clic." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Al abrir, quien lo usa suele marcar la fila: las acciones de una lista operan sobre lo marcado (así lo hace DataListBlock)." },
    { name: "children", type: "ReactElement", description: "La fila o tarjeta. Tiene que aceptar ref y props; si no, envuélvela en un `<div className=\"contents\">`." },
  ],
  guidelines: {
    do: [
      "Ofrece las mismas acciones que el botón «⋯» o el panel del registro: el clic derecho es un atajo, no un sitio nuevo.",
      "Marca la fila al abrir el menú cuando las acciones operan sobre la selección.",
      "Deja lo irreversible con `tone: \"danger\"`: el menú lo separa y lo pone al final.",
    ],
    dont: [
      "No escondas acciones solo en el clic derecho: en táctil y con teclado no se descubre.",
      "No lo pongas en propuestas o vistas previas que se aceptan tocándolas: ahí no hay nada que operar.",
    ],
  },
  related: ["row-actions-menu", "data-list-block", "resource-day-grid", "context-menu"],
});
