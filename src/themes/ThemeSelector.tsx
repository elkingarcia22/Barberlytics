import * as React from "react";
import { Check, Moon, Monitor, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "./themeContext";
import type { RadiusScale, ThemeMode } from "./buildTokens";
import type { FontOption, HeadingFontId } from "./fonts";
import type { ThemePreset } from "./presets";

const MODES: readonly { id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
];

const RADII: readonly { id: RadiusScale; label: string; px: number }[] = [
  { id: "none", label: "Recto", px: 0 },
  { id: "sm", label: "Suave", px: 6 },
  { id: "md", label: "Normal", px: 10 },
  { id: "lg", label: "Amplio", px: 14 },
];

/** Muestra pequeña de un preset: el primario claro y el oscuro, en diagonal. */
export function ThemeSwatch({ preset, className }: { preset: ThemePreset; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-4 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15", className)}
      style={{
        background: `linear-gradient(135deg, ${preset.primary.light} 50%, ${preset.primary.dark} 50%)`,
      }}
    />
  );
}

function SegmentedGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { id: T; label: string; render?: React.ReactNode }[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</legend>
      <div role="radiogroup" className="grid gap-1 rounded-lg bg-tab-track p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active ? "bg-surface text-text-primary shadow-card" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {option.render}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FontSelect({
  id,
  label,
  value,
  onChange,
  fonts,
  allowSame,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  fonts: readonly FontOption[];
  allowSame?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-text-secondary">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        {/*
          `position="popper"` en vez del `item-aligned` por defecto: solo el
          contenido posicionado por Popper lleva el atributo que globals.css
          usa para forzar `z-index: 9999` en los overlays (línea ~575). Sin
          esto, el listado de fuentes se queda con su z-index base y sale
          detrás del popover "Personalizar tema" que lo contiene.
        */}
        <SelectContent position="popper">
          {allowSame && (
            <SelectItem value="same" className="text-xs">
              Igual que el cuerpo
            </SelectItem>
          )}
          {fonts.map((font) => (
            <SelectItem key={font.id} value={font.id} className="text-xs" style={{ fontFamily: font.family }}>
              {font.name}
              <span className="ml-1.5 text-[10px] text-text-muted">{font.category === "serif" ? "serif" : ""}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface ThemeSelectorProps {
  /** Botón compacto (solo icono) para cabeceras estrechas. */
  compact?: boolean;
  className?: string;
}

/**
 * El selector de tema: paleta de presets, escala de radios y modo. Todo se
 * aplica al instante y queda guardado en localStorage a través del provider.
 */
export function ThemeSelector({ compact = false, className }: ThemeSelectorProps) {
  const { preset, presets, setPreset, mode, setMode, radius, setRadius, font, setFont, headingFont, setHeadingFont, fonts } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size={compact ? "icon" : "default"} className={cn("gap-2", className)} aria-label="Cambiar tema">
          <Palette />
          {!compact && (
            <>
              <span className="hidden sm:inline">{preset.name}</span>
              <ThemeSwatch preset={preset} className="size-3.5" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] space-y-5 rounded-2xl p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">Personalizar tema</p>
          <p className="text-xs text-text-secondary">Los cambios se aplican a toda la interfaz y se recuerdan en este navegador.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Color</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-1.5">
            {presets.map((item) => {
              const active = item.id === preset.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPreset(item.id)}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-lg border px-2.5 text-left text-xs font-medium transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        active
                          ? "border-primary/60 bg-primary/8 text-text-primary"
                          : "border-border/60 bg-surface text-text-secondary hover:border-border-strong/60 hover:text-text-primary"
                      )}
                    >
                      <ThemeSwatch preset={item} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {active && <Check className="size-3.5 text-primary" strokeWidth={2.5} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{item.description}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </fieldset>

        <SegmentedGroup
          label="Radio"
          value={radius}
          onChange={setRadius}
          options={RADII.map((item) => ({
            id: item.id,
            label: item.label,
            render: (
              <span
                aria-hidden
                className="block size-3.5 border-l-2 border-t-2 border-current"
                style={{ borderTopLeftRadius: item.px }}
              />
            ),
          }))}
        />

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Tipografía</legend>
          <div className="grid grid-cols-2 gap-2">
            <FontSelect id="theme-font-body" label="Cuerpo" value={font} onChange={(value) => setFont(value as FontOption["id"])} fonts={fonts} />
            <FontSelect
              id="theme-font-heading"
              label="Títulos"
              value={headingFont}
              onChange={(value) => setHeadingFont(value as HeadingFontId)}
              fonts={fonts}
              allowSame
            />
          </div>
          <p className="text-[11px] leading-snug text-text-muted" style={{ fontFamily: "var(--font-heading)" }}>
            Los títulos se ven así. <span style={{ fontFamily: "var(--font-body)" }}>Y el cuerpo, así.</span>
          </p>
        </fieldset>

        <SegmentedGroup
          label="Modo"
          value={mode}
          onChange={setMode}
          options={MODES.map((item) => ({ id: item.id, label: item.label, render: <item.icon className="size-3.5" /> }))}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Conmutador rápido claro ⇄ oscuro, para ponerlo al lado del selector. */
export function ThemeModeToggle({ className }: { className?: string }) {
  const { resolvedMode, setMode } = useTheme();
  const next: ThemeMode = resolvedMode === "dark" ? "light" : "dark";
  const Icon = resolvedMode === "dark" ? Sun : Moon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className={className} onClick={() => setMode(next)} aria-label={`Cambiar a modo ${next === "dark" ? "oscuro" : "claro"}`}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{resolvedMode === "dark" ? "Modo claro" : "Modo oscuro"}</TooltipContent>
    </Tooltip>
  );
}
