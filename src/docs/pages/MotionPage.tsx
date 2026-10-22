import * as React from "react";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";
import { cn } from "@/lib/utils";
import { CodeBlock } from "../components/CodeBlock";
import { DocSection, PageIntro } from "../components/PageIntro";

function Replayable({ children, label = "Repetir" }: { children: (key: number) => React.ReactNode; label?: string }) {
  const [key, setKey] = React.useState(0);
  return (
    <div className="space-y-stack">
      {/* El lienzo de la demo, no una card: va en el color del fondo de app
          para que las superficies que entran se lean por encima de él. */}
      <div className="rounded-2xl border border-border/60 bg-background p-card">{children(key)}</div>
      <Button size="sm" variant="outline" onClick={() => setKey((value) => value + 1)}>
        <RotateCcw /> {label}
      </Button>
    </div>
  );
}

const ROWS = [
  ["Ana Pérez", "Producto", "En curso"],
  ["Luis Gómez", "Ventas", "Finalizado"],
  ["María Ruiz", "Personas", "Por iniciar"],
  ["Carlos Díaz", "Ingeniería", "En curso"],
  ["Antonia Torres", "Marketing", "En curso"],
] as const;

const TAILWIND_ANIMS = [
  { name: "overlay-in / overlay-out", use: "Velo de drawers y diálogos: solo opacidad, 300/380ms." },
  { name: "drawer-in-{side} / drawer-out-{side}", use: "Sheet: recorrido completo desde su borde, 500ms expo-out al entrar, 300ms al salir." },
  { name: "dialog-in / dialog-out", use: "Diálogo centrado: fade + scale 0.96→1." },
  { name: "shell-reveal-in / shell-reveal-out", use: "Paneles flotantes del shell: clip-path circular desde --reveal-x/--reveal-y." },
  { name: "highlight-row", use: "Fila recién creada: azul que se apaga en 3s." },
  { name: "border-beam", use: "Haz que recorre el borde (BorderBeam), dura --duration s." },
  { name: "bg-pan", use: "Gradiente que se desplaza en bucle, para fondos de IA." },
] as const;

const CSS_UTILS = [
  { name: ".cascade-enter", use: "Los hijos directos entran escalonados 90ms al montar. Úsalo con key={id} para repetirlo al cambiar de pestaña." },
  { name: ".cascade-enter-drawer", use: "Igual, pero espera 280ms a que el drawer termine de deslizarse." },
  { name: "tbody > tr", use: "Las filas de cualquier tabla entran en cascada (55ms) hasta la fila 20." },
  { name: ".popup-cascade", use: "Ítems de menús y selects: pasos de 26ms con tope en el noveno." },
  { name: ".magic-card-sweep + .magic-card-lift", use: "Hover de card: lavado radial en el primario y 1px de elevación." },
  { name: ".tone-hover", use: "Hover en el acento que se pase por --tone (ver lib/tone.ts)." },
  { name: ".shimmer-mirror", use: "Reflejo que cruza una superficie, para estados de IA pensando." },
] as const;

/** La capa de atmósfera (src/styles/atmosphere.css): clases que acompañan a los componentes del grupo. */
const ATMOSPHERE_UTILS = [
  { name: ".reveal / .enter", use: "Aparición al entrar en pantalla y entrada de portada: 14px de ascenso y opacidad. Los ponen Reveal y Enter." },
  { name: ".foil", use: "Lámina dorada sobre una palabra: barrido de luz cada 7s en --color-brand. Lo pone Foil." },
  { name: ".pole / .pole-ring", use: "El poste girando (translateY en bucle) y la rueda vista desde arriba (una vuelta cada 80s)." },
  { name: ".cut", use: "El corte de tijera: clip-path sobre la línea continua y transform hasta --cut-w. Lo pone CutLine." },
  { name: ".marquee", use: "Ticker en bucle con los extremos fundidos; se pausa en hover y envuelve con reduced-motion." },
  { name: ".tilt", use: "Perspectiva hacia el puntero; useTilt escribe el transform y .tilt-reset lo devuelve." },
  { name: ".grain / .vignette / .halo", use: "Fondos con material: ruido, bordes hundidos y resplandor del primario. Sin coste de scroll." },
  { name: ".brand-ring / .panel-sheen / .barber-stripes", use: "Acabados de panel: borde con gradiente de marca, filo de luz y la diagonal del poste. Los botones no llevan brillo ni barrido: son planos." },
] as const;

const FRAMER_CODE = `import { motion } from "framer-motion";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";

<motion.ul initial="hidden" animate="show" variants={cascadeContainer} custom={0}>
  {items.map((item) => (
    <motion.li key={item.id} variants={cascadeItem}>{item.label}</motion.li>
  ))}
</motion.ul>`;

export function MotionPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Fundamentos"
        title="Motion"
        description="Una sola curva para casi todo, cubic-bezier(0.16, 1, 0.3, 1): llega rápido y frena al final. Las entradas se escalonan para leerse como una cascada, no como un parpadeo, y todo respeta prefers-reduced-motion."
      />

      <DocSection id="tokens" title="Tokens" description="Duraciones, curvas y capas con nombre. Un componente nuevo elige una; nunca escribe 300ms, una cubic-bezier ni un z-index a mano.">
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="p-card">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Duración y curva</p>
            <ul className="space-y-1.5 font-mono text-[12px] text-text-secondary">
              <li><span className="text-primary">--duration-instant</span> 100ms · hover y foco</li>
              <li><span className="text-primary">--duration-fast</span> 150ms · toggles, chips, tooltips</li>
              <li><span className="text-primary">--duration-normal</span> 300ms · diálogos, velos, cascadas</li>
              <li><span className="text-primary">--duration-slow</span> 500ms · drawers que recorren la pantalla</li>
              <li className="pt-1"><span className="text-primary">--ease-out-expo</span> entrar · <span className="text-primary">--ease-standard</span> salir · <span className="text-primary">--ease-in</span> desaparecer</li>
            </ul>
            <p className="mt-3 text-[12px] text-text-secondary">Clases: <code>duration-fast</code>, <code>ease-out-expo</code>, <code>transition-all duration-normal ease-standard</code>.</p>
          </Card>
          <Card className="p-card">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Capas (z-index)</p>
            <ul className="space-y-1.5 font-mono text-[12px] text-text-secondary">
              {[
                ["--z-raised", "10", "cabeceras pegajosas dentro de una tarjeta o tabla"],
                ["--z-sticky", "20", "barras pegajosas de página"],
                ["--z-rail", "30", "barra de acciones flotante"],
                ["--z-sidebar", "40", "barra lateral"],
                ["--z-header", "50", "cabecera"],
                ["--z-drawer", "60", "drawers"],
                ["--z-overlay", "70", "el velo de drawers y diálogos"],
                ["--z-dialog", "80", "diálogos"],
                ["--z-popover", "90", "menús, tooltips, comandos"],
                ["--z-toast", "100", "avisos"],
              ].map(([token, value, use]) => (
                <li key={token}><span className="text-primary">{token}</span> {value} · {use}</li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-text-secondary">Clases: <code>z-popover</code>, <code>z-dialog</code>… <code>npm run check</code> marca cualquier <code>z-[…]</code> en producto.</p>
          </Card>
        </div>
      </DocSection>

      <DocSection id="cascade" title="Cascada de entrada" description="La utilidad .cascade-enter escalona los hijos directos del contenedor. Cada pantalla, pestaña o paso nuevo la usa.">
        <Replayable>
          {(key) => (
            <div key={key} className="cascade-enter grid gap-2 sm:grid-cols-3">
              {["Resumen", "Grupos", "Ranking", "Alineación", "Colaboradores", "Análisis IA"].map((label) => (
                <Card key={label} className="rounded-xl px-4 py-3 text-[13px] font-medium text-text-primary">
                  {label}
                </Card>
              ))}
            </div>
          )}
        </Replayable>
        <CodeBlock code={`<div key={activeTab} className="cascade-enter">\n  {/* cada hijo directo entra 90ms después del anterior */}\n</div>`} />
      </DocSection>

      <DocSection id="table" title="Filas de tabla" description="Sin escala: una fila ocupa todo el ancho y un scale() se lee como un salto horizontal. Solo opacidad y 10px de ascenso.">
        <Replayable>
          {(key) => (
            <Card key={key} className="overflow-hidden rounded-xl shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.map((row) => (
                    <TableRow key={row[0]}>
                      <TableCell className="font-medium">{row[0]}</TableCell>
                      <TableCell>{row[1]}</TableCell>
                      <TableCell>{row[2]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Replayable>
      </DocSection>

      <DocSection id="framer" title="Cascada con Framer Motion" description="Para listas anidadas donde el CSS no llega: el contenedor escalona y cada fila hereda la variante.">
        <Replayable>
          {(key) => (
            <motion.ul key={key} initial="hidden" animate="show" variants={cascadeContainer} custom={0} className="space-y-1.5">
              {["Definir objetivos de empresa", "Asignar a grupos", "Configurar pesos", "Revisar conflictos", "Publicar ciclo"].map((step, index) => (
                <motion.li key={step} variants={cascadeItem} className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2 text-[13px] text-text-primary">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{index + 1}</span>
                  {step}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </Replayable>
        <CodeBlock code={FRAMER_CODE} />
      </DocSection>

      <DocSection id="hover" title="Hover de card" description="Dos capas que entran juntas: un lavado radial en el primario y 1px de elevación con sombra teñida.">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Card con sweep + lift", "Solo sweep", "Solo lift"].map((label, index) => (
            <Card
              key={label}
              className={cn(
                "relative overflow-hidden p-card text-[13px] font-medium text-text-primary",
                index !== 2 && "magic-card-sweep",
                index !== 1 && "magic-card-lift"
              )}
            >
              <span className="relative z-10">{label}</span>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="catalog" title="Catálogo de animaciones" description="Lo que tailwind.config.js y globals.css ponen a disposición de cualquier componente.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="divide-y divide-border/50">
            <p className="px-card py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Tailwind · animate-*</p>
            {TAILWIND_ANIMS.map((item) => (
              <div key={item.name} className="px-card py-3">
                <p className="font-mono text-[12px] font-semibold text-primary">{item.name}</p>
                <p className="text-[12px] text-text-secondary">{item.use}</p>
              </div>
            ))}
          </Card>
          <Card className="divide-y divide-border/50">
            <p className="px-card py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">CSS · globals.css</p>
            {CSS_UTILS.map((item) => (
              <div key={item.name} className="px-card py-3">
                <p className="font-mono text-[12px] font-semibold text-primary">{item.name}</p>
                <p className="text-[12px] text-text-secondary">{item.use}</p>
              </div>
            ))}
          </Card>
        </div>
      </DocSection>

      <DocSection
        id="atmosphere"
        title="Atmósfera y marca"
        description="La capa que una página de marca necesita y el producto no trae: cabello que cae, poste, corte de tijera, sello, ticker, grano y halo. Vive en src/styles/atmosphere.css y cada pieza tiene su componente en la familia Atmósfera. Todo se mueve con transform, opacity o clip-path, y prefers-reduced-motion deja cada pieza en su estado final."
      >
        <Card className="divide-y divide-border/50">
          <p className="px-card py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">CSS · atmosphere.css</p>
          {ATMOSPHERE_UTILS.map((item) => (
            <div key={item.name} className="px-card py-3">
              <p className="font-mono text-[12px] font-semibold text-primary">{item.name}</p>
              <p className="text-[12px] text-text-secondary">{item.use}</p>
            </div>
          ))}
          <div className="px-card py-3">
            <a href="#/group/atmosphere" className="text-[12px] font-medium text-primary underline-offset-4 hover:underline">
              Ver la familia Atmósfera y marca
            </a>
          </div>
        </Card>
      </DocSection>

      <DocSection id="reduced" title="Movimiento reducido" description="Con prefers-reduced-motion los overlays siguen apareciendo (Radix espera a que termine la animación para desmontar) pero en 1ms; las cascadas y los hover se anulan del todo.">
        <CodeBlock
          language="css"
          code={`@media (prefers-reduced-motion: reduce) {
  [data-slot="sheet-content"], [data-slot="dialog-content"], /* … */ {
    animation-duration: 1ms !important;
  }
  .cascade-enter > *, tbody > tr { animation: none; }
  .magic-card-lift:hover { transform: none; }
}`}
        />
      </DocSection>
    </div>
  );
}
