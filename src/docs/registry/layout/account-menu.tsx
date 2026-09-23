import * as React from "react";
import { Armchair, ConciergeBell, Crown, Scissors, ShieldCheck } from "lucide-react";
import { AccountMenu } from "@/components/app-shell";
import { COMPANIES, COMPANY_MENU_LINKS, CURRENT_USER, USER_ROLES, type Company } from "@/components/app-shell/appShellData";
import type { ShellWorkspaceLabels } from "@/components/app-shell";
import { defineEntry, definePlayground } from "../types";

/**
 * Sucursales: ni logo propio, ni licencias que enseñar. Con nombre de estado
 * a propósito —son los más largos que se van a ver— para que el ejemplo
 * enseñe el peor caso y no uno cómodo.
 */
const BRANCHES: readonly Company[] = [
  { id: "ma", name: "Massachusetts", initial: "MA", meta: "88 Newbury St, Boston · 6 sillas" },
  { id: "nc", name: "North Carolina", initial: "NC", meta: "210 W Trade St, Charlotte · 4 sillas" },
  { id: "ri", name: "Rhode Island", initial: "RI", meta: "134 Thayer St, Providence · 5 sillas" },
];

const BRANCH_LABELS: ShellWorkspaceLabels = {
  entity: "Sucursal",
  change: "Cambiar de sucursal",
  list: "Tus sucursales",
};

const BARBER_ROLES = [
  { id: "owner", label: "Owner", description: "Todas las sucursales y sus números.", icon: Crown },
  { id: "admin", label: "Administrador", description: "Su sucursal: agenda, equipo y caja.", icon: ShieldCheck },
  { id: "recepcion", label: "Recepcionista", description: "La agenda del día y los cobros.", icon: ConciergeBell },
  { id: "barbero-comision", label: "Barbero de comisión", description: "Sus citas y la comisión de cada servicio.", icon: Scissors },
  { id: "barbero-renta", label: "Barbero de renta", description: "Sus citas y la renta de su silla.", icon: Armchair },
] as const;

/** El menú con su estado: sucursal y rol cambian desde el mismo sitio. */
function AccountMenuDemo({
  withUser = true,
  companies = BRANCHES,
  roles = BARBER_ROLES,
  labels = BRANCH_LABELS,
  links = [] as readonly string[],
  showUsage = false,
  withRoles = true,
}: {
  withUser?: boolean;
  companies?: readonly Company[];
  roles?: readonly { id: string; label: string; description: string; icon?: React.ComponentType<{ className?: string }> }[];
  labels?: ShellWorkspaceLabels;
  links?: readonly string[];
  showUsage?: boolean;
  withRoles?: boolean;
}) {
  const [companyId, setCompanyId] = React.useState(companies[0].id);
  const [roleId, setRoleId] = React.useState(roles[0].id);
  const [salidas, setSalidas] = React.useState(0);
  const activeCompany = companies.find((company) => company.id === companyId) ?? companies[0];
  const activeRole = roles.find((role) => role.id === roleId) ?? roles[0];

  return (
    <div className="flex w-full flex-col gap-2">
      {/* La cabecera real lo pone al final de la fila: es la esquina de la cuenta. */}
      <div className="flex h-14 w-full items-center justify-end gap-3 rounded-xl border border-border/60 bg-card px-4">
        <AccountMenu
          user={withUser ? CURRENT_USER : undefined}
          onLogout={withUser ? () => setSalidas((value) => value + 1) : undefined}
          companies={companies}
          activeCompany={activeCompany}
          onSelectCompany={setCompanyId}
          links={links}
          labels={labels}
          showUsage={showUsage}
          roles={withRoles ? roles : undefined}
          activeRole={withRoles ? activeRole : undefined}
          onSelectRole={setRoleId}
        />
      </div>
      <p className="text-[12px] text-text-muted">
        Activo: <span className="font-semibold text-text-primary">{activeCompany.name}</span>
        {withRoles && (
          <>
            {" · "}
            <span className="font-semibold text-text-primary">{activeRole.label}</span>
          </>
        )}
        {withUser && <> · onLogout × {salidas}</>}
      </p>
    </div>
  );
}

export const accountMenuEntry = defineEntry({
  id: "account-menu",
  name: "AccountMenu",
  group: "layout",
  description:
    "Quién eres, dónde estás y como quién estás mirando, en una sola puerta al final de la cabecera. Antes eran tres piezas repartidas —el chip de sucursal a la izquierda, el de rol junto al avatar y el avatar con su propio menú— y las tres respondían a la misma pregunta. El disparador lleva borde —se lee como botón, no como firma de la pantalla— y enseña la foto, la sucursal activa y, debajo, el rol en una píldora: el nombre no se escribe porque ya lo dicen la foto y sus iniciales, y dentro está entero con el correo; el menú abre con el nombre y el correo, cambia de sucursal (submenú lateral, pueden ser muchas), cambia de rol (lista directa, son un puñado) y cierra la sesión. Nada más: el tema y el idioma son de la plataforma, no de la cuenta, y viven en «Personalización», colgando de la marca. AppHeader lo monta con los datos de ShellConfig; documéntalo suelto solo para ver sus estados.",
  importPath: 'import { AccountMenu } from "@/components/app-shell"',
  sourcePath: "src/components/app-shell/AccountMenu.tsx",
  status: "stable",
  tags: ["dropdown-menu", "submenu", "shell", "header"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      space: { type: "select", label: "Espacios", options: ["sucursales", "empresas"], default: "sucursales" },
      withUser: { type: "boolean", label: "Con persona", default: true },
      withRoles: { type: "boolean", label: "Con rol", default: true },
      showUsage: { type: "boolean", label: "Con consumo", default: false },
    },
    render: ({ space, withUser, withRoles, showUsage }) => (
      <AccountMenuDemo
        key={`${space}-${withUser}-${withRoles}-${showUsage}`}
        withUser={withUser}
        companies={space === "empresas" ? COMPANIES : BRANCHES}
        labels={space === "empresas" ? undefined : BRANCH_LABELS}
        links={space === "empresas" ? COMPANY_MENU_LINKS : []}
        roles={space === "empresas" ? USER_ROLES : BARBER_ROLES}
        withRoles={withRoles}
        showUsage={showUsage}
      />
    ),
    code: ({ space, withUser, withRoles, showUsage }) => `<AccountMenu${withUser ? "\n  user={user}\n  onLogout={logout}" : ""}
  companies={${space === "empresas" ? "COMPANIES" : "BRANCHES"}}
  activeCompany={activeCompany}
  onSelectCompany={setCompanyId}${showUsage ? "" : "\n  showUsage={false}"}${space === "empresas" ? "\n  links={COMPANY_MENU_LINKS}" : '\n  labels={{ entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" }}'}${
      withRoles
        ? `
  roles={ROLES}
  activeRole={activeRole}
  onSelectRole={setRoleId}`
        : ""
    }
/>`,
  }),
  examples: [
    {
      id: "default",
      title: "La cuenta y su contexto",
      description:
        "Ábrelo: arriba la persona con su correo, después la sucursal activa con su submenú de cambio, los roles como grupo de opciones y, al final, cerrar sesión. Todo lo que se puede cambiar sobre «quién y dónde» está en esta lista y en ninguna otra.",
      layout: "stretch",
      code: `<AccountMenu
  user={user}
  onLogout={logout}
  companies={BRANCHES}
  activeCompany={activeBranch}
  onSelectCompany={setBranchId}
  showUsage={false}
  labels={{ entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" }}
  roles={ROLES}
  activeRole={activeRole}
  onSelectRole={setRoleId}
/>`,
      render: () => <AccountMenuDemo />,
    },
    {
      id: "sin-rol",
      title: "Sin rol que asumir",
      description:
        "Con un solo rol —o con `chrome.role: false` en el shell— la segunda línea se queda en la sucursal y el menú no muestra la lista: no hay nada que elegir.",
      layout: "stretch",
      code: `<AccountMenu user={user} onLogout={logout} companies={BRANCHES} activeCompany={activeBranch} onSelectCompany={setBranchId} />`,
      render: () => <AccountMenuDemo withRoles={false} />,
    },
    {
      id: "sin-persona",
      title: "Solo contexto",
      description:
        "Sin `user` (p. ej. `chrome.profile: false`) la foto la sustituye la marca del espacio y el chip dice lo mismo. Sin `onLogout` no hay salida que ofrecer.",
      layout: "stretch",
      code: `<AccountMenu companies={BRANCHES} activeCompany={activeBranch} onSelectCompany={setBranchId} roles={ROLES} activeRole={activeRole} onSelectRole={setRoleId} />`,
      render: () => <AccountMenuDemo withUser={false} />,
    },
    {
      id: "empresas",
      title: "Empresas con consumo",
      description:
        "El mismo componente en un SaaS multiempresa: `labels` se lee «Empresa», `links` trae los atajos de administración y `showUsage` enseña licencias y créditos como anillos de proporción.",
      layout: "stretch",
      code: `<AccountMenu
  user={user}
  onLogout={logout}
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setCompanyId}
  links={COMPANY_MENU_LINKS}
  roles={USER_ROLES}
  activeRole={activeRole}
  onSelectRole={setRoleId}
/>`,
      render: () => (
        <AccountMenuDemo companies={COMPANIES} labels={undefined} links={COMPANY_MENU_LINKS} roles={USER_ROLES} showUsage />
      ),
    },
  ],
  props: [
    { name: "user", type: "ShellUser", description: "La persona conectada: su foto (o iniciales) en el chip, su nombre y su correo dentro. Sin espacio activo, el nombre sube al chip." },
    { name: "onLogout", type: "() => void", description: "Cerrar sesión, al final del menú. Sin él, el menú no ofrece salir." },
    { name: "companies", type: "readonly Company[]", description: "Todos los espacios de la persona; alimentan el submenú de cambio." },
    { name: "activeCompany", type: "Company", description: "El espacio activo: lo que se lee en el chip y la fila que abre el cambio. `meta` es su línea descriptiva; `licenses` y `credits` son pares `[usado, total]`." },
    { name: "onSelectCompany", type: "(id: string) => void", description: "Al elegir otro espacio. La app decide qué recarga." },
    { name: "roles", type: "readonly UserRoleOption[]", description: "Los roles que se pueden asumir. Con menos de dos no hay lista que mostrar. Cada uno puede traer `icon` (un componente de icono) para reconocerlo sin leer; el shell no sabe qué roles existen en cada producto." },
    { name: "activeRole", type: "UserRoleOption", description: "El rol activo: la píldora bajo el nombre del espacio y la opción marcada de la lista." },
    { name: "onSelectRole", type: "(id: string) => void", description: "Al asumir otro rol. No es cambiar de cuenta: la sesión sigue siendo la misma." },
    { name: "links", type: "readonly string[]", default: "[]", description: "Enlaces de administración del espacio, entre su identidad y el cambio." },
    { name: "linkIcons", type: "readonly React.ComponentType<{ className?: string }>[]", description: "Iconos opcionales para `links`, en el mismo orden." },
    { name: "labels", type: "ShellWorkspaceLabels", default: "Empresa", description: "Cómo se lee el espacio: `entity`, `change` y `list`." },
    { name: "showUsage", type: "boolean", default: "true", description: "Los anillos de licencias y créditos. Apagado, el menú es identidad y cambios." },
  ],
  guidelines: {
    do: [
      "Deja que AppHeader lo monte con `user`, `companies`, `roles` y `workspaceLabels` de ShellConfig: así la esquina dice lo mismo en toda la aplicación.",
      "Mantén juntas las tres respuestas —quién, dónde y como quién—: repartidas por la cabecera obligaban a cruzar la pantalla para cambiar de contexto.",
      "Reacciona en `onSelectCompany` y `onSelectRole`: el menú solo mueve la marca, la navegación y los permisos son de la app.",
    ],
    dont: [
      "No metas aquí el tema ni el idioma: son de la plataforma, no de la cuenta, y viven en «Personalización» (menú de la marca).",
      "No añadas los ajustes del negocio: esos están en `WorkspaceMenu` y en su propia pantalla.",
      "No uses el cambio de rol como cambio de cuenta: la sesión no cambia, solo la vista.",
    ],
  },
  related: ["app-header", "company-menu", "admin-shell", "workspace-menu"],
});
