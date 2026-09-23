import * as React from "react";
import { Check, ChevronRight, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCompactViewport } from "@/components/action-rail/useCompactViewport";
import { useT } from "@/i18n";
import { SHELL_MENU_PANEL } from "./shellPanel";
import { HeaderChip } from "./HeaderChip";
import { IconTile } from "@/components/utility";
import type { UserRoleOption } from "./appShellData";

export interface RoleMenuProps {
  roles: readonly UserRoleOption[];
  activeRole: UserRoleOption;
  onSelectRole: (id: string) => void;
  /** Cierra el menú de perfil entero: elegir rol termina la interacción. */
  onDone?: () => void;
  /**
   * Cómo se abre. `row` es la fila dentro del menú de perfil; `chip` es el
   * disparador propio de la cabecera, que además enseña el rol activo sin
   * abrir nada.
   */
  trigger?: "row" | "chip";
  /** La fila hereda la entrada escalonada del menú que la contiene. */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Cambiar de rol desde el menú de perfil. Igual que cambiar de empresa en el
 * sidebar, la lista se abre **al lado** y no sustituye al menú: quien
 * administra está mirando su propia cuenta y no debería perder de vista dónde
 * estaba para asomarse a la vista de un líder o de un colaborador. En pantalla
 * estrecha, donde no cabe al lado, cuelga del propio ítem.
 */
export function RoleMenu({ roles, activeRole, onSelectRole, onDone, trigger = "row", className, style }: RoleMenuProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  // Al lado solo cuando cabe: por debajo de `lg` no hay 250px libres a la
  // izquierda del menú de perfil y la lista se saldría de la pantalla, así que
  // cuelga del propio ítem.
  const isCompact = useCompactViewport();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger === "chip" ? (
          <HeaderChip
            data-testid="role-switch"
            aria-expanded={open}
            leading={<IconTile icon={<UserCog />} tone="info" size="sm" />}
            value={activeRole.label}
            srLabel={`${t("shell.role")}: ${activeRole.label}`}
            open={open}
            className={className}
            style={style}
          />
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${t("shell.changeRole")}: ${activeRole.label}`}
            data-testid="role-switch"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
              open && "bg-background text-text-primary",
              className
            )}
            style={style}
          >
            <UserCog className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
            <span className="flex-1 text-left">{t("shell.changeRole")}</span>
            <ChevronRight
              className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform duration-200", open && "translate-x-0.5")}
              strokeWidth={2}
            />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        side={trigger === "chip" ? "bottom" : isCompact ? "bottom" : "left"}
        align={trigger === "chip" ? "start" : isCompact ? "end" : "start"}
        sideOffset={trigger === "chip" ? 8 : isCompact ? 6 : 10}
        collisionPadding={12}
        className={cn("w-[252px] gap-0", SHELL_MENU_PANEL)}
      >
        <p className="px-3 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
          {t("shell.viewAs")}
        </p>
        <div role="radiogroup" aria-label={t("shell.activeRole")} className="flex flex-col">
          {roles.map((role) => {
            const isActive = role.id === activeRole.id;
            return (
              <button
                key={role.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  if (!isActive) onSelectRole(role.id);
                  setOpen(false);
                  onDone?.();
                }}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive ? "bg-primary/[0.07]" : "hover:bg-background"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[13px]",
                      isActive ? "font-bold text-text-primary" : "font-semibold text-text-secondary"
                    )}
                  >
                    {role.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">{role.description}</span>
                </span>
                {isActive && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
