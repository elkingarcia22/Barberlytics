import * as React from "react";
import { Palette } from "lucide-react";
import { WorkspaceMenu } from "@/components/app-shell/WorkspaceMenu";
import { SETTINGS_GROUPS } from "@/components/app-shell/appShellData";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { defineEntry, definePlayground } from "../types";

/** El disparador tal y como lo monta AppSidebar: la fila de marca. */
function BrandTrigger({ productName = "Thema", tagline = "Barbería" }: { productName?: string; tagline?: string }) {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center gap-2 rounded-xl px-1.5 text-left transition-colors hover:bg-background"
    >
      <BrandMark name={productName} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold leading-tight tracking-tight text-text-primary">{productName}</span>
        <span className="block truncate text-[11px] text-text-muted">{tagline}</span>
      </span>
    </button>
  );
}

function WorkspaceMenuDemo({ withExtra = true, withAll = true }: { withExtra?: boolean; withAll?: boolean }) {
  const [lastNav, setLastNav] = React.useState<string | null>(null);
  return (
    <div className="w-60 rounded-2xl border border-border/60 bg-surface p-3 pt-4">
      <WorkspaceMenu
        trigger={<BrandTrigger />}
        productName="Thema"
        tagline="Barbería"
        groups={SETTINGS_GROUPS}
        all={withAll ? { id: "configuracion", label: "Ver toda la configuración", path: "/configuracion" } : undefined}
        onNavigate={(id) => setLastNav(id)}
        extra={
          withExtra ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            >
              <Palette className="size-4 shrink-0 text-text-muted" strokeWidth={2} />
              Personalizar tema
            </button>
          ) : undefined
        }
      />
      <p className="mt-3 px-1.5 text-[12px] text-text-muted">
        {lastNav ? <>Último: <span className="font-semibold text-text-primary">onNavigate("{lastNav}")</span></> : "Elige un ajuste"}
      </p>
    </div>
  );
}

export const workspaceMenuEntry = defineEntry({
  id: "workspace-menu",
  name: "WorkspaceMenu",
  group: "layout",
  description:
    "El menú que cuelga de la marca del producto en el sidebar: antes de esto, ajustar la cuenta era un engranaje suelto en la cabecera y personalizar el tema otro botón aparte, compitiendo con la sucursal, el buscador y el avatar por sitio. Aquí es una sola puerta: la identidad del producto, lo que la app añada en `extra` (tema, idioma) y los grupos de `config.settings`, con un pie opcional que lleva a la pantalla que los reúne todos. El shell no sabe qué hay dentro de `extra` — solo le da un lugar entre la identidad y los ajustes.",
  importPath: 'import { WorkspaceMenu } from "@/components/app-shell/WorkspaceMenu"',
  sourcePath: "src/components/app-shell/WorkspaceMenu.tsx",
  status: "stable",
  tags: ["dropdown-menu", "shell", "sidebar"],
  playground: definePlayground({
    controls: {
      withExtra: { type: "boolean", label: "Con personalización (extra)", default: true },
      withAll: { type: "boolean", label: "Con «Ver toda la configuración»", default: true },
    },
    render: ({ withExtra, withAll }) => <WorkspaceMenuDemo key={`${withExtra}-${withAll}`} withExtra={withExtra} withAll={withAll} />,
    code: ({ withExtra, withAll }) => `<WorkspaceMenu
  trigger={<BrandRow />}
  productName="Thema"
  tagline="Barbería"
  groups={SETTINGS_GROUPS}${withAll ? '\n  all={{ id: "configuracion", label: "Ver toda la configuración", path: "/configuracion" }}' : ""}
  onNavigate={(id, path) => navigate(path ?? id)}${withExtra ? "\n  extra={<ThemeSelector className=\"w-full justify-start\" />}" : ""}
/>`,
  }),
  examples: [
    {
      id: "default",
      title: "Identidad, personalización y ajustes",
      description:
        "AppSidebar lo monta así: la fila de marca como disparador, `extra` con lo que la app quiera ofrecer para personalizar (tema, idioma) y los grupos de `ShellConfig.settings` debajo. Elegir un ajuste llama a `onNavigate` y cierra el menú.",
      layout: "stretch",
      code: `<WorkspaceMenu
  trigger={<BrandRow />}
  productName={brand.productName}
  tagline={brand.tagline}
  groups={config.settings}
  all={config.settingsAll}
  onNavigate={config.onNavigate}
  extra={<ThemeSelector className="w-full justify-start" />}
/>`,
      render: () => <WorkspaceMenuDemo />,
    },
  ],
  props: [
    { name: "trigger", type: "React.ReactElement", description: "El elemento que lo abre: la fila de marca del panel expandido, o el icono solo en el rail plegado." },
    { name: "productName", type: "string", description: "Encabeza el menú, junto al `tagline` si lo hay." },
    { name: "tagline", type: "string", description: "Segunda línea bajo el nombre del producto." },
    { name: "groups", type: "SettingsGroup[]", default: "config.settings", description: "Los ajustes agrupados. Cada ítem navega por `onNavigate`." },
    { name: "all", type: "{ id, label, path? }", description: "El pie del menú: la pantalla que reúne todos los ajustes." },
    { name: "onNavigate", type: "(id: string, path?: string) => void", description: "Al elegir un ajuste o el pie «Ver toda la configuración»." },
    { name: "extra", type: "React.ReactNode", description: "Controles que la app añade entre la identidad y los ajustes — el shell no sabe qué son, típicamente `ThemeSelector` y `LanguageSelector`." },
    { name: "side / align", type: '"bottom" | "right" · "start" | "end"', default: '"bottom" · "start"', description: "Lado del contenido: `bottom` para la fila expandida del panel, `right` para el icono del rail plegado." },
  ],
  guidelines: {
    do: [
      "Da a `extra` el mismo peso visual que un ítem del menú (fila completa, no un botón suelto): así se lee como una sección más, no como un intruso.",
      "Deja que AppSidebar decida cuándo montarlo: sin `config.settings` (la documentación, por ejemplo), la marca se queda como identidad simple, sin abrir nada.",
      "Usa el mismo `config.settings` que ya alimentaba el engranaje de la cabecera; este componente no inventa su propio catálogo de ajustes.",
    ],
    dont: [
      "No lo dupliques en la cabecera: los ajustes solo se ofrecen desde la marca, para no repartir la misma puerta en dos sitios distintos.",
      "No metas contenido pesado y sin relación en `extra`; es un atajo a personalización, no un cajón de sastre.",
    ],
  },
  related: ["admin-shell", "app-sidebar", "app-header", "sidebar-icon-rail", "dropdown-menu"],
});
