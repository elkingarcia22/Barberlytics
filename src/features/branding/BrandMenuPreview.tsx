import * as React from "react";
import { BrandSlot, type ShellBrandLogo } from "@/components/app-shell";
import { Text } from "@/components/typography";
import { buildThemeTokens, useTheme, type ResolvedMode } from "@/themes";

/** El menú lateral en miniatura, con los tokens del modo pedido: cuadro del rail y fila del panel. */
export function BrandMenuPreview({ mode, logo, name }: { mode: ResolvedMode; logo: ShellBrandLogo | null; name: string }) {
  const { preset } = useTheme();
  const tokens = React.useMemo(() => buildThemeTokens(preset, mode), [preset, mode]);
  return (
    <div className="space-y-2">
      <Text variant="small" tone="muted">
        {mode === "light" ? "Modo claro" : "Modo oscuro"}
      </Text>
      <div
        className="flex items-start gap-3 rounded-xl border border-border p-3"
        style={{ ...(tokens as unknown as React.CSSProperties), background: "var(--color-bg-app)", color: "var(--color-text-primary)" }}
      >
        <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-nav p-2">
          <BrandSlot variant="icon" logo={logo} name={name} mode={mode} />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-surface px-3 py-2">
          <BrandSlot logo={logo} name={name} tagline="Barbería" mode={mode} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
