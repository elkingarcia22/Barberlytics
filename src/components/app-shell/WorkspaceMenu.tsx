import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SettingsGroup } from "./appShellData";

export interface WorkspaceMenuProps {
  /** El elemento que lo abre: la fila de marca del panel, o su icono en el rail. */
  trigger: React.ReactElement;
  /** Nombre del producto, para encabezar el menú. */
  productName: string;
  tagline?: string;
  groups: readonly SettingsGroup[];
  all?: { label: string; id: string; path?: string };
  onNavigate?: (id: string, path?: string) => void;
  /** Controles que añade la app —tema, idioma— entre la identidad y los ajustes. */
  extra?: React.ReactNode;
  side?: "bottom" | "right";
  align?: "start" | "end";
}

/**
 * El menú que cuelga de la marca del producto: antes eran dos puertas
 * separadas —el engranaje de ajustes en la cabecera y el selector de tema
 * suelto a su lado—, apretadas entre sucursal, buscador y avatar. Aquí es una
 * sola: la identidad, cómo se ve la plataforma (`extra`, que la app llena con
 * su propio `ThemeSelector`/`LanguageSelector`) y los ajustes agrupados. El
 * shell no sabe qué hay dentro de `extra`; solo le da un sitio.
 */
export function WorkspaceMenu({
  trigger,
  productName,
  tagline,
  groups,
  all,
  onNavigate,
  extra,
  side = "bottom",
  align = "start",
}: WorkspaceMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} sideOffset={8} className="max-h-[75vh] w-[280px] overflow-y-auto">
        <div className="px-1.5 pb-2 pt-1">
          <span className="block truncate text-sm font-bold text-text-primary">{productName}</span>
          {tagline && <span className="block truncate text-[11px] text-text-muted">{tagline}</span>}
        </div>

        {extra && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-0.5 px-0.5 py-1">{extra}</div>
          </>
        )}

        {/* Un grupo, una fila: dentro de cada uno hay entre dos y seis ajustes
            y desplegarlos todos de golpe daba una lista de dieciséis que había
            que recorrer con la vista. El submenú los guarda hasta que se sabe
            por dónde se va —el negocio, el cobro, el equipo, la cuenta—. */}
        {/* `DropdownMenuGroup`, no un `<div>`: la animación de entrada en
            cascada anima el `transform` de cada hijo DIRECTO de este panel, y
            con `animation-fill-mode: both` ese transform se queda puesto para
            siempre —de sobra para volver a ese hijo el `offsetParent` de LOS
            SUYOS, en vez del panel. Con un `<div>` de por medio, la píldora de
            `FluidHighlight` (que mide contra el panel) se dibujaba en el sitio
            equivocado en vez de sobre la fila señalada. Un grupo
            (`data-slot="dropdown-menu-group"`) es el caso que ese CSS ya
            contempla: a él no le toca la animación, se la pasa a sus hijos. */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="space-y-0.5">
          {groups.map((group) => (
            <DropdownMenuSub key={group.id}>
              <DropdownMenuSubTrigger>
                {group.icon && <group.icon className="size-4 shrink-0 text-text-muted" strokeWidth={2} />}
                {group.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[240px]">
                {group.items.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className={cn(item.tone === "danger" && "text-destructive focus:text-destructive")}
                    onSelect={() => {
                      setOpen(false);
                      onNavigate?.(item.id, item.path);
                    }}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>

        {all && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="settings-all"
              onSelect={() => {
                setOpen(false);
                onNavigate?.(all.id, all.path);
              }}
            >
              <ArrowRight className="size-4 shrink-0 text-text-muted" />
              {all.label}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
