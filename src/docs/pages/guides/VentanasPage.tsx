import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { ConfirmDialog } from "@/components/overlays/ConfirmDialog";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { ModalShell } from "@/components/overlays/ModalShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "../../components/CodeBlock";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { Decision, Demo, DoDont } from "./GuideBits";

const DECISION = [
  { when: "hay que ver o editar un registro, filtrar una lista o llenar un formulario largo sin perder la página de fondo", use: "DrawerShell", href: "#/components/drawer-shell" },
  { when: "hay que decidir o completar algo corto que no puede esperar: 2 o 3 campos, anunciar algo nuevo", use: "ModalShell", href: "#/components/modal-shell" },
  { when: "la decisión no se puede dejar a medias: eliminar, salir sin guardar, sesión por expirar", use: "ConfirmDialog (ventana de alerta: sin X, no se cierra fuera)", href: "#/components/confirm-dialog" },
  { when: "solo hay que contar que algo pasó y no hay nada que decidir: «Nota guardada», «Candidatos movidos»", use: "toast (ThemaToaster)", href: "#/components/thema-toaster" },
  { when: "el trabajo es sobre lo que ya está abierto y lo hace la IA: un campo, una selección, un dato", use: "AiAgentDrawer (agente contextual)", href: "#/components/ai-agent-drawer" },
];

const DRAWER_CODE = `<DrawerShell
  trigger={<Button variant="outline">Ver ficha</Button>}
  title="Renata Méndez"
  description="Analista de datos · postuló hace 12 días"
  size="lg"
  actions={<><Button variant="outline">Rechazar</Button><Button>Avanzar etapa</Button></>}
>
  <Tabs defaultValue="resumen">…</Tabs>
</DrawerShell>`;

const MODAL_CODE = `<ModalShell
  trigger={<Button>Nueva etiqueta</Button>}
  title="Nueva etiqueta"
  description="Se aplica a los 3 candidatos seleccionados."
  size="sm"
  actions={<><Button variant="outline">Cancelar</Button><Button>Crear</Button></>}
>
  <Field label="Nombre"><Input placeholder="Finalista" /></Field>
</ModalShell>`;

const CONFIRM_CODE = `<ConfirmDialog
  trigger={<Button variant="destructive">Eliminar vacante</Button>}
  title="¿Eliminar «Analista de datos»?"
  description="Se pierden las 18 postulaciones. Esta acción no se puede deshacer."
  variant="destructive"
  confirmLabel="Eliminar"
  confirmationText="Analista de datos"
  onConfirm={() => toast.success("Vacante eliminada")}
/>`;

function DrawerDemo() {
  return (
    <DrawerShell
      trigger={<Button variant="outline">Ver ficha del candidato</Button>}
      title="Renata Méndez"
      description="Analista de datos · postuló hace 12 días"
      size="lg"
      actions={
        <>
          <Button variant="outline">Rechazar</Button>
          <Button>Avanzar etapa</Button>
        </>
      }
    >
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="recorrido">Recorrido</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="mt-4 text-[13px] leading-relaxed text-text-secondary">Aquí va la ficha: datos, recorrido y documentos. Es el cuerpo del drawer, un slot libre.</p>
    </DrawerShell>
  );
}

function ModalDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <ModalShell
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>Nueva etiqueta</Button>}
      title="Nueva etiqueta"
      description="Se aplica a los 3 candidatos seleccionados."
      size="sm"
      actions={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              toast.success("Etiqueta creada");
            }}
          >
            Crear
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" required>
          <Input placeholder="Finalista" />
        </Field>
        <Field label="Descripción" description="Opcional. La ven los reclutadores.">
          <Textarea rows={2} />
        </Field>
      </div>
    </ModalShell>
  );
}

/**
 * Cuándo una ventana, cuándo un panel, cuándo un aviso. Todo con las piezas
 * de overlays del sistema; la decisión es la que cambia.
 */
export function VentanasPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Patrones"
        title="Modales y drawers"
        description="Ventanas que aparecen encima de la página para decidir o completar algo corto, y paneles que salen desde un borde para trabajar sin perder la página. La pieza es siempre del sistema; lo que hay que decidir es cuál."
      />

      <DocSection id="decidir" title="Cuál usar" description="La misma pregunta cada vez: ¿la persona necesita seguir viendo la página de fondo?">
        <Decision rows={DECISION} />
      </DocSection>

      <DocSection id="drawer" title="Drawer: ver y trabajar un registro" description="Derecha para detalle y formularios, izquierda para navegar, abajo para acciones rápidas en celular. Cierra con Esc, con clic afuera y con la X. El principal siempre a la derecha del pie.">
        <Demo title="Detalle de un candidato">
          <DrawerDemo />
          <CodeBlock code={DRAWER_CODE} language="tsx" />
        </Demo>
      </DocSection>

      <DocSection id="modal" title="Modal: decidir o completar algo corto" description="Chico (384px) para una pregunta, mediano (448px) para dos o tres campos, grande para una vista previa. Título que se entiende solo, una o dos líneas de descripción y el pie con el principal a la derecha.">
        <Demo title="Formulario corto">
          <ModalDemo />
          <CodeBlock code={MODAL_CODE} language="tsx" />
        </Demo>
      </DocSection>

      <DocSection id="alerta" title="Ventana de alerta: lo irreversible" description="No lleva X ni se cierra con clic afuera: hay que elegir un botón. Para borrar un registro con nombre, se pide escribirlo.">
        <Demo title="Eliminar con confirmación escrita">
          <ConfirmDialog
            trigger={<Button variant="destructive">Eliminar vacante</Button>}
            title="¿Eliminar «Analista de datos»?"
            description="Se pierden las 18 postulaciones. Esta acción no se puede deshacer."
            variant="destructive"
            confirmLabel="Eliminar"
            confirmationText="Analista de datos"
            onConfirm={() => toast.success("Vacante eliminada")}
          />
          <CodeBlock code={CONFIRM_CODE} language="tsx" />
        </Demo>
      </DocSection>

      <DocSection id="reglas" title="Reglas">
        <DoDont
          dos={[
            "Crear, editar y ver detalle: drawer. Decisiones cortas: modal. Lo destructivo: ventana de alerta.",
            "Título siempre, en forma de pregunta si hay que decidir: «¿Mover 3 candidatos a Entrevistas?».",
            "Un solo primario en el pie, a la derecha; Cancelar como secundario a su izquierda.",
            "Después de una acción con éxito, un toast; no otra ventana.",
          ]}
          donts={[
            "No anides un modal sobre otro modal; si hace falta un segundo nivel, es un drawer.",
            "No uses un modal para un formulario largo: la persona pierde la página de fondo.",
            "No cierres una ventana de alerta con clic afuera ni le pongas X.",
            "No abras nada al cargar la página sin que la persona lo pida, salvo la sesión por expirar.",
          ]}
        />
      </DocSection>
    </div>
  );
}
