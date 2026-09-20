import { AppShell, PageShell } from "@/components/layout";
import { defineEntry, definePlayground } from "../types";
import { DemoLongContent, DemoStats, ShellFrame } from "./layoutDemo";

const MAX_WIDTHS = ["enterprise", "constrained", "full"] as const;
type MaxWidth = (typeof MAX_WIDTHS)[number];

const WIDTH_LABEL: Record<MaxWidth, string> = {
  enterprise: "1600px",
  constrained: "1200px",
  full: "sin límite",
};

/** Una PageShell acotada, con una guía del ancho máximo dibujada sobre el contenido. */
function PageDemo({ maxWidth = "enterprise", height = 360, rows = 4 }: { maxWidth?: MaxWidth; height?: number; rows?: number }) {
  return (
    <ShellFrame height={height}>
      <PageShell maxWidth={maxWidth} className="h-full">
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-center text-xs font-medium text-primary">
          maxWidth="{maxWidth}" · {WIDTH_LABEL[maxWidth]}
        </div>
        <DemoStats />
        <DemoLongContent rows={rows} />
      </PageShell>
    </ShellFrame>
  );
}

export const pageShellEntry = defineEntry({
  id: "page-shell",
  name: "PageShell",
  group: "layout",
  description:
    "El `<main>` de una página: hace scroll por su cuenta, pone el padding de página y centra el contenido en una columna con ancho máximo. Tres anchos según la densidad de la pantalla: enterprise para tablas y dashboards, constrained para lectura y formularios, full para lienzos.",
  importPath: 'import { PageShell } from "@/components/layout"',
  sourcePath: "src/components/layout/PageShell.tsx",
  status: "stable",
  tags: ["main", "scroll", "forwardRef"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      maxWidth: { type: "select", options: MAX_WIDTHS, default: "enterprise" },
    },
    render: ({ maxWidth }) => <PageDemo maxWidth={maxWidth as MaxWidth} />,
    code: ({ maxWidth }) => `<PageShell${maxWidth !== "enterprise" ? ` maxWidth="${maxWidth}"` : ""}>
  <PageHeader … />
  <Stats />
</PageShell>`,
  }),
  examples: [
    {
      id: "widths",
      title: "Los tres anchos",
      description: "El contenido se centra con `mx-auto` y las secciones se separan con `space-y-8`. El límite solo se nota cuando el viewport es más ancho que la columna.",
      layout: "stretch",
      code: `<PageShell>…</PageShell>                       // max-w-[1600px]
<PageShell maxWidth="constrained">…</PageShell> // max-w-[1200px]
<PageShell maxWidth="full">…</PageShell>        // max-w-full`,
      render: () => (
        <div className="flex w-full flex-col gap-4">
          <PageDemo maxWidth="constrained" height={260} rows={2} />
          <PageDemo maxWidth="full" height={260} rows={2} />
        </div>
      ),
    },
    {
      id: "in-shell",
      title: "Dentro de AppShell",
      description: "Es el hijo natural del viewport del shell: `flex-1` toma el alto que sobra y el scroll queda dentro de la página.",
      layout: "stretch",
      code: `<AppShell sidebar={<SidebarRail … />} header={<Header … />}>
  <PageShell maxWidth="constrained">{children}</PageShell>
</AppShell>`,
      render: () => (
        <ShellFrame height={360}>
          <AppShell className="h-full">
            <PageShell maxWidth="constrained">
              <DemoStats />
              <DemoLongContent rows={3} />
            </PageShell>
          </AppShell>
        </ShellFrame>
      ),
    },
  ],
  props: [
    { name: "maxWidth", type: '"enterprise" | "constrained" | "full"', default: '"enterprise"', description: "Ancho máximo de la columna: 1600px, 1200px o sin límite." },
    { name: "children", type: "React.ReactNode", description: "Las secciones de la página; se apilan con `space-y-8`." },
    { name: "className", type: "string", description: "Se mezcla con el `<main>` (`flex-1 overflow-y-auto bg-background p-8`)." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Atributos nativos del `<main>`. Reenvía `ref`." },
  ],
  guidelines: {
    do: [
      "Usa `enterprise` para tablas anchas y dashboards; `constrained` cuando el contenido se lee de arriba abajo.",
      "Encabeza la página con PageHeader como primera sección.",
      "Deja que PageShell sea el único elemento con scroll vertical de la vista.",
    ],
    dont: [
      "No pongas otro `<main>` dentro; ya lo es.",
      "No sobrescribas el padding por sección: es el ritmo de página compartido.",
    ],
  },
  related: ["app-shell", "page-header", "section-header"],
});
