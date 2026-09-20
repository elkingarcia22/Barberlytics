import * as React from "react";
import { Download, Plus, Search } from "lucide-react";
import { TableShell } from "@/components/data-display/TableShell";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { defineEntry, definePlayground } from "../types";

interface Person {
  name: string;
  area: string;
  progress: number;
  status: "active" | "pending" | "completed";
}

const PEOPLE: Person[] = [
  { name: "Laura Méndez", area: "Producto", progress: 82, status: "active" },
  { name: "Carlos Rojas", area: "Ventas", progress: 100, status: "completed" },
  { name: "Ana Torres", area: "Tecnología", progress: 45, status: "pending" },
  { name: "Diego Salazar", area: "Finanzas", progress: 67, status: "active" },
  { name: "Valentina Ruiz", area: "Marketing", progress: 30, status: "pending" },
];

const MANY_PEOPLE: Person[] = Array.from({ length: 24 }, (_, index) => ({
  ...PEOPLE[index % PEOPLE.length],
  name: `${PEOPLE[index % PEOPLE.length].name} ${index + 1}`,
}));

function PeopleRows({ rows }: { rows: Person[] }) {
  return (
    <>
      {rows.map((person) => (
        <TableRow key={person.name}>
          <TableCell className="font-medium">{person.name}</TableCell>
          <TableCell>{person.area}</TableCell>
          <TableCell className="text-right tabular-nums">{person.progress}%</TableCell>
          <TableCell>
            <StatusBadge status={person.status} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function PeopleHead() {
  return (
    <TableRow>
      <TableHead>Colaborador</TableHead>
      <TableHead>Área</TableHead>
      <TableHead className="text-right">Avance</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  );
}

function PeopleTable({ rows = PEOPLE }: { rows?: Person[] }) {
  return (
    <Table>
      <TableHeader>
        <PeopleHead />
      </TableHeader>
      <TableBody>
        <PeopleRows rows={rows} />
      </TableBody>
    </Table>
  );
}

function FilterableShellDemo() {
  const [query, setQuery] = React.useState("");
  const rows = PEOPLE.filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <TableShell
      title="Colaboradores"
      description={`${rows.length} de ${PEOPLE.length}`}
      empty={rows.length === 0}
      emptyState={
        <EmptyState icon={Search} title="Nadie coincide" description={`No hay colaboradores que contengan "${query}".`} className="border-none bg-transparent shadow-none" action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Limpiar</Button>} />
      }
      actions={<Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar…" className="h-8 w-44" />}
    >
      <PeopleTable rows={rows} />
    </TableShell>
  );
}

export const tableShellEntry = defineEntry({
  id: "table-shell",
  name: "TableShell",
  group: "data-display",
  description:
    "La tarjeta que envuelve una tabla: título, descripción y acciones en la cabecera, y el estado vacío resuelto por defecto. La tabla en sí va como `children`; el shell solo pone el marco, el scroll horizontal y, si se pide, el encabezado pegajoso.",
  importPath: 'import { TableShell } from "@/components/data-display/TableShell"',
  sourcePath: "src/components/data-display/TableShell.tsx",
  status: "stable",
  tags: ["card", "empty-state"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Colaboradores" },
      description: { type: "text", default: "Avance del ciclo 2026-H1" },
      withActions: { type: "boolean", label: "Con acciones", default: true },
      empty: { type: "boolean", label: "Vacía", default: false },
    },
    layout: "stretch",
    render: ({ title, description, withActions, empty }) => (
      <TableShell
        title={title || undefined}
        description={description || undefined}
        empty={empty}
        actions={
          withActions ? (
            <>
              <Button variant="outline" size="sm">
                <Download /> Exportar
              </Button>
              <Button size="sm">
                <Plus /> Añadir
              </Button>
            </>
          ) : undefined
        }
      >
        <PeopleTable />
      </TableShell>
    ),
    code: ({ title, description, withActions, empty }) => {
      const attrs = [title ? `title="${title}"` : "", description ? `description="${description}"` : "", empty ? "empty" : ""].filter(Boolean);
      if (withActions) attrs.push('actions={<><Button variant="outline" size="sm"><Download /> Exportar</Button><Button size="sm"><Plus /> Añadir</Button></>}');
      return `<TableShell\n  ${attrs.join("\n  ")}\n>\n  <Table>…</Table>\n</TableShell>`;
    },
  }),
  examples: [
    {
      id: "filterable",
      title: "Con búsqueda y vacío propio",
      description: "`empty` se calcula desde los datos filtrados; `emptyState` reemplaza el mensaje por defecto con uno que deshace el filtro.",
      layout: "stretch",
      code: `const rows = PEOPLE.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));

<TableShell
  title="Colaboradores"
  description={\`\${rows.length} de \${PEOPLE.length}\`}
  empty={rows.length === 0}
  emptyState={<EmptyState icon={Search} title="Nadie coincide" className="border-none bg-transparent shadow-none" action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Limpiar</Button>} />}
  actions={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="h-8 w-44" />}
>
  <Table>…</Table>
</TableShell>`,
      render: () => <FilterableShellDemo />,
    },
    {
      id: "empty-default",
      title: "Vacío por defecto",
      description: "Sin `emptyState`, el shell pinta un `EmptyState` genérico con el icono de base de datos.",
      layout: "stretch",
      code: `<TableShell title="Objetivos" empty>
  <Table>…</Table>
</TableShell>`,
      render: () => (
        <TableShell title="Objetivos" empty>
          <PeopleTable />
        </TableShell>
      ),
    },
    {
      id: "sticky",
      title: "Encabezado pegajoso",
      description: "Con `stickyHeader` el `<thead>` se queda arriba mientras la caja hace scroll. Usa un `<table>` plano: el wrapper de `Table` crearía su propio contexto de scroll.",
      layout: "stretch",
      code: `<TableShell stickyHeader className="[&_.overflow-x-auto]:max-h-64">
  <table className="w-full text-sm">
    <TableHeader>…</TableHeader>
    <TableBody>…</TableBody>
  </table>
</TableShell>`,
      render: () => (
        <TableShell stickyHeader className="[&_.overflow-x-auto]:max-h-64">
          <table className="w-full text-sm">
            <TableHeader>
              <PeopleHead />
            </TableHeader>
            <TableBody>
              <PeopleRows rows={MANY_PEOPLE} />
            </TableBody>
          </table>
        </TableShell>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Título de la cabecera de la tarjeta." },
    { name: "description", type: "string", description: "Línea secundaria bajo el título." },
    { name: "actions", type: "React.ReactNode", description: "Botones o controles alineados a la derecha de la cabecera." },
    { name: "children", type: "React.ReactNode", description: "La tabla; se envuelve en una caja con scroll horizontal." },
    { name: "empty", type: "boolean", default: "false", description: "Si es cierto, se pinta el estado vacío en lugar de la tabla." },
    { name: "emptyState", type: "React.ReactNode", description: "Estado vacío propio; por defecto un `EmptyState` genérico." },
    { name: "stickyHeader", type: "boolean", default: "false", description: "Fija el `<thead>` arriba mientras la caja interior hace scroll." },
    { name: "className", type: "string", description: "Clases extra sobre la `Card`." },
  ],
  guidelines: {
    do: ["Calcula `empty` desde los datos ya filtrados, no desde la carga inicial.", "Pon en `actions` solo lo que actúa sobre toda la tabla: exportar, crear, buscar."],
    dont: ["No anides otra `Card` dentro: el shell ya es la tarjeta.", "No uses `stickyHeader` sin acotar la altura de la caja interior; sin scroll no hay nada que pegar."],
  },
  related: ["table", "empty-state", "table-config", "table-header-controls", "card"],
});
