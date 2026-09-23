import * as React from "react";
import { Boxes, Building2, Users } from "lucide-react";
import { Tree, type TreeNode, type TreeSelectable } from "@/components/data-display/Tree";
import { defineEntry, definePlayground } from "../types";

/** Empresa → áreas → equipos, con contadores de personas y un equipo deshabilitado. */
const AUDIENCE_TREE: TreeNode[] = [
  {
    id: "acme",
    label: "Acme",
    icon: <Building2 />,
    children: [
      {
        id: "tecnologia",
        label: "Tecnología",
        icon: <Boxes />,
        children: [
          { id: "frontend", label: "Frontend", icon: <Users />, count: 8 },
          { id: "backend", label: "Backend", icon: <Users />, count: 12 },
          { id: "datos", label: "Datos", icon: <Users />, count: 5 },
        ],
      },
      {
        id: "personas",
        label: "Personas",
        icon: <Boxes />,
        children: [
          { id: "talento", label: "Talento", icon: <Users />, count: 4 },
          { id: "nomina", label: "Nómina", icon: <Users />, count: 3, disabled: true },
        ],
      },
      { id: "ventas", label: "Ventas", icon: <Users />, count: 15 },
    ],
  },
];

const LEAF_COUNTS: Record<string, number> = {
  frontend: 8,
  backend: 12,
  datos: 5,
  talento: 4,
  nomina: 3,
  ventas: 15,
};

function stripCounts(nodes: readonly TreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    count: undefined,
    children: node.children ? stripCounts(node.children) : undefined,
  }));
}

function findNode(nodes: readonly TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children && findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

function AudienceSelector() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(["frontend", "backend"]);
  const total = selectedIds.reduce((sum, id) => sum + (LEAF_COUNTS[id] ?? 0), 0);

  return (
    <div className="w-full max-w-sm space-y-3">
      <Tree
        nodes={AUDIENCE_TREE}
        selectable="multiple"
        defaultExpandedIds={["acme", "tecnologia", "personas"]}
        selectedIds={selectedIds}
        onSelectedChange={setSelectedIds}
      />
      <p className="text-xs text-text-muted">{total} personas en la audiencia seleccionada.</p>
    </div>
  );
}

function TeamPicker() {
  const [selected, setSelected] = React.useState<string[]>(["frontend"]);
  const selectedNode = selected[0] ? findNode(AUDIENCE_TREE, selected[0]) : undefined;

  return (
    <div className="w-full max-w-sm space-y-3">
      <Tree
        nodes={AUDIENCE_TREE}
        selectable="single"
        defaultExpandedIds={["acme", "tecnologia", "personas"]}
        selectedIds={selected}
        onSelectedChange={setSelected}
      />
      <p className="text-xs text-text-muted">{selectedNode ? `Reporta a: ${selectedNode.label}` : "Elige un equipo."}</p>
    </div>
  );
}

export const treeEntry = defineEntry({
  id: "tree",
  name: "Tree",
  group: "data-display",
  description:
    "Árbol jerárquico con expansión y selección: empresa → áreas → equipos, o cualquier estructura anidada que haya que recorrer o elegir. Implementa el patrón ARIA `tree` completo (foco itinerante, `aria-level`, indeterminado en la selección múltiple) para navegarse entero con el teclado.",
  importPath: 'import { Tree } from "@/components/data-display/Tree"',
  sourcePath: "src/components/data-display/Tree.tsx",
  status: "stable",
  tags: ["aria-tree", "keyboard", "jerarquía"],
  playground: definePlayground({
    controls: {
      selectable: { type: "select", options: ["none", "single", "multiple"], default: "multiple" },
      size: { type: "select", options: ["default", "sm"], default: "default" },
      withCounts: { type: "boolean", label: "Con contadores", default: true },
      expandAll: { type: "boolean", label: "Expandir todo", default: true },
    },
    layout: "start",
    render: ({ selectable, size, withCounts, expandAll }) => (
      <Tree
        nodes={withCounts ? AUDIENCE_TREE : stripCounts(AUDIENCE_TREE)}
        selectable={selectable as TreeSelectable}
        size={size as "default" | "sm"}
        defaultExpandedIds={expandAll ? ["acme", "tecnologia", "personas"] : ["acme"]}
        className="w-full max-w-sm"
      />
    ),
    code: ({ selectable, size, withCounts, expandAll }) => {
      const attrs = [
        selectable !== "none" ? `selectable="${selectable}"` : "",
        size !== "default" ? `size="${size}"` : "",
        `defaultExpandedIds={${expandAll ? '["acme", "tecnologia", "personas"]' : '["acme"]'}}`,
      ].filter(Boolean);
      return `<Tree
  nodes={${withCounts ? "nodes" : "nodesSinContadores"}}
  ${attrs.join("\n  ")}
/>`;
    },
  }),
  examples: [
    {
      id: "audience-selection",
      title: "Selección de audiencia",
      description: "Marcar «Tecnología» selecciona sus tres equipos y deja a «Acme» indeterminado. El nodo deshabilitado (Nómina) no cuenta ni se puede marcar.",
      layout: "start",
      frameClassName: "min-h-[320px] items-start",
      code: `const [selectedIds, setSelectedIds] = React.useState(["frontend", "backend"]);

<Tree
  nodes={nodes}
  selectable="multiple"
  defaultExpandedIds={["acme", "tecnologia", "personas"]}
  selectedIds={selectedIds}
  onSelectedChange={setSelectedIds}
/>`,
      render: () => <AudienceSelector />,
    },
    {
      id: "single-select",
      title: "Selección única",
      description: "`selectable=\"single\"` quita la casilla y marca un solo nodo a la vez; útil para elegir a quién reporta algo.",
      layout: "start",
      frameClassName: "min-h-[320px] items-start",
      code: `const [selected, setSelected] = React.useState(["frontend"]);

<Tree nodes={nodes} selectable="single" selectedIds={selected} onSelectedChange={setSelected} />`,
      render: () => <TeamPicker />,
    },
    {
      id: "icons-and-disabled",
      title: "Con iconos y un nodo deshabilitado",
      description: "El icono va a 16px a la izquierda de la etiqueta. «Nómina» está `disabled`: no se enfoca, no se selecciona y no cuenta para el indeterminado de su padre.",
      layout: "start",
      frameClassName: "min-h-[280px] items-start",
      code: `<Tree
  nodes={[
    { id: "acme", label: "Acme", icon: <Building2 />, children: [
      { id: "personas", label: "Personas", icon: <Boxes />, children: [
        { id: "talento", label: "Talento", icon: <Users />, count: 4 },
        { id: "nomina", label: "Nómina", icon: <Users />, count: 3, disabled: true },
      ]},
    ]},
  ]}
  defaultExpandedIds={["acme", "personas"]}
/>`,
      render: () => (
        <Tree
          nodes={[AUDIENCE_TREE[0].children![1]]}
          defaultExpandedIds={["personas"]}
          className="w-full max-w-sm"
        />
      ),
    },
    {
      id: "empty",
      title: "Sin elementos",
      description: "Con `nodes` vacío se muestra `emptyLabel` en lugar de un árbol en blanco.",
      code: `<Tree nodes={[]} emptyLabel="Sin áreas para esta empresa" />`,
      render: () => <Tree nodes={[]} emptyLabel="Sin áreas para esta empresa" className="w-full max-w-sm" />,
    },
  ],
  props: [
    { name: "nodes", type: "TreeNode[]", description: "La jerarquía completa; cada nodo puede traer sus propios `children`." },
    { name: "selectable", type: '"none" | "single" | "multiple"', default: '"none"', description: "`multiple` añade casilla por nodo con propagación e indeterminado." },
    { name: "size", type: '"default" | "sm"', default: '"default"', description: "Alto de fila e íconos. Usa `sm` solo con dos niveles como máximo." },
    { name: "expandedIds / defaultExpandedIds", type: "string[]", description: "Ids abiertos, en modo controlado o inicial." },
    { name: "onExpandedChange", type: "(ids: string[]) => void", description: "Se dispara al abrir o cerrar un nodo." },
    { name: "selectedIds / defaultSelectedIds", type: "string[]", description: "Ids marcados, en modo controlado o inicial." },
    { name: "onSelectedChange", type: "(ids: string[]) => void", description: "Nueva selección completa, ya con los ancestros recalculados." },
    { name: "emptyLabel", type: "string", default: '"Sin elementos"', description: "Texto cuando `nodes` viene vacío." },
    { name: "TreeNode.id", type: "string", description: "Identificador estable del nodo." },
    { name: "TreeNode.label", type: "string", description: "Etiqueta visible y accesible del nodo." },
    { name: "TreeNode.icon", type: "React.ReactNode", description: "Icono de 16px a la izquierda de la etiqueta." },
    { name: "TreeNode.count", type: "number", description: "Contador a la derecha, p. ej. cuántas personas cuelgan del nodo." },
    { name: "TreeNode.disabled", type: "boolean", description: "El nodo (y su rama) no se enfoca, no se selecciona y no cuenta para sus ancestros." },
    { name: "TreeNode.children", type: "TreeNode[]", description: "Nodos hijos; su presencia añade el chevron de expandir." },
  ],
  guidelines: {
    do: [
      "Úsalo para jerarquías reales de al menos dos niveles; una lista plana no necesita `role=\"tree\"`.",
      "Deja que el estado indeterminado comunique una selección parcial: no lo tapes con `className`.",
      "Marca `disabled` los nodos que no aplican en vez de quitarlos; la jerarquía se ve completa igual.",
    ],
    dont: [
      "No actives `selectable=\"multiple\"` sin mostrar en algún lugar cuántos elementos quedaron seleccionados.",
      "No uses `size=\"sm\"` en árboles de más de tres niveles: la indentación se vuelve ilegible.",
      "No dupliques la navegación con clics obligatorios; el árbol ya cubre flechas, Home, End y Espacio.",
    ],
  },
  related: ["list-item", "checkbox", "badge"],
});
