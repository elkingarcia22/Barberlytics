import * as React from "react";
import { Building2, Network, Palette, ShieldCheck, Users } from "lucide-react";
import { CompanyMark, CompanyMenu } from "@/components/app-shell/CompanyMenu";
import { COMPANIES, COMPANY_MENU_LINKS, type Company } from "@/components/app-shell/appShellData";
import type { ShellWorkspaceLabels } from "@/components/app-shell";
import { defineEntry, definePlayground } from "../types";

const COMPANY_IDS = COMPANIES.map((company) => company.id);
const LINK_ICONS = [Users, Palette, Network, Building2, ShieldCheck] as const;

/** Una columna de 240px, el ancho del panel del sidebar donde vive el menú. */
function SidebarColumn({ children }: { children: React.ReactNode }) {
  return <div className="w-60 rounded-2xl border border-border/60 bg-surface p-3 pt-4">{children}</div>;
}

/** El menú con su estado: la empresa activa cambia desde el submenú. */
function CompanyMenuDemo({
  initialCompanyId = COMPANIES[0].id,
  companies = COMPANIES,
  withIcons = false,
  placement = "sidebar",
  links = COMPANY_MENU_LINKS,
  labels,
  showUsage = true,
}: {
  initialCompanyId?: string;
  companies?: readonly Company[];
  withIcons?: boolean;
  placement?: "sidebar" | "header";
  links?: readonly string[];
  labels?: ShellWorkspaceLabels;
  showUsage?: boolean;
}) {
  const [activeId, setActiveId] = React.useState(initialCompanyId);
  const activeCompany = companies.find((company) => company.id === activeId) ?? companies[0];
  const menu = (
    <CompanyMenu
      placement={placement}
      companies={companies}
      activeCompany={activeCompany}
      onSelectCompany={setActiveId}
      links={links}
      labels={labels}
      showUsage={showUsage}
      linkIcons={withIcons ? LINK_ICONS : undefined}
    />
  );

  if (placement === "header") {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex h-14 w-full items-center gap-3 rounded-xl border border-border/60 bg-card px-4">{menu}</div>
        <p className="text-[12px] text-text-muted">
          Activa: <span className="font-semibold text-text-primary">{activeCompany.name}</span>
        </p>
      </div>
    );
  }

  return (
    <SidebarColumn>
      {menu}
      <p className="px-1.5 text-[12px] text-text-muted">
        Activa: <span className="font-semibold text-text-primary">{activeCompany.name}</span>
      </p>
    </SidebarColumn>
  );
}

/** Sucursales: ni logo propio, ni licencias que enseñar. */
const BRANCHES: readonly Company[] = [
  { id: "centro", name: "Centro", initial: "C", meta: "Calle 10 n.º 5-20 · 6 sillas" },
  { id: "norte", name: "Norte", initial: "N", meta: "Cra. 45 n.º 100-12 · 4 sillas" },
];

const BRANCH_LABELS: ShellWorkspaceLabels = {
  entity: "Sucursal",
  change: "Cambiar de sucursal",
  list: "Tus sucursales",
};

export const companyMenuEntry = defineEntry({
  id: "company-menu",
  name: "CompanyMenu",
  group: "layout",
  description:
    "El espacio de trabajo activo y su cambio. En la cabecera de la aplicación (`placement=\"header\"`) es un `HeaderChip`: una sola línea con la marca y el nombre, sin rótulo apretado encima — el tipo («Sucursal») se lee dentro, en la cabecera del menú que abre, donde sí hay sitio para la frase completa. El menú trae el consumo de licencias y créditos como anillos de proporción —apagable con `showUsage` para un producto que no las vende—, los enlaces de administración y un submenú lateral para cambiar. `labels` decide cómo se lee: empresa, sucursal o sede. La cabecera de la aplicación ya no lo monta: ahí el espacio activo va con la persona y el rol en la misma puerta (ver `AccountMenu`). Este queda para el espacio activo a solas —un sidebar, un producto sin cuenta ni roles que asumir—.",
  importPath: 'import { CompanyMenu, CompanyMark } from "@/components/app-shell/CompanyMenu"',
  sourcePath: "src/components/app-shell/CompanyMenu.tsx",
  status: "stable",
  tags: ["dropdown-menu", "submenu", "shell"],
  playground: definePlayground({
    controls: {
      company: { type: "select", label: "Empresa activa", options: COMPANY_IDS, default: COMPANY_IDS[0] },
      placement: { type: "select", label: "Dónde vive", options: ["sidebar", "header"], default: "header" },
      withIcons: { type: "boolean", label: "Iconos en los enlaces", default: false },
      showUsage: { type: "boolean", label: "Con consumo", default: true },
    },
    render: ({ company, placement, withIcons, showUsage }) => (
      <CompanyMenuDemo
        key={`${company}-${placement}-${withIcons}-${showUsage}`}
        initialCompanyId={company}
        placement={placement as "sidebar" | "header"}
        withIcons={withIcons}
        showUsage={showUsage}
      />
    ),
    code: ({ company, placement, withIcons, showUsage }) => `const [activeId, setActiveId] = React.useState("${company}");
const activeCompany = COMPANIES.find((c) => c.id === activeId)!;

<CompanyMenu
  placement="${placement}"${showUsage ? "" : "\n  showUsage={false}"}
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setActiveId}
  links={COMPANY_MENU_LINKS}${withIcons ? "\n  linkIcons={[Users, Palette, Network, Building2, ShieldCheck]}" : ""}
/>`,
  }),
  examples: [
    {
      id: "default",
      title: "Menú y cambio de empresa",
      description:
        "Abre el menú y pasa por «Cambiar de empresa»: el submenú sale al lado, marca la activa con un check y muestra plan y personas de cada una. Elegir otra dispara `onSelectCompany` y cierra todo.",
      code: `const [activeId, setActiveId] = React.useState(COMPANIES[0].id);
const activeCompany = COMPANIES.find((c) => c.id === activeId) ?? COMPANIES[0];

<CompanyMenu
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setActiveId}
  links={COMPANY_MENU_LINKS}
/>`,
      render: () => <CompanyMenuDemo />,
    },
    {
      id: "branches",
      title: "Sucursales en la cabecera",
      description:
        "El mismo componente para un negocio con locales: `labels` cambia cómo se lee, `showUsage={false}` quita las licencias que aquí no existen y `links={[]}` deja el menú en identidad y cambio, porque la administración vive en el menú de configuración. La línea bajo el nombre sale de `company.meta`.",
      code: `<CompanyMenu
  placement="header"
  companies={BRANCHES}
  activeCompany={activeBranch}
  onSelectCompany={setBranchId}
  links={[]}
  showUsage={false}
  labels={{ entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" }}
/>`,
      layout: "stretch",
      render: () => (
        <CompanyMenuDemo
          placement="header"
          companies={BRANCHES}
          initialCompanyId={BRANCHES[0].id}
          links={[]}
          labels={BRANCH_LABELS}
          showUsage={false}
        />
      ),
    },
    {
      id: "link-icons",
      title: "Enlaces con icono",
      description: "`linkIcons` va en el mismo orden que `links`; los que falten se pintan sin icono.",
      code: `<CompanyMenu
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setActiveId}
  links={["Gestión de usuarios", "Personalización", "Organigrama", "Datos de empresa", "Roles y permisos"]}
  linkIcons={[Users, Palette, Network, Building2, ShieldCheck]}
/>`,
      render: () => <CompanyMenuDemo withIcons />,
    },
    {
      id: "single-company",
      title: "Una sola empresa",
      description: "Con una empresa el submenú sigue existiendo, pero lista solo la activa. Si el producto no tiene multiempresa, apaga `chrome.company` en ShellConfig en vez de ocultar esto.",
      code: `<CompanyMenu companies={[COMPANIES[1]]} activeCompany={COMPANIES[1]} onSelectCompany={() => undefined} links={COMPANY_MENU_LINKS} />`,
      render: () => <CompanyMenuDemo companies={[COMPANIES[1]]} initialCompanyId={COMPANIES[1].id} />,
    },
    {
      id: "company-mark",
      title: "CompanyMark",
      description: "La marca cuadrada que usa el menú y el rail plegado: inicial sobre el color de la empresa, o el logo de Google cuando `isGoogle`. Dos tallas: `md` (32px) y `sm` (24px).",
      code: `<CompanyMark company={COMPANIES[0]} />
<CompanyMark company={COMPANIES[1]} />
<CompanyMark company={COMPANIES[2]} size="sm" />`,
      render: () => (
        <div className="flex items-center gap-3">
          {COMPANIES.map((company) => (
            <CompanyMark key={company.id} company={company} />
          ))}
          <span className="mx-1 h-6 border-l border-border/60" aria-hidden />
          {COMPANIES.map((company) => (
            <CompanyMark key={`${company.id}-sm`} company={company} size="sm" />
          ))}
        </div>
      ),
    },
  ],
  props: [
    { name: "companies", type: "readonly Company[]", description: "Todas las empresas de la persona; alimentan el submenú «Cambiar de empresa»." },
    { name: "activeCompany", type: "Company", description: "El espacio mostrado en el disparador y en la cabecera del menú. `licenses` y `credits` son pares `[usado, total]` opcionales; `meta` es la línea que se lee bajo el nombre." },
    { name: "onSelectCompany", type: "(id: string) => void", description: "Al elegir otra empresa en el submenú." },
    { name: "links", type: "readonly string[]", description: "Etiquetas de los enlaces de administración, entre el consumo y el cambio de empresa." },
    { name: "linkIcons", type: "readonly React.ComponentType<{ className?: string }>[]", description: "Iconos opcionales para `links`, en el mismo orden." },
    { name: "placement", type: '"sidebar" | "header"', default: '"sidebar"', description: "Dónde vive el disparador: la fila ancha del sidebar o el chip compacto de la cabecera de la aplicación." },
    { name: "labels", type: "ShellWorkspaceLabels", default: "Empresa", description: "Cómo se lee el espacio: `entity`, `change` y `list`." },
    { name: "showUsage", type: "boolean", default: "true", description: "Los anillos de licencias y créditos. Apagado (o sin esos datos en la empresa), el menú es identidad y cambio." },
    { name: "CompanyMark", type: "{ company: Company; size?: \"sm\" | \"md\" }", description: "Export secundario: la marca cuadrada de una empresa, reutilizada por el rail plegado." },
  ],
  guidelines: {
    do: [
      "Deja que AppHeader lo monte con `companies` y `companyMenuLinks` de ShellConfig; los enlaces y los rótulos se personalizan ahí.",
      "Mantén `licenses` y `credits` como pares `[usado, total]`: el anillo calcula el porcentaje por sí solo.",
      "Da a cada empresa un `bg` con contraste suficiente para la inicial en blanco; sin `bg`, la marca usa el color del tema.",
      "Describe cada espacio con `meta` cuando no sean empresas: una sucursal se reconoce por su dirección, no por su plan.",
    ],
    dont: [
      "No conviertas «Cambiar de empresa» en una vista que sustituya al menú: el submenú lateral existe para no perder de vista dónde se estaba.",
      "No añadas más de cinco o seis enlaces; el menú es un atajo, no la navegación de administración.",
      "No dejes el rótulo en «Empresa» si el producto trabaja por sucursales: el chip es lo único que dice en qué contexto ocurre todo lo demás.",
    ],
  },
  related: ["account-menu", "app-sidebar", "sidebar-icon-rail", "admin-shell", "dropdown-menu"],
});
