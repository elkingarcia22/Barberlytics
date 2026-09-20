import * as React from "react";
import { ThemaSubNav } from "@/components/navigation";
import { SUB_NAV_VARIANTS, type SubNavVariantKey } from "@/config/subNavNavigation";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = Object.keys(SUB_NAV_VARIANTS) as SubNavVariantKey[];

function SubNavDemo({ variant, clientName, showLogo = true }: { variant: SubNavVariantKey; clientName?: string; showLogo?: boolean }) {
  const config = SUB_NAV_VARIANTS[variant];
  const [active, setActive] = React.useState(config.tabs[0].id);
  const label = config.tabs.find((tab) => tab.id === active)?.label;
  return (
    <div className="w-full space-y-4 rounded-2xl bg-surface-subtle p-4">
      <ThemaSubNav variant={variant} activeTabId={active} onTabChange={setActive} clientName={clientName} showLogo={showLogo} isSticky={false} />
      <div className="rounded-xl border border-border/60 bg-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{config.name}</p>
        <h3 className="mt-1 text-lg font-bold text-text-primary">{label}</h3>
      </div>
    </div>
  );
}

function PlaygroundDemo({ variant, clientName, showLogo }: { variant: SubNavVariantKey; clientName: string; showLogo: boolean }) {
  return <SubNavDemo key={variant} variant={variant} clientName={clientName} showLogo={showLogo} />;
}

export const themaSubNavEntry = defineEntry({
  id: "thema-sub-nav",
  name: "ThemaSubNav",
  group: "navigation",
  description:
    "La píldora de sub-navegación que cuelga bajo la cabecera: marca del cliente, las pestañas del módulo con icono y subrayado animado, y dos utilidades a la derecha. Las pestañas salen de `SUB_NAV_VARIANTS` por nombre de módulo y en pantallas estrechas se pliegan a un menú.",
  importPath: 'import { ThemaSubNav } from "@/components/navigation"',
  sourcePath: "src/components/navigation/ThemaSubNav.tsx",
  status: "stable",
  tags: ["sticky", "responsive", "config"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", label: "Módulo", options: VARIANTS, default: "aprendizaje" },
      clientName: { type: "text", label: "Cliente", default: "Acme" },
      showLogo: { type: "boolean", label: "Con logo", default: true },
    },
    layout: "stretch",
    render: ({ variant, clientName, showLogo }) => <PlaygroundDemo variant={variant as SubNavVariantKey} clientName={clientName} showLogo={showLogo} />,
    code: ({ variant, clientName, showLogo }) => {
      const first = SUB_NAV_VARIANTS[variant].tabs[0].id;
      const attrs = [`variant="${variant}"`, "activeTabId={active}", "onTabChange={setActive}", showLogo ? `clientName="${clientName}"` : "showLogo={false}"];
      return `const [active, setActive] = React.useState("${first}");\n\n<ThemaSubNav\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "learning",
      title: "Módulo de aprendizaje",
      description: "Cinco pestañas con icono; el subrayado se desplaza a la activa. Estado controlado en el padre.",
      layout: "stretch",
      code: `const [active, setActive] = React.useState("home");

<ThemaSubNav variant="aprendizaje" activeTabId={active} onTabChange={setActive} clientName="Acme" />`,
      render: () => <SubNavDemo variant="aprendizaje" clientName="Acme" />,
    },
    {
      id: "no-logo",
      title: "Sin logo",
      description: "Cuando la cabecera de producto ya muestra la marca, la sub-nav prescinde de ella.",
      layout: "stretch",
      code: `<ThemaSubNav variant="reclutamiento" activeTabId={active} onTabChange={setActive} showLogo={false} />`,
      render: () => <SubNavDemo variant="reclutamiento" showLogo={false} />,
    },
    {
      id: "two-tabs",
      title: "Módulo corto",
      description: "El diagnóstico tiene solo dos pestañas; la píldora mantiene su altura y su espaciado.",
      layout: "stretch",
      code: `<ThemaSubNav variant="diagnostico" activeTabId={active} onTabChange={setActive} clientName="Acme" />`,
      render: () => <SubNavDemo variant="diagnostico" clientName="Acme" />,
    },
  ],
  props: [
    { name: "variant", type: "SubNavVariantKey", default: '"template"', description: "Módulo cuyas pestañas se muestran; las claves de `SUB_NAV_VARIANTS` en `@/config/subNavNavigation`." },
    { name: "activeTabId", type: "string", description: "Id de la pestaña activa. Si se omite, se resalta la primera." },
    { name: "onTabChange", type: "(id: string) => void", description: "Se llama al pulsar una pestaña (o una opción del menú en móvil)." },
    { name: "showLogo", type: "boolean", default: "true", description: "Muestra el bloque de marca a la izquierda." },
    { name: "clientName", type: "string", default: '"Client"', description: "Nombre que acompaña al logo." },
    { name: "isSticky", type: "boolean", default: "true", description: "Fija la barra con `sticky top-4` al hacer scroll." },
    { name: "className", type: "string", description: "Clases extra para el <header>." },
  ],
  guidelines: {
    do: ["Añade nuevos módulos en `SUB_NAV_VARIANTS`, no con pestañas inline.", "Sincroniza `activeTabId` con la ruta para que el refresco conserve la pestaña.", "Déjala `sticky` en páginas largas: es el único ancla del módulo."],
    dont: ["No la uses para pestañas dentro de un panel; para eso está `ThemaTabs`.", "No cambies la altura de 40px: está calculada para encajar bajo la cabecera."],
  },
  related: ["thema-product-header", "thema-tabs", "playground-sidebar", "dropdown-menu"],
});
