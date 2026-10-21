import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter } from "@/components/ui/card";
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
    <article>
      <Card className={cn("overflow-hidden transition-colors", isActive && "border-primary/60 ring-2 ring-primary/20")}>
        {/* Preview aislado: los componentes leen los tokens del wrapper, no del documento. */}
        <div className="docs-preview border-b border-border/60 p-card" style={{ ...tokensToStyle(previewTokens), background: "var(--color-bg-app)" }}>
          {/* La card del preview sí es una <Card>, pero su fondo y su borde
              siguen llegando por `style`: son los tokens del tema aislado. */}
          <Card className="rounded-xl p-3" style={{ background: "var(--color-surface)", borderColor: "hsl(var(--border) / 0.6)" }}>
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
            <div className="mt-3 h-2 rounded-full bg-ai-gradient" title="Gradiente de IA del tema" />
            <div className="mt-3 flex items-center gap-inline">
              <Button size="sm">Guardar</Button>
              <Button size="sm" variant="outline">
                Cancelar
              </Button>
              <Switch className="ml-auto" defaultChecked aria-label="Ejemplo" />
            </div>
          </Card>
        </div>
        <div className="flex items-start gap-3 p-card">
          <ThemeSwatch preset={preset} className="mt-0.5 size-5" />
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-text-primary">{preset.name}</h3>
            <p className="text-[12px] leading-relaxed text-text-secondary">{preset.description}</p>
            <p className="mt-1.5 font-mono text-[11px] text-text-muted">
              {preset.primary.light} · {preset.primary.dark} · neutros {preset.neutral === "tinted" ? "teñidos" : "grises"}
            </p>
          </div>
        </div>
        <CardFooter className="mt-0 gap-inline border-border/50 py-3">
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
        </CardFooter>
      </Card>
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
  fonts: { body: "satoshi", heading: "fraunces" },   // opcional
  ai: { start: "#F43F5E", end: "#F59E0B" },           // opcional
  tier: "premium",       // opcional: activa los acabados de themes/premium.css
  depth: "deep",         // opcional: modo oscuro al carbón, bordes hairline
}`;

export function ThemesPage() {
  const { preset, radius, density, tokens, resolvedMode, font, headingFont } = useTheme();
  const css = React.useMemo(
    () => themeToCss(preset, radius, { body: font, heading: headingFont }, density),
    [preset, radius, density, font, headingFont]
  );

  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Fundamentos"
        title="Temas"
        description="Un tema es un color primario por modo, una decisión sobre los neutros y una tipografía. Todo lo demás se deriva: hover, pressed, fondo de app, pista de pestañas, superficies del modo oscuro, el anillo de foco y el gradiente de IA, que arranca en el primario y recorre 120° del círculo cromático. Los estados semánticos (positivo, negativo, warning, info) no cambian entre temas porque son significado, no decoración."
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
          <div className="space-y-stack">
            <CodeBlock code={PRESET_CODE} />
            <ul className="space-y-1.5 text-[13px] text-text-secondary">
              <li>• La preferencia se guarda en <code className="rounded bg-muted px-1 font-mono text-[12px]">localStorage["thema-theme"]</code>.</li>
              <li>• El modo <em>Sistema</em> sigue a <code className="rounded bg-muted px-1 font-mono text-[12px]">prefers-color-scheme</code>.</li>
              <li>• El radio escala los siete pasos (xs → 3xl) con un factor: recto ×0, suave ×0.6, normal ×1, amplio ×1.45.</li>
              <li>• La tipografía (cuerpo y títulos) se elige en el selector; un preset puede sugerir la suya con <code className="rounded bg-muted px-1 font-mono text-[12px]">fonts</code> y las de Google se cargan solo al elegirlas.</li>
              <li>• El gradiente de IA se deriva del primario; un preset puede fijar el suyo con <code className="rounded bg-muted px-1 font-mono text-[12px]">ai</code>.</li>
              <li>
                • <strong>Personalizado</strong> (la última pastilla del selector) arma el tema con un primario y un secundario que elige la barbería en un{" "}
                <code className="rounded bg-muted px-1 font-mono text-[12px]">ColorPicker</code> o que se leen de su logo (
                <code className="rounded bg-muted px-1 font-mono text-[12px]">extractLogoPalette</code>). El primario se aclara u oscurece en cada modo hasta contrastar 4,5:1 (
                <code className="rounded bg-muted px-1 font-mono text-[12px]">fitToMode</code>); el secundario cierra los degradados de marca e IA. Se guarda en{" "}
                <code className="rounded bg-muted px-1 font-mono text-[12px]">custom</code> dentro de la misma preferencia.
              </li>
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
            const isColorish = value.startsWith("#") || /^\d+ \d/.test(value);
            const swatch = value.startsWith("#") ? value : /^\d+ [\d.]+% [\d.]+%$/.test(value) ? `hsl(${value})` : undefined;
            return (
              // Fila densa de token, no una card: sin elevación y con un radio
              // pequeño para que la lista se lea como una tabla.
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
