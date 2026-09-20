import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { defineEntry } from "../types";

type PageToken = number | "ellipsis";

/** Ventana de páginas: primera, última y una vecina a cada lado de la actual. */
function pageWindow(page: number, total: number): PageToken[] {
  const pages = new Set<number>([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((n, index) => (index > 0 && n - sorted[index - 1] > 1 ? ["ellipsis" as const, n] : [n]));
}

function PagedList() {
  const [page, setPage] = React.useState(3);
  const total = 8;
  const go = (next: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(total, Math.max(1, next)));
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-text-secondary">
        Página {page} de {total}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" text="Anterior" onClick={go(page - 1)} aria-disabled={page === 1} className={page === 1 ? "pointer-events-none opacity-50" : undefined} />
          </PaginationItem>
          {pageWindow(page, total).map((token, index) =>
            token === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={token}>
                <PaginationLink href="#" isActive={token === page} onClick={go(token)}>
                  {token}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext href="#" text="Siguiente" onClick={go(page + 1)} aria-disabled={page === total} className={page === total ? "pointer-events-none opacity-50" : undefined} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export const paginationEntry = defineEntry({
  id: "pagination",
  name: "Pagination",
  group: "ui",
  description:
    "Navegación entre páginas de una lista, compuesta con enlaces que heredan los estilos de Button (ghost por defecto, outline para la activa). Úsala al pie de tablas y listados largos con URL por página.",
  importPath: 'import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"',
  sourcePath: "src/components/ui/pagination.tsx",
  status: "stable",
  tags: ["composición", "button"],
  examples: [
    {
      id: "interactive",
      title: "Con estado",
      description: "Ventana de páginas con elipsis; los extremos se desactivan en la primera y la última.",
      code: `const [page, setPage] = React.useState(3);

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" text="Anterior" onClick={go(page - 1)} />
    </PaginationItem>
    {pageWindow(page, total).map((token) =>
      token === "ellipsis" ? (
        <PaginationItem><PaginationEllipsis /></PaginationItem>
      ) : (
        <PaginationItem key={token}>
          <PaginationLink href="#" isActive={token === page} onClick={go(token)}>{token}</PaginationLink>
        </PaginationItem>
      )
    )}
    <PaginationItem>
      <PaginationNext href="#" text="Siguiente" onClick={go(page + 1)} />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
      render: () => <PagedList />,
    },
    {
      id: "static",
      title: "Marcado básico",
      description: "Los enlaces son <a> reales: enlaza cada página a su URL.",
      code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#/page/1" text="Anterior" /></PaginationItem>
    <PaginationItem><PaginationLink href="#/page/1">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#/page/2" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#/page/3">3</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationNext href="#/page/3" text="Siguiente" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
      render: () => (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#/components/pagination" text="Anterior" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#/components/pagination">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#/components/pagination" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#/components/pagination">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#/components/pagination" text="Siguiente" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ),
    },
    {
      id: "compact",
      title: "Solo anterior / siguiente",
      description: "Para feeds o cuando el total de páginas no se conoce.",
      code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" text="Más recientes" /></PaginationItem>
    <PaginationItem><PaginationNext href="#" text="Más antiguas" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
      render: () => (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#/components/pagination" text="Más recientes" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#/components/pagination" text="Más antiguas" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ),
    },
  ],
  props: [
    { name: "PaginationLink.isActive", type: "boolean", default: "false", description: "Marca la página actual: variante outline y `aria-current=\"page\"`." },
    { name: "PaginationLink.size", type: "ButtonProps[\"size\"]", default: '"icon"', description: "Tamaño heredado de Button; los enlaces numéricos son cuadrados." },
    { name: "PaginationPrevious.text / PaginationNext.text", type: "string", default: '"Previous" / "Next"', description: "Etiqueta visible (oculta en móvil, solo queda el chevron). Pásala en español." },
    { name: "...props", type: 'React.ComponentProps<"a">', description: "PaginationLink es un <a>: href, onClick, etc. Pagination es un <nav>, PaginationContent un <ul>." },
  ],
  guidelines: {
    do: ["Pasa siempre `text` en español a Previous/Next.", "Usa elipsis cuando hay más de 7 páginas; muestra primera, última y vecinas.", "Sincroniza la página con la URL para que sea compartible."],
    dont: ["No la uses para menos de 2 páginas: oculta el componente.", "No renderices todas las páginas de una lista larga."],
  },
  related: ["button", "table"],
});
