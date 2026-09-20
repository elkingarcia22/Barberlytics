import { Separator } from "@/components/ui/separator";
import { defineEntry, definePlayground } from "../types";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

export const separatorEntry = defineEntry({
  id: "separator",
  name: "Separator",
  group: "ui",
  description:
    "Línea de 1px en el color de borde, horizontal o vertical. Úsala para separar bloques de contenido o ítems de una fila cuando el espacio en blanco no basta.",
  importPath: 'import { Separator } from "@/components/ui/separator"',
  sourcePath: "src/components/ui/separator.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      decorative: { type: "boolean", default: true },
    },
    render: ({ orientation, decorative }) =>
      orientation === "vertical" ? (
        <div className="flex h-8 items-center gap-4 text-sm text-text-primary">
          <span>Borradores</span>
          <Separator orientation="vertical" decorative={decorative} />
          <span>Publicadas</span>
        </div>
      ) : (
        <div className="w-64 space-y-3 text-sm text-text-primary">
          <span>Borradores</span>
          <Separator decorative={decorative} />
          <span>Publicadas</span>
        </div>
      ),
    code: ({ orientation, decorative }) => {
      const attrs = [orientation === "vertical" ? 'orientation="vertical"' : "", decorative ? "" : "decorative={false}"].filter(Boolean).join(" ");
      const tag = `<Separator${attrs ? ` ${attrs}` : ""} />`;
      return orientation === "vertical"
        ? `<div className="flex h-8 items-center gap-4">
  <span>Borradores</span>
  ${tag}
  <span>Publicadas</span>
</div>`
        : `<div className="space-y-3">
  <span>Borradores</span>
  ${tag}
  <span>Publicadas</span>
</div>`;
    },
  }),
  examples: [
    {
      id: "section",
      title: "Entre bloques",
      code: `<div className="space-y-1">
  <h4 className="text-sm font-semibold">Encuesta de clima</h4>
  <p className="text-xs text-text-secondary">Cerrada el 12 de marzo · 312 respuestas</p>
</div>
<Separator className="my-4" />
<p className="text-sm">Los resultados se comparten con líderes de equipo.</p>`,
      render: () => (
        <div className="w-80">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-text-primary">Encuesta de clima</h4>
            <p className="text-xs text-text-secondary">Cerrada el 12 de marzo · 312 respuestas</p>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-text-primary">Los resultados se comparten con líderes de equipo.</p>
        </div>
      ),
    },
    {
      id: "inline",
      title: "En una fila",
      description: "La vertical usa `self-stretch`: el contenedor debe ser flex con altura.",
      code: `<div className="flex h-5 items-center gap-3 text-sm">
  <span>Vista previa</span>
  <Separator orientation="vertical" />
  <span>Duplicar</span>
  <Separator orientation="vertical" />
  <span>Archivar</span>
</div>`,
      render: () => (
        <div className="flex h-5 items-center gap-3 text-sm text-text-primary">
          <span>Vista previa</span>
          <Separator orientation="vertical" />
          <span>Duplicar</span>
          <Separator orientation="vertical" />
          <span>Archivar</span>
        </div>
      ),
    },
  ],
  props: [
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Dirección de la línea." },
    { name: "decorative", type: "boolean", default: "true", description: "Si es decorativa se oculta a lectores de pantalla; con `false` se anuncia como separador." },
    { name: "className", type: "string", description: "Márgenes (`my-4`, `mx-2`) o color alternativo." },
  ],
  guidelines: {
    do: ["Añade el margen desde fuera (`my-*`, `mx-*`).", "Pon `decorative={false}` cuando separa secciones con sentido semántico."],
    dont: ["No apiles separadores entre cada elemento de una lista densa; usa bordes en los ítems.", "No la uses como línea de énfasis o decoración de color."],
  },
  related: ["scroll-area", "card"],
});
