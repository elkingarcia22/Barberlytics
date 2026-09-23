import * as React from "react";
import { Scrollspy, useScrollspy, type ScrollspySection } from "@/components/navigation/Scrollspy";
import { defineEntry, definePlayground } from "../types";

const ORIENTATIONS = ["vertical", "horizontal"] as const;

const CONFIG_SECTIONS: ScrollspySection[] = [
  { id: "rs-general", label: "General" },
  { id: "rs-notificaciones", label: "Notificaciones" },
  { id: "rs-permisos", label: "Permisos" },
  { id: "rs-integraciones", label: "Integraciones" },
];

function ConfigSectionBlock({ id, title }: { id: string; title: string }) {
  return (
    <section id={id} className="scroll-mt-2 rounded-lg border border-border/60 bg-surface-subtle p-4">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Contenido de la sección «{title}». Al hacer scroll dentro del panel, el índice de la
        izquierda marca cuál está a la vista.
      </p>
    </section>
  );
}

function ConfigScrollspyDemo({ orientation }: { orientation: (typeof ORIENTATIONS)[number] }) {
  const scrollContainer = React.useRef<HTMLDivElement>(null);
  const isVertical = orientation === "vertical";

  return (
    <div className={isVertical ? "flex h-full gap-4" : "flex h-full flex-col gap-3"}>
      <Scrollspy
        sections={CONFIG_SECTIONS}
        scrollContainer={scrollContainer}
        orientation={orientation}
        title={isVertical ? "En esta página" : undefined}
        updateHash={false}
        className={isVertical ? "w-44 shrink-0" : undefined}
      />
      <div ref={scrollContainer} className="min-h-0 flex-1 space-y-4 overflow-auto rounded-xl border border-border p-4">
        {CONFIG_SECTIONS.map((section) => (
          <ConfigSectionBlock key={section.id} id={section.id} title={section.label} />
        ))}
      </div>
    </div>
  );
}

const CANDIDATE_SECTIONS: ScrollspySection[] = [
  { id: "sc-perfil", label: "Perfil" },
  { id: "sc-experiencia", label: "Experiencia", level: 2 },
  { id: "sc-formacion", label: "Formación", level: 2 },
  { id: "sc-evaluacion", label: "Evaluación" },
  { id: "sc-referencias", label: "Referencias" },
];

function CandidateProfileScrollspy() {
  const scrollContainer = React.useRef<HTMLDivElement>(null);
  return (
    <div className="flex h-full gap-4">
      <Scrollspy
        sections={CANDIDATE_SECTIONS}
        scrollContainer={scrollContainer}
        title="Ficha del candidato"
        updateHash={false}
        className="w-48 shrink-0"
      />
      <div ref={scrollContainer} className="min-h-0 flex-1 space-y-4 overflow-auto rounded-xl border border-border p-4">
        {CANDIDATE_SECTIONS.map((section) => (
          <ConfigSectionBlock key={section.id} id={section.id} title={section.label} />
        ))}
      </div>
    </div>
  );
}

function ManualHookDemo() {
  const scrollContainer = React.useRef<HTMLDivElement>(null);
  const ids = CONFIG_SECTIONS.map((section) => section.id);
  const { activeId, setActiveId } = useScrollspy(ids, { scrollContainer });

  return (
    <div className="flex h-full gap-4">
      <nav className="flex w-44 shrink-0 flex-col gap-1">
        {CONFIG_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              setActiveId(section.id);
              document.getElementById(section.id)?.scrollIntoView({ block: "start", behavior: "smooth" });
            }}
            className={
              "rounded-md px-3 py-1.5 text-left text-sm transition-colors duration-fast ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 " +
              (activeId === section.id
                ? "bg-primary/10 font-medium text-primary"
                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary")
            }
          >
            {section.label}
          </button>
        ))}
      </nav>
      <div ref={scrollContainer} className="min-h-0 flex-1 space-y-4 overflow-auto rounded-xl border border-border p-4">
        {CONFIG_SECTIONS.map((section) => (
          <ConfigSectionBlock key={section.id} id={section.id} title={section.label} />
        ))}
      </div>
    </div>
  );
}

export const scrollspyEntry = defineEntry({
  id: "scrollspy",
  name: "Scrollspy",
  group: "navigation",
  description:
    "Índice lateral (o de pestañas) que resalta la sección visible mientras se hace scroll, con `IntersectionObserver` en vez de un handler de scroll. Úsalo en pantallas largas de configuración o en fichas con varias secciones fijas.",
  importPath: 'import { Scrollspy, useScrollspy } from "@/components/navigation/Scrollspy"',
  sourcePath: "src/components/navigation/Scrollspy.tsx",
  status: "stable",
  tags: ["intersection-observer", "a11y", "hook"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "vertical" },
    },
    layout: "stretch",
    render: ({ orientation }) => (
      <div className="h-80">
        <ConfigScrollspyDemo orientation={orientation as (typeof ORIENTATIONS)[number]} />
      </div>
    ),
    code: ({ orientation }) =>
      `<Scrollspy
  sections={sections}
  scrollContainer={scrollContainer}${orientation !== "vertical" ? `\n  orientation="${orientation}"` : ""}
/>`,
  }),
  examples: [
    {
      id: "config-panel",
      title: "Cuatro secciones de una pantalla de configuración",
      description:
        "El caso típico: `scrollContainer` apunta al panel con scroll propio (no al viewport), y `updateHash` va en `false` porque la doc ya usa el hash como ruta.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `const scrollContainer = React.useRef<HTMLDivElement>(null);

<Scrollspy sections={sections} scrollContainer={scrollContainer} title="En esta página" />
<div ref={scrollContainer} className="overflow-auto">
  <section id="general">...</section>
  <section id="notificaciones">...</section>
  <section id="permisos">...</section>
  <section id="integraciones">...</section>
</div>`,
      render: () => <ConfigScrollspyDemo orientation="vertical" />,
    },
    {
      id: "candidate-profile",
      title: "Ficha de candidato con subsecciones",
      description:
        "`level: 2` indenta una entrada como subsección, útil cuando «Experiencia» y «Formación» cuelgan de un bloque más grande.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<Scrollspy
  title="Ficha del candidato"
  sections={[
    { id: "perfil", label: "Perfil" },
    { id: "experiencia", label: "Experiencia", level: 2 },
    { id: "formacion", label: "Formación", level: 2 },
    { id: "evaluacion", label: "Evaluación" },
    { id: "referencias", label: "Referencias" },
  ]}
  scrollContainer={scrollContainer}
/>`,
      render: () => <CandidateProfileScrollspy />,
    },
    {
      id: "use-scrollspy",
      title: "El hook a mano",
      description:
        "`useScrollspy(ids, options)` devuelve `activeId` y `setActiveId`; sirve para construir un índice propio (aquí, botones en vez de enlaces) cuando el `<nav>` de `Scrollspy` no encaja.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `const ids = sections.map((s) => s.id);
const { activeId, setActiveId } = useScrollspy(ids, { scrollContainer });

<button
  onClick={() => {
    setActiveId(section.id);
    document.getElementById(section.id)?.scrollIntoView({ block: "start" });
  }}
  aria-current={activeId === section.id ? "true" : undefined}
>
  {section.label}
</button>`,
      render: () => <ManualHookDemo />,
    },
  ],
  props: [
    { name: "sections", type: "ScrollspySection[]", description: '`{ id, label, level? }`. `id` debe existir en el DOM dentro de `scrollContainer` (o del documento). `level: 2` indenta la entrada como subsección.' },
    { name: "scrollContainer", type: "React.RefObject<HTMLElement | null>", description: "Contenedor con scroll propio. Sin él, se observa contra el viewport." },
    { name: "offset", type: "number", default: "0", description: "Píxeles que tapa una cabecera fija sobre el contenedor; desplaza tanto el destino del clic como la banda activa del observador." },
    { name: "title", type: "string", description: 'Rótulo del índice; también es el `aria-label` del `<nav>` ("En esta página" si no se indica ninguno de los dos).' },
    { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Vertical dibuja una lista con filete lateral; horizontal, una barra de pestañas con scroll." },
    { name: "onSectionChange", type: "(id: string) => void", description: "Se llama cada vez que cambia la sección activa (mismo evento que dispara el hook)." },
    { name: "updateHash", type: "boolean", default: "true", description: 'Escribe `#id` en la barra de direcciones con `replaceState` al hacer clic. Desactívalo en pantallas con router por hash, donde el hash ya es la ruta.' },
    { name: "...props", type: 'Omit<React.HTMLAttributes<HTMLElement>, "title">', description: "Atributos nativos del `<nav>`." },
    { name: "useScrollspy(ids, options)", type: "(ids: readonly string[], options?: UseScrollspyOptions) => UseScrollspyResult", description: 'El hook detrás de `Scrollspy`. `options`: `{ scrollContainer?, offset?, onChange? }`. Devuelve `{ activeId, setActiveId }`; reutilízalo para un índice con markup propio.' },
  ],
  guidelines: {
    do: [
      "Pasa siempre `scrollContainer` cuando las secciones viven dentro de un panel con su propio scroll; sin él, `Scrollspy` observa el viewport completo.",
      "Da a cada sección un `id` estable y usa `scroll-mt-*` (o `offset`) si hay una cabecera fija encima.",
      "En pantallas con router por hash, pasa `updateHash={false}` para no pisar la ruta actual.",
    ],
    dont: [
      "No lo uses con menos de tres secciones: un enlace «Ver más abajo» resuelve el caso simple.",
      "No dupliques `id`s entre `Scrollspy` y otras anclas de la misma página; el observador solo ve el primero.",
      "No lo reemplaces por un listener de `scroll`: pierdes la eficiencia del `IntersectionObserver` y el efecto es más difícil de igualar.",
    ],
  },
  related: ["tabs-nav", "breadcrumbs", "page-shell", "table-shell"],
});
