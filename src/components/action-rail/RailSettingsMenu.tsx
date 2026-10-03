import * as React from "react";
import { Check, LayoutPanelTop, Minimize2, PanelBottom, PanelBottomDashed, PanelRight, Pin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActionsPlacement } from "./actionsPlacement";
import { useRailAutoHide } from "./railAutoHide";
import { useRailOrientation, useRailPopoutSide, type RailOrientation } from "./railOrientation";

/**
 * The bar's own preferences — how it behaves and which way it lies — behind a
 * single button.
 *
 * They are grouped rather than sitting loose on the rail because they are not
 * actions on the screen's content: nothing here touches a survey or a
 * demographic. Keeping them together also stops the rail from spending two of
 * its scarce icon slots on settings, and gives each choice room for a label,
 * which a lone pin icon never had.
 */
export function RailSettingsMenu() {
  const [autoHide, setAutoHide] = useRailAutoHide();
  const [orientation, setOrientation] = useRailOrientation();
  const [placement, setPlacement] = useActionsPlacement();
  const [open, setOpen] = React.useState(false);
  const side = useRailPopoutSide();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Ajustes de la barra"
              className={cn(
                "dock-item relative flex h-10 w-10 items-center justify-center rounded-xl text-nav-foreground/60 transition-colors hover:bg-nav-foreground/10 hover:text-nav-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-foreground/30",
                open && "bg-nav-foreground/10 text-nav-foreground"
              )}
            >
              <Settings className="h-[20px] w-[20px]" strokeWidth={2} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side={side}>Ajustes de la barra</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="center"
        side={side}
        sideOffset={16}
        collisionPadding={16}
        className="w-[240px] rounded-2xl border-primary/15 bg-surface-nav p-2 text-nav-foreground/60 shadow-rail"
      >
        <SettingGroup label="Orientación">
          <ChoiceRow
            icon={<PanelBottom className="h-[18px] w-[18px]" strokeWidth={2} />}
            label="Horizontal"
            active={orientation === "horizontal"}
            onClick={() => setOrientation("horizontal" satisfies RailOrientation)}
          />
          <ChoiceRow
            icon={<PanelRight className="h-[18px] w-[18px]" strokeWidth={2} />}
            label="Vertical"
            active={orientation === "vertical"}
            onClick={() => setOrientation("vertical" satisfies RailOrientation)}
          />
        </SettingGroup>

        <SettingGroup label="Visibilidad" className="mt-1.5">
          <ChoiceRow
            icon={<Pin className="h-[18px] w-[18px]" strokeWidth={2} />}
            label="Mantener abierta"
            active={!autoHide}
            onClick={() => setAutoHide(false)}
          />
          <ChoiceRow
            icon={<Minimize2 className="h-[18px] w-[18px]" strokeWidth={2} />}
            label="Ocultar sola"
            active={autoHide}
            onClick={() => setAutoHide(true)}
          />
        </SettingGroup>

        {/* Pasarlas a la pantalla apaga esta barra; se vuelve a encender en «Personalización». */}
        <SettingGroup label="Dónde van las acciones" className="mt-1.5">
          <ChoiceRow
            icon={<PanelBottomDashed className="h-[18px] w-[18px]" strokeWidth={2} />}
            label="En esta barra"
            active={placement === "rail"}
            onClick={() => setPlacement("rail")}
          />
          <ChoiceRow
            icon={<LayoutPanelTop className="h-[18px] w-[18px]" strokeWidth={2} />}
            label="En la pantalla"
            active={placement === "inline"}
            onClick={() => {
              setOpen(false);
              setPlacement("inline");
            }}
          />
        </SettingGroup>
      </PopoverContent>
    </Popover>
  );
}

function SettingGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-nav-foreground/35">
        {label}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

/**
 * One option of a two-way choice, on the same row anatomy as the rail's
 * overflow menu — icon tile, then the label — so the two menus that open off
 * this bar read as one list and not as two different widgets.
 *
 * Both options stay listed with the chosen one ticked, rather than a single
 * button that swaps meaning on click: a toggle that shows only the state you
 * are *not* in is the reason the old pin icon needed a tooltip to be readable
 * at all.
 */
function ChoiceRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-foreground/30",
        active ? "bg-nav-foreground/5" : "hover:bg-nav-foreground/5"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-primary/25 text-nav-foreground"
            : "bg-nav-foreground/5 text-nav-foreground/60 group-hover:bg-nav-foreground/10 group-hover:text-nav-foreground"
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "text-[13px] font-semibold tracking-tight",
          active ? "text-nav-foreground" : "text-nav-foreground/70"
        )}
      >
        {label}
      </span>
      {active && <Check className="ml-auto h-4 w-4 shrink-0 text-nav-foreground" strokeWidth={2.5} />}
    </button>
  );
}
