import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColorPicker } from "@/components/forms/ColorPicker";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { SegmentedGroup } from "@/components/ui/segmented-group";
import { useTheme } from "./themeContext";
import { extractLogoPalette } from "./logoPalette";
import { hexToHsl, hslToHex } from "./color";
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

/** Si el logo tiene un solo color, el secundario es su complementario cercano (120° más allá). */
function proposeFromLogo(colors: readonly string[]): CustomColors {
  const [primary, second] = colors;
  if (second) return { primary, secondary: second };
  const hsl = hexToHsl(primary);
  return { primary, secondary: hslToHex({ ...hsl, h: hsl.h + 120 }).toUpperCase() };
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden className="size-3 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15" style={{ backgroundColor: color }} />;
}

/**
 * «Personalizado»: el primario y el secundario de la barbería, elegidos en el espectro
 * o propuestos a partir de su logo. Todo se aplica al instante, como los demás temas.
 */
export function CustomThemeEditor({ logoSrc }: { logoSrc?: string | null }) {
  const { customColors, setCustomColors, preset } = useTheme();
  const [slot, setSlot] = React.useState<Slot>("primary");
  const logo = useLogoPalette(logoSrc);
  const logoColors = logo.data ?? [];
  const proposal = logoColors.length > 0 ? proposeFromLogo(logoColors) : null;
  const proposalApplied = proposal && proposal.primary === customColors.primary && proposal.secondary === customColors.secondary;

  const chosen = customColors[slot];
  // El primario se aclara u oscurece para leerse en cada modo; se avisa para que no sorprenda.
  const adjusted = slot === "primary" && preset.primary.light !== chosen.toUpperCase() && preset.primary.dark !== chosen.toUpperCase();

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-surface-subtle p-3">
      {logoSrc && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Desde tu logo</p>
          {logo.isPending && <p className="text-xs text-text-secondary">Leyendo los colores del logo…</p>}
          {logo.isError && <p className="text-xs text-text-secondary">{logo.error.message} Elige los colores a mano.</p>}
          {logo.isSuccess && !proposal && (
            <p className="text-xs text-text-secondary">Tu logo no tiene color (es blanco, negro o gris): elige los tuyos.</p>
          )}
          {proposal && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Dot color={proposal.primary} />
                <Dot color={proposal.secondary} />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
                {proposalApplied ? "Estás usando los colores de tu logo." : "Tu logo propone estos dos."}
              </span>
              {!proposalApplied && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCustomColors(proposal)}>
                  <ThemaIcon name="sparkles" size="xs" />
                  Usarlos
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <SegmentedGroup<Slot>
        label="Editar"
        value={slot}
        onChange={setSlot}
        options={[
          { id: "primary", label: "Primario", render: <Dot color={customColors.primary} /> },
          { id: "secondary", label: "Secundario", render: <Dot color={customColors.secondary} /> },
        ]}
        hint={slot === "primary" ? "Botones, enlaces y la marca." : "Cierra el degradado de marca y el de IA."}
      />

      <ColorPicker
        key={slot}
        label={slot === "primary" ? "Color primario" : "Color secundario"}
        value={chosen}
        onChange={(color) => setCustomColors({ ...customColors, [slot]: color })}
        swatches={logoColors.map((color) => ({ color, label: `Del logo: ${color}` }))}
        swatchesLabel="Colores de tu logo"
      />

      {adjusted && (
        <p className="text-[11px] leading-snug text-text-muted">
          Lo aclaramos u oscurecemos un poco en cada modo para que el texto se lea sobre el fondo.
        </p>
      )}
    </div>
  );
}
