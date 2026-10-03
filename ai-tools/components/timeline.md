# Timeline

Línea de tiempo de eventos: un punto o icono de 24px sobre una línea vertical continua, con título, hora y una descripción o cuerpo opcional. Úsala para historiales (de un candidato, de una solicitud) y registros de actividad.

Familia: Datos · Doc: `/docs#/components/timeline` · Fuente: `src/components/data-display/Timeline.tsx`

```ts
import { Timeline, TimelineItem } from "@/components/data-display/Timeline"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Timeline.align` | `"left" \| "alternate"` | `"left"` | Lado de los eventos respecto a la línea. |
| `TimelineItem.icon` | `React.ReactNode` |  | Icono de 12px dentro del punto. Sin él se dibuja un punto sólido. |
| `TimelineItem.tone` | `"default" \| "primary" \| "positive" \| "negative" \| "warning"` | `"default"` | Color del punto y del icono. |
| `TimelineItem.title` | `React.ReactNode` |  | Qué pasó, en pocas palabras. |
| `TimelineItem.time` | `React.ReactNode` |  | Fecha u hora, alineada a la derecha con dígitos tabulares. |
| `TimelineItem.description` | `React.ReactNode` |  | Una línea de contexto bajo el título. |
| `TimelineItem.children` | `React.ReactNode` |  | Cuerpo libre bajo la descripción. |

## Guías

- Sí: Ordena del más reciente al más antiguo salvo que el flujo sea cronológico (un proceso de selección).
- Sí: Escribe títulos en pasado y con sujeto («CV revisado por Renata»).
- Sí: Usa la hora relativa («hace 2 h») en actividad reciente y la fecha absoluta en historiales.
- No: No mezcles más de dos tonos de color en la misma lista si no son estados reales.
- No: No pongas formularios dentro del cuerpo; enlaza a la pantalla correspondiente.
- No: No uses `alternate` en columnas de menos de 480px.

Relacionados: status-badge, stepper, badge, avatar

## Ejemplos

### Historial de un candidato

Los tonos señalan el hito (`primary` al entrar, `positive` al superar una fase, `warning` si hay algo pendiente). El cuerpo admite cualquier nodo: aquí una cita de la entrevistadora.

```tsx
<Timeline>
  <TimelineItem icon={<UserPlus />} tone="primary" title="Postulación recibida" time="12 mar, 09:14" description="Desde LinkedIn…" />
  <TimelineItem icon={<FileText />} title="CV revisado por Renata Méndez" time="12 mar, 16:40" />
  <TimelineItem icon={<Mail />} title="Invitación a entrevista enviada" time="13 mar, 10:02" />
  <TimelineItem icon={<CalendarCheck />} tone="positive" title="Entrevista completada" time="17 mar, 15:30">
    <blockquote>«Muy buen criterio de sistemas. Pasa a la prueba técnica.»</blockquote>
  </TimelineItem>
  <TimelineItem tone="warning" title="Prueba técnica pendiente" time="Vence el 24 mar" />
</Timeline>
```

### Tonos

Sin icono, el punto es un círculo sólido del color del tono. Reserva `negative` para rechazos o fallos.

```tsx
<TimelineItem tone="default" title="Comentario añadido" />
<TimelineItem tone="primary" title="Solicitud creada" />
<TimelineItem tone="positive" title="Aprobada por RR. HH." />
<TimelineItem tone="warning" title="Falta la firma del líder" />
<TimelineItem tone="negative" icon={<XCircle />} title="Rechazada" />
```

### Alternada

`align="alternate"` reparte los eventos a ambos lados de la línea; funciona bien en resúmenes anchos, no en paneles estrechos.

```tsx
<Timeline align="alternate">
  <TimelineItem … />
</Timeline>
```

### Con cuerpo enriquecido

El `children` va bajo la descripción: badges, adjuntos o un resumen del cambio.

```tsx
<TimelineItem icon={<FileText />} title="Plan de formación actualizado" time="hace 2 h" description="Se añadieron 3 cursos al itinerario de liderazgo.">
  <div className="flex flex-wrap gap-1.5">
    <Badge variant="secondary">Feedback efectivo</Badge>
    <Badge variant="secondary">Delegación</Badge>
    <Badge variant="secondary">1:1 que funcionan</Badge>
  </div>
</TimelineItem>
```
