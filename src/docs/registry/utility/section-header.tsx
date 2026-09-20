import * as React from "react";
import { Filter, Plus } from "lucide-react";
import { SectionHeader } from "@/components/utility";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { defineEntry, definePlayground } from "../types";

function CounterDemo() {
  const [count, setCount] = React.useState(3);
  return (
    <div className="w-full space-y-4">
      <SectionHeader
        title="Integrantes"
        description={`${count} persona(s) en este equipo.`}
        actions={
          <Button size="sm" onClick={() => setCount((value) => value + 1)}>
            <Plus /> Añadir
          </Button>
        }
      />
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <Card key={index} className="flex h-12 items-center justify-center text-xs text-text-muted">
            Integrante {index + 1}
          </Card>
        ))}
      </div>
    </div>
  );
}

export const sectionHeaderEntry = defineEntry({
  id: "section-header",
  name: "SectionHeader",
  group: "utility",
  description:
    "El encabezado de una sección interna de página: eyebrow, título en 18px, descripción y un slot de acciones alineado abajo a la derecha, cerrado con una línea. Úsalo para separar bloques dentro de una misma vista, entre el PageHeader y el contenido.",
  importPath: 'import { SectionHeader } from "@/components/utility"',
  sourcePath: "src/components/utility/SectionHeader.tsx",
  status: "stable",
  tags: ["heading", "layout"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      eyebrow: { type: "text", default: "Paso 2 de 4" },
      title: { type: "text", label: "Título", default: "Contenido del programa" },
      description: { type: "text", label: "Descripción", default: "Añade lecciones y evaluaciones." },
      withActions: { type: "boolean", label: "Con acciones", default: true },
    },
    render: ({ eyebrow, title, description, withActions }) => (
      <SectionHeader
        eyebrow={eyebrow || undefined}
        title={title}
        description={description || undefined}
        actions={
          withActions ? (
            <Button size="sm" variant="outline">
              <Plus /> Añadir lección
            </Button>
          ) : undefined
        }
      />
    ),
    code: ({ eyebrow, title, description, withActions }) => {
      const lines = [
        eyebrow ? `  eyebrow="${eyebrow}"` : "",
        `  title="${title}"`,
        description ? `  description="${description}"` : "",
        withActions ? `  actions={<Button size="sm" variant="outline"><Plus /> Añadir lección</Button>}` : "",
      ].filter(Boolean);
      return `<SectionHeader\n${lines.join("\n")}\n/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Título y descripción",
      layout: "stretch",
      code: `<SectionHeader title="Actividad reciente" description="Últimos 30 días." />`,
      render: () => <SectionHeader title="Actividad reciente" description="Últimos 30 días." />,
    },
    {
      id: "actions",
      title: "Con acciones que cambian la sección",
      description: "La descripción se recalcula al añadir integrantes.",
      layout: "stretch",
      code: `<SectionHeader
  title="Integrantes"
  description={\`\${count} persona(s) en este equipo.\`}
  actions={<Button size="sm" onClick={add}><Plus /> Añadir</Button>}
/>`,
      render: () => <CounterDemo />,
    },
    {
      id: "eyebrow",
      title: "Eyebrow y varias acciones",
      layout: "stretch",
      code: `<SectionHeader
  eyebrow="Reportes"
  title="Avance por equipo"
  actions={
    <>
      <Button size="sm" variant="ghost"><Filter /> Filtrar</Button>
      <Button size="sm" variant="outline">Exportar</Button>
    </>
  }
/>`,
      render: () => (
        <SectionHeader
          eyebrow="Reportes"
          title="Avance por equipo"
          actions={
            <>
              <Button size="sm" variant="ghost">
                <Filter /> Filtrar
              </Button>
              <Button size="sm" variant="outline">
                Exportar
              </Button>
            </>
          }
        />
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Título de la sección, renderizado como h3." },
    { name: "description", type: "string", description: "Texto secundario bajo el título." },
    { name: "eyebrow", type: "string", description: "Texto pequeño sobre el título: paso, categoría o contexto." },
    { name: "actions", type: "React.ReactNode", description: "Botones alineados a la derecha, con gap de 8px." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Atributos del contenedor." },
  ],
  guidelines: {
    do: ["Uno por bloque de contenido; deja que la línea inferior separe las secciones.", "Limita las acciones a dos y hazlas secundarias (outline o ghost).", "Usa el eyebrow para el contexto que el título no necesita repetir."],
    dont: ["No lo uses como encabezado de página: para eso está PageHeader.", "No apiles dos SectionHeader sin contenido entre ellos."],
  },
  related: ["page-header", "form-section", "button"],
});
