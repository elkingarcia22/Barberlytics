import { ResizableGroup, ResizableHandle, ResizablePanel } from "@/components/layout/Resizable";
import { defineEntry, definePlayground } from "../types";

const DIRECTIONS = ["horizontal", "vertical"] as const;

const CANDIDATES = ["Renata Méndez", "Carlos Rojas", "Ana Torres", "Diego Salazar", "Valentina Ruiz"];

function CandidateList() {
  return (
    <ul className="flex h-full flex-col gap-1 overflow-auto p-3 text-sm">
      {CANDIDATES.map((name) => (
        <li
          key={name}
          className="cursor-default rounded-md px-2 py-1.5 text-text-secondary first:bg-primary/10 first:font-medium first:text-primary"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

function CandidateDetail() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-4">
      <p className="text-sm font-medium text-text-primary">Renata Méndez</p>
      <p className="text-sm text-text-secondary">Producto · 4 años de experiencia · Bogotá</p>
      <p className="text-sm text-text-secondary">
        Entrevistada el 12 de marzo. Referencias verificadas y prueba técnica completa con 88/100.
      </p>
    </div>
  );
}

function MasterDetailPlayground({
  direction,
  withGrip,
  collapsible,
}: {
  direction: (typeof DIRECTIONS)[number];
  withGrip: boolean;
  collapsible: boolean;
}) {
  return (
    <ResizableGroup direction={direction} className="h-full rounded-xl border border-border">
      <ResizablePanel defaultSize={30} minSize={15} maxSize={70} collapsible={collapsible}>
        <CandidateList />
      </ResizablePanel>
      <ResizableHandle withGrip={withGrip} />
      <ResizablePanel defaultSize={70} minSize={20}>
        <CandidateDetail />
      </ResizablePanel>
    </ResizableGroup>
  );
}

function EditorPreview() {
  return (
    <ResizableGroup direction="vertical" className="h-full rounded-xl border border-border">
      <ResizablePanel defaultSize={55} minSize={20}>
        <div className="h-full overflow-auto p-4 font-mono text-xs text-text-secondary">
          ## Política de vacaciones{"\n\n"}
          El equipo puede solicitar días libres con 5 días de anticipación...
        </div>
      </ResizablePanel>
      <ResizableHandle withGrip />
      <ResizablePanel defaultSize={45} minSize={20}>
        <div className="h-full overflow-auto p-4">
          <h3 className="text-base font-semibold text-text-primary">Política de vacaciones</h3>
          <p className="mt-2 text-sm text-text-secondary">
            El equipo puede solicitar días libres con 5 días de anticipación...
          </p>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  );
}

function CollapsibleSidebar() {
  return (
    <ResizableGroup direction="horizontal" className="h-full rounded-xl border border-border">
      <ResizablePanel defaultSize={22} minSize={15} collapsible>
        <CandidateList />
      </ResizablePanel>
      <ResizableHandle withGrip />
      <ResizablePanel defaultSize={78} minSize={30}>
        <CandidateDetail />
      </ResizablePanel>
    </ResizableGroup>
  );
}

export const resizableEntry = defineEntry({
  id: "resizable",
  name: "Resizable",
  group: "layout",
  description:
    "Paneles que se reparten el ancho o el alto de un grupo y se redimensionan arrastrando el asa que los separa. Sin dependencias: el reparto vive como porcentajes en el grupo y cada panel lo recibe como `flex-basis`.",
  importPath:
    'import { ResizableGroup, ResizablePanel, ResizableHandle } from "@/components/layout/Resizable"',
  sourcePath: "src/components/layout/Resizable.tsx",
  status: "stable",
  tags: ["sin-dependencias", "a11y", "drag"],
  playground: definePlayground({
    controls: {
      direction: { type: "select", label: "Dirección", options: DIRECTIONS, default: "horizontal" },
      withGrip: { type: "boolean", label: "Con tirador", default: true },
      collapsible: { type: "boolean", label: "Panel plegable", default: false },
    },
    layout: "stretch",
    render: ({ direction, withGrip, collapsible }) => (
      <div className="h-80">
        <MasterDetailPlayground
          direction={direction as (typeof DIRECTIONS)[number]}
          withGrip={withGrip}
          collapsible={collapsible}
        />
      </div>
    ),
    code: ({ direction, withGrip, collapsible }) => {
      const attrs = [direction !== "horizontal" ? `direction="${direction}"` : ""].filter(Boolean);
      return `<ResizableGroup ${attrs.join(" ")}>
  <ResizablePanel defaultSize={30} minSize={15} maxSize={70}${collapsible ? " collapsible" : ""}>
    <CandidateList />
  </ResizablePanel>
  <ResizableHandle${withGrip ? " withGrip" : ""} />
  <ResizablePanel defaultSize={70} minSize={20}>
    <CandidateDetail />
  </ResizablePanel>
</ResizableGroup>`;
    },
  }),
  examples: [
    {
      id: "master-detail",
      title: "Maestro-detalle de candidatos",
      description:
        "El caso base: una lista angosta a la izquierda y la ficha a la derecha. `minSize` en ambos paneles evita que uno aplaste al otro.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<ResizableGroup direction="horizontal" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={30} minSize={15} maxSize={70}>
    <CandidateList />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={70} minSize={20}>
    <CandidateDetail />
  </ResizablePanel>
</ResizableGroup>`,
      render: () => (
        <MasterDetailPlayground direction="horizontal" withGrip={false} collapsible={false} />
      ),
    },
    {
      id: "editor-preview",
      title: "Editor de contenido con vista previa",
      description:
        "`direction=\"vertical\"` apila el editor sobre la vista previa; el tirador (`withGrip`) deja claro que el borde se puede arrastrar.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<ResizableGroup direction="vertical" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={55} minSize={20}>
    <Editor />
  </ResizablePanel>
  <ResizableHandle withGrip />
  <ResizablePanel defaultSize={45} minSize={20}>
    <Preview />
  </ResizablePanel>
</ResizableGroup>`,
      render: () => <EditorPreview />,
    },
    {
      id: "collapsible",
      title: "Panel plegable",
      description:
        "Con `collapsible` el panel se pliega a 0 al arrastrarlo por debajo de la mitad de su `minSize`; el doble clic en el asa restablece el reparto por defecto.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<ResizableGroup direction="horizontal" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={22} minSize={15} collapsible>
    <CandidateList />
  </ResizablePanel>
  <ResizableHandle withGrip />
  <ResizablePanel defaultSize={78} minSize={30}>
    <CandidateDetail />
  </ResizablePanel>
</ResizableGroup>`,
      render: () => <CollapsibleSidebar />,
    },
  ],
  props: [
    {
      name: "ResizableGroup — direction",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: "Eje del reparto. Horizontal pone los paneles en fila; vertical, en columna.",
    },
    {
      name: "ResizableGroup — onLayout",
      type: "(sizes: number[]) => void",
      description: "Se llama con el reparto completo (porcentajes que suman 100) en cada cambio, incluido el arrastre en curso.",
    },
    {
      name: "ResizableGroup — storageKey",
      type: "string",
      description: "Clave de `localStorage` donde se recuerda el reparto entre visitas. Se guarda al soltar el asa, no en cada frame.",
    },
    {
      name: "ResizableGroup — ...props",
      type: 'React.HTMLAttributes<"div">',
      description: "Atributos nativos del contenedor del grupo.",
    },
    {
      name: "ResizablePanel — defaultSize",
      type: "number",
      description: "Porcentaje inicial del grupo. Sin él, el panel se reparte a partes iguales lo que sobre entre los paneles sin tamaño declarado.",
    },
    {
      name: "ResizablePanel — minSize",
      type: "number",
      description: "Porcentaje mínimo. También topa al panel vecino al arrastrar el asa que comparten.",
    },
    {
      name: "ResizablePanel — maxSize",
      type: "number",
      description: "Porcentaje máximo del panel.",
    },
    {
      name: "ResizablePanel — collapsible",
      type: "boolean",
      default: "false",
      description: "Deja que el panel se pliegue a 0 al arrastrarlo por debajo de la mitad de `minSize`.",
    },
    {
      name: "ResizablePanel — ...props",
      type: 'React.HTMLAttributes<"div">',
      description: "Atributos nativos del panel (`min-h-0 min-w-0 overflow-auto` ya vienen incluidos para que el contenido no le impida encogerse).",
    },
    {
      name: "ResizableHandle — withGrip",
      type: "boolean",
      default: "false",
      description: "Dibuja el tirador central, para que se vea que el borde se puede arrastrar.",
    },
    {
      name: "ResizableHandle — ...props",
      type: 'React.HTMLAttributes<"div">',
      description: 'Atributos nativos del asa. Es un `role="separator"` enfocable: el grupo le inyecta los `aria-value*`, `aria-orientation` y los manejadores de puntero y teclado.',
    },
  ],
  guidelines: {
    do: [
      "Fija un `minSize` en cada panel para que ninguno desaparezca por accidente al arrastrar.",
      "Dale al `ResizableGroup` una altura explícita (`h-full` sobre un contenedor con alto definido); los porcentajes se calculan contra ella.",
      "Usa `storageKey` cuando el reparto tenga sentido recordarlo entre sesiones, como un panel lateral de la app.",
    ],
    dont: [
      "No lo uses para layouts que no necesitan ajuste manual: un `grid` fijo es más simple y más predecible.",
      "No pongas contenido crítico solo en un panel `collapsible` sin una forma de volver a abrirlo (doble clic en el asa o un botón externo).",
      "No anides más de dos niveles de `ResizableGroup`; la pista deja de ser legible con tantas asas.",
    ],
  },
  related: ["page-shell", "admin-shell", "scroll-area", "table-shell"],
});
