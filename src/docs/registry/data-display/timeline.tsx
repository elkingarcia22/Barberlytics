import { CalendarCheck, FileText, Mail, MessageSquare, UserPlus, XCircle } from "lucide-react";
import { Timeline, TimelineItem, type TimelineAlign } from "@/components/data-display/Timeline";
import { Badge } from "@/components/ui/badge";
import { defineEntry, definePlayground } from "../types";

const TONES = ["default", "primary", "positive", "negative", "warning"] as const;
type Tone = (typeof TONES)[number];
type Align = TimelineAlign;

function CandidateHistory({ align = "left" }: { align?: Align }) {
  return (
    <Timeline align={align} className="w-full max-w-md">
      <TimelineItem icon={<UserPlus />} tone="primary" title="Postulación recibida" time="12 mar, 09:14" description="Desde LinkedIn, para Diseñador/a de producto senior." />
      <TimelineItem icon={<FileText />} title="CV revisado por Renata Méndez" time="12 mar, 16:40" />
      <TimelineItem icon={<Mail />} title="Invitación a entrevista enviada" time="13 mar, 10:02" description="Primera entrevista con la líder de diseño." />
      <TimelineItem icon={<CalendarCheck />} tone="positive" title="Entrevista completada" time="17 mar, 15:30">
        <blockquote className="rounded-lg border border-border/60 bg-surface-subtle px-3 py-2 text-xs text-text-secondary">
          «Muy buen criterio de sistemas. Pasa a la prueba técnica.»
        </blockquote>
      </TimelineItem>
      <TimelineItem tone="warning" title="Prueba técnica pendiente" time="Vence el 24 mar" />
    </Timeline>
  );
}

export const timelineEntry = defineEntry({
  id: "timeline",
  name: "Timeline",
  group: "data-display",
  description:
    "Línea de tiempo de eventos: un punto o icono de 24px sobre una línea vertical continua, con título, hora y una descripción o cuerpo opcional. Úsala para historiales (de un candidato, de una solicitud) y registros de actividad.",
  importPath: 'import { Timeline, TimelineItem } from "@/components/data-display/Timeline"',
  sourcePath: "src/components/data-display/Timeline.tsx",
  status: "stable",
  tags: ["history", "activity"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", options: TONES, default: "primary" },
      withIcon: { type: "boolean", label: "Con icono", default: true },
      withTime: { type: "boolean", label: "Con hora", default: true },
      description: { type: "text", default: "Primera entrevista con la líder de diseño." },
    },
    layout: "stretch",
    render: ({ tone, withIcon, withTime, description }) => (
      <Timeline className="max-w-md">
        <TimelineItem
          icon={withIcon ? <Mail /> : undefined}
          tone={tone as Tone}
          title="Invitación a entrevista enviada"
          time={withTime ? "13 mar, 10:02" : undefined}
          description={description || undefined}
        />
        <TimelineItem title="CV revisado" time={withTime ? "12 mar, 16:40" : undefined} />
        <TimelineItem icon={withIcon ? <UserPlus /> : undefined} title="Postulación recibida" time={withTime ? "12 mar, 09:14" : undefined} />
      </Timeline>
    ),
    code: ({ tone, withIcon, withTime, description }) => {
      const attrs = [
        withIcon ? "icon={<Mail />}" : "",
        tone !== "default" ? `tone="${tone}"` : "",
        'title="Invitación a entrevista enviada"',
        withTime ? 'time="13 mar, 10:02"' : "",
        description ? `description="${description}"` : "",
      ].filter(Boolean);
      return `<Timeline>
  <TimelineItem
    ${attrs.join("\n    ")}
  />
  <TimelineItem title="CV revisado" ${withTime ? 'time="12 mar, 16:40" ' : ""}/>
  <TimelineItem ${withIcon ? "icon={<UserPlus />} " : ""}title="Postulación recibida" ${withTime ? 'time="12 mar, 09:14" ' : ""}/>
</Timeline>`;
    },
  }),
  examples: [
    {
      id: "candidate",
      title: "Historial de un candidato",
      description: "Los tonos señalan el hito (`primary` al entrar, `positive` al superar una fase, `warning` si hay algo pendiente). El cuerpo admite cualquier nodo: aquí una cita de la entrevistadora.",
      layout: "start",
      code: `<Timeline>
  <TimelineItem icon={<UserPlus />} tone="primary" title="Postulación recibida" time="12 mar, 09:14" description="Desde LinkedIn…" />
  <TimelineItem icon={<FileText />} title="CV revisado por Renata Méndez" time="12 mar, 16:40" />
  <TimelineItem icon={<Mail />} title="Invitación a entrevista enviada" time="13 mar, 10:02" />
  <TimelineItem icon={<CalendarCheck />} tone="positive" title="Entrevista completada" time="17 mar, 15:30">
    <blockquote>«Muy buen criterio de sistemas. Pasa a la prueba técnica.»</blockquote>
  </TimelineItem>
  <TimelineItem tone="warning" title="Prueba técnica pendiente" time="Vence el 24 mar" />
</Timeline>`,
      render: () => <CandidateHistory />,
    },
    {
      id: "tones",
      title: "Tonos",
      description: "Sin icono, el punto es un círculo sólido del color del tono. Reserva `negative` para rechazos o fallos.",
      layout: "start",
      code: `<TimelineItem tone="default" title="Comentario añadido" />
<TimelineItem tone="primary" title="Solicitud creada" />
<TimelineItem tone="positive" title="Aprobada por RR. HH." />
<TimelineItem tone="warning" title="Falta la firma del líder" />
<TimelineItem tone="negative" icon={<XCircle />} title="Rechazada" />`,
      render: () => (
        <Timeline className="w-72">
          <TimelineItem tone="default" icon={<MessageSquare />} title="Comentario añadido" time="Hoy" />
          <TimelineItem tone="primary" title="Solicitud creada" time="Ayer" />
          <TimelineItem tone="positive" title="Aprobada por RR. HH." time="Lun" />
          <TimelineItem tone="warning" title="Falta la firma del líder" time="Vie" />
          <TimelineItem tone="negative" icon={<XCircle />} title="Rechazada" time="Jue" />
        </Timeline>
      ),
    },
    {
      id: "alternate",
      title: "Alternada",
      description: "`align=\"alternate\"` reparte los eventos a ambos lados de la línea; funciona bien en resúmenes anchos, no en paneles estrechos.",
      layout: "stretch",
      code: `<Timeline align="alternate">
  <TimelineItem … />
</Timeline>`,
      render: () => <CandidateHistory align="alternate" />,
    },
    {
      id: "with-body",
      title: "Con cuerpo enriquecido",
      description: "El `children` va bajo la descripción: badges, adjuntos o un resumen del cambio.",
      layout: "start",
      code: `<TimelineItem icon={<FileText />} title="Plan de formación actualizado" time="hace 2 h" description="Se añadieron 3 cursos al itinerario de liderazgo.">
  <div className="flex flex-wrap gap-1.5">
    <Badge variant="secondary">Feedback efectivo</Badge>
    <Badge variant="secondary">Delegación</Badge>
    <Badge variant="secondary">1:1 que funcionan</Badge>
  </div>
</TimelineItem>`,
      render: () => (
        <Timeline className="w-full max-w-md">
          <TimelineItem icon={<FileText />} tone="primary" title="Plan de formación actualizado" time="hace 2 h" description="Se añadieron 3 cursos al itinerario de liderazgo.">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">Feedback efectivo</Badge>
              <Badge variant="secondary">Delegación</Badge>
              <Badge variant="secondary">1:1 que funcionan</Badge>
            </div>
          </TimelineItem>
          <TimelineItem title="Plan asignado a 12 personas" time="ayer" />
        </Timeline>
      ),
    },
  ],
  props: [
    { name: "Timeline.align", type: '"left" | "alternate"', default: '"left"', description: "Lado de los eventos respecto a la línea." },
    { name: "TimelineItem.icon", type: "React.ReactNode", description: "Icono de 12px dentro del punto. Sin él se dibuja un punto sólido." },
    { name: "TimelineItem.tone", type: '"default" | "primary" | "positive" | "negative" | "warning"', default: '"default"', description: "Color del punto y del icono." },
    { name: "TimelineItem.title", type: "React.ReactNode", description: "Qué pasó, en pocas palabras." },
    { name: "TimelineItem.time", type: "React.ReactNode", description: "Fecha u hora, alineada a la derecha con dígitos tabulares." },
    { name: "TimelineItem.description", type: "React.ReactNode", description: "Una línea de contexto bajo el título." },
    { name: "TimelineItem.children", type: "React.ReactNode", description: "Cuerpo libre bajo la descripción." },
  ],
  guidelines: {
    do: ["Ordena del más reciente al más antiguo salvo que el flujo sea cronológico (un proceso de selección).", "Escribe títulos en pasado y con sujeto («CV revisado por Renata»).", "Usa la hora relativa («hace 2 h») en actividad reciente y la fecha absoluta en historiales."],
    dont: ["No mezcles más de dos tonos de color en la misma lista si no son estados reales.", "No pongas formularios dentro del cuerpo; enlaza a la pantalla correspondiente.", "No uses `alternate` en columnas de menos de 480px."],
  },
  related: ["status-badge", "stepper", "badge", "avatar"],
});
