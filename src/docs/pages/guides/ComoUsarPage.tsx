import { Bot, CheckCheck, Droplets, FolderOpen, Layers, Package, Shapes, ShieldCheck } from "lucide-react";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { RuleCard } from "./GuideBits";

/**
 * Las cinco reglas que sostienen el sistema y dónde está cada cosa. Es la
 * primera página que abre alguien nuevo (persona o IA): si una pantalla
 * cumple esto, se ve y se comporta como el resto del producto.
 */
export function ComoUsarPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Empezar"
        title="Cómo usar el sistema"
        description="Thema sirve para armar pantallas rápido con piezas que ya existen. Estas son las cinco reglas que sostienen todo y dónde encontrar cada cosa. Las mismas reglas las lee la IA en AGENTS.md, así que lo que vale para una persona vale para ella."
      />

      <DocSection id="reglas" title="Las cinco reglas" description="Si una pantalla las cumple, se ve y se comporta como el resto del producto.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RuleCard icon={Package} title="Todo sale del sistema" href="#/" linkLabel="Ver los componentes">
            Botones, tablas, formularios, avisos: todo es de <code>@/components</code>. Si algo no existe, se pregunta antes de inventarlo; y si hace falta, se crea como componente documentado, no como un <code>div</code> en la pantalla.
          </RuleCard>
          <RuleCard icon={Shapes} title="Iconos del registro" href="#/foundations/icons" linkLabel="Ver iconos">
            Se piden por concepto (<code>&lt;ThemaIcon name="search" /&gt;</code>) y se resuelven en Hugeicons. Nada de SVG pegados ni iconos de Figma; <code>lucide-react</code> solo donde el registro no llega.
          </RuleCard>
          <RuleCard icon={Droplets} title="Colores y letra del tema" href="#/foundations/colors" linkLabel="Ver color">
            Solo clases del tema (<code>bg-primary</code>, <code>text-text-secondary</code>, <code>border-border</code>) y la escala de <code>Heading</code> y <code>Text</code>. Nunca un hex, un <code>bg-blue-500</code> ni un <code>text-[13px]</code>.
          </RuleCard>
          <RuleCard icon={Layers} title="Las piezas se ven como vienen" href="#/guides/botones" linkLabel="Ver botones">
            <code>className</code> sirve para acomodar (ancho, márgenes, orden), no para cambiar colores, bordes ni esquinas. Cada componente ya trae su aire y su radio.
          </RuleCard>
          <RuleCard icon={CheckCheck} title="Se cierra con la validación" href="#/guides/flujo-de-trabajo" linkLabel="Ver el flujo">
            Antes de decir que algo está listo se corre <code>npm run check</code> y <code>npm run verify</code>. Si falla, se arregla; no se desactiva.
          </RuleCard>
          <RuleCard icon={Bot} title="La IA sigue las mismas reglas" href="#/guides/trabajar-con-ia" linkLabel="Trabajar con la IA">
            Claude, Cursor, Codex y Gemini leen <code>AGENTS.md</code> y el catálogo de componentes. Pídele la pantalla por lo que se ve; ella elige las piezas.
          </RuleCard>
        </div>
      </DocSection>

      <DocSection id="donde" title="Dónde se trabaja" description="Tres zonas con tres niveles de cuidado.">
        <div className="grid gap-3 sm:grid-cols-3">
          <RuleCard icon={FolderOpen} title="Tu pantalla, libre">
            Todo lo que está en <code>src/features/&lt;dominio&gt;/</code> se crea y se edita sin pedir permiso: la página, sus consultas, sus tipos y sus pruebas.
          </RuleCard>
          <RuleCard icon={Layers} title="El menú y las rutas, con cuidado">
            <code>src/app/navigation.ts</code>, <code>router.tsx</code> y <code>lazyPages.ts</code> se tocan solo para sumar una pantalla. Nada más.
          </RuleCard>
          <RuleCard icon={ShieldCheck} title="El resto, con ingeniería">
            Tokens (<code>src/styles</code>), temas (<code>src/themes</code>), el shell (<code>src/components/app-shell</code>), la configuración y los scripts. La validación avisa si se tocaron.
          </RuleCard>
        </div>
      </DocSection>
    </div>
  );
}
