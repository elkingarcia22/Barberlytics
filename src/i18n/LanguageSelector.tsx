import * as React from "react";
import { Check, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SegmentedGroup } from "@/components/ui/segmented-group";
import { useLocale } from "./localeContext";
import type { LocaleId } from "./locales";

export interface LanguageSelectorProps {
  className?: string;
  /** Solo el icono, para cabeceras apretadas. Por defecto muestra el idioma. */
  compact?: boolean;
  /**
   * Los idiomas que se ofrecen, si no son todos los del sistema: una
   * superficie cuyo contenido solo existe en algunos idiomas (el centro de
   * ayuda) no ofrece uno en el que se vería a medias.
   */
  only?: readonly LocaleId[];
}

/**
 * La lista de idiomas sola, sin disparador ni encabezado propios: la
 * comparten `LanguageSelector` (que la envuelve en su Popover de siempre) y
 * cualquier menú que quiera empotrarla, como el «Personalización» combinado
 * del shell. Cada idioma se ofrece escrito en su propio idioma —"Français",
 * no "Francés"— porque quien lo busca lo reconoce así, no traducido al que
 * no entiende.
 */
function LocaleRadioList({ only }: { only?: readonly LocaleId[] }) {
  const { locale, setLocale, locales: all, t } = useLocale();
  const locales = only ? all.filter((option) => only.includes(option.id)) : all;

  return (
    <div role="radiogroup" aria-label={t("language.label")} className="flex flex-col">
      {locales.map((option) => {
        const isActive = option.id === locale;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setLocale(option.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              isActive ? "bg-primary/[0.07] font-semibold text-text-primary" : "font-medium text-text-secondary hover:bg-background hover:text-text-primary"
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-[10px] font-bold uppercase text-text-secondary">
              {option.id}
            </span>
            <span className="min-w-0 flex-1 truncate">{option.nativeName}</span>
            {isActive && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * El cuerpo del selector de idioma, sin Popover: la versión que se empotra
 * dentro de otro menú (el «Personalización» combinado). Con solo un puñado
 * de idiomas, una fila de opciones —el mismo `SegmentedGroup` que ahí usan
 * Modo, Radio y Densidad— se lee de un vistazo; la lista vertical de
 * `LanguageSelector` tiene sentido cuando el idioma es lo único que se está
 * eligiendo, no aquí, donde es la mitad de un menú más corto.
 */
export function LanguagePickerPanel({ className }: { className?: string }) {
  const { locale, setLocale, locales, t } = useLocale();
  return (
    <SegmentedGroup
      label={t("language.label")}
      value={locale}
      onChange={setLocale}
      options={locales.map((option) => ({ id: option.id, label: option.nativeName }))}
      className={className}
    />
  );
}

/**
 * El interruptor de idioma del sistema, hermano de `ThemeSelector`: se monta
 * una vez en la cabecera y toda la interfaz lo sigue.
 */
export function LanguageSelector({ className, compact = false, only }: LanguageSelectorProps) {
  const { current, t } = useLocale();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "default"}
          className={cn("gap-inline", className)}
          aria-label={t("language.change")}
          title={t("language.change")}
        >
          <Languages className="size-4" />
          {!compact && <span className="text-xs font-semibold uppercase">{current.id}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[248px] gap-0 rounded-2xl p-2">
        <div className="px-2 pb-2 pt-1">
          <p className="text-sm font-semibold text-text-primary">{t("language.label")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t("language.description")}</p>
        </div>
        <LocaleRadioList only={only} />
      </PopoverContent>
    </Popover>
  );
}
