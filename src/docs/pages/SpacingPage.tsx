import { Card } from "@/components/ui/card";
import { useTheme } from "@/themes";
import { useCssVars } from "../hooks/useCssVar";
import { CodeBlock } from "../components/CodeBlock";
import { DocSection, PageIntro } from "../components/PageIntro";

const STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const;

const ALIASES = [
  { token: "--space-inline", cls: "gap-inline", use: "Entre elementos de una fila: icono y texto, chips, botones de una barra." },
  { token: "--space-stack", cls: "space-y-stack", use: "Entre elementos apilados: campos de un formulario, filas de una lista." },
  { token: "--space-card", cls: "p-card", use: "Padding interior de una card. Es el que usa <Card>." },
  { token: "--space-page", cls: "px-page", use: "Margen lateral del contenido de página. Es el que usa el shell." },
  { token: "--space-section", cls: "mt-section", use: "Aire entre secciones de una pantalla. Es lo que separa «Empieza con una plantilla» de las métricas; sin él la pantalla se lee apelmazada y la densidad no llega a moverlo." },
] as const;

const USAGE = `/* Alias semánticos: siguen a la densidad del selector de tema. */
<Card>                       /* p-card */
<div className="flex items-center gap-inline">…</div>
<form className="space-y-stack">…</form>
<main className="px-page">…</main>
<section className="mb-section">…</section>          /* o space-y-section en el contenedor */

/* La escala numérica de Tailwind no cambia: p-4 siempre es 16px. Úsala
   para medidas fijas (anchos de sidebar, alturas de control). */`;

const DENSITY_CODE = `// Unidad base 4px × factor de densidad
compacta ×0.875 → 3.5px   normal ×1 → 4px   amplia ×1.125 → 4.5px

// buildSpacingTokens(density) emite --space-unit, --space-1 … --space-16
// y los cinco alias; ThemeProvider los escribe en <html> como el resto.`;

export function SpacingPage() {
  const { density } = useTheme();
  const values = useCssVars([...STEPS.map((step) => `--space-${step}`), ...ALIASES.map((item) => item.token), "--space-unit", "--container-narrow", "--container-normal", "--container-wide"]);

  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Fundamentos"
        title="Espaciado"
        description="Una escala de diez pasos sobre una unidad de 4px y cinco alias con nombre de intención. La densidad del selector de tema mueve la unidad; los alias la siguen y la escala numérica de Tailwind se queda fija para las medidas que no deben respirar."
      />

      <DocSection
        id="scale"
        title="Escala"
        description={`Los valores se leen en vivo. Densidad actual: ${density === "compact" ? "compacta" : density === "comfortable" ? "amplia" : "normal"} (unidad ${values["--space-unit"]}).`}
      >
        <Card className="p-card">
          <ul className="space-y-stack">
            {STEPS.map((step) => {
              const token = `--space-${step}`;
              return (
                <li key={token} className="flex items-center gap-inline">
                  <span className="w-24 shrink-0 font-mono text-[11px] font-semibold text-primary">{token}</span>
                  <span className="w-14 shrink-0 font-mono text-[11px] text-text-muted">{values[token]}</span>
                  <span className="h-3 rounded-sm bg-brand-gradient" style={{ width: `var(${token})`, minWidth: 2 }} aria-hidden />
                </li>
              );
            })}
          </ul>
        </Card>
      </DocSection>

      <DocSection id="aliases" title="Alias semánticos" description="Nombra la intención, no el número: el día que la densidad cambie, cambia en todos lados a la vez.">
        <div className="grid gap-3 sm:grid-cols-2">
          {ALIASES.map((item) => (
            <Card key={item.token} className="p-card">
              <div className="flex items-baseline justify-between gap-inline">
                <p className="font-mono text-[11px] font-semibold text-primary">{item.cls}</p>
                <p className="font-mono text-[11px] text-text-muted">
                  {item.token} · {values[item.token]}
                </p>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{item.use}</p>
              <div className="mt-3 flex items-center rounded-lg bg-surface-subtle" style={{ padding: `var(${item.token})` }}>
                <span className="h-6 flex-1 rounded-md bg-primary/15" aria-hidden />
              </div>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="widths" title="Anchos de contenido" description="Tres anchos máximos, siempre centrados. El ancho lo pone la página (PageShell maxWidth), no cada pantalla.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { token: "--container-narrow", cls: "max-w-narrow", name: "Angosto", use: "Formularios y asistentes por pasos." },
            { token: "--container-normal", cls: "max-w-normal", name: "Normal", use: "La mayoría de las pantallas. Es el ancho por defecto." },
            { token: "--container-wide", cls: "max-w-wide", name: "Ancho", use: "Tableros densos con muchas columnas." },
          ].map((item) => (
            <Card key={item.token} className="p-card">
              <div className="flex items-baseline justify-between gap-inline">
                <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                <p className="font-mono text-[11px] text-text-muted">{values[item.token]}</p>
              </div>
              <p className="mt-1 font-mono text-[11px] text-primary">{item.cls}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{item.use}</p>
              <div className="mt-3 h-2 rounded-full bg-surface-subtle">
                <div className="h-2 rounded-full bg-primary/40" style={{ width: `calc(${values[item.token] || "0px"} / 1600px * 100%)` }} aria-hidden />
              </div>
            </Card>
          ))}
        </div>
        <CodeBlock
          code={`// En la aplicación lo pone el marco, una sola vez:
<AdminShell config={{ contentWidth: "normal" }}>…</AdminShell>   // 1140px, por defecto
<AdminShell config={{ contentWidth: "narrow" }}>…</AdminShell>   // 720px, formularios y asistentes
<AdminShell config={{ contentWidth: "wide" }}>…</AdminShell>     // 1600px, tableros densos
<AdminShell config={{ contentWidth: "full" }}>…</AdminShell>     // lienzo entero: editores

// Fuera del marco (una pantalla suelta, una vista previa):
<PageShell maxWidth="normal">…</PageShell>`}
          language="tsx"
        />
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Una pantalla nunca fija su propio tope: <code>npm run check</code> marca cualquier <code>max-w-</code> de página en <code>src/features</code> y <code>src/app</code>.
        </p>
      </DocSection>

      <DocSection id="rhythm" title="Ritmo dentro de un bloque" description="Las separaciones que más se repiten. No se inventan: son las que ya traen los componentes por dentro.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { px: "4 px", cls: "gap-1", what: "Un título y su bajada", where: "Cabecera de página, tarjetas, filas de lista, menús y campos." },
            { px: "8 px", cls: "gap-2 · gap-inline", what: "Un icono (hasta 20 px) y su texto", where: "Filas de menú, casillas y dos acciones vecinas." },
            { px: "12 px", cls: "gap-3 · space-y-stack", what: "Una baldosa o un avatar (24 px o más)", where: "Barra lateral, tarjeta de empresa, menú de perfil, filas con foto." },
          ].map((item) => (
            <Card key={item.cls} className="p-card">
              <p className="text-sm font-semibold text-text-primary">{item.px} · {item.what}</p>
              <p className="mt-1 font-mono text-[11px] text-primary">{item.cls}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{item.where}</p>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="density" title="Densidad" description="Compacta para paneles densos y portátiles pequeños; amplia para pantallas de lectura o kioscos. El cambio es global y se recuerda con el tema.">
        <CodeBlock code={DENSITY_CODE} language="ts" />
      </DocSection>

      <DocSection id="usage" title="Uso">
        <CodeBlock code={USAGE} language="tsx" />
      </DocSection>
    </div>
  );
}
