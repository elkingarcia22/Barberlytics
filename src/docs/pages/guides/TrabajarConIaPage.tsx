import { BookOpen, Bot, FileCheck, FileCode, FolderTree, ListChecks, Search, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "../../components/CodeBlock";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { RuleCard } from "./GuideBits";

const PROCEDURES = [
  { name: "Elegir componentes", when: "Al maquetar cualquier pantalla. Es obligatoria.", what: "Busca en el catálogo qué pieza resuelve cada cosa y abre su ficha antes de escribir nada.", icon: Search },
  { name: "Nueva pantalla", when: "Cuando pides «una pantalla de…».", what: "Sigue la receta del flujo de trabajo: dominio, datos, ruta, menú, validación.", icon: FileCode },
  { name: "Revisar contra el sistema", when: "Antes de entregar, o cuando pides «revisa esto».", what: "Busca lo que se dibujó a mano pudiendo salir del sistema y lo que rompe las reglas.", icon: ListChecks },
  { name: "Documentar un componente", when: "Al crear una pieza nueva reutilizable.", what: "Crea su entrada en el registro con playground, ejemplos, props y guías, y regenera el catálogo.", icon: BookOpen },
] as const;

const HOOKS = [
  { when: "Antes de escribir un archivo", what: "Se bloquea la escritura si aparece otra librería de interfaz, un color a mano o un tamaño de letra fijado." },
  { when: "En cada pedido", what: "AGENTS.md y CLAUDE.md le recuerdan que toda la interfaz sale del sistema y que los colores son tokens del tema." },
  { when: "Al terminar", what: "npm run check repasa los cambios y avisa lo que quedó fuera de las reglas." },
] as const;

const ASK_CODE = `# Pídelo en español y por lo que se ve, no por el nombre de la pieza
«Una tabla de colaboradores con filtro por área, selección múltiple y acciones masivas»
«Un drawer para ver la ficha de un candidato y pasar al siguiente»
«El formulario de alta de vacante en cuatro pasos»

# La IA lee ai-tools/catalog.json y elige TableShell + FilterBar + ActionRail, DrawerShell, Stepper + Field…`;

/**
 * Qué sabe la IA de este proyecto y de dónde lo saca. Todo está dentro del
 * repo: las reglas, el catálogo y los procedimientos.
 */
export function TrabajarConIaPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Empezar"
        title="Trabajar con la IA"
        description="Las pantallas se arman con ayuda de la IA, y la IA no adivina: lee las reglas del equipo, el catálogo de componentes y los documentos del proyecto. Esto es todo lo que tiene a mano y de dónde sale cada cosa."
      />

      <DocSection id="pedir" title="Cómo pedirle" description="Por lo que se ve y en español. Ella traduce a piezas del sistema.">
        <CodeBlock code={ASK_CODE} language="bash" />
      </DocSection>

      <DocSection id="procedimientos" title="Lo que ya sabe hacer" description="Procedimientos escritos en .claude/skills/, que se activan solos según lo que pidas. No hay que nombrarlos.">
        <div className="grid gap-3 sm:grid-cols-2">
          {PROCEDURES.map((item) => (
            <Card key={item.name} className="flex gap-3 p-card">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-4" aria-hidden />
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">{item.name}</h3>
                <p className="text-[13px] leading-relaxed text-text-secondary">{item.what}</p>
                <p className="text-[12px] text-text-muted">{item.when}</p>
              </div>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="fuentes" title="De dónde saca la información" description="Tres fuentes, todas dentro del repo.">
        <div className="grid gap-3 sm:grid-cols-3">
          <RuleCard icon={FolderTree} title="El catálogo de componentes">
            <code>ai-tools/catalog.json</code> y <code>ai-tools/CATALOG.md</code>: cada componente con su import, para qué sirve, sus props y sus guías. Se genera del registro con <code>npm run catalog</code>, así nunca se desactualiza a mano.
          </RuleCard>
          <RuleCard icon={FileCheck} title="El contrato con el backend">
            <code>docs/API_CONTRACT.md</code> dice qué espera el frontend; <code>src/mocks/</code> lo implementa. Por eso una tabla dice lo mismo que la API y no algo inventado.
          </RuleCard>
          <RuleCard icon={Bot} title="Las reglas y el mapa del repo">
            <code>AGENTS.md</code> (las reglas, para cualquier IA) y <code>CLAUDE.md</code> (el mapa del repo, las trampas conocidas y cómo cerrar un trabajo).
          </RuleCard>
        </div>
      </DocSection>

      <DocSection id="avisos" title="Los avisos automáticos" description="Hooks de Claude Code en .claude/settings.json. No dependen de que la IA se acuerde.">
        <div className="grid gap-3 sm:grid-cols-3">
          {HOOKS.map((item) => (
            <RuleCard key={item.when} icon={ShieldAlert} title={item.when}>
              {item.what}
            </RuleCard>
          ))}
        </div>
      </DocSection>

      <DocSection id="donde" title="Dónde vive todo esto" description="Por si alguien de ingeniería lo busca en el repositorio.">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-surface">
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-border/60">
              {[
                ["AGENTS.md", "Las reglas: qué librería, qué iconos, qué colores, qué no se toca y cómo se entrega. Las leen Cursor, Codex, Gemini y Claude."],
                ["CLAUDE.md", "Además, para Claude: el mapa del repo, dónde está cada cosa, las trampas conocidas y cómo cerrar un trabajo."],
                ["ai-tools/", "El catálogo generado (catalog.json, CATALOG.md)."],
                [".claude/skills/", "Los procedimientos: elegir componentes, nueva pantalla, revisar, documentar."],
                [".claude/settings.json", "Los hooks: bloquear escrituras fuera de las reglas y repasar al terminar."],
                ["scripts/check-design-system.mjs", "La validación (npm run check)."],
                ["docs/", "Arquitectura, contrato de API, theming, despliegue y las decisiones de diseño."],
              ].map(([path, what]) => (
                <tr key={path}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-primary">{path}</td>
                  <td className="px-4 py-3 text-text-secondary">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
    </div>
  );
}
