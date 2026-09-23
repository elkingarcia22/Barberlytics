import { toast } from "sonner";
import { AlertTriangle, CalendarClock, CheckCircle2, FileQuestion, Inbox, Lock, SearchX, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { AttentionAction, AttentionStrip } from "@/components/feedback/AttentionStrip";
import { ErrorState } from "@/lib/query/ErrorState";
import { ApiError } from "@/lib/api";
import { CodeBlock } from "../../components/CodeBlock";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { Decision, Demo, DoDont } from "./GuideBits";

const EMPTY_CODE = `// Primera vez: invita a crear el primero
<EmptyState icon={Inbox} title="Todavía no hay planes de formación" description="Cuando crees el primero aparecerá aquí junto a su avance y sus participantes." action={<Button>Crear plan</Button>} />

// Sin resultados: la salida es aflojar el filtro
<EmptyState icon={SearchX} title="Sin resultados para «onboarding»" description="Revisa la ortografía o quita alguno de los 3 filtros activos." action={<Button variant="outline">Limpiar filtros</Button>} />`;

const BOUNDARY_CODE = `// La pantalla no decide: QueryBoundary pinta carga → error → vacío → datos
<QueryBoundary query={query} loading={<Skeleton className="h-40" />} empty={<EmptyState … />}>
  {(rows) => <TableShell rows={rows} />}
</QueryBoundary>`;

const TOAST_CODE = `import { toast } from "sonner";
toast.success("Candidatos movidos a Entrevistas");
toast.error("No pudimos guardar", { description: "Vuelve a intentarlo en unos segundos." });`;

const DECISION = [
  { when: "nadie creó nada todavía", use: "EmptyState + botón primario para crear el primero", href: "#/components/empty-state" },
  { when: "sí hay datos, pero el filtro o la búsqueda los dejó fuera", use: "EmptyState + «Limpiar filtros»", href: "#/components/empty-state" },
  { when: "algo falló del lado del sistema", use: "ErrorState con reintento (lo pone QueryBoundary)", href: "#/components/page-shell" },
  { when: "el contenido existe pero no es para esta persona", use: "EmptyState sin acción: explica a quién pedirlo", href: "#/components/empty-state" },
  { when: "algo está cargando y ya sabemos su forma", use: "Skeleton con la silueta del contenido", href: "#/components/skeleton" },
  { when: "algo pasó y no hay nada que decidir", use: "toast", href: "#/components/thema-toaster" },
  { when: "hay que avisar dentro de una sección y que se quede", use: "Alert (info, success, warning, destructive)", href: "#/components/alert" },
  { when: "hay algo que atender arriba de la pantalla", use: "AttentionStrip", href: "#/components/attention-strip" },
];

/**
 * Qué mostrar cuando no hay nada, cuando algo carga, cuando hay que avisar,
 * cuando conviene confirmar y cuando la plataforma falla.
 */
export function EstadosPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Patrones"
        title="Estados y feedback"
        description="Qué mostrar cuando no hay nada, cuando algo está cargando, cuando hay que avisar, cuando conviene pedir confirmación y cuando la plataforma falla. Todo es del sistema; ningún estado se dibuja a mano."
      />

      <DocSection id="decidir" title="Cuál usar">
        <Decision rows={DECISION} />
      </DocSection>

      <DocSection id="vacios" title="Estados vacíos" description="Cuatro motivos distintos por los que una pantalla puede no tener nada que mostrar. Cada uno cuenta qué pasó y ofrece la salida que corresponde.">
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState icon={Inbox} title="Todavía no hay planes de formación" description="Cuando crees el primero aparecerá aquí junto a su avance y sus participantes." action={<Button>Crear plan de formación</Button>} />
          <EmptyState icon={SearchX} title="Sin resultados para «onboarding»" description="Revisa la ortografía o quita alguno de los 3 filtros activos." action={<Button variant="outline">Limpiar filtros</Button>} />
          <EmptyState icon={FileQuestion} title="No pudimos cargar la lista" description="Se perdió la conexión con el servidor. Vuelve a intentarlo en unos segundos." action={<Button variant="outline">Reintentar</Button>} />
          <EmptyState icon={Lock} title="No tienes acceso a este reporte" description="Pídele a un administrador de tu empresa que te habilite el módulo de Métricas." />
        </div>
        <CodeBlock code={EMPTY_CODE} language="tsx" />
      </DocSection>

      <DocSection id="carga" title="Carga y error de sistema" description="La pantalla no decide qué mostrar: QueryBoundary pinta carga, error, vacío o datos según la consulta. El esqueleto copia la silueta del contenido para que nada salte al llegar.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Cargando" hint="Skeleton con la forma de la tabla que viene.">
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </Demo>
          <Demo title="Error de carga" hint="ErrorState: título humano, descripción y reintento.">
            <ErrorState error={new ApiError({ code: "network", message: "Se perdió la conexión", status: 0 })} onRetry={() => toast("Reintentando…")} compact />
          </Demo>
        </div>
        <CodeBlock code={BOUNDARY_CODE} language="tsx" />
      </DocSection>

      <DocSection id="feedback" title="Avisos" description="Toast para lo que ya pasó; Alert para lo que se queda en la sección; AttentionStrip para lo que hay que atender arriba de todo.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Toasts">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => toast.success("Candidatos movidos a Entrevistas")}>
                <CheckCircle2 /> Éxito
              </Button>
              <Button variant="outline" onClick={() => toast.error("No pudimos guardar", { description: "Vuelve a intentarlo en unos segundos." })}>
                <AlertTriangle /> Error
              </Button>
            </div>
            <CodeBlock code={TOAST_CODE} language="tsx" />
          </Demo>
          <Demo title="Alertas en línea">
            <div className="space-y-3">
              <Alert variant="info">
                <AlertTitle>Se importaron 234 de 300 filas</AlertTitle>
                <AlertDescription>Las 66 restantes tienen un correo inválido. Descarga el detalle para corregirlas.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTitle>La encuesta cierra en 2 días</AlertTitle>
                <AlertDescription>Todavía faltan 112 personas por responder.</AlertDescription>
              </Alert>
            </div>
          </Demo>
        </div>
        <AttentionStrip label="Avisos del ciclo" icon={AlertTriangle} tone="warning" title="5 avisos" detail="Cada uno filtra la lista de abajo.">
          <AttentionAction icon={CalendarClock} label="Vencen esta semana" hint="Planes cuya fecha límite cae en los próximos 7 días." value={3} tone="warning" onClick={() => toast("Filtro: vencen esta semana")} />
          <AttentionAction icon={UserX} label="Sin participantes" hint="Planes publicados a los que nadie está asignado." value={2} tone="negative" onClick={() => toast("Filtro: sin participantes")} />
        </AttentionStrip>
      </DocSection>

      <DocSection id="reglas" title="Reglas">
        <DoDont
          dos={[
            "Cada vacío dice qué pasó y ofrece la salida que corresponde: crear, limpiar filtros, reintentar o pedir acceso.",
            "El esqueleto tiene la forma del contenido que viene.",
            "El error de carga no culpa a la persona: se le ofrece reintentar.",
            "Un aviso de éxito es un toast, no una ventana.",
          ]}
          donts={[
            "No dibujes estados vacíos con divs: la tabla y QueryBoundary ya los traen.",
            "No uses un spinner a pantalla completa cuando puedes mostrar la silueta.",
            "No pongas un Alert para algo que ya pasó y no requiere atención.",
            "No muestres dos avisos a la vez por la misma causa.",
          ]}
        />
      </DocSection>
    </div>
  );
}
