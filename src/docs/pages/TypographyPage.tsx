import { findFont, resolveHeadingFont, useTheme } from "@/themes";
import { CodeBlock } from "../components/CodeBlock";
import { DocSection, PageIntro } from "../components/PageIntro";

const HEADINGS = [
  { tag: "h1", classes: "text-2xl font-bold tracking-tight", use: "Título de pantalla" },
  { tag: "h2", classes: "text-xl font-bold tracking-tight", use: "Sección principal" },
  { tag: "h3", classes: "text-lg font-semibold tracking-tight", use: "Card, drawer" },
  { tag: "h4", classes: "text-base font-semibold tracking-tight", use: "Subsección" },
  { tag: "h5", classes: "text-sm font-semibold tracking-tight", use: "Encabezado de bloque" },
  { tag: "h6", classes: "text-xs font-semibold text-text-secondary", use: "Etiqueta / eyebrow" },
] as const;

const SIZES = [
  { cls: "text-[10px]", px: 10, use: "Etiquetas de tooltip, contadores" },
  { cls: "text-[11px]", px: 11, use: "Eyebrows en mayúsculas, meta" },
  { cls: "text-xs", px: 12, use: "Badges, hints, tablas densas" },
  { cls: "text-[13px]", px: 13, use: "Cuerpo de UI: inputs, tabs, celdas" },
  { cls: "text-sm", px: 14, use: "Botones, cuerpo de card" },
  { cls: "text-base", px: 16, use: "Párrafos largos" },
  { cls: "text-lg", px: 18, use: "Títulos de card" },
  { cls: "text-xl", px: 20, use: "Sección" },
  { cls: "text-2xl", px: 24, use: "Título de pantalla" },
  { cls: "text-3xl", px: 30, use: "Hero de documentación" },
] as const;

const WEIGHTS = [
  { cls: "font-normal", value: 400, use: "Cuerpo" },
  { cls: "font-medium", value: 500, use: "Botones, labels" },
  { cls: "font-semibold", value: 600, use: "Títulos pequeños, tabs activas" },
  { cls: "font-bold", value: 700, use: "Títulos (con tracking -0.01em)" },
] as const;

const BODY_CODE = `body {
  font-family: var(--font-body);        /* la elige el selector de tema */
  font-feature-settings: "cv05", "cv08", "cv11", "ss01";
  letter-spacing: -0.011em;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }
h1 { @apply text-2xl font-bold tracking-tight text-text-primary; }
p, span, div { @apply leading-relaxed; }`;

export function TypographyPage() {
  const { font, headingFont } = useTheme();
  const body = findFont(font);
  const heading = resolveHeadingFont(headingFont, font);
  return (
    <div className="cascade-enter space-y-12">
      <PageIntro
        eyebrow="Fundamentos"
        title="Tipografía"
        description="La tipografía forma parte del tema: el selector elige una familia para el cuerpo y otra (o la misma) para los títulos, y todo el sistema las lee desde --font-body y --font-heading. La escala es compacta: la UI vive en 13px, el cuerpo en 14 y los títulos rara vez superan los 24."
      />

      <DocSection id="specimen" title="Espécimen" description={`Cuerpo: ${body.name} · Títulos: ${heading.name}. Cámbialas desde el selector de tema en la cabecera.`}>
        <div className="rounded-2xl border border-border/60 bg-surface p-8 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{heading.name} · {body.name}</p>
          <p className="mt-3 text-5xl font-bold leading-none tracking-tight text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>Aa Bb Cc 0123</p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
            Objetivos claros, resultados visibles. La plataforma de personas que conecta aprendizaje, desempeño y clima en
            una sola experiencia.
          </p>
          <p className="mt-3 font-mono text-[13px] text-text-muted">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz ÁÉÍÓÚ ñ ¿? ¡! @ # % &amp;</p>
        </div>
      </DocSection>

      <DocSection id="headings" title="Jerarquía" description="Los encabezados vienen estilizados desde globals.css: un <h2> ya es text-xl bold sin clases.">
        <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-surface shadow-card">
          {HEADINGS.map((item) => (
            <div key={item.tag} className="grid items-baseline gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]">
              <span className={item.classes + " text-text-primary"}>Configuración de objetivos</span>
              <span className="text-right">
                <span className="block font-mono text-[11px] text-primary">&lt;{item.tag}&gt; · {item.classes}</span>
                <span className="block text-[11px] text-text-muted">{item.use}</span>
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="sizes" title="Escala de tamaños">
        <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-surface shadow-card">
          {SIZES.map((item) => (
            <div key={item.cls} className="grid items-center gap-2 px-5 py-3 sm:grid-cols-[110px_1fr_auto]">
              <span className="font-mono text-[11px] text-primary">{item.cls}</span>
              <span className={item.cls + " text-text-primary"}>Configura el ciclo y asigna objetivos</span>
              <span className="text-[11px] text-text-muted">
                {item.px}px · {item.use}
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="weights" title="Pesos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WEIGHTS.map((item) => (
            <div key={item.cls} className="rounded-2xl border border-border/60 bg-surface p-5 shadow-card">
              <p className={item.cls + " text-2xl text-text-primary"}>Ágil</p>
              <p className="mt-2 font-mono text-[11px] text-primary">{item.cls}</p>
              <p className="text-[11px] text-text-muted">
                {item.value} · {item.use}
              </p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="rules" title="Reglas de base" description="Lo que globals.css fija para todo el documento.">
        <CodeBlock code={BODY_CODE} language="css" />
        <ul className="space-y-1.5 text-[13px] text-text-secondary">
          <li>• Máximo dos familias: una para el cuerpo y una para títulos; la monoespaciada del sistema solo para código y tokens.</li>
          <li>• Eyebrows y etiquetas en mayúsculas llevan tracking amplio (0.12–0.16em) y 11px.</li>
          <li>• Los títulos no superan los 24px dentro del producto; 30px+ queda para páginas de documentación y marketing.</li>
        </ul>
      </DocSection>
    </div>
  );
}
