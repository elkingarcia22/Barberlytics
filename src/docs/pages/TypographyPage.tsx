import { Card } from "@/components/ui/card";
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
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Fundamentos"
        title="Tipografía"
        description="La tipografía forma parte del tema: el selector elige una familia para el cuerpo y otra (o la misma) para los títulos, y todo el sistema las lee desde --font-body y --font-heading. La escala es compacta: la UI vive en 13px, el cuerpo en 14 y los títulos rara vez superan los 24."
      />

      <DocSection id="specimen" title="Espécimen" description={`Cuerpo: ${body.name} · Títulos: ${heading.name}. Cámbialas desde el selector de tema en la cabecera.`}>
        {/* El espécimen conserva su padding editorial de 32px: aquí el aire es
            parte de la muestra, no el padding de una card. */}
        <Card className="p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{heading.name} · {body.name}</p>
          <p className="mt-3 text-5xl font-bold leading-none tracking-tight text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>Aa Bb Cc 0123</p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
            Objetivos claros, resultados visibles. La plataforma de personas que conecta aprendizaje, desempeño y clima en
            una sola experiencia.
          </p>
          <p className="mt-3 font-mono text-[13px] text-text-muted">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz ÁÉÍÓÚ ñ ¿? ¡! @ # % &amp;</p>
        </Card>
      </DocSection>

      <DocSection id="components" title="Heading y Text" description="La escala como componentes. En las pantallas no se escriben tamaños a mano: un título es <Heading level={n}> y un texto es <Text size|variant>. npm run check marca cualquier text-[Npx] en src/features y src/app.">
        <CodeBlock
          code={`import { Heading, Text } from "@/components/typography";

<Heading level={2}>Planes de formación</Heading>          // título de página (lo pone PageHeader)
<Text variant="lead">Rutas por cargo y grupos de personas.</Text>
<Text>Texto de interfaz: 14px.</Text>                     // size="sm" por defecto
<Text size="xs" tone="muted">Actualizado hace 2 h</Text>
<Text size="xl" weight="semibold" tabular>1.248</Text>    // cifras de indicadores`}
          language="tsx"
        />
        <div className="flex flex-wrap gap-inline">
          <a className="text-[13px] font-medium text-primary hover:underline" href="#/components/heading">Ver Heading →</a>
          <a className="text-[13px] font-medium text-primary hover:underline" href="#/components/text">Ver Text →</a>
        </div>
      </DocSection>

      <DocSection id="headings" title="Jerarquía" description="Los encabezados vienen estilizados desde globals.css: un <h2> ya es text-xl bold sin clases.">
        <Card className="divide-y divide-border/50">
          {HEADINGS.map((item) => (
            <div key={item.tag} className="grid items-baseline gap-inline px-card py-4 sm:grid-cols-[1fr_auto]">
              <span className={item.classes + " text-text-primary"}>Configuración de objetivos</span>
              <span className="text-right">
                <span className="block font-mono text-[11px] text-primary">&lt;{item.tag}&gt; · {item.classes}</span>
                <span className="block text-[11px] text-text-muted">{item.use}</span>
              </span>
            </div>
          ))}
        </Card>
      </DocSection>

      <DocSection id="sizes" title="Escala de tamaños">
        <Card className="divide-y divide-border/50">
          {SIZES.map((item) => (
            <div key={item.cls} className="grid items-center gap-inline px-card py-3 sm:grid-cols-[110px_1fr_auto]">
              <span className="font-mono text-[11px] text-primary">{item.cls}</span>
              <span className={item.cls + " text-text-primary"}>Configura el ciclo y asigna objetivos</span>
              <span className="text-[11px] text-text-muted">
                {item.px}px · {item.use}
              </span>
            </div>
          ))}
        </Card>
      </DocSection>

      <DocSection id="weights" title="Pesos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WEIGHTS.map((item) => (
            <Card key={item.cls} className="p-card">
              <p className={item.cls + " text-2xl text-text-primary"}>Ágil</p>
              <p className="mt-2 font-mono text-[11px] text-primary">{item.cls}</p>
              <p className="text-[11px] text-text-muted">
                {item.value} · {item.use}
              </p>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="chrome"
        title="El marco tiene su propia escala"
        description="La barra lateral, el pie, los menús flotantes y el selector de tema usan 10, 11 y 13 px, que no están en esta escala y no deben aparecer en una pantalla. Son cromo: texto que acompaña un control, nunca contenido que alguien lee."
      >
        <CodeBlock
          code={`// En una pantalla (src/features, src/app): siempre la escala
<Text size="xs">Actualizado hace 2 h</Text>      // 12px, el mínimo legible

// En el cromo del marco (src/components/app-shell, src/themes): escala propia
<span className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Color</span>

// npm run check lo hace cumplir: marca text-[Npx] en src/features y src/app,
// y lo permite en el marco, que es donde vive esa escala.`}
          language="tsx"
        />
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
