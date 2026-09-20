import * as React from "react";
import { AppHeader } from "@/components/app-shell/AppHeader";
import { ShellHeaderSlot } from "@/components/app-shell";
import { ShellHeaderSlotProvider } from "@/components/app-shell/shellHeaderSlot";
import { Badge } from "@/components/ui/badge";
import { defineEntry, definePlayground } from "../types";

/** El header con su proveedor de slot, como lo cablea AdminShell. */
function HeaderDemo({ withSlot = true, initialDark = false }: { withSlot?: boolean; initialDark?: boolean }) {
  const [host, setHost] = React.useState<HTMLDivElement | null>(null);
  const [isDark, setIsDark] = React.useState(initialDark);
  const [menuTaps, setMenuTaps] = React.useState(0);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full rounded-xl border border-border/60 bg-background p-2">
        <ShellHeaderSlotProvider value={host}>
          <AppHeader
            onToggleSidebar={() => setMenuTaps((value) => value + 1)}
            isDark={isDark}
            onToggleDark={() => setIsDark((value) => !value)}
            onOpenNews={() => undefined}
            onSlotRef={setHost}
          />
          {withSlot && (
            <ShellHeaderSlot>
              <span className="truncate text-sm font-semibold text-text-primary">Encuesta de clima Q3</span>
              <Badge variant="secondary">Borrador</Badge>
              <span className="text-xs text-text-muted">Guardado hace 2 min</span>
            </ShellHeaderSlot>
          )}
        </ShellHeaderSlotProvider>
      </div>
      <p className="font-mono text-[11px] text-text-muted">
        isDark = {String(isDark)} · onToggleSidebar × {menuTaps} (el botón «Menú» solo aparece por debajo de lg)
      </p>
    </div>
  );
}

export const appHeaderEntry = defineEntry({
  id: "app-header",
  name: "AppHeader",
  group: "layout",
  description:
    "La franja de 56px del AdminShell: a la izquierda el toggle del cajón móvil y el hueco donde la pantalla portala su identidad (ShellHeaderSlot); a la derecha Novedades, ayuda, notificaciones y el avatar con su menú, que incluye el interruptor de modo oscuro. Los tres popovers se abren desde el punto exacto de su botón.",
  importPath: 'import { AppHeader } from "@/components/app-shell/AppHeader"',
  sourcePath: "src/components/app-shell/AppHeader.tsx",
  status: "stable",
  tags: ["popover", "liquid-reveal", "slot"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      withSlot: { type: "boolean", label: "Con ShellHeaderSlot", default: true },
      isDark: { type: "boolean", label: "isDark (inicial)", default: false },
    },
    render: ({ withSlot, isDark }) => <HeaderDemo key={`${withSlot}-${isDark}`} withSlot={withSlot} initialDark={isDark} />,
    code: ({ withSlot, isDark }) => `const [isDark, setIsDark] = React.useState(${isDark});
const [headerSlot, setHeaderSlot] = React.useState<HTMLDivElement | null>(null);

<AppHeader
  onToggleSidebar={toggleSidebar}
  isDark={isDark}
  onToggleDark={() => setIsDark((value) => !value)}
  onOpenNews={noop}
  onSlotRef={setHeaderSlot}
/>${
      withSlot
        ? `

<ShellHeaderSlotProvider value={headerSlot}>
  <ShellHeaderSlot>
    <span className="text-sm font-semibold">Encuesta de clima Q3</span>
    <Badge variant="secondary">Borrador</Badge>
  </ShellHeaderSlot>
</ShellHeaderSlotProvider>`
        : ""
    }`,
  }),
  examples: [
    {
      id: "slot",
      title: "Identidad de la pantalla en el header",
      description:
        "El header entrega el elemento del hueco por `onSlotRef`; AdminShell lo pasa al proveedor y la pantalla lo llena con ShellHeaderSlot. Así el nombre que se está escribiendo o el estado de autosave siguen siendo estado de la pantalla.",
      layout: "stretch",
      code: `// En AdminShell:
<AppHeader … onSlotRef={setHeaderSlot} />
<ShellHeaderSlotProvider value={headerSlot}>{children}</ShellHeaderSlotProvider>

// En la pantalla:
<ShellHeaderSlot>
  <span className="text-sm font-semibold">{name}</span>
  <Badge variant="secondary">{status}</Badge>
</ShellHeaderSlot>`,
      render: () => <HeaderDemo />,
    },
    {
      id: "menus",
      title: "Novedades, notificaciones y avatar",
      description: "Abre cada popover: las filas entran escalonadas y la máscara se abre desde el centro del botón (`liquid`). El interruptor de tema del avatar llama a `onToggleDark`; aquí solo cambia `isDark`.",
      layout: "stretch",
      code: `<AppHeader
  onToggleSidebar={toggleSidebar}
  isDark={isDark}
  onToggleDark={() => setIsDark((value) => !value)}
  onOpenNews={noop}
  onSlotRef={setHeaderSlot}
/>`,
      render: () => <HeaderDemo withSlot={false} />,
    },
  ],
  props: [
    { name: "onToggleSidebar", type: "() => void", description: "El botón «Menú», visible solo por debajo de `lg`, donde el sidebar es un cajón." },
    { name: "isDark", type: "boolean", description: "Estado del interruptor de tema en el menú del avatar." },
    { name: "onToggleDark", type: "() => void", description: "Al mover el interruptor. AdminShell lo conecta con la clase `dark` de `<html>`." },
    { name: "onOpenNews", type: "() => void", description: "Obsoleto: Novedades ya se abre solo. Se mantiene por compatibilidad." },
    { name: "onSlotRef", type: "(element: HTMLDivElement | null) => void", description: "Recibe el elemento del hueco de identidad para pasarlo a ShellHeaderSlotProvider." },
  ],
  guidelines: {
    do: [
      "Guarda el elemento de `onSlotRef` en estado (no en un ref): el slot se monta después del primer render y los consumidores necesitan re-renderizar.",
      "Usa ShellHeaderSlot para identidad corta: nombre, estado, autosave. Máximo una línea.",
    ],
    dont: [
      "No pongas migas en el header: la navegación vive en el sidebar y el hueco es para la pantalla.",
      "No montes AppHeader fuera de AdminShell salvo para probarlo; los popovers asumen el ancho del shell.",
    ],
  },
  related: ["admin-shell", "app-sidebar", "header", "save-indicator"],
});
