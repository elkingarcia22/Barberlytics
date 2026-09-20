import * as React from "react";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";
import { CodeBlock } from "../components/CodeBlock";
import { DocSection, PageIntro } from "../components/PageIntro";

function Replayable({ children, label = "Repetir" }: { children: (key: number) => React.ReactNode; label?: string }) {
  const [key, setKey] = React.useState(0);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-background p-5">{children(key)}</div>
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
  ["Sofía Torres", "Marketing", "En curso"],
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

const FRAMER_CODE = `import { motion } from "framer-motion";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";

<motion.ul initial="hidden" animate="show" variants={cascadeContainer} custom={0}>
  {items.map((item) => (
    <motion.li key={item.id} variants={cascadeItem}>{item.label}</motion.li>
  ))}
</motion.ul>`;

export function MotionPage() {
  return (
    <div className="cascade-enter space-y-12">
      <PageIntro
        eyebrow="Fundamentos"
        title="Motion"
        description="Una sola curva para casi todo, cubic-bezier(0.16, 1, 0.3, 1): llega rápido y frena al final. Las entradas se escalonan para leerse como una cascada, no como un parpadeo, y todo respeta prefers-reduced-motion."
      />

      <DocSection id="cascade" title="Cascada de entrada" description="La utilidad .cascade-enter escalona los hijos directos del contenedor. Cada pantalla, pestaña o paso nuevo la usa.">
        <Replayable>
          {(key) => (
            <div key={key} className="cascade-enter grid gap-2 sm:grid-cols-3">
              {["Resumen", "Grupos", "Ranking", "Alineación", "Colaboradores", "Análisis IA"].map((label) => (
                <div key={label} className="rounded-xl border border-border/60 bg-surface px-4 py-3 text-[13px] font-medium text-text-primary shadow-card">
                  {label}
                </div>
              ))}
            </div>
          )}
        </Replayable>
        <CodeBlock code={`<div key={activeTab} className="cascade-enter">\n  {/* cada hijo directo entra 90ms después del anterior */}\n</div>`} />
      </DocSection>

      <DocSection id="table" title="Filas de tabla" description="Sin escala: una fila ocupa todo el ancho y un scale() se lee como un salto horizontal. Solo opacidad y 10px de ascenso.">
        <Replayable>
          {(key) => (
            <div key={key} className="overflow-hidden rounded-xl border border-border/60 bg-surface">
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
            </div>
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
            <div
              key={label}
              className={[
                "relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 text-[13px] font-medium text-text-primary shadow-card",
                index !== 2 ? "magic-card-sweep" : "",
                index !== 1 ? "magic-card-lift" : "",
              ].join(" ")}
            >
              <span className="relative z-10">{label}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="catalog" title="Catálogo de animaciones" description="Lo que tailwind.config.js y globals.css ponen a disposición de cualquier componente.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-surface shadow-card">
            <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Tailwind · animate-*</p>
            {TAILWIND_ANIMS.map((item) => (
              <div key={item.name} className="px-4 py-3">
                <p className="font-mono text-[12px] font-semibold text-primary">{item.name}</p>
                <p className="text-[12px] text-text-secondary">{item.use}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-surface shadow-card">
            <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">CSS · globals.css</p>
            {CSS_UTILS.map((item) => (
              <div key={item.name} className="px-4 py-3">
                <p className="font-mono text-[12px] font-semibold text-primary">{item.name}</p>
                <p className="text-[12px] text-text-secondary">{item.use}</p>
              </div>
            ))}
          </div>
        </div>
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
