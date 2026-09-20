import * as React from "react";
import { SaveIndicator, type SaveStatus } from "@/components/ai-interaction";
import { Input } from "@/components/ui/input";
import { defineEntry, definePlayground } from "../types";

const STATUSES = ["idle", "saving", "saved", "error", "offline"] as const;
const DEBOUNCE_MS = 700;
const SAVE_MS = 900;

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function AutosaveField() {
  const [value, setValue] = React.useState("Encuesta de clima 2026");
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = React.useState<string>();
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const debounce = setTimeout(() => {
      setStatus("saving");
      const save = setTimeout(() => {
        setStatus("saved");
        setSavedAt(formatTime(new Date()));
      }, SAVE_MS);
      return () => clearTimeout(save);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounce);
  }, [value]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="autosave-title" className="text-xs font-medium text-text-secondary">
          Título de la encuesta
        </label>
        <SaveIndicator status={status} timestamp={savedAt} />
      </div>
      <Input id="autosave-title" value={value} onChange={(event) => setValue(event.target.value)} />
    </div>
  );
}

export const saveIndicatorEntry = defineEntry({
  id: "save-indicator",
  name: "SaveIndicator",
  group: "ai",
  description:
    "Indicador discreto del estado de autoguardado: en la nube, guardando, guardado, error o sin conexión. Icono y color cambian por estado, y con `timestamp` muestra la hora del último guardado.",
  importPath: 'import { SaveIndicator } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/SaveIndicator.tsx",
  status: "stable",
  tags: ["autosave", "estado"],
  playground: definePlayground({
    controls: {
      status: { type: "select", options: STATUSES, default: "saved" },
      label: { type: "text", default: "", placeholder: "Texto por defecto del estado" },
      timestamp: { type: "text", label: "Hora (solo saved)", default: "10:42" },
      compact: { type: "boolean", label: "Compacto", default: false },
    },
    render: ({ status, label, timestamp, compact }) => (
      <SaveIndicator status={status as SaveStatus} label={label || undefined} timestamp={timestamp || undefined} compact={compact} />
    ),
    code: ({ status, label, timestamp, compact }) => {
      const attrs = [
        `status="${status}"`,
        label ? `label="${label}"` : "",
        timestamp && status === "saved" ? `timestamp="${timestamp}"` : "",
        compact ? "compact" : "",
      ].filter(Boolean);
      return `<SaveIndicator ${attrs.join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "statuses",
      title: "Estados",
      description: "Cada estado trae icono, color y texto por defecto.",
      code: `<SaveIndicator status="idle" />
<SaveIndicator status="saving" />
<SaveIndicator status="saved" timestamp="10:42" />
<SaveIndicator status="error" />
<SaveIndicator status="offline" />`,
      render: () => (
        <div className="flex flex-col gap-3">
          <SaveIndicator status="idle" />
          <SaveIndicator status="saving" />
          <SaveIndicator status="saved" timestamp="10:42" />
          <SaveIndicator status="error" />
          <SaveIndicator status="offline" />
        </div>
      ),
    },
    {
      id: "autosave",
      title: "Ciclo de autoguardado",
      description: "Escribe en el campo: tras una pausa pasa a «Guardando…» y luego a «Guardado» con la hora.",
      code: `const [status, setStatus] = React.useState<SaveStatus>("idle");
const [savedAt, setSavedAt] = React.useState<string>();

// Al cambiar el valor (con debounce):
setStatus("saving");
await save();
setStatus("saved");
setSavedAt(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));

<SaveIndicator status={status} timestamp={savedAt} />`,
      render: () => <AutosaveField />,
    },
    {
      id: "compact",
      title: "Compacto",
      description: "Solo el icono, para barras de herramientas o cabeceras estrechas.",
      code: `<SaveIndicator status="saving" compact />
<SaveIndicator status="saved" compact />
<SaveIndicator status="error" compact />`,
      render: () => (
        <div className="flex items-center gap-4">
          <SaveIndicator status="saving" compact />
          <SaveIndicator status="saved" compact />
          <SaveIndicator status="error" compact />
        </div>
      ),
    },
  ],
  props: [
    { name: "status", type: '"idle" | "saving" | "saved" | "error" | "offline"', description: "Estado actual. Obligatorio." },
    { name: "label", type: "string", description: "Texto que reemplaza al del estado." },
    { name: "timestamp", type: "string", description: "Hora del último guardado; solo se muestra con `status=\"saved\"`." },
    { name: "compact", type: "boolean", default: "false", description: "Oculta el texto y deja solo el icono." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Colócalo cerca de lo que se guarda: en la cabecera del formulario o del editor.", "Pasa `timestamp` ya formateado en el idioma del usuario.", "Mantén el estado `saved` visible; no lo escondas al segundo."],
    dont: ["No lo uses como confirmación de acciones explícitas (para eso está el toast).", "No muestres `error` sin ofrecer una vía de reintento cerca."],
  },
  related: ["badge", "toast", "input"],
});
