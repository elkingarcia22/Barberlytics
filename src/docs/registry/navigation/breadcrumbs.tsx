import * as React from "react";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const TREE: Record<string, string[]> = {
  Aprendizaje: ["Catálogo", "Mis cursos", "Certificados"],
  Catálogo: ["Liderazgo", "Datos", "Ventas"],
  Liderazgo: ["Feedback efectivo", "Delegación"],
};

function DrillDownDemo() {
  const [path, setPath] = React.useState<string[]>(["Aprendizaje"]);
  const current = path[path.length - 1];
  const children = TREE[current] ?? [];
  return (
    <div className="w-full max-w-md space-y-4 rounded-xl border border-border/60 bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumbs items={path} />
        <Button variant="ghost" size="xs" disabled={path.length === 1} onClick={() => setPath((prev) => prev.slice(0, -1))}>
          <ArrowLeft /> Volver
        </Button>
      </div>
      <ul className="space-y-1">
        {children.length === 0 && <li className="text-[13px] text-text-muted">Sin subcarpetas.</li>}
        {children.map((child) => (
          <li key={child}>
            <button
              type="button"
              onClick={() => setPath((prev) => [...prev, child])}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-text-secondary transition-colors hover:bg-accent hover:text-text-primary"
            >
              <FolderOpen className="size-4 text-text-muted" /> {child}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const breadcrumbsEntry = defineEntry({
  id: "breadcrumbs",
  name: "Breadcrumbs",
  group: "navigation",
  description:
    "El rastro de dónde está la persona dentro de una jerarquía, con el último tramo resaltado como página actual. Recibe una lista de etiquetas y se encarga del separador y del contraste entre niveles.",
  importPath: 'import { Breadcrumbs } from "@/components/navigation"',
  sourcePath: "src/components/navigation/Breadcrumbs.tsx",
  status: "stable",
  tags: ["nav", "aria-label"],
  playground: definePlayground({
    controls: {
      depth: { type: "number", label: "Niveles", default: 3, min: 1, max: 5, step: 1 },
      last: { type: "text", label: "Página actual", default: "Feedback efectivo" },
    },
    render: ({ depth, last }) => {
      const base = ["Inicio", "Aprendizaje", "Catálogo", "Liderazgo"];
      return <Breadcrumbs items={[...base.slice(0, Math.max(0, depth - 1)), last]} />;
    },
    code: ({ depth, last }) => {
      const base = ["Inicio", "Aprendizaje", "Catálogo", "Liderazgo"];
      const items = [...base.slice(0, Math.max(0, depth - 1)), last].map((item) => `"${item}"`).join(", ");
      return `<Breadcrumbs items={[${items}]} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Básico",
      description: "Tres niveles: el último se pinta como texto primario y sin separador.",
      code: `<Breadcrumbs items={["Empresa", "Usuarios", "Elena Martínez"]} />`,
      render: () => <Breadcrumbs items={["Empresa", "Usuarios", "Elena Martínez"]} />,
    },
    {
      id: "drill-down",
      title: "Navegación controlada",
      description: "El rastro crece al entrar en una carpeta y se recorta con «Volver». El componente solo recibe la lista.",
      code: `const [path, setPath] = React.useState(["Aprendizaje"]);

<Breadcrumbs items={path} />
<Button variant="ghost" size="xs" onClick={() => setPath((p) => p.slice(0, -1))}>
  <ArrowLeft /> Volver
</Button>
<button onClick={() => setPath((p) => [...p, "Catálogo"])}>Catálogo</button>`,
      render: () => <DrillDownDemo />,
    },
    {
      id: "in-header",
      title: "Sobre un encabezado de página",
      description: "Va justo encima del título, en el mismo bloque, para no competir con él.",
      code: `<header className="space-y-1">
  <Breadcrumbs items={["Desempeño", "Evaluaciones 360", "Ciclo 2026-Q1"]} />
  <h1 className="text-xl font-bold text-text-primary">Ciclo 2026-Q1</h1>
</header>`,
      render: () => (
        <header className="space-y-1">
          <Breadcrumbs items={["Desempeño", "Evaluaciones 360", "Ciclo 2026-Q1"]} />
          <h1 className="text-xl font-bold text-text-primary">Ciclo 2026-Q1</h1>
        </header>
      ),
    },
  ],
  props: [
    { name: "items", type: "string[]", description: "Etiquetas de cada nivel, de la raíz a la página actual. El último elemento se resalta." },
    { name: "className", type: "string", description: "Clases extra para el <nav>." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Cualquier atributo nativo; el `aria-label` ya viene puesto." },
  ],
  guidelines: {
    do: ["Úsalo a partir de dos niveles de profundidad; con uno solo no aporta nada.", "Mantén las etiquetas cortas y en el mismo orden que la jerarquía real.", "Colócalo encima del título de la página, nunca dentro del contenido."],
    dont: ["No lo uses como sustituto de la sub-navegación: no cambia de sección, solo ubica.", "No superes cinco niveles; a partir de ahí colapsa los intermedios."],
  },
  related: ["ubits-sub-nav", "page-header", "breadcrumb"],
});
