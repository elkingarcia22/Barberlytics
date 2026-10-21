import * as React from "react";
import { ChevronRight, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCompactViewport } from "@/components/action-rail/useCompactViewport";
import { useActionsPlacement, type ActionsPlacement } from "@/components/action-rail/actionsPlacement";
import { SegmentedGroup } from "@/components/ui/segmented-group";
import { ThemeSelectorPanel, ThemeSwatch, useTheme, type DefaultLogo } from "@/themes";
import { LanguagePickerPanel, useT } from "@/i18n";
import { SHELL_MENU_PANEL } from "./shellPanel";
import { useCloseWorkspaceMenu } from "./workspaceMenuContext";

export interface PersonalizationMenuProps {
  /** El logo de la barbería, para proponer sus colores en el tema «Personalizado». */
  logoSrc?: string | null;
  /** El logo por defecto (colores e IA), para proponerlo cuando no hay uno propio. */
  defaultLogo?: DefaultLogo;
  /** Sección propia del producto arriba del color (p. ej. el logo). Recibe cómo cerrar el panel y el menú de la marca. */
  leading?: (close: () => void) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * «Cómo se ve y en qué idioma»: antes eran dos filas sueltas —tema e
 * idioma— colgando del menú de la marca junto a los ajustes del negocio, cada
 * una con su propio disparador. Aquí es una sola puerta, con la misma pastilla
 * de color del tema activo que ya usa `ThemeSwatch` en el selector completo,
 * así se reconoce sin abrir nada. Abre al lado —como «Cambiar de rol» en el
 * menú de perfil— para no tapar el menú que la contiene; en pantalla
 * estrecha, donde no cabe al lado, cuelga del propio ítem.
 */
export function PersonalizationMenu({ leading, logoSrc, defaultLogo, className, style }: PersonalizationMenuProps) {
  const t = useT();
  const { preset } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [placement, setPlacement] = useActionsPlacement();
  const isCompact = useCompactViewport();
  const closeWorkspaceMenu = useCloseWorkspaceMenu();
  const closeAll = React.useCallback(() => {
    setOpen(false);
    closeWorkspaceMenu();
  }, [closeWorkspaceMenu]);

  return (
    // Modal: mientras está abierto, el resto del menú de la marca no reacciona al cursor (antes
    // «Cuenta» o «Negocio» abrían su submenú encima) y solo un clic afuera lo cierra.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${t("shell.personalization")}: ${preset.name}`}
          data-testid="personalization-switch"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
            open && "bg-background text-text-primary",
            className
          )}
          style={style}
        >
          <Palette className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
          <span className="flex-1 text-left">{t("shell.personalization")}</span>
          <ThemeSwatch preset={preset} className="size-3.5" />
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform duration-200", open && "translate-x-0.5")}
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={isCompact ? "bottom" : "left"}
        align={isCompact ? "end" : "start"}
        sideOffset={isCompact ? 6 : 10}
        collisionPadding={12}
        // El panel común va primero: su `p-2` pisaba el relleno y el contenido rozaba las esquinas redondeadas.
        className={cn(SHELL_MENU_PANEL, "w-[340px] max-h-[75vh] space-y-4 overflow-y-auto p-5")}
        // Se abre con clic y se cierra con clic afuera. Al pasar el cursor por las otras filas del menú
        // de la marca, ese menú les da el foco; sin esto el panel lo tomaba por un clic afuera y se cerraba.
        onFocusOutside={(event) => event.preventDefault()}
      >
        {/* Sin «Más ajustes»: radio, densidad y tipografía se eligen una vez
            al montar el negocio, no aquí. Quien las necesite las encuentra en
            el selector completo de Fundamentos › Temas. */}
        {leading?.(closeAll)}
        <ThemeSelectorPanel
          advanced={false}
          logoSrc={logoSrc}
          defaultLogo={defaultLogo}
        />
        <LanguagePickerPanel />
        {/* Mismo ajuste que Modo e Idioma: etiqueta del marco y el segmentado del sistema. */}
        <SegmentedGroup<ActionsPlacement>
          data-testid="actions-placement"
          label={t("shell.actionsPlacement")}
          options={[
            { id: "rail", label: t("shell.actionsPlacement.rail") },
            { id: "inline", label: t("shell.actionsPlacement.inline") },
          ]}
          value={placement}
          onChange={setPlacement}
          hint={t(placement === "rail" ? "shell.actionsPlacement.railHint" : "shell.actionsPlacement.inlineHint")}
        />

      </PopoverContent>
    </Popover>
  );
}
