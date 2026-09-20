import * as React from "react";
import { StatusBadge, type StatusState } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const STATES = ["neutral", "pending", "success", "failed", "info"] as const;

const STATE_LABEL: Record<StatusState, string> = {
  neutral: "Por iniciar",
  pending: "Pendiente",
  success: "Éxito",
  failed: "Fallido",
  info: "Info",
};

function TransitionsDemo() {
  const [state, setState] = React.useState<StatusState>("neutral");
  return (
    <div className="flex flex-col items-center gap-4">
      <StatusBadge state={state} />
      <div className="flex flex-wrap justify-center gap-1.5">
        {STATES.map((value) => (
          <Button key={value} size="xs" variant={state === value ? "default" : "outline"} onClick={() => setState(value)}>
            {STATE_LABEL[value]}
          </Button>
        ))}
      </div>
    </div>
  );
}

const SEND_LABELS = { neutral: "Sin enviar", pending: "Enviando", success: "Enviada", failed: "Rechazada" } as const;

function SendFlowDemo() {
  const [state, setState] = React.useState<StatusState>("neutral");
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const send = (shouldFail: boolean) => {
    setState("pending");
    timers.current.push(window.setTimeout(() => setState(shouldFail ? "failed" : "success"), 1400));
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-text-secondary">Evaluación de Laura Méndez</span>
      <StatusBadge state={state} labels={SEND_LABELS} />
      <Button size="sm" onClick={() => send(false)} disabled={state === "pending"}>
        Enviar
      </Button>
      <Button size="sm" variant="outline" onClick={() => send(true)} disabled={state === "pending"}>
        Simular fallo
      </Button>
    </div>
  );
}

export const statusBadgeAnimatedEntry = defineEntry({
  id: "status-badge-animated",
  name: "StatusBadge (animado)",
  group: "data-display",
  description:
    "La píldora de estado con transición: al cambiar `state`, el icono entra con un resorte y el texto se desliza, así el ojo ve que algo pasó y no solo que algo es distinto. El estado pendiente lleva un spinner girando; el resto, un icono fijo.",
  importPath: 'import { StatusBadge } from "@/components/status-badge"',
  sourcePath: "src/components/status-badge.tsx",
  status: "stable",
  tags: ["framer-motion", "badge"],
  playground: definePlayground({
    controls: {
      state: { type: "select", options: STATES, default: "pending" },
      label: { type: "text", default: "", placeholder: "Etiqueta por defecto" },
    },
    render: ({ state, label }) => <StatusBadge state={state as StatusState} labels={label ? { [state]: label } : undefined} />,
    code: ({ state, label }) => `<StatusBadge state="${state}"${label ? ` labels={{ ${state}: "${label}" }}` : ""} />`,
  }),
  examples: [
    {
      id: "transitions",
      title: "Transiciones entre estados",
      description: "Cambia el estado con los botones para ver la animación de icono y texto.",
      code: `const [state, setState] = React.useState<StatusState>("neutral");

<StatusBadge state={state} />
<Button size="xs" onClick={() => setState("pending")}>Pendiente</Button>
<Button size="xs" onClick={() => setState("success")}>Éxito</Button>`,
      render: () => <TransitionsDemo />,
    },
    {
      id: "send-flow",
      title: "Flujo de envío",
      description: "Un caso real: sin enviar, enviando (spinner) y el resultado. Las etiquetas vienen del dominio con `labels`.",
      code: `const SEND_LABELS = { neutral: "Sin enviar", pending: "Enviando", success: "Enviada", failed: "Rechazada" };
const [state, setState] = React.useState<StatusState>("neutral");

const send = async () => {
  setState("pending");
  try {
    await api.send();
    setState("success");
  } catch {
    setState("failed");
  }
};

<StatusBadge state={state} labels={SEND_LABELS} />`,
      render: () => <SendFlowDemo />,
    },
    {
      id: "all",
      title: "Todos los estados",
      code: `<StatusBadge state="neutral" />
<StatusBadge state="pending" />
<StatusBadge state="success" />
<StatusBadge state="failed" />
<StatusBadge state="info" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          {STATES.map((state) => (
            <StatusBadge key={state} state={state} />
          ))}
        </div>
      ),
    },
  ],
  props: [
    { name: "state", type: '"pending" | "failed" | "success" | "neutral" | "info"', default: '"pending"', description: "El estado actual; cambiarlo dispara la transición." },
    { name: "labels", type: "Partial<Record<StatusState, string>>", description: "Etiquetas propias por estado; se mezclan con las de fábrica." },
    { name: "className", type: "string", description: "Clases extra sobre la píldora." },
  ],
  guidelines: {
    do: ["Úsalo donde el estado cambia delante del usuario: envíos, sincronizaciones, procesos.", "Pasa `labels` con el vocabulario del dominio (Enviada, Rechazada…)."],
    dont: ["No lo uses en listas largas y estáticas: cada instancia monta framer-motion; ahí va `StatusBadge` de data-display.", "No cambies el estado en cada render; la animación se dispara con cada cambio de `state`."],
  },
  related: ["status-badge", "badge"],
});
