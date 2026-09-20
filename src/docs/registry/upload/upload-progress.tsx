import * as React from "react";
import { RotateCcw, Upload } from "lucide-react";
import { UploadProgress, type UploadProgressStatus } from "@/components/upload";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const STATUSES = ["idle", "validating", "uploading", "success", "error"] as const;
const TICK_MS = 120;
const STEP = 4;
const VALIDATING_MS = 900;

const STATUS_LABEL: Record<UploadProgressStatus, string> = {
  idle: "En espera",
  validating: "Validando datos…",
  uploading: "Cargando archivo…",
  success: "Carga completada",
  error: "Falló la carga",
};

/** Simula una carga completa: uploading 0→100, validating, success. Sin backend. */
function SimulatedUpload() {
  const [value, setValue] = React.useState(0);
  const [status, setStatus] = React.useState<UploadProgressStatus>("idle");

  React.useEffect(() => {
    if (status !== "uploading") return;
    const timer = window.setInterval(() => {
      setValue((prev) => {
        if (prev + STEP >= 100) {
          window.clearInterval(timer);
          setStatus("validating");
          return 100;
        }
        return prev + STEP;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [status]);

  React.useEffect(() => {
    if (status !== "validating") return;
    const timer = window.setTimeout(() => setStatus("success"), VALIDATING_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const start = () => {
    setValue(0);
    setStatus("uploading");
  };
  const isBusy = status === "uploading" || status === "validating";

  return (
    <div className="w-full max-w-lg space-y-4">
      <UploadProgress value={value} status={status} label={STATUS_LABEL[status]} description="informe-trimestral.pdf · 1.2 MB" />
      <div className="flex gap-2">
        <Button size="sm" onClick={start} disabled={isBusy}>
          {status === "success" ? <RotateCcw /> : <Upload />}
          {status === "success" ? "Repetir" : "Iniciar carga"}
        </Button>
      </div>
    </div>
  );
}

export const uploadProgressEntry = defineEntry({
  id: "upload-progress",
  name: "UploadProgress",
  group: "upload",
  description:
    "Barra de progreso con etiqueta, descripción, porcentaje y un icono por estado (cargando, validando, éxito, error). Es totalmente controlada: no tiene temporizadores, el padre decide el valor y el estado.",
  importPath: 'import { UploadProgress } from "@/components/upload"',
  sourcePath: "src/components/upload/UploadProgress.tsx",
  status: "stable",
  tags: ["controlado", "a11y"],
  playground: definePlayground({
    controls: {
      status: { type: "select", options: STATUSES, default: "uploading" },
      value: { type: "number", label: "Valor", default: 42, min: 0, max: 100, step: 1 },
      label: { type: "text", default: "Cargando archivo…" },
      showValue: { type: "boolean", label: "Mostrar %", default: true },
    },
    layout: "stretch",
    render: ({ status, value, label, showValue }) => (
      <UploadProgress
        value={value}
        status={status as UploadProgressStatus}
        label={label}
        description="informe-trimestral.pdf · 1.2 MB"
        error="Se perdió la conexión a mitad de la carga."
        showValue={showValue}
        className="w-full max-w-lg"
      />
    ),
    code: ({ status, value, label, showValue }) =>
      `<UploadProgress
  value={${value}}
  status="${status}"
  label="${label}"
  description="informe-trimestral.pdf · 1.2 MB"${status === "error" ? '\n  error="Se perdió la conexión a mitad de la carga."' : ""}${showValue ? "" : "\n  showValue={false}"}
/>`,
  }),
  examples: [
    {
      id: "simulated",
      title: "Carga simulada",
      description: "Un `setInterval` en el padre sube el valor; al llegar a 100 pasa a `validating` y luego a `success`. El componente solo pinta.",
      layout: "stretch",
      code: `const [value, setValue] = React.useState(0);
const [status, setStatus] = React.useState<UploadProgressStatus>("idle");

React.useEffect(() => {
  if (status !== "uploading") return;
  const timer = window.setInterval(() => {
    setValue((prev) => {
      if (prev + 4 >= 100) {
        window.clearInterval(timer);
        setStatus("validating");
        return 100;
      }
      return prev + 4;
    });
  }, 120);
  return () => window.clearInterval(timer);
}, [status]);

<UploadProgress value={value} status={status} label={STATUS_LABEL[status]} description="informe-trimestral.pdf · 1.2 MB" />
<Button onClick={() => { setValue(0); setStatus("uploading"); }}>Iniciar carga</Button>`,
      render: () => <SimulatedUpload />,
    },
    {
      id: "states",
      title: "Estados",
      description: "El icono y el color cambian con `status`; en `idle` se oculta el porcentaje.",
      layout: "stretch",
      code: `<UploadProgress status="idle" value={0} label="En espera" description="Selecciona un archivo" />
<UploadProgress status="uploading" value={58} label="Cargando archivo…" />
<UploadProgress status="validating" value={100} label="Validando datos…" />
<UploadProgress status="success" value={100} label="Carga completada" description="1.240 filas importadas" />
<UploadProgress status="error" value={73} label="Falló la carga" error="Se perdió la conexión a mitad de la carga." />`,
      render: () => (
        <div className="w-full max-w-lg space-y-5">
          <UploadProgress status="idle" value={0} label="En espera" description="Selecciona un archivo" />
          <UploadProgress status="uploading" value={58} label="Cargando archivo…" />
          <UploadProgress status="validating" value={100} label="Validando datos…" />
          <UploadProgress status="success" value={100} label="Carga completada" description="1.240 filas importadas" />
          <UploadProgress status="error" value={73} label="Falló la carga" error="Se perdió la conexión a mitad de la carga." />
        </div>
      ),
    },
    {
      id: "minimal",
      title: "Sin porcentaje ni etiqueta",
      description: "Con `showValue={false}` y sin `label` queda solo la barra y el icono: útil en filas de una tabla.",
      layout: "stretch",
      code: `<UploadProgress status="uploading" value={30} showValue={false} />`,
      render: () => <UploadProgress status="uploading" value={30} showValue={false} className="w-full max-w-sm" />,
    },
  ],
  props: [
    { name: "value", type: "number", default: "0", description: "Progreso de 0 a 100." },
    { name: "status", type: '"idle" | "validating" | "uploading" | "success" | "error"', default: '"idle"', description: "Estado actual; controla icono, color y si se muestra el porcentaje." },
    { name: "label", type: "string", description: "Texto principal. También alimenta `aria-label`." },
    { name: "description", type: "string", description: "Texto secundario (nombre, tamaño, filas)." },
    { name: "error", type: "string", description: "Mensaje que reemplaza la descripción cuando `status` es `error`." },
    { name: "showValue", type: "boolean", default: "true", description: "Muestra el porcentaje a la derecha (nunca en `idle`)." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Mantén el valor y el estado en el padre; el componente no adivina nada.", "Pasa el `error` real del servidor: el usuario necesita saber si reintentar.", "Usa `validating` para el tramo posterior a la subida (parseo, chequeos)."],
    dont: ["No lo uses como spinner indeterminado: si no conoces el progreso, usa Skeleton o un loader.", "No cambies a `success` antes de que el servidor confirme."],
  },
  related: ["progress", "import-csv-panel", "upload-zone"],
});
