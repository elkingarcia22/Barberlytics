import * as React from "react";
import { FolderOpen, Inbox, Plus, Search, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defineEntry, definePlayground } from "../types";

function SearchEmptyDemo() {
  const [query, setQuery] = React.useState("marketing");
  const items = ["Ventas", "Producto", "Tecnología", "Finanzas"];
  const matches = items.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="space-y-3">
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar área…" className="max-w-xs" />
      {matches.length > 0 ? (
        <ul className="space-y-1 text-sm text-text-primary">
          {matches.map((item) => (
            <li key={item} className="rounded-md border border-border/60 bg-surface px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Search}
          title={`Sin resultados para "${query}"`}
          description="Revisa la ortografía o prueba con otro término."
          action={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Limpiar búsqueda
            </Button>
          }
        />
      )}
    </div>
  );
}

export const emptyStateEntry = defineEntry({
  id: "empty-state",
  name: "EmptyState",
  group: "feedback",
  description:
    "La tarjeta punteada que ocupa el lugar de una lista vacía: un icono, un título, una explicación breve y, si aplica, la acción que la llena. Reutiliza `Card` con borde discontinuo y fondo sutil.",
  importPath: 'import { EmptyState } from "@/components/feedback/EmptyState"',
  sourcePath: "src/components/feedback/EmptyState.tsx",
  status: "stable",
  tags: ["card"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Aún no hay objetivos" },
      description: { type: "text", default: "Crea el primero para empezar a hacer seguimiento del ciclo." },
      withIcon: { type: "boolean", label: "Con icono", default: true },
      withAction: { type: "boolean", label: "Con acción", default: true },
    },
    layout: "stretch",
    render: ({ title, description, withIcon, withAction }) => (
      <EmptyState
        icon={withIcon ? Inbox : undefined}
        title={title}
        description={description || undefined}
        action={
          withAction ? (
            <Button>
              <Plus /> Crear objetivo
            </Button>
          ) : undefined
        }
      />
    ),
    code: ({ title, description, withIcon, withAction }) => {
      const attrs = [withIcon ? "icon={Inbox}" : "", `title="${title}"`, description ? `description="${description}"` : ""].filter(Boolean);
      if (!withAction) return `<EmptyState ${attrs.join(" ")} />`;
      return `<EmptyState
  ${attrs.join("\n  ")}
  action={<Button><Plus /> Crear objetivo</Button>}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Sin acción",
      description: "Cuando no hay nada que el usuario pueda hacer aquí, basta con explicar por qué está vacío.",
      layout: "stretch",
      code: `<EmptyState icon={FolderOpen} title="Sin evaluaciones recibidas" description="Cuando tu líder envíe la evaluación aparecerá aquí." />`,
      render: () => <EmptyState icon={FolderOpen} title="Sin evaluaciones recibidas" description="Cuando tu líder envíe la evaluación aparecerá aquí." />,
    },
    {
      id: "search",
      title: "Resultado de búsqueda vacío",
      description: "El estado vacío reemplaza la lista y ofrece deshacer el filtro que la dejó sin resultados.",
      layout: "stretch",
      code: `const [query, setQuery] = React.useState("marketing");
const matches = items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

{matches.length === 0 && (
  <EmptyState
    icon={Search}
    title={\`Sin resultados para "\${query}"\`}
    description="Revisa la ortografía o prueba con otro término."
    action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Limpiar búsqueda</Button>}
  />
)}`,
      render: () => <SearchEmptyDemo />,
    },
    {
      id: "two-actions",
      title: "Dos formas de empezar",
      description: "Dos `EmptyStateActionButton` con el mismo peso: crear a mano o dejar que la IA proponga.",
      layout: "stretch",
      code: `<EmptyState
  icon={Inbox}
  title="Aún no hay objetivos"
  description="Empieza con uno propio o deja que la IA proponga a partir del rol."
  action={
    <div className="flex flex-wrap justify-center gap-2">
      <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear objetivo</EmptyStateActionButton>
      <EmptyStateActionButton icon={<Sparkles className="size-4" />}>Sugerir con IA</EmptyStateActionButton>
    </div>
  }
/>`,
      render: () => (
        <EmptyState
          icon={Inbox}
          title="Aún no hay objetivos"
          description="Empieza con uno propio o deja que la IA proponga a partir del rol."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear objetivo</EmptyStateActionButton>
              <EmptyStateActionButton icon={<Sparkles className="size-4" />}>Sugerir con IA</EmptyStateActionButton>
            </div>
          }
        />
      ),
    },
    {
      id: "compact",
      title: "Compacto dentro de un panel",
      description: "Con `className` se quita el marco cuando el contenedor ya lo pone (es lo que hace TableShell).",
      layout: "stretch",
      code: `<EmptyState icon={Inbox} title="Sin información" description="No se encontraron registros." className="border-none bg-transparent p-6 shadow-none" />`,
      render: () => (
        <div className="rounded-xl border border-border/60 bg-surface p-2">
          <EmptyState icon={Inbox} title="Sin información" description="No se encontraron registros." className="border-none bg-transparent p-6 shadow-none" />
        </div>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "El titular del estado vacío." },
    { name: "description", type: "string", description: "Explicación breve de por qué está vacío o qué hacer." },
    { name: "icon", type: "LucideIcon", description: "Icono en el disco superior; se omite si no se pasa." },
    { name: "action", type: "React.ReactNode", description: "Botón o grupo de botones bajo la descripción." },
    { name: "className", type: "string", description: "Clases extra sobre la `Card` (p. ej. para quitar el marco)." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Cualquier atributo nativo del contenedor." },
  ],
  guidelines: {
    do: ["Di qué está vacío y qué lo llenaría, en una o dos frases.", "Ofrece la acción que resuelve el vacío cuando el usuario puede hacerla desde aquí.", "Quita el marco con `className` si el contenedor ya dibuja uno."],
    dont: ["No lo uses como pantalla de error: para fallos está Alert o un toast.", "No metas más de dos acciones; el estado vacío no es un menú."],
  },
  related: ["empty-state-action-button", "table-shell", "card", "button"],
});
