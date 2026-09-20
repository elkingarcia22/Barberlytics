import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCssVars } from "../hooks/useCssVar";
import { useCopy } from "../hooks/useCopy";
import { DocSection, PageIntro } from "../components/PageIntro";
import { CodeBlock } from "../components/CodeBlock";

interface TokenSpec {
  name: string;
  label: string;
  /** Clase Tailwind que lo expone, si existe. */
  cls?: string;
  /** Los tokens shadcn son canales HSL: hay que envolverlos en hsl(). */
  hsl?: boolean;
  note?: string;
}

const BRAND: TokenSpec[] = [
  { name: "--color-brand", label: "Brand", cls: "bg-brand / bg-primary" },
  { name: "--color-brand-hover", label: "Brand hover", cls: "bg-brand-hover" },
  { name: "--color-brand-pressed", label: "Brand pressed", cls: "bg-brand-pressed" },
];

const SURFACES: TokenSpec[] = [
  { name: "--color-bg-app", label: "Fondo de app", cls: "bg-background", note: "La pantalla base." },
  { name: "--color-surface", label: "Superficie", cls: "bg-surface / bg-card", note: "Cards y paneles." },
  { name: "--color-surface-muted", label: "Superficie muted", cls: "bg-surface-muted / bg-secondary" },
  { name: "--color-surface-subtle", label: "Superficie subtle", cls: "bg-surface-subtle", note: "Zonas hundidas, código." },
  { name: "--color-tab-track", label: "Pista de tabs", cls: "bg-tab-track" },
  { name: "--color-surface-nav", label: "Navegación", cls: "bg-surface-nav / bg-nav", note: "Invariante: navy en ambos modos." },
];

const TEXT: TokenSpec[] = [
  { name: "--color-text-primary", label: "Texto primario", cls: "text-text-primary / text-foreground", note: "Títulos." },
  { name: "--color-text-secondary", label: "Texto secundario", cls: "text-text-secondary / text-muted-foreground", note: "Cuerpo y subtítulos." },
  { name: "--color-text-muted", label: "Texto muted", cls: "text-text-muted", note: "Hints y placeholders." },
  { name: "--color-text-inverse", label: "Texto inverso", cls: "text-text-inverse" },
];

const BORDERS: TokenSpec[] = [
  { name: "--color-border", label: "Borde", cls: "border-border" },
  { name: "--color-border-strong", label: "Borde fuerte", cls: "border-border-strong" },
];

const STATES: TokenSpec[] = [
  { name: "--color-positive", label: "Positivo", cls: "text-status-positive / bg-success" },
  { name: "--color-positive-bg", label: "Positivo · fondo", cls: "bg-status-positive-bg" },
  { name: "--color-positive-dark", label: "Positivo · oscuro", cls: "text-status-positive-dark" },
  { name: "--color-negative", label: "Negativo", cls: "text-status-negative / bg-destructive" },
  { name: "--color-warning", label: "Warning", cls: "text-status-warning / bg-warning" },
  { name: "--color-warning-light", label: "Warning · claro", cls: "bg-status-warning-light" },
  { name: "--color-yellow", label: "Amarillo", note: "Escala de favorabilidad." },
  { name: "--color-info", label: "Info", cls: "text-status-info / bg-info" },
  { name: "--color-indigo", label: "Índigo", note: "El quinto tono: 'oficial / otro'." },
];

const AI: TokenSpec[] = [
  { name: "--color-ai-bg", label: "IA · fondo", cls: "bg-ai-bg" },
  { name: "--color-ai-border", label: "IA · borde", cls: "border-ai-border" },
  { name: "--color-ai-gradient-start", label: "IA · gradiente inicio" },
  { name: "--color-ai-gradient-end", label: "IA · gradiente fin" },
];

const SHADCN: TokenSpec[] = [
  { name: "--background", label: "background", cls: "bg-background", hsl: true },
  { name: "--foreground", label: "foreground", cls: "text-foreground", hsl: true },
  { name: "--card", label: "card", cls: "bg-card", hsl: true },
  { name: "--popover", label: "popover", cls: "bg-popover", hsl: true },
  { name: "--primary", label: "primary", cls: "bg-primary", hsl: true },
  { name: "--primary-foreground", label: "primary-foreground", cls: "text-primary-foreground", hsl: true },
  { name: "--secondary", label: "secondary", cls: "bg-secondary", hsl: true },
  { name: "--muted", label: "muted", cls: "bg-muted", hsl: true },
  { name: "--muted-foreground", label: "muted-foreground", cls: "text-muted-foreground", hsl: true },
  { name: "--accent", label: "accent", cls: "bg-accent", hsl: true },
  { name: "--destructive", label: "destructive", cls: "bg-destructive", hsl: true },
  { name: "--success", label: "success", cls: "bg-success", hsl: true },
  { name: "--warning", label: "warning", cls: "bg-warning", hsl: true },
  { name: "--info", label: "info", cls: "bg-info", hsl: true },
  { name: "--border", label: "border", cls: "border-border", hsl: true },
  { name: "--input", label: "input", cls: "border-input", hsl: true },
  { name: "--ring", label: "ring", cls: "ring-ring", hsl: true },
  { name: "--nav", label: "nav", cls: "bg-nav", hsl: true },
];

function Swatch({ spec, value }: { spec: TokenSpec; value: string }) {
  const { copied, copy } = useCopy();
  const color = spec.hsl ? `hsl(${value})` : value;
  return (
    <button
      type="button"
      onClick={() => copy(`var(${spec.name})`)}
      title={`Copiar var(${spec.name})`}
      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-surface p-3 text-left shadow-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span
        className="relative size-12 shrink-0 rounded-lg border border-black/10 dark:border-white/10"
        style={{ background: color }}
      >
        {copied && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white">
            <Check className="size-4" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-text-primary">{spec.label}</span>
        <span className="block truncate font-mono text-[11px] text-text-secondary">{spec.name}</span>
        <span className="block truncate font-mono text-[11px] text-text-muted">{value || "—"}</span>
        {spec.cls && <span className="mt-1 block truncate font-mono text-[10.5px] text-primary">{spec.cls}</span>}
        {spec.note && <span className="mt-0.5 block text-[11px] text-text-muted">{spec.note}</span>}
      </span>
    </button>
  );
}

function SwatchGrid({ specs, cols = 3 }: { specs: TokenSpec[]; cols?: 2 | 3 | 4 }) {
  const names = React.useMemo(() => specs.map((spec) => spec.name), [specs]);
  const values = useCssVars(names);
  return (
    <div className={cn("grid gap-3", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-2 lg:grid-cols-3", cols === 4 && "sm:grid-cols-2 lg:grid-cols-4")}>
      {specs.map((spec) => (
        <Swatch key={spec.name} spec={spec} value={values[spec.name] ?? ""} />
      ))}
    </div>
  );
}

const OPACITY_CODE = `/* tokens.css: cada color vive dos veces */
--color-brand: #0C5BEF;          /* HEX para canvas, ECharts, style={} */
--color-brand-hsl: 219 90% 49%;  /* canales HSL para opacidad en Tailwind */

/* globals.css: el mapa shadcn apunta a los canales */
--primary: var(--color-brand-hsl);

/* y Tailwind puede hacer */
<div className="bg-primary/10 text-primary ring-ring/50" />`;

export function ColorsPage() {
  return (
    <div className="cascade-enter space-y-12">
      <PageIntro
        eyebrow="Fundamentos"
        title="Colores y tokens"
        description="Dos capas: los tokens Thema (tokens.css, nombrados por lo que son: marca, superficie, texto, estado) y el mapa semántico shadcn (globals.css) que los expone a los primitivos. Los valores de esta página se leen en vivo del documento: cambia el tema o el modo y se actualizan."
      />
      <DocSection id="brand" title="Marca" description="El primario y sus dos pasos de interacción. Es lo único que un tema cambia de verdad; el resto de la paleta se deriva de él.">
        <SwatchGrid specs={BRAND} />
      </DocSection>
      <DocSection id="surfaces" title="Superficies" description="Del fondo de app a la card: cada paso un poco más claro que el anterior en claro, un poco más luminoso en oscuro. La navegación es la excepción: navy en ambos modos.">
        <SwatchGrid specs={SURFACES} />
      </DocSection>
      <DocSection id="text" title="Texto">
        <SwatchGrid specs={TEXT} cols={4} />
      </DocSection>
      <DocSection id="borders" title="Bordes">
        <SwatchGrid specs={BORDERS} cols={2} />
      </DocSection>
      <DocSection id="states" title="Estados" description="Invariantes entre temas. Verde para lo que va bien, rojo para lo que falla, naranja para lo que pide atención, azul info para lo neutro-informativo e índigo como quinto tono sin estado.">
        <SwatchGrid specs={STATES} />
      </DocSection>
      <DocSection id="ai" title="IA" description="La familia de IA es siempre un gradiente, nunca un azul más: así no compite con la marca.">
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-ai-gradient shadow-ai-premium" />
          <div className="h-8 rounded-lg" style={{ background: "linear-gradient(90deg, var(--color-ai-stop-1), var(--color-ai-stop-2), var(--color-ai-stop-3), var(--color-ai-stop-4), var(--color-ai-stop-5))" }} />
          <SwatchGrid specs={AI} cols={4} />
        </div>
      </DocSection>
      <DocSection id="shadcn" title="Mapa semántico shadcn" description="Lo que consumen los primitivos. Son canales HSL para que las clases admitan opacidad (bg-primary/10).">
        <SwatchGrid specs={SHADCN} />
      </DocSection>
      <DocSection id="opacity" title="Por qué cada color existe dos veces">
        <CodeBlock code={OPACITY_CODE} language="css" />
      </DocSection>
    </div>
  );
}
