import * as React from "react";
import { PaginationShell } from "@/components/navigation";
import { defineEntry, definePlayground } from "../types";

const PAGE_SIZE = 10;
const TOTAL = 137;
const NAMES = ["Elena Martínez", "Carlos Ruiz", "Ana Torres", "Luis Gómez", "María Pérez", "Jorge Díaz", "Sofía Rojas", "Pablo Vega", "Laura Castro", "Diego Mora"];

function PlaygroundDemo({ pageCount, showSummary, withTotals }: { pageCount: number; showSummary: boolean; withTotals: boolean }) {
  const [page, setPage] = React.useState(1);
  const safePage = Math.min(page, pageCount);
  return (
    <PaginationShell
      page={safePage}
      pageCount={pageCount}
      totalItems={withTotals ? pageCount * PAGE_SIZE - 3 : undefined}
      pageSize={withTotals ? PAGE_SIZE : undefined}
      showSummary={showSummary}
      onPageChange={setPage}
      className="py-0"
    />
  );
}

function TableDemo() {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.ceil(TOTAL / PAGE_SIZE);
  const rows = Array.from({ length: Math.min(PAGE_SIZE, TOTAL - (page - 1) * PAGE_SIZE) }, (_, index) => {
    const id = (page - 1) * PAGE_SIZE + index + 1;
    return { id, name: NAMES[index % NAMES.length], area: id % 3 === 0 ? "Ventas" : id % 3 === 1 ? "Producto" : "Operaciones" };
  });
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-surface">
      <table className="w-full text-[13px]">
        <thead className="bg-surface-subtle text-left text-[11px] uppercase tracking-wider text-text-muted">
          <tr>
            <th className="px-4 py-2 font-semibold">#</th>
            <th className="px-4 py-2 font-semibold">Colaborador</th>
            <th className="px-4 py-2 font-semibold">Área</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/50">
              <td className="px-4 py-1.5 tabular-nums text-text-muted">{row.id}</td>
              <td className="px-4 py-1.5 text-text-primary">{row.name}</td>
              <td className="px-4 py-1.5 text-text-secondary">{row.area}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationShell page={page} pageCount={pageCount} totalItems={TOTAL} pageSize={PAGE_SIZE} onPageChange={setPage} className="border-t border-border/50 px-4" />
    </div>
  );
}

function CompactDemo() {
  const [page, setPage] = React.useState(3);
  return <PaginationShell page={page} pageCount={5} showSummary={false} onPageChange={setPage} className="py-0" />;
}

export const paginationShellEntry = defineEntry({
  id: "pagination-shell",
  name: "PaginationShell",
  group: "navigation",
  description:
    "Paginación lista para tablas y listados: resumen de resultados a la izquierda, controles a la derecha y elipsis automáticas alrededor de la página actual. Es controlada, sin routing ni lógica de datos: recibe la página y avisa del cambio.",
  importPath: 'import { PaginationShell } from "@/components/navigation"',
  sourcePath: "src/components/navigation/PaginationShell.tsx",
  status: "stable",
  tags: ["controlled", "table"],
  playground: definePlayground({
    controls: {
      pageCount: { type: "number", label: "Páginas", default: 12, min: 1, max: 40, step: 1 },
      showSummary: { type: "boolean", label: "Con resumen", default: true },
      withTotals: { type: "boolean", label: "Totales por resultado", default: true },
    },
    layout: "stretch",
    render: ({ pageCount, showSummary, withTotals }) => (
      <PlaygroundDemo key={`${pageCount}-${withTotals}`} pageCount={pageCount} showSummary={showSummary} withTotals={withTotals} />
    ),
    code: ({ pageCount, showSummary, withTotals }) => {
      const attrs = [
        "page={page}",
        `pageCount={${pageCount}}`,
        withTotals ? `totalItems={${pageCount * PAGE_SIZE - 3}}` : "",
        withTotals ? `pageSize={${PAGE_SIZE}}` : "",
        !showSummary ? "showSummary={false}" : "",
        "onPageChange={setPage}",
      ].filter(Boolean);
      return `const [page, setPage] = React.useState(1);\n\n<PaginationShell\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "table",
      title: "Al pie de una tabla",
      description: "Con `totalItems` y `pageSize` el resumen dice qué rango se está viendo; las filas cambian con la página.",
      layout: "stretch",
      code: `const [page, setPage] = React.useState(1);
const pageCount = Math.ceil(total / pageSize);

<table>…</table>
<PaginationShell
  page={page}
  pageCount={pageCount}
  totalItems={total}
  pageSize={pageSize}
  onPageChange={setPage}
/>`,
      render: () => <TableDemo />,
    },
    {
      id: "compact",
      title: "Solo controles",
      description: "Sin resumen, para un carrusel de tarjetas o un panel estrecho.",
      code: `const [page, setPage] = React.useState(3);

<PaginationShell page={page} pageCount={5} showSummary={false} onPageChange={setPage} />`,
      render: () => <CompactDemo />,
    },
  ],
  props: [
    { name: "page", type: "number", description: "Página actual, empezando en 1." },
    { name: "pageCount", type: "number", description: "Total de páginas. Los controles se desactivan en los extremos." },
    { name: "totalItems", type: "number", description: "Total de resultados. Si se indica, el resumen muestra el rango «x - y de n»." },
    { name: "pageSize", type: "number", description: "Resultados por página; necesario para calcular el rango del resumen." },
    { name: "onPageChange", type: "(page: number) => void", description: "Se llama con la página destino; nunca fuera de [1, pageCount]." },
    { name: "showSummary", type: "boolean", default: "true", description: "Muestra u oculta el texto de resumen a la izquierda." },
    { name: "className", type: "string", description: "Clases para el contenedor (trae `py-4` por defecto)." },
  ],
  guidelines: {
    do: ["Guarda la página en la URL cuando el listado sea compartible.", "Pasa `totalItems` y `pageSize` siempre que los conozcas: el rango orienta más que «Página 3 de 14».", "Vuelve a la página 1 al cambiar filtros o búsqueda."],
    dont: ["No lo uses para scroll infinito ni para «cargar más».", "No calcules `pageCount` dentro del render en cada cambio de página si el total viene del servidor: cachéalo."],
  },
  related: ["pagination", "configurable-table", "button"],
});
