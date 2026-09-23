import * as React from "react";
import { Check, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n";
import { IconTile } from "@/components/utility";
import { CompanyMark } from "./CompanyMenu";
import { companyMeta, WorkspaceUsage } from "./workspaceUsage";
import { DEFAULT_WORKSPACE_LABELS, userInitials, type ShellUser, type ShellWorkspaceLabels } from "./shellConfig";
import type { Company, UserRoleOption } from "./appShellData";

export interface AccountMenuProps {
  /** La persona conectada. Sin ella, el chip es solo contexto. */
  user?: ShellUser;
  /** Cierre de sesión. Sin él, el menú no ofrece salir. */
  onLogout?: () => void;
  /** Los espacios entre los que se cambia. Vacío, no hay espacio que mostrar. */
  companies?: readonly Company[];
  activeCompany?: Company;
  onSelectCompany?: (id: string) => void;
  /** Enlaces de administración del espacio, bajo su identidad. */
  links?: readonly string[];
  /** Iconos opcionales por enlace, en el mismo orden. */
  linkIcons?: readonly React.ComponentType<{ className?: string }>[];
  /** Cómo se lee el espacio activo en este producto: empresa, sucursal, sede. */
  labels?: ShellWorkspaceLabels;
  /** Consumo de licencias y créditos del espacio activo. */
  showUsage?: boolean;
  /** Roles que la persona puede asumir. Con menos de dos no hay nada que elegir. */
  roles?: readonly UserRoleOption[];
  activeRole?: UserRoleOption;
  onSelectRole?: (id: string) => void;
}

/** La cara de la persona: su foto o, sin ella, sus iniciales sobre el color del tema. */
function Avatar({ user, size }: { user: ShellUser; size: "sm" | "md" }) {
  const box = size === "md" ? "h-9 w-9 text-xs" : "h-8 w-8 text-[11px]";
  return (
    <span className={cn("shrink-0 overflow-hidden rounded-full border border-border/70", box)}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-primary font-bold text-primary-foreground">
          {userInitials(user.name)}
        </span>
      )}
    </span>
  );
}

/**
 * Quién eres, dónde estás y como quién estás mirando: una sola puerta en la
 * esquina de la cabecera.
 *
 * Antes eran tres cosas repartidas —el chip de sucursal a la izquierda, el de
 * rol junto al avatar y el avatar con su propio menú— y las tres respondían a
 * la misma pregunta: en qué contexto ocurre lo que estoy viendo. Aquí el chip
 * enseña la foto, el nombre y, debajo, «sucursal · rol»; el menú que abre
 * cambia la sucursal, cambia el rol y cierra la sesión, y nada más.
 *
 * Lo que no vive aquí: el tema y el idioma (son de la plataforma, no de la
 * cuenta, y cuelgan de «Personalización», en el menú de la marca) ni los
 * ajustes del negocio. Este menú es identidad y contexto.
 */
export function AccountMenu({
  user,
  onLogout,
  companies = [],
  activeCompany,
  onSelectCompany,
  links = [],
  linkIcons,
  labels = DEFAULT_WORKSPACE_LABELS,
  showUsage = true,
  roles,
  activeRole,
  onSelectRole,
}: AccountMenuProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);

  const withCompany = Boolean(activeCompany && companies.length > 0);
  const withRoles = Boolean(roles && roles.length > 1 && activeRole);
  // Qué se lee en el chip: el contexto, no la identidad. El nombre de la
  // persona ya lo dice su foto (o sus iniciales), así que el sitio de honor es
  // para lo que cambia de una pantalla a otra —dónde estás y como quién—; el
  // nombre y el correo se leen dentro, al abrir. Sin espacio activo, el nombre
  // vuelve a la primera línea: es lo único que queda por decir.
  const title = withCompany ? activeCompany!.name : user?.name;
  const roleLabel = withRoles ? activeRole!.label : null;
  const srLabel = [
    user ? `${user.name}, ${user.email}` : null,
    withCompany ? `${labels.entity}: ${activeCompany!.name}` : null,
    withRoles ? `${t("shell.role")}: ${activeRole!.label}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="shell-avatar"
          aria-label={srLabel}
          title={srLabel}
          className={cn(
            // El borde es lo que dice «esto se pulsa»: sin él el chip se leía
            // como la firma de la pantalla y nadie lo tocaba.
            "flex h-10 max-w-[224px] shrink-0 items-center gap-2 rounded-full border border-border/70 bg-surface py-1 pl-1 pr-2.5 text-left transition-colors",
            "hover:border-border hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            // En móvil el chip es el mismo —cara, contexto y rol— y solo
            // cede ancho: nunca pasa del 40% de la fila, así que su texto se
            // recorta y el título de la pantalla conserva su hueco. Antes se
            // quedaba en la cara sola y dónde estabas dejaba de leerse justo
            // donde más cuesta saberlo.
            "max-md:max-w-[40vw] max-md:pr-2",
            open && "border-border bg-surface-muted"
          )}
        >
          {user ? <Avatar user={user} size="sm" /> : activeCompany && <CompanyMark company={activeCompany} size="sm" />}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            {/* Un punto por debajo del cuerpo del sistema: el nombre de la
                sucursal es contexto, no el título de la pantalla, y a 13px
                pesaba más que lo que se está mirando. */}
            <span className="truncate text-[12px] font-semibold leading-tight text-text-primary">{title}</span>
            {roleLabel && (
              // El rol como píldora y no como más texto gris: es lo que decide
              // qué se ve y qué se puede hacer, así que no se confunde con el
              // nombre del sitio donde ocurre.
              <span className="flex min-w-0">
                <span className="inline-flex h-4 min-w-0 items-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold leading-none text-primary">
                  <span className="truncate">{roleLabel}</span>
                </span>
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-text-muted transition-transform duration-200",
              open && "rotate-180"
            )}
            strokeWidth={2.5}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-[300px]">
        {user && (
          // La persona, en su propia tarjeta: el nombre y el correo no son
          // opciones del menú, son de quién es este menú.
          <div className="mb-1 flex items-center gap-2.5 rounded-lg bg-surface-muted/60 px-2.5 py-2.5">
            <Avatar user={user} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-text-primary">{user.name}</span>
              <span className="block truncate text-[11px] leading-tight text-text-muted">{user.email}</span>
            </span>
          </div>
        )}

        {withCompany && (
          <>
            <DropdownMenuLabel className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {labels.entity}
            </DropdownMenuLabel>

            {/* La identidad del espacio y su cambio son la misma fila: dice
                dónde estás y, al pasar por encima, abre al lado la lista para
                irte a otra parte. Antes eran un bloque muerto y un ítem más. */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger data-testid="company-switch" className="gap-2.5 py-2" aria-label={labels.change}>
                <CompanyMark company={activeCompany!} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-text-primary">{activeCompany!.name}</span>
                  {companyMeta(activeCompany!) && (
                    <span className="block truncate text-[11px] tabular-nums text-text-muted">
                      {companyMeta(activeCompany!)}
                    </span>
                  )}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[272px]">
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                  {labels.list}
                  <span className="text-[11px] font-semibold tabular-nums text-text-muted">{companies.length}</span>
                </DropdownMenuLabel>
                {companies.map((company) => {
                  const isActive = company.id === activeCompany!.id;
                  return (
                    <DropdownMenuItem
                      key={company.id}
                      onSelect={() => {
                        onSelectCompany?.(company.id);
                        setOpen(false);
                      }}
                      className={cn("gap-2.5 py-2", isActive && "bg-primary/[0.07]")}
                    >
                      <CompanyMark company={company} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[13px]",
                            isActive ? "font-semibold text-text-primary" : "font-medium"
                          )}
                        >
                          {company.name}
                        </span>
                        <span className="block truncate text-[11px] tabular-nums text-text-muted">
                          {company.plan ? `${company.plan} · ` : ""}
                          {companyMeta(company)}
                        </span>
                      </span>
                      {isActive && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <WorkspaceUsage company={activeCompany!} enabled={showUsage} />

            {links.map((label, index) => {
              const Icon = linkIcons?.[index];
              return (
                <DropdownMenuItem key={label} onSelect={() => setOpen(false)}>
                  {Icon && <Icon className="size-4 shrink-0 text-text-muted" />}
                  {label}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {withRoles && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {t("shell.viewAs")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={activeRole!.id}
              onValueChange={(id) => {
                if (id !== activeRole!.id) onSelectRole?.(id);
                setOpen(false);
              }}
              data-testid="role-switch"
            >
              {roles!.map((role) => {
                const isActive = role.id === activeRole!.id;
                const Icon = role.icon;
                return (
                  <DropdownMenuRadioItem
                    key={role.id}
                    value={role.id}
                    className={cn("gap-2.5 py-2 pl-2", isActive && "bg-primary/[0.07]")}
                  >
                    {Icon && (
                      <IconTile
                        icon={<Icon />}
                        tone={isActive ? "primary" : "neutral"}
                        size="sm"
                        shape="circle"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[13px] leading-tight",
                          isActive ? "font-bold text-text-primary" : "font-semibold text-text-secondary"
                        )}
                      >
                        {role.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] leading-tight text-text-muted">
                        {role.description}
                      </span>
                    </span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </>
        )}

        {onLogout && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="shell-logout"
              onSelect={() => {
                setOpen(false);
                onLogout();
              }}
              className="font-semibold"
            >
              <LogOut className="size-4 shrink-0" strokeWidth={2} />
              {t("shell.logout")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
