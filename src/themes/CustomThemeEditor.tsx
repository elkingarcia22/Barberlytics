import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColorPicker } from "@/components/forms/ColorPicker";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { SegmentedGroup } from "@/components/ui/segmented-group";
import { useTheme } from "./themeContext";
import { extractLogoPalette, proposeBrandColors } from "./logoPalette";
import type { CustomColors } from "./customTheme";

type Slot = keyof CustomColors;

/** Los colores del logo, leídos una vez por logo (la consulta los guarda mientras dure la sesión). */
function useLogoPalette(logoSrc: string | null | undefined) {
  return useQuery({
    queryKey: ["logo-palette", logoSrc],
    queryFn: () => extractLogoPalette(logoSrc as string),
    enabled: Boolean(logoSrc),
    staleTime: Infinity,
    retry: false,
  });
}


function Dot({ color }: { color: string }) {
  return <span aria-hidden className="size-3 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15" style={{ backgroundColor: color }} />;
}

export interface CustomThemeEditorProps {
  /** El logo propio de la barbería, si subió uno: se le leen los colores. */
  logoSrc?: string | null;
  /** Los colores del logo que se ve cuando no hay uno propio (el de Barberlytics). */
  defaultLogoColors?: readonly string[];
}

/** El texto junto a la propuesta, según de dónde sale y si ya está aplicada. */
function proposalLabel({ isDefault, singleColor, applied }: { isDefault: boolean; singleColor: boolean; applied: boolean }): string {
  if (isDefault) return applied ? "Usas los colores de Barberlytics." : "Los de Barberlytics, tu logo por defecto.";
  if (singleColor) return applied ? "Tu color y un tono suyo." : "Un color: lo combinamos con un tono suyo.";
  return applied ? "Estás usando los colores de tu logo." : "Tu logo propone estos dos.";
}

/**
 * «Personalizado»: el primario y el secundario de la barbería, elegidos en el espectro
 * o propuestos a partir de su logo —el propio o, si no subió uno, el de Barberlytics que
 * se ve en su menú—. Todo se aplica al instante, como los demás temas.
 */
export function CustomThemeEditor({ logoSrc, defaultLogoColors = [] }: CustomThemeEditorProps) {
  const { customColors, setCustomColors, preset } = useTheme();
  const [slot, setSlot] = React.useState<Slot>("primary");
  const logo = useLogoPalette(logoSrc);
  const isDefault = !logoSrc;
  const logoColors = isDefault ? defaultLogoColors : (logo.data ?? []);
  const proposal = logoColors.length > 0 ? proposeBrandColors(logoColors) : null;
  const proposalApplied = proposal && proposal.primary === customColors.primary && proposal.secondary === customColors.secondary;

  const chosen = customColors[slot];
  // El primario se aclara u oscurece para leerse en cada modo; se avisa para que no sorprenda.
  const adjusted = slot === "primary" && preset.primary.light !== chosen.toUpperCase() && preset.primary.dark !== chosen.toUpperCase();

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-surface-subtle p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Desde tu logo</p>
        {!isDefault && logo.isPending && <p className="text-xs text-text-secondary">Leyendo los colores del logo…</p>}
        {!isDefault && logo.isError && <p className="text-xs text-text-secondary">{logo.error.message} Elige los colores a mano.</p>}
        {!isDefault && logo.isSuccess && !proposal && <p className="text-xs text-text-secondary">Tu logo no tiene color (es blanco, negro o gris): elige los tuyos.</p>}
        {proposal && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Dot color={proposal.primary} />
              <Dot color={proposal.secondary} />
            </span>
            {/* Sin `truncate`: con el botón al lado el texto cabe en dos líneas, no a medias. */}
            <span className="min-w-0 flex-1 text-xs leading-snug text-text-secondary">
              {proposalLabel({ isDefault, singleColor: proposal.singleColor, applied: Boolean(proposalApplied) })}
            </span>
            {!proposalApplied && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCustomColors({ primary: proposal.primary, secondary: proposal.secondary })}>
                <ThemaIcon name="sparkles" size="xs" />
                Usarlos
              </Button>
            )}
          </div>
        )}
      </div>

      <SegmentedGroup<Slot>
        label="Editar"
        value={slot}
        onChange={setSlot}
        options={[
          {
            id: "primary",
            label: "Primario",
            render: <Dot color={customColors.primary} />,
          },
          {
            id: "secondary",
            label: "Secundario",
            render: <Dot color={customColors.secondary} />,
          },
        ]}
        hint={slot === "primary" ? "Botones, enlaces y la marca." : "Cierra el degradado de marca y el de IA."}
      />

      <ColorPicker
        key={slot}
        label={slot === "primary" ? "Color primario" : "Color secundario"}
        value={chosen}
        onChange={(color) => setCustomColors({ ...customColors, [slot]: color })}
        swatches={logoColors.map((color) => ({
          color,
          label: `Del logo: ${color}`,
        }))}
        swatchesLabel={isDefault ? "Colores de Barberlytics" : "Colores de tu logo"}
      />

      {adjusted && (
        <p className="text-[11px] leading-snug text-text-muted">Lo aclaramos u oscurecemos un poco en cada modo para que el texto se lea sobre el fondo.</p>
      )}
    </div>
  );
}
