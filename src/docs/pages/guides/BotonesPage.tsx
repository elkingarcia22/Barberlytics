import { Download, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIButton } from "@/components/ai-interaction/AIButton";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "../../components/CodeBlock";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { Demo, DoDont } from "./GuideBits";

const HIERARCHY = [
  { level: "Primario", variant: "default", label: "Crear encuesta", use: "La acción principal de la vista. Uno por pantalla, por tarjeta o por diálogo." },
  { level: "Secundario", variant: "outline", label: "Exportar", use: "Acciones de apoyo junto al primario: cancelar, exportar, ver el detalle." },
  { level: "Terciario", variant: "ghost", label: "Ver más", use: "Acciones de poco peso dentro de tablas, tarjetas y barras, y los botones de solo icono." },
  { level: "Enlace", variant: "link", label: "Ver todo", use: "Para navegar dentro de un texto o al final de una lista: «Ver todo», enlaces legales." },
  { level: "Peligro", variant: "destructive", label: "Eliminar", use: "Solo para borrar o suspender, y siempre después de pedir confirmación." },
  { level: "Relleno gris", variant: "secondary", label: "Filtrar", use: "Selecciones y filtros activos. No compite con el primario porque no tiene color." },
] as const;

const FOOTER_CODE = `<div className="flex justify-end gap-2">
  <Button variant="outline">Cancelar</Button>
  <Button>Guardar cambios</Button>
</div>`;

const ROW_CODE = `<Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil /></Button>
<Button variant="ghost" size="icon-sm" aria-label="Más acciones"><MoreHorizontal /></Button>`;

const AI_CODE = `import { AIButton } from "@/components/ai-interaction";

<AIButton label="Sugerir con IA" />                        // la acción de IA de la pantalla
<AIButton label="Mejorar texto" variant="secondary" size="sm" />
<Button variant="ghost"><Sparkles /> Resumir</Button>       // dentro de una fila o tarjeta`;

/**
 * Qué botón usar en cada caso: cuánto pesa la acción, qué tamaño lleva, dónde
 * va el icono y cuándo se usa el de IA. Todo es el Button del sistema tal
 * como viene; ninguna clase le cambia el color.
 */
export function BotonesPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Patrones"
        title="Botones"
        description="Qué botón usar en cada caso: cuánto pesa la acción, qué tamaño lleva, dónde va el icono y cuándo se usa el de IA. Todo es el Button del sistema tal como viene."
      />

      <DocSection id="jerarquia" title="De más a menos peso" description="Seis variantes. Cada nivel responde a cuánta atención merece la acción.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HIERARCHY.map((item) => (
            <Card key={item.variant} className="flex flex-col gap-3 p-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{item.level}</p>
                <code className="rounded-xs bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">variant="{item.variant}"</code>
              </div>
              <div className="flex h-14 items-center justify-center rounded-xl bg-background">
                <Button variant={item.variant}>{item.label}</Button>
              </div>
              <p className="text-[13px] leading-relaxed text-text-secondary">{item.use}</p>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="combinaciones" title="Así se combinan" description="Los mismos niveles en los dos lugares que se repiten en todo el producto.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Pie de un formulario" hint="Cancelar como secundario y el primario al final.">
            <div className="space-y-4">
              <p className="text-[13px] text-text-secondary">Los cambios se aplican a los 48 participantes del plan.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar cambios</Button>
              </div>
            </div>
            <CodeBlock code={FOOTER_CODE} language="tsx" />
          </Demo>
          <Demo title="Fila de una tabla" hint="Acciones de la fila en terciario, de solo icono y con aria-label.">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Onboarding comercial Q3</p>
                <p className="text-[12px] text-text-secondary">Vigente · 48 participantes</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Editar">
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                  <MoreHorizontal />
                </Button>
              </div>
            </div>
            <CodeBlock code={ROW_CODE} language="tsx" />
          </Demo>
        </div>
      </DocSection>

      <DocSection id="tamanos" title="Tamaños y iconos" description="Por defecto 32px. sm y xs en tablas y barras densas; lg solo en portadas y vacíos. El icono va a la izquierda salvo que indique dirección.">
        <Demo title="Los cuatro tamaños">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">
              <Plus /> Añadir
            </Button>
            <Button size="sm">
              <Plus /> Añadir
            </Button>
            <Button>
              <Plus /> Añadir
            </Button>
            <Button size="lg">
              <Plus /> Añadir
            </Button>
            <Button variant="outline" size="icon" aria-label="Descargar">
              <Download />
            </Button>
            <Button variant="destructive">
              <Trash2 /> Eliminar
            </Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="ia" title="El botón de IA" description="Significa «esto lo hace la IA». Lleva la identidad de IA del tema; nunca se pinta a mano con un gradiente.">
        <Demo title="AIButton y la chispa">
          <div className="flex flex-wrap items-center gap-3">
            <AIButton label="Sugerir con IA" />
            <AIButton label="Mejorar texto" variant="secondary" size="sm" />
            <Button variant="ghost">
              <Sparkles /> Resumir
            </Button>
          </div>
          <CodeBlock code={AI_CODE} language="tsx" />
        </Demo>
      </DocSection>

      <DocSection id="reglas" title="Reglas">
        <DoDont
          dos={[
            "Un solo primario por pantalla, tarjeta o diálogo; siempre al final del grupo.",
            "El secundario va antes del primario; «Cancelar» siempre es secundario.",
            "Los botones de solo icono llevan aria-label y son terciarios.",
            "Verbo en el texto: «Crear encuesta», no «Encuesta» ni «OK».",
            "Peligro solo tras una confirmación (ConfirmDialog).",
          ]}
          donts={[
            "No cambies el color de un botón con className: si no existe la variante, no existe el caso.",
            "No pongas dos primarios juntos ni un primario por cada tarjeta de una rejilla.",
            "No uses link para acciones que cambian datos.",
            "No uses el gradiente de IA en botones que no llaman a la IA.",
          ]}
        />
      </DocSection>
    </div>
  );
}
