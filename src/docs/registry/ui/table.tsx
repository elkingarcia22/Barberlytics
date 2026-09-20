import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { defineEntry, definePlayground } from "../types";

interface Person {
  id: string;
  name: string;
  area: string;
  status: "Activo" | "Pendiente" | "Inactivo";
  seats: number;
}

const PEOPLE: Person[] = [
  { id: "p1", name: "Ana Suárez", area: "People", status: "Activo", seats: 12 },
  { id: "p2", name: "Carlos Mena", area: "Ventas", status: "Pendiente", seats: 8 },
  { id: "p3", name: "Lucía Torres", area: "Producto", status: "Activo", seats: 21 },
  { id: "p4", name: "Diego Ríos", area: "Finanzas", status: "Inactivo", seats: 4 },
  { id: "p5", name: "Marta Vega", area: "Operaciones", status: "Activo", seats: 16 },
  { id: "p6", name: "Jorge Lima", area: "Tecnología", status: "Pendiente", seats: 30 },
];

const STATUS_VARIANT: Record<Person["status"], "default" | "secondary" | "neutral"> = {
  Activo: "default",
  Pendiente: "secondary",
  Inactivo: "neutral",
};

function PeopleTable({ rows, withCaption, withFooter }: { rows: Person[]; withCaption?: boolean; withFooter?: boolean }) {
  const total = rows.reduce((sum, person) => sum + person.seats, 0);
  return (
    <Table>
      {withCaption && <TableCaption>Equipos con asientos asignados en el ciclo 2026.</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Área</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Asientos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((person) => (
          <TableRow key={person.id}>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell className="text-text-secondary">{person.area}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[person.status]}>{person.status}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{person.seats}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {withFooter && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right tabular-nums">{total}</TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

function SelectableTable() {
  const [selected, setSelected] = React.useState<string[]>(["p1"]);
  const allSelected = selected.length === PEOPLE.length;
  const toggleAll = (value: boolean) => setSelected(value ? PEOPLE.map((person) => person.id) : []);
  const toggle = (id: string) => (value: boolean) => setSelected((prev) => (value ? [...prev, id] : prev.filter((item) => item !== id)));
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs text-text-secondary">{selected.length} de {PEOPLE.length} seleccionadas</span>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected ? true : selected.length > 0 ? "indeterminate" : false} onCheckedChange={(value) => toggleAll(value === true)} aria-label="Seleccionar todo" />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Área</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PEOPLE.slice(0, 4).map((person) => {
            const isSelected = selected.includes(person.id);
            return (
              <TableRow key={person.id} data-state={isSelected ? "selected" : undefined}>
                <TableCell>
                  <Checkbox checked={isSelected} onCheckedChange={(value) => toggle(person.id)(value === true)} aria-label={`Seleccionar ${person.name}`} />
                </TableCell>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell className="text-text-secondary">{person.area}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CascadeReplay() {
  const [key, setKey] = React.useState(0);
  return (
    <div className="flex w-full flex-col gap-3">
      <Button size="sm" variant="outline" className="self-start" onClick={() => setKey((value) => value + 1)}>
        <RefreshCw /> Volver a montar
      </Button>
      <PeopleTable key={key} rows={PEOPLE} />
    </div>
  );
}

export const tableEntry = defineEntry({
  id: "table",
  name: "Table",
  group: "ui",
  description:
    "La tabla semántica base: contenedor con scroll horizontal, cabecera, cuerpo, pie y caption con la tipografía del sistema. Al montarse, las filas del cuerpo entran en cascada (fade + leve ascenso escalonado por fila, definido en globals.css).",
  importPath: 'import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table"',
  sourcePath: "src/components/ui/table.tsx",
  status: "stable",
  tags: ["semántica", "cascada"],
  playground: definePlayground({
    controls: {
      rows: { type: "number", label: "Filas", default: 4, min: 1, max: 6, step: 1 },
      withCaption: { type: "boolean", label: "Caption", default: false },
      withFooter: { type: "boolean", label: "Pie con total", default: true },
    },
    layout: "stretch",
    render: ({ rows, withCaption, withFooter }) => <PeopleTable key={`${rows}-${withCaption}-${withFooter}`} rows={PEOPLE.slice(0, rows)} withCaption={withCaption} withFooter={withFooter} />,
    code: ({ rows, withCaption, withFooter }) => `<Table>${withCaption ? "\n  <TableCaption>Equipos con asientos asignados en el ciclo 2026.</TableCaption>" : ""}
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Área</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right">Asientos</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {people.slice(0, ${rows}).map((p) => (
      <TableRow key={p.id}>
        <TableCell className="font-medium">{p.name}</TableCell>
        <TableCell className="text-text-secondary">{p.area}</TableCell>
        <TableCell><Badge variant={variantFor(p.status)}>{p.status}</Badge></TableCell>
        <TableCell className="text-right tabular-nums">{p.seats}</TableCell>
      </TableRow>
    ))}
  </TableBody>${withFooter ? `
  <TableFooter>
    <TableRow>
      <TableCell colSpan={3}>Total</TableCell>
      <TableCell className="text-right tabular-nums">{total}</TableCell>
    </TableRow>
  </TableFooter>` : ""}
</Table>`,
  }),
  examples: [
    {
      id: "basic",
      title: "Básica con caption",
      description: "El caption va al final (`caption-bottom`) y explica qué muestra la tabla.",
      layout: "stretch",
      code: `<Table>
  <TableCaption>Equipos con asientos asignados en el ciclo 2026.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Área</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right">Asientos</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>…</TableBody>
</Table>`,
      render: () => <PeopleTable rows={PEOPLE.slice(0, 4)} withCaption />,
    },
    {
      id: "selectable",
      title: "Filas seleccionables",
      description: "`data-state=\"selected\"` en la fila pinta el fondo; las celdas con checkbox pierden el padding derecho.",
      layout: "stretch",
      code: `<TableRow data-state={isSelected ? "selected" : undefined}>
  <TableCell>
    <Checkbox checked={isSelected} onCheckedChange={(v) => toggle(person.id, v === true)} aria-label={\`Seleccionar \${person.name}\`} />
  </TableCell>
  <TableCell className="font-medium">{person.name}</TableCell>
  <TableCell>{person.area}</TableCell>
</TableRow>`,
      render: () => <SelectableTable />,
    },
    {
      id: "cascade",
      title: "Cascada de entrada",
      description: "Cada `<tr>` del cuerpo entra 55ms después del anterior (hasta la fila 20). Cambia la `key` para repetirla.",
      layout: "stretch",
      code: `/* globals.css */
[data-slot="table-body"] > tr { animation: table-row-in 780ms cubic-bezier(0.16, 1, 0.3, 1) both; }
[data-slot="table-body"] > tr:nth-child(2) { animation-delay: 55ms; }
/* … hasta nth-child(20) */

<PeopleTable key={reloadCount} rows={people} />`,
      render: () => <CascadeReplay />,
    },
  ],
  props: [
    { name: "Table", type: "componente", description: "Envuelve la <table> en un contenedor `overflow-x-auto`; la tabla mide `w-full`." },
    { name: "TableHeader / TableBody / TableFooter", type: "componente", description: "thead, tbody y tfoot. El cuerpo lleva `data-slot=\"table-body\"`, que activa la cascada." },
    { name: "TableRow", type: "componente", description: "Borde inferior, hover en `bg-muted/50` y `data-state=\"selected\"` para la selección." },
    { name: "TableHead / TableCell", type: "componente", description: "Celda de cabecera (h-10, medium) y de cuerpo (p-2). `whitespace-nowrap` por defecto." },
    { name: "TableCaption", type: "componente", description: "Texto secundario debajo de la tabla." },
    { name: "className / ...props", type: "atributos nativos", description: "Cada pieza acepta las props de su elemento HTML." },
  ],
  guidelines: {
    do: ["Alinea los números a la derecha con `tabular-nums`.", "Usa Badge para estados en vez de texto coloreado.", "Para tablas con ordenación, paginación o columnas fijas usa TableShell, que se apoya en estas piezas."],
    dont: ["No metas la tabla en otro contenedor con scroll horizontal; Table ya trae el suyo.", "No animes las filas por tu cuenta: la cascada ya está en globals.css y se activa sola."],
  },
  related: ["table-shell", "table-header-controls", "pagination", "checkbox", "badge"],
});
