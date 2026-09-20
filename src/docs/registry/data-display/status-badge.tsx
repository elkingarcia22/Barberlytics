import { StatusBadge, type StatusType } from "@/components/data-display/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { defineEntry, definePlayground } from "../types";

const STATUSES = ["active", "inactive", "pending", "completed", "warning", "error", "info", "neutral"] as const;

const CYCLES: { name: string; status: StatusType; label?: string }[] = [
  { name: "Ciclo 2026-H1", status: "active", label: "En curso" },
  { name: "Ciclo 2025-H2", status: "completed", label: "Cerrado" },
  { name: "Ciclo 2026-H2", status: "pending", label: "Programado" },
  { name: "Piloto ventas", status: "error", label: "Sin plantilla" },
];

export const statusBadgeEntry = defineEntry({
  id: "status-badge",
  name: "StatusBadge",
  group: "data-display",
  description:
    "Un `Badge` con vocabulario de estado: cada valor trae su variante de color y su etiqueta en español por defecto. Sirve para que una tabla o una tarjeta digan «Activo» o «Pendiente» sin repetir el mapa de colores en cada pantalla.",
  importPath: 'import { StatusBadge } from "@/components/data-display/StatusBadge"',
  sourcePath: "src/components/data-display/StatusBadge.tsx",
  status: "stable",
  tags: ["badge"],
  playground: definePlayground({
    controls: {
      status: { type: "select", options: STATUSES, default: "active" },
      label: { type: "text", default: "", placeholder: "Etiqueta por defecto" },
    },
    render: ({ status, label }) => <StatusBadge status={status as StatusType} label={label || undefined} />,
    code: ({ status, label }) => `<StatusBadge status="${status}"${label ? ` label="${label}"` : ""} />`,
  }),
  examples: [
    {
      id: "all",
      title: "Todos los estados",
      description: "Ocho valores, cuatro tonos: positivo, neutro, aviso, negativo e informativo.",
      code: `<StatusBadge status="active" />
<StatusBadge status="completed" />
<StatusBadge status="pending" />
<StatusBadge status="warning" />
<StatusBadge status="error" />
<StatusBadge status="info" />
<StatusBadge status="inactive" />
<StatusBadge status="neutral" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      ),
    },
    {
      id: "custom-label",
      title: "Etiqueta propia",
      description: "El estado fija el color; `label` pone el texto que el dominio necesita.",
      code: `<StatusBadge status="active" label="En curso" />
<StatusBadge status="pending" label="Programado" />
<StatusBadge status="error" label="Sin plantilla" />
<StatusBadge status="completed" label="Cerrado" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="active" label="En curso" />
          <StatusBadge status="pending" label="Programado" />
          <StatusBadge status="error" label="Sin plantilla" />
          <StatusBadge status="completed" label="Cerrado" />
        </div>
      ),
    },
    {
      id: "in-table",
      title: "En una tabla",
      description: "El uso habitual: una columna de estado con la misma altura que el texto de la fila.",
      layout: "stretch",
      code: `<TableRow>
  <TableCell>{cycle.name}</TableCell>
  <TableCell><StatusBadge status={cycle.status} label={cycle.label} /></TableCell>
</TableRow>`,
      render: () => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ciclo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CYCLES.map((cycle) => (
              <TableRow key={cycle.name}>
                <TableCell className="font-medium">{cycle.name}</TableCell>
                <TableCell>
                  <StatusBadge status={cycle.status} label={cycle.label} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ),
    },
  ],
  props: [
    { name: "status", type: '"active" | "inactive" | "pending" | "completed" | "warning" | "error" | "info" | "neutral"', description: "El estado; decide la variante de color y la etiqueta por defecto." },
    { name: "label", type: "string", description: "Texto alternativo; si se omite se usa la etiqueta en español del estado." },
    { name: "className", type: "string", description: "Clases extra sobre el `Badge`." },
    { name: "...props", type: "React.HTMLAttributes<HTMLDivElement>", description: "Cualquier atributo nativo del contenedor." },
  ],
  guidelines: {
    do: ["Usa el mismo `status` para el mismo significado en toda la app; cambia solo `label`.", "Prefiere `inactive` o `neutral` para lo archivado, no `error`."],
    dont: ["No lo uses como botón ni como filtro: es solo lectura.", "No inventes colores con `className`; si falta un estado, amplía el mapa."],
  },
  related: ["badge", "status-badge-animated", "table-shell"],
});
