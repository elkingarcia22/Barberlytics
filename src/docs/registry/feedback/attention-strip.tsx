import * as React from "react";
import { AlertTriangle, BellRing, CheckCircle2, Clock, Info, UserX } from "lucide-react";
import { AttentionAction, AttentionStrip, type AttentionTone } from "@/components/feedback/AttentionStrip";
import { defineEntry, definePlayground } from "../types";

const TONES = ["brand", "positive", "warning", "negative", "neutral"] as const;

function FilterStripDemo() {
  const [active, setActive] = React.useState<string | null>(null);
  const toggle = (id: string) => setActive((current) => (current === id ? null : id));
  return (
    <div className="space-y-3">
      <AttentionStrip
        label="Avisos del ciclo"
        icon={AlertTriangle}
        title="14 colaboradores reclaman atención"
        detail="Pulsa un motivo para filtrar la lista"
      >
        <AttentionAction icon={Clock} label="Sin evaluar" hint="Aún no han recibido ninguna evaluación en este ciclo." value={9} tone="warning" active={active === "pending"} onClick={() => toggle("pending")} />
        <AttentionAction icon={UserX} label="Sin líder" hint="No tienen un líder asignado que pueda evaluarlos." value={5} tone="negative" active={active === "no-leader"} onClick={() => toggle("no-leader")} />
      </AttentionStrip>
      <p className="text-[12px] text-text-muted">Filtro activo: {active ?? "ninguno"}</p>
    </div>
  );
}

export const attentionStripEntry = defineEntry({
  id: "attention-strip",
  name: "AttentionStrip",
  group: "feedback",
  description:
    "La franja de avisos: una sola fila que dice cuánto reclama atención y ofrece un botón por motivo. El ánimo va en el filete lateral y el disco del icono, no en un lavado de color sobre toda la fila.",
  importPath: 'import { AttentionStrip, AttentionAction } from "@/components/feedback/AttentionStrip"',
  sourcePath: "src/components/feedback/AttentionStrip.tsx",
  status: "stable",
  tags: ["tooltip", "aria-pressed"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", options: TONES, default: "warning" },
      title: { type: "text", default: "14 colaboradores reclaman atención" },
      detail: { type: "text", default: "Pulsa un motivo para filtrar la lista" },
      withActions: { type: "boolean", label: "Con acciones", default: true },
    },
    layout: "stretch",
    render: ({ tone, title, detail, withActions }) => (
      <AttentionStrip label="Avisos" icon={BellRing} tone={tone as AttentionTone} title={title} detail={detail}>
        {withActions && (
          <>
            <AttentionAction icon={Clock} label="Sin evaluar" hint="Aún no han recibido evaluación." value={9} tone="warning" onClick={() => {}} />
            <AttentionAction icon={UserX} label="Sin líder" hint="No tienen líder asignado." value={5} tone="negative" onClick={() => {}} />
          </>
        )}
      </AttentionStrip>
    ),
    code: ({ tone, title, detail, withActions }) => {
      const toneAttr = tone !== "warning" ? ` tone="${tone}"` : "";
      const open = `<AttentionStrip label="Avisos" icon={BellRing}${toneAttr} title="${title}" detail="${detail}"`;
      if (!withActions) return `${open} />`;
      return `${open}>
  <AttentionAction icon={Clock} label="Sin evaluar" hint="Aún no han recibido evaluación." value={9} tone="warning" onClick={filterPending} />
  <AttentionAction icon={UserX} label="Sin líder" hint="No tienen líder asignado." value={5} tone="negative" onClick={filterNoLeader} />
</AttentionStrip>`;
    },
  }),
  examples: [
    {
      id: "as-filter",
      title: "Acciones como filtro",
      description: "Con `active` el botón se pinta encendido: el aviso además es un filtro puesto.",
      layout: "stretch",
      code: `const [active, setActive] = React.useState<string | null>(null);
const toggle = (id: string) => setActive((current) => (current === id ? null : id));

<AttentionStrip label="Avisos del ciclo" icon={AlertTriangle} title="14 colaboradores reclaman atención" detail="Pulsa un motivo para filtrar la lista">
  <AttentionAction icon={Clock} label="Sin evaluar" hint="Aún no han recibido ninguna evaluación en este ciclo." value={9} tone="warning" active={active === "pending"} onClick={() => toggle("pending")} />
  <AttentionAction icon={UserX} label="Sin líder" hint="No tienen un líder asignado que pueda evaluarlos." value={5} tone="negative" active={active === "no-leader"} onClick={() => toggle("no-leader")} />
</AttentionStrip>`,
      render: () => <FilterStripDemo />,
    },
    {
      id: "tones",
      title: "Tonos",
      description: "El tono cambia solo el filete y el disco del icono; la superficie es la misma que la de las tarjetas.",
      layout: "stretch",
      code: `<AttentionStrip label="Todo al día" icon={CheckCircle2} tone="positive" title="Todo al día" detail="No hay pendientes en este ciclo" />
<AttentionStrip label="Novedad" icon={Info} tone="brand" title="Nueva plantilla disponible" detail="Puedes aplicarla al próximo ciclo" />
<AttentionStrip label="Cierre" icon={AlertTriangle} tone="negative" title="El ciclo cierra en 2 días" detail="Quedan 31 evaluaciones sin enviar" />
<AttentionStrip label="Archivado" icon={Clock} tone="neutral" title="Ciclo archivado" detail="Solo lectura" />`,
      render: () => (
        <div className="space-y-3">
          <AttentionStrip label="Todo al día" icon={CheckCircle2} tone="positive" title="Todo al día" detail="No hay pendientes en este ciclo" />
          <AttentionStrip label="Novedad" icon={Info} tone="brand" title="Nueva plantilla disponible" detail="Puedes aplicarla al próximo ciclo" />
          <AttentionStrip label="Cierre" icon={AlertTriangle} tone="negative" title="El ciclo cierra en 2 días" detail="Quedan 31 evaluaciones sin enviar" />
          <AttentionStrip label="Archivado" icon={Clock} tone="neutral" title="Ciclo archivado" detail="Solo lectura" />
        </div>
      ),
    },
    {
      id: "action-tones",
      title: "Tono por acción",
      description: "Cada `AttentionAction` colorea su propio icono según el motivo; la cifra se formatea con separador de miles.",
      layout: "stretch",
      code: `<AttentionStrip label="Resumen" icon={BellRing} tone="brand" title="1.240 avisos en la organización" detail="Agrupados por motivo">
  <AttentionAction icon={CheckCircle2} label="Completados" hint="Evaluaciones enviadas y cerradas." value={1024} tone="positive" onClick={goCompleted} />
  <AttentionAction icon={Clock} label="Pendientes" hint="Evaluaciones sin enviar." value={198} tone="warning" onClick={goPending} />
  <AttentionAction icon={UserX} label="Bloqueados" hint="Sin líder o sin plantilla asignada." value={18} tone="negative" onClick={goBlocked} />
</AttentionStrip>`,
      render: () => (
        <AttentionStrip label="Resumen" icon={BellRing} tone="brand" title="1.240 avisos en la organización" detail="Agrupados por motivo">
          <AttentionAction icon={CheckCircle2} label="Completados" hint="Evaluaciones enviadas y cerradas." value={1024} tone="positive" onClick={() => {}} />
          <AttentionAction icon={Clock} label="Pendientes" hint="Evaluaciones sin enviar." value={198} tone="warning" onClick={() => {}} />
          <AttentionAction icon={UserX} label="Bloqueados" hint="Sin líder o sin plantilla asignada." value={18} tone="negative" onClick={() => {}} />
        </AttentionStrip>
      ),
    },
  ],
  props: [
    { name: "label", type: "string", description: "Cómo se anuncia el grupo a un lector de pantalla (`aria-label`)." },
    { name: "icon", type: "LucideIcon", description: "Icono del disco a la izquierda de la franja." },
    { name: "tone", type: '"brand" | "positive" | "warning" | "negative" | "neutral"', default: '"warning"', description: "Color del filete lateral y del disco del icono." },
    { name: "title", type: "string", description: "La cifra de arriba: cuánto reclama atención." },
    { name: "detail", type: "string", description: "La línea de abajo: qué hacer con la fila." },
    { name: "children", type: "React.ReactNode", description: "Los botones, un `AttentionAction` por motivo." },
    { name: "AttentionAction.icon", type: "LucideIcon", description: "Icono del motivo; se colorea con `tone`." },
    { name: "AttentionAction.label", type: "string", description: "Nombre del motivo." },
    { name: "AttentionAction.hint", type: "string", description: "Explicación del aviso, mostrada en un tooltip." },
    { name: "AttentionAction.value", type: "number", description: "Cifra del motivo, formateada con separador de miles (es-CO)." },
    { name: "AttentionAction.tone", type: "AttentionTone", default: '"brand"', description: "Color del icono del botón cuando no está activo." },
    { name: "AttentionAction.active", type: "boolean", default: "false", description: "Se pinta encendido cuando el aviso es además un filtro puesto." },
    { name: "AttentionAction.onClick", type: "() => void", description: "Qué pasa al pulsar el motivo." },
  ],
  guidelines: {
    do: ["Una sola franja por bloque: agrupa varios motivos dentro con `AttentionAction`.", "Usa `active` cuando el aviso filtra la lista que está debajo.", "Escribe `hint` como una frase completa: es lo que explica el aviso."],
    dont: ["No apiles varias franjas del mismo tono para decir lo mismo.", "No la uses para mensajes de sistema o errores de formulario; para eso está Alert.", "No pongas más de tres o cuatro acciones: la fila se vuelve una barra de menú."],
  },
  related: ["alert", "badge", "button", "tooltip"],
});
