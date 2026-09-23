import * as React from "react";
import { AppHeader } from "@/components/app-shell/AppHeader";
import { ShellHeaderSlot } from "@/components/app-shell";
import { ShellHeaderSlotProvider } from "@/components/app-shell/shellHeaderSlot";
import { Badge } from "@/components/ui/badge";
import { defineEntry, definePlayground } from "../types";

/** El header con su proveedor de slot, como lo cablea AdminShell. */
function HeaderDemo({ withSlot = true }: { withSlot?: boolean }) {
  const [host, setHost] = React.useState<HTMLDivElement | null>(null);
  const [menuTaps, setMenuTaps] = React.useState(0);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full rounded-xl border border-border/60 bg-background p-2">
        <ShellHeaderSlotProvider value={host}>
          <AppHeader
            onToggleSidebar={() => setMenuTaps((value) => value + 1)}
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
        onToggleSidebar × {menuTaps} (el botón «Menú» solo aparece por debajo de lg)
      </p>
    </div>
  );
}

export const appHeaderEntry = defineEntry({
  id: "app-header",
  name: "AppHeader",
  group: "layout",
  description:
    "La franja de 56px del AdminShell. A la izquierda, el hueco donde la pantalla portala su identidad (ShellHeaderSlot). A la derecha, la búsqueda general primero, Novedades, ayuda, las notificaciones y, cerrando la fila, `AccountMenu`: la foto y el nombre de la persona con «sucursal · rol» debajo, y un solo menú que cambia de sucursal, cambia de rol y cierra la sesión. Los ajustes, el tema y el idioma no están aquí: viven en `WorkspaceMenu` y en «Personalización», colgados de la marca del sidebar. Los popovers se abren desde el punto exacto de su botón. Por debajo de `md` la fila se queda con lo que responde a la pantalla que estás mirando —búsqueda, notificaciones y el chip de la cuenta, que sigue siendo el mismo chip y solo cede ancho—: la ayuda se va y Novedades baja al pie del menú lateral.",
  importPath: 'import { AppHeader } from "@/components/app-shell/AppHeader"',
  sourcePath: "src/components/app-shell/AppHeader.tsx",
  status: "stable",
  tags: ["popover", "liquid-reveal", "slot"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      withSlot: { type: "boolean", label: "Con ShellHeaderSlot", default: true },
    },
    render: ({ withSlot }) => <HeaderDemo key={String(withSlot)} withSlot={withSlot} />,
    code: ({ withSlot }) => `const [headerSlot, setHeaderSlot] = React.useState<HTMLDivElement | null>(null);

<AppHeader
  onToggleSidebar={toggleSidebar}
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
      title: "Novedades, notificaciones y cuenta",
      description: "Abre cada popover: las filas entran escalonadas y la máscara se abre desde el centro del botón (`liquid`). El chip de la cuenta abre la persona con su correo, la sucursal, los roles y el cierre de sesión en un solo menú. El tema y el idioma ya no están en esta cabecera: están en «Personalización», dentro de `WorkspaceMenu` (ver el componente en `layout`), colgado de la marca del sidebar.",
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
    { name: "config.companies", type: "Company[]", default: "COMPANIES", description: "Los espacios entre los que se cambia desde el menú de la cuenta: empresas, sucursales, sedes. `chrome.company: false` los quita." },
    { name: "config.activeCompanyId", type: "string", description: "Espacio activo controlado desde fuera. Sin él, el header arranca en el primero y gestiona su propio estado." },
    { name: "config.onSelectCompany", type: "(id: string) => void", description: "Al elegir otro espacio. Todo lo que se ve debajo es de ese espacio, así que la app decide qué recarga." },
    { name: "config.workspaceLabels", type: "ShellWorkspaceLabels", default: "Empresa", description: "Cómo se lee el espacio en este producto: `entity` («Sucursal»), `change` («Cambiar de sucursal») y `list` («Tus sucursales»)." },
    { name: "config.showWorkspaceUsage", type: "boolean", default: "true", description: "Licencias y créditos dentro del menú. Un producto que no las vende lo apaga y el menú queda en identidad y cambio." },
    { name: "config.roles", type: "UserRoleOption[]", default: "USER_ROLES", description: "Roles que la persona puede asumir. Con menos de dos el chip no los menciona. `chrome.role: false` quita la lista del menú." },
    { name: "config.activeRoleId", type: "string", description: "Rol activo controlado desde fuera. Sin él, el header arranca en el primero y gestiona su propio estado." },
    { name: "config.onSelectRole", type: "(id: string) => void", description: "Al elegir un rol. La app decide qué recarga: navegación, permisos o la pantalla entera." },
    { name: "onToggleSidebar", type: "() => void", description: "El botón «Menú», visible solo por debajo de `lg`, donde el sidebar es un cajón." },
    { name: "onOpenNews", type: "() => void", description: "Obsoleto: Novedades ya se abre solo. Se mantiene por compatibilidad." },
    { name: "onSlotRef", type: "(element: HTMLDivElement | null) => void", description: "Recibe el elemento del hueco de identidad para pasarlo a ShellHeaderSlotProvider." },
  ],
  guidelines: {
    do: [
      "Guarda el elemento de `onSlotRef` en estado (no en un ref): el slot se monta después del primer render y los consumidores necesitan re-renderizar.",
      "Usa ShellHeaderSlot para identidad corta: nombre, estado, autosave. Máximo una línea.",
      "Cuando cambie el rol o la sucursal, reacciona en `onSelectRole` / `onSelectCompany`: el shell solo mueve la marca, la navegación y los permisos son de la app.",
      "Da a `workspaceLabels` el nombre que usa el producto: el mismo conmutador se lee «Empresa» en un SaaS y «Sucursal» en un negocio con locales.",
    ],
    dont: [
      "No pongas migas en el header: la navegación vive en el sidebar y el hueco es para la pantalla.",
      "No montes AppHeader fuera de AdminShell salvo para probarlo; los popovers asumen el ancho del shell.",
      "No repartas el contexto: quién, dónde y como quién son la misma pregunta y viven en la misma puerta, con el rol y la sucursal visibles en el propio chip.",
      "No dejes el chip de la cuenta en la cara sola en móvil: es donde más cuesta saber en qué sucursal estás. Si falta ancho, lo que sale de la fila es lo que no depende de la pantalla (Novedades, ayuda).",
      "No metas la configuración en el árbol de navegación ni de vuelta en esta cabecera: se ajusta una vez, así que vive en `WorkspaceMenu`, colgado de la marca (ver `admin-shell` y `workspace-menu`).",
    ],
  },
  related: ["admin-shell", "account-menu", "app-sidebar", "workspace-menu", "header", "save-indicator"],
});
