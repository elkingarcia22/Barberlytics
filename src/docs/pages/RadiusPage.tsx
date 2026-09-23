import { Card } from "@/components/ui/card";
import { useCssVars } from "../hooks/useCssVar";
import { DocSection, PageIntro } from "../components/PageIntro";
import { CodeBlock } from "../components/CodeBlock";

const RADII = [
  { token: "--radius-xs", cls: "rounded-xs / rounded", use: "Checkboxes, código inline, marcas de 20px" },
  { token: "--radius-sm", cls: "rounded-sm", use: "Badges, chips, avatares cuadrados" },
  { token: "--radius-md", cls: "rounded-md", use: "Botones, inputs, filas: el radio del header" },
  { token: "--radius-lg", cls: "rounded-lg", use: "Tiles, filas de lista, celdas" },
  { token: "--radius-xl", cls: "rounded-xl", use: "Cards dentro de un panel" },
  { token: "--radius-2xl", cls: "rounded-2xl", use: "Paneles y contenedores: el radio del aside" },
  { token: "--radius-3xl", cls: "rounded-3xl", use: "Drawers, diálogos, barra de acciones flotante" },
] as const;

const SHADOWS = [
  { cls: "shadow-card", token: "--shadow-card", use: "Cards en reposo. Casi imperceptible: el borde hace el trabajo." },
  { cls: "shadow-drawer", token: "--shadow-drawer", use: "Drawers y popovers." },
  { cls: "shadow-rail", token: "--shadow-rail", use: "La barra de acciones flotante: lo único que flota sobre contenido vivo." },
  { cls: "shadow-premium", token: "--shadow-premium", use: "Superficies destacadas, muy difusa." },
  { cls: "shadow-ai-premium", token: "--shadow-ai-premium", use: "Botones y cards de IA: sombra teñida por el gradiente." },
] as const;

const SCALE_CODE = `/* Escala monótona: una card dentro de un panel siempre es un poco menos
   redondeada que el panel que la contiene. */
--radius-xs: 6px;   --radius-sm: 8px;   --radius-md: 10px;  --radius-lg: 12px;
--radius-xl: 14px;  --radius-2xl: 16px; --radius-3xl: 24px; --radius-full: 9999px;

/* El selector de tema multiplica los siete pasos:
   recto ×0 · suave ×0.6 · normal ×1 · amplio ×1.45 */`;

export function RadiusPage() {
  const values = useCssVars(RADII.map((item) => item.token));

  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Fundamentos"
        title="Radios y sombras"
        description="Los radios son una escala monótona anclada en el shell: 16px para un panel, 10px para cualquier cosa pulsable. Las sombras son navy translúcido, nunca negro puro, y casi siempre el borde de 1px hace más trabajo que ellas."
      />

      <DocSection id="radius" title="Escala de radios" description="Los valores se leen en vivo; cambia el radio en el selector de tema y verás cómo escala toda la serie.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RADII.map((item) => (
            <Card key={item.token} className="p-4">
              <div className="flex h-24 items-center justify-center rounded-xl bg-surface-subtle">
                <div className="size-16 border-2 border-primary bg-primary/10" style={{ borderRadius: `var(${item.token})` }} />
              </div>
              <p className="mt-3 font-mono text-[11px] font-semibold text-primary">{item.cls}</p>
              <p className="font-mono text-[11px] text-text-muted">
                {item.token} · {values[item.token] || "—"}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-text-secondary">{item.use}</p>
            </Card>
          ))}
        </div>
        <CodeBlock code={SCALE_CODE} language="css" />
      </DocSection>

      <DocSection id="shadows" title="Elevaciones" description="Cinco sombras con nombre. tailwind-merge las conoce (ver lib/utils.ts), así que shadow-card sobrescribe correctamente a shadow-md.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SHADOWS.map((item) => (
            // Estas dos capas no pasan a <Card> a propósito: la de fuera es el
            // lienzo (bg-background, sin borde) y la de dentro tiene que llevar
            // la sombra de la fila. `shadow-rail` no está registrada en
            // tailwind-merge (ver lib/utils.ts), así que no ganaría a la
            // `shadow-card` que Card trae de serie.
            <div key={item.cls} className="rounded-2xl bg-background p-6">
              <div className={`flex h-24 items-center justify-center rounded-2xl border border-border/40 bg-surface ${item.cls}`}>
                <span className="font-mono text-[12px] font-semibold text-text-primary">{item.cls}</span>
              </div>
              <p className="mt-3 font-mono text-[11px] text-text-muted">{item.token}</p>
              <p className="mt-1 text-[12px] leading-snug text-text-secondary">{item.use}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="borders" title="Bordes y separación" description="La regla del sistema: delimitar con bordes sutiles antes que con sombras.">
        {/* Tres <Card> sin elevación: la sección demuestra que el borde basta,
            así que `shadow-none` desactiva la sombra que Card trae de serie. */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-card shadow-none">
            <p className="text-[13px] font-semibold text-text-primary">border-border/60</p>
            <p className="mt-1 text-[12px] text-text-secondary">Cards y paneles en reposo. Al 60% para no pesar.</p>
          </Card>
          <Card className="border-border p-card shadow-none">
            <p className="text-[13px] font-semibold text-text-primary">border-border</p>
            <p className="mt-1 text-[12px] text-text-secondary">Inputs y controles: el borde completo.</p>
          </Card>
          <Card className="border-border-strong/60 p-card shadow-none">
            <p className="text-[13px] font-semibold text-text-primary">border-border-strong/60</p>
            <p className="mt-1 text-[12px] text-text-secondary">Hover sobre superficies interactivas neutras.</p>
          </Card>
        </div>
      </DocSection>
    </div>
  );
}
