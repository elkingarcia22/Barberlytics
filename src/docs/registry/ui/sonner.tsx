import * as React from "react";
import { toast } from "sonner";
import { Bell, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const KINDS = ["default", "success", "info", "warning", "error"] as const;
type ToastKind = (typeof KINDS)[number];

const DEFAULT_DURATION_MS = 4000;

function fire(kind: ToastKind, title: string, options?: { description?: string; duration?: number; action?: { label: string; onClick: () => void } }) {
  if (kind === "default") return toast(title, options);
  return toast[kind](title, options);
}

function UndoDelete() {
  const [deleted, setDeleted] = React.useState(0);
  const remove = () => {
    setDeleted((count) => count + 1);
    toast("Encuesta eliminada", {
      description: "Clima Q3 se movió a la papelera.",
      action: { label: "Deshacer", onClick: () => setDeleted((count) => Math.max(0, count - 1)) },
    });
  };
  return (
    <div className="flex items-center gap-3">
      <Button variant="destructive" onClick={remove}>
        <Trash2 /> Eliminar encuesta
      </Button>
      <span className="text-xs text-text-secondary">Eliminadas: {deleted}</span>
    </div>
  );
}

const UPLOAD_MS = 1800;

function PromiseToast() {
  const upload = () =>
    toast.promise(new Promise<string>((resolve) => window.setTimeout(() => resolve("respuestas.csv"), UPLOAD_MS)), {
      loading: "Subiendo archivo…",
      success: (name) => `${name} se importó correctamente`,
      error: "No se pudo subir el archivo",
    });
  return (
    <Button variant="outline" onClick={upload}>
      <Upload /> Importar CSV
    </Button>
  );
}

function PersistentToast() {
  const [id, setId] = React.useState<string | number | null>(null);
  const show = () =>
    setId(
      toast.warning("Tu sesión expira en 5 minutos", {
        description: "Guarda los cambios pendientes.",
        duration: Infinity,
      })
    );
  const dismiss = () => {
    if (id === null) return;
    toast.dismiss(id);
    setId(null);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={show} disabled={id !== null}>
        Mostrar aviso persistente
      </Button>
      <Button variant="ghost" onClick={dismiss} disabled={id === null}>
        Cerrar desde código
      </Button>
    </div>
  );
}

export const sonnerEntry = defineEntry({
  id: "sonner",
  name: "Toaster / toast()",
  group: "ui",
  description:
    "El Toaster de Sonner afinado con los tokens Thema: iconos por tipo, bordes tintados y un botón de cierre de 28px que sí se puede pulsar. Se monta una sola vez (la app ya lo hace vía ThemaToaster) y desde cualquier pantalla se dispara con `toast()`.",
  importPath: 'import { toast } from "sonner"',
  sourcePath: "src/components/ui/sonner.tsx",
  status: "stable",
  tags: ["sonner", "feedback", "app-level"],
  playground: definePlayground({
    controls: {
      kind: { type: "select", label: "Tipo", options: KINDS, default: "success" },
      title: { type: "text", label: "Título", default: "Cambios guardados" },
      description: { type: "text", label: "Descripción", default: "El objetivo se actualizó correctamente." },
      duration: { type: "number", label: "Duración (ms)", default: DEFAULT_DURATION_MS, min: 1000, max: 10000, step: 500 },
    },
    render: ({ kind, title, description, duration }) => (
      <Button onClick={() => fire(kind as ToastKind, title, { description: description || undefined, duration })}>
        <Bell /> Mostrar toast
      </Button>
    ),
    code: ({ kind, title, description, duration }) => {
      const fn = kind === "default" ? "toast" : `toast.${kind}`;
      const options = [description ? `description: "${description}"` : "", duration !== DEFAULT_DURATION_MS ? `duration: ${duration}` : ""].filter(Boolean);
      const args = options.length ? `"${title}", { ${options.join(", ")} }` : `"${title}"`;
      return `import { toast } from "sonner";

${fn}(${args});`;
    },
  }),
  examples: [
    {
      id: "kinds",
      title: "Tipos",
      description: "Cada tipo trae su icono y tinte de borde; el fondo se mantiene sobrio.",
      code: `toast("Nota guardada");
toast.success("Encuesta publicada");
toast.info("Hay una versión nueva disponible");
toast.warning("Quedan 2 asientos");
toast.error("No se pudo conectar");`,
      render: () => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast("Nota guardada")}>
            Default
          </Button>
          <Button variant="outline" onClick={() => toast.success("Encuesta publicada")}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.info("Hay una versión nueva disponible")}>
            Info
          </Button>
          <Button variant="outline" onClick={() => toast.warning("Quedan 2 asientos")}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => toast.error("No se pudo conectar")}>
            Error
          </Button>
        </div>
      ),
    },
    {
      id: "with-action",
      title: "Con acción (deshacer)",
      description: "El patrón para acciones reversibles: se ejecuta de inmediato y el toast ofrece revertirla.",
      code: `toast("Encuesta eliminada", {
  description: "Clima Q3 se movió a la papelera.",
  action: { label: "Deshacer", onClick: restore },
});`,
      render: () => <UndoDelete />,
    },
    {
      id: "promise",
      title: "Promesa",
      description: "Un solo toast que pasa de cargando a éxito o error según resuelva la promesa.",
      code: `toast.promise(uploadFile(file), {
  loading: "Subiendo archivo…",
  success: (name) => \`\${name} se importó correctamente\`,
  error: "No se pudo subir el archivo",
});`,
      render: () => <PromiseToast />,
    },
    {
      id: "persistent",
      title: "Persistente y cierre programático",
      description: "`duration: Infinity` lo deja fijo; `toast.dismiss(id)` lo cierra desde código.",
      code: `const id = toast.warning("Tu sesión expira en 5 minutos", {
  description: "Guarda los cambios pendientes.",
  duration: Infinity,
});

toast.dismiss(id);`,
      render: () => <PersistentToast />,
    },
  ],
  props: [
    { name: "toast(title, options?)", type: "función", description: "Dispara un toast neutro. `toast.success/info/warning/error/loading` cambian icono y borde." },
    { name: "options.description", type: "string", description: "Segunda línea en color secundario." },
    { name: "options.action", type: "{ label, onClick }", description: "Botón primario dentro del toast." },
    { name: "options.duration", type: "number", default: "4000", description: "Milisegundos en pantalla; `Infinity` lo hace persistente." },
    { name: "options.id", type: "string | number", description: "Reutiliza un toast existente (p. ej. actualizar un `loading`)." },
    { name: "toast.promise(promise, { loading, success, error })", type: "función", description: "Encadena los tres estados en un mismo toast." },
    { name: "<Toaster />", type: "componente", description: "El contenedor de `@/components/ui/sonner`. Ya está montado a través de ThemaToaster; no montes otro." },
  ],
  guidelines: {
    do: ["Confirma lo que acaba de ocurrir en una línea; usa la descripción para el detalle.", "Ofrece «Deshacer» en lugar de pedir confirmación previa cuando la acción es reversible.", "Reutiliza el `id` para actualizar un toast de carga en vez de apilar dos."],
    dont: ["No montes un segundo `<Toaster />`: cada toast saldría duplicado.", "No uses toasts para errores que bloquean el flujo; ahí va Alert o AlertDialog.", "No abuses de `duration: Infinity`; solo para avisos que requieren acción."],
  },
  related: ["thema-toaster", "alert", "alert-dialog", "button"],
});
