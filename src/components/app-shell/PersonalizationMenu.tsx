import * as React from "react";
import { ChevronRight, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCompactViewport } from "@/components/action-rail/useCompactViewport";
import { ThemeSelectorPanel, ThemeSwatch, useTheme } from "@/themes";
import { LanguagePickerPanel, useT } from "@/i18n";
import { SHELL_MENU_PANEL } from "./shellPanel";

export interface PersonalizationMenuProps {
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
export function PersonalizationMenu({ className, style }: PersonalizationMenuProps) {
  const t = useT();
  const { preset } = useTheme();
  const [open, setOpen] = React.useState(false);
  const isCompact = useCompactViewport();

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        className={cn("w-[320px] max-h-[75vh] space-y-4 overflow-y-auto p-4", SHELL_MENU_PANEL)}
      >
        {/* Sin «Más ajustes»: radio, densidad y tipografía se eligen una vez
            al montar el negocio, no aquí. Quien las necesite las encuentra en
            el selector completo de Fundamentos › Temas. */}
        <ThemeSelectorPanel advanced={false} />
        <LanguagePickerPanel />
      </PopoverContent>
    </Popover>
  );
}
