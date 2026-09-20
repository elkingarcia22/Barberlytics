import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { buildRadiusTokens, buildThemeTokens, themeToCss, THEME_PRESETS, ThemeSwatch, useTheme, type ThemePreset, type ThemeTokens } from "@/themes";
import { CodeBlock } from "../components/CodeBlock";
import { useCopy } from "../hooks/useCopy";
import { DocSection, PageIntro } from "../components/PageIntro";

/** Convierte un mapa de tokens en estilos inline para un preview aislado. */
function tokensToStyle(tokens: ThemeTokens): React.CSSProperties {
  return tokens as unknown as React.CSSProperties;
}

function ThemeCard({ preset }: { preset: ThemePreset }) {
  const { preset: active, setPreset, resolvedMode, radius } = useTheme();
  const { copied, copy } = useCopy();
  const isActive = active.id === preset.id;
  const previewTokens = React.useMemo(
    () => ({ ...buildThemeTokens(preset, resolvedMode), ...buildRadiusTokens(radius) }),
    [preset, resolvedMode, radius]
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-surface shadow-card transition-colors",
        isActive ? "border-primary/60 ring-2 ring-primary/20" : "border-border/60"
      )}
    >
      {/* Preview aislado: los componentes leen los tokens del wrapper, no del documento. */}
      <div className="docs-preview border-b border-border/60 p-4" style={{ ...tokensToStyle(previewTokens), background: "var(--color-bg-app)" }}>
        <div className="rounded-xl border p-3 shadow-card" style={{ background: "var(--color-surface)", borderColor: "hsl(var(--border) / 0.6)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Objetivos Q3
            </span>
            <Badge>{preset.name}</Badge>
          </div>
          <p className="mt-1 text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            Avance del ciclo y acciones.
          </p>
          <Progress value={64} className="mt-3" />
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm">Guardar</Button>
            <Button size="sm" variant="outline">
              Cancelar
            </Button>
            <Switch className="ml-auto" defaultChecked aria-label="Ejemplo" />
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4">
        <ThemeSwatch preset={preset} className="mt-0.5 size-5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-text-primary">{preset.name}</h3>
          <p className="text-[12px] leading-relaxed text-text-secondary">{preset.description}</p>
          <p className="mt-1.5 font-mono text-[11px] text-text-muted">
            {preset.primary.light} · {preset.primary.dark} · neutros {preset.neutral === "tinted" ? "teñidos" : "grises"}
          </p>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/50 px-4 py-3">
        <Button size="sm" variant={isActive ? "secondary" : "default"} onClick={() => setPreset(preset.id)} disabled={isActive}>
          {isActive ? (
            <>
              <Check /> Activo
            </>
          ) : (
            "Aplicar"
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => copy(themeToCss(preset, radius))}>
          {copied ? <Check className="text-status-positive" /> : <Copy />}
          {copied ? "Copiado" : "Copiar CSS"}
        </Button>
      </div>
    </article>
  );
}

const USAGE_CODE = `import { ThemeProvider, ThemeSelector, useTheme } from "@/themes";

function App() {
  return (
    <ThemeProvider>
      <Header>
        <ThemeSelector />   {/* color + radio + modo */}
      </Header>
      <Screen />
    </ThemeProvider>
  );
}

function Screen() {
  const { preset, setPreset, resolvedMode, radius } = useTheme();
  return <button onClick={() => setPreset("emerald")}>Tema: {preset.name}</button>;
}`;

const PRESET_CODE = `// src/themes/presets.ts
{
  id: "coral",
  name: "Coral",
  description: "Cálido, para campañas internas.",
  primary: { light: "#F43F5E", dark: "#FB7185" },
  neutral: "gray",       // "tinted" tiñe los neutros con el matiz del primario
}`;

export function ThemesPage() {
  const { preset, radius, tokens, resolvedMode } = useTheme();
  const css = React.useMemo(() => themeToCss(preset, radius), [preset, radius]);

  return (
    <div className="cascade-enter space-y-12">
      <PageIntro
        eyebrow="Fundamentos"
        title="Temas"
        description="Un tema es un color primario por modo y una decisión sobre los neutros. Todo lo demás se deriva: hover, pressed, fondo de app, pista de pestañas, superficies del modo oscuro y el anillo de foco. Los estados semánticos (positivo, negativo, warning, info, IA) no cambian entre temas porque son significado, no decoración."
      />

      <DocSection id="catalog" title="Catálogo" description="Cada tarjeta se renderiza con los tokens de su tema, aislada del tema activo del documento. Aplica uno o copia su CSS estático para llevarlo a otro proyecto.">
        <div className="grid gap-4 sm:grid-cols-2">
          {THEME_PRESETS.map((item) => (
            <ThemeCard key={item.id} preset={item} />
          ))}
        </div>
      </DocSection>

      <DocSection id="how" title="Cómo funciona" description="El provider calcula los tokens del tema y los escribe como variables inline en <html>; al ganar en especificidad a tokens.css y globals.css, todo componente que use las variables lo sigue sin cambios.">
        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock code={USAGE_CODE} />
          <div className="space-y-3">
            <CodeBlock code={PRESET_CODE} />
            <ul className="space-y-1.5 text-[13px] text-text-secondary">
              <li>• La preferencia se guarda en <code className="rounded bg-muted px-1 font-mono text-[12px]">localStorage["ubits-theme"]</code>.</li>
              <li>• El modo <em>Sistema</em> sigue a <code className="rounded bg-muted px-1 font-mono text-[12px]">prefers-color-scheme</code>.</li>
              <li>• El radio escala los siete pasos (xs → 3xl) con un factor: recto ×0, suave ×0.6, normal ×1, amplio ×1.45.</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection id="export" title={`Exportar el tema activo · ${preset.name}`} description="El mismo bloque que copia el botón de cada tarjeta: :root con el modo claro y .dark con el oscuro. Pégalo después de tokens.css en cualquier proyecto que use estos componentes.">
        <CodeBlock code={css} language="css" className="max-h-[420px] overflow-y-auto" />
      </DocSection>

      <DocSection id="live-tokens" title={`Tokens en vivo · modo ${resolvedMode === "dark" ? "oscuro" : "claro"}`} description="Los valores que el provider está aplicando ahora mismo al documento.">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(tokens).map(([name, value]) => {
            const isColorish = value.startsWith("#") || /^\d/.test(value);
            const swatch = value.startsWith("#") ? value : value.endsWith("px") ? undefined : `hsl(${value})`;
            return (
              <div key={name} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-surface px-2.5 py-2">
                {isColorish && swatch ? (
                  <span className="size-6 shrink-0 rounded-md border border-black/10 dark:border-white/10" style={{ background: swatch }} />
                ) : (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/60 text-[9px] font-semibold text-text-muted">
                    px
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-semibold text-text-primary">{name}</p>
                  <p className="truncate font-mono text-[10.5px] text-text-muted">{value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DocSection>
    </div>
  );
}
