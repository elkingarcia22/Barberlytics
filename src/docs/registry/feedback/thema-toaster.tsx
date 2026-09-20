import * as React from "react";
import { toast } from "sonner";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const KINDS = ["default", "success", "info", "warning", "error", "loading"] as const;
type ToastKind = (typeof KINDS)[number];

function fire(kind: ToastKind, title: string, description?: string) {
  const options = description ? { description } : undefined;
  if (kind === "default") return toast(title, options);
  return toast[kind](title, options);
}

function LoadingToastDemo() {
  const [toastId, setToastId] = React.useState<string | number | null>(null);
  const start = () => setToastId(toast.loading("Exportando reporte…", { description: "Puede tardar unos segundos." }));
  const finish = () => {
    if (toastId === null) return;
    toast.success("Reporte listo", { id: toastId, description: "Se descargó reporte-ciclo-2026.xlsx" });
    setToastId(null);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={start} disabled={toastId !== null}>
        Iniciar exportación
      </Button>
      <Button onClick={finish} disabled={toastId === null}>
        Marcar como lista
      </Button>
    </div>
  );
}

export const themaToasterEntry = defineEntry({
  id: "thema-toaster",
  name: "ThemaToaster",
  group: "feedback",
  description:
    "El contenedor de toasts de Sonner con los ajustes Thema: apilados arriba a la derecha, por debajo del header, sin colores saturados y con botón de cierre. Se monta una sola vez a nivel de app (esta documentación ya lo hace); desde cualquier pantalla solo se llama a `toast()` de `sonner`.",
  importPath: 'import { ThemaToaster } from "@/components/feedback/ThemaToaster"',
  sourcePath: "src/components/feedback/ThemaToaster.tsx",
  status: "stable",
  tags: ["sonner", "app-level"],
  playground: definePlayground({
    controls: {
      kind: { type: "select", label: "Tipo", options: KINDS, default: "success" },
      title: { type: "text", default: "Cambios guardados" },
      description: { type: "text", default: "El objetivo se actualizó correctamente." },
    },
    render: ({ kind, title, description }) => (
      <Button onClick={() => fire(kind as ToastKind, title, description || undefined)}>
        <Bell /> Mostrar toast
      </Button>
    ),
    code: ({ kind, title, description }) => {
      const fn = kind === "default" ? "toast" : `toast.${kind}`;
      const args = description ? `"${title}", { description: "${description}" }` : `"${title}"`;
      return `import { toast } from "sonner";

// <ThemaToaster /> ya está montado en el root de la app.
<Button onClick={() => ${fn}(${args})}>Mostrar toast</Button>`;
    },
  }),
  examples: [
    {
      id: "kinds",
      title: "Tipos",
      description: "Cada tipo trae su icono semántico y un borde teñido muy leve; el fondo es siempre el del popover.",
      code: `toast("Recordatorio enviado");
toast.success("Cambios guardados");
toast.info("Hay una versión nueva de la plantilla");
toast.warning("El ciclo cierra en 2 días");
toast.error("No se pudo enviar la evaluación");`,
      render: () => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast("Recordatorio enviado")}>Normal</Button>
          <Button variant="outline" onClick={() => toast.success("Cambios guardados")}>Éxito</Button>
          <Button variant="outline" onClick={() => toast.info("Hay una versión nueva de la plantilla")}>Info</Button>
          <Button variant="outline" onClick={() => toast.warning("El ciclo cierra en 2 días")}>Aviso</Button>
          <Button variant="outline" onClick={() => toast.error("No se pudo enviar la evaluación")}>Error</Button>
        </div>
      ),
    },
    {
      id: "with-action",
      title: "Con acción y descripción",
      description: "Una acción para deshacer o ir al detalle; la descripción aporta el dato concreto.",
      code: `toast("Objetivo archivado", {
  description: "\\"Reducir el churn un 5 %\\" pasó a la lista de archivados.",
  action: { label: "Deshacer", onClick: () => restore() },
});`,
      render: () => (
        <Button
          variant="destructive"
          onClick={() =>
            toast("Objetivo archivado", {
              description: '"Reducir el churn un 5 %" pasó a la lista de archivados.',
              action: { label: "Deshacer", onClick: () => toast.success("Objetivo restaurado") },
            })
          }
        >
          <Trash2 /> Archivar objetivo
        </Button>
      ),
    },
    {
      id: "loading",
      title: "Cargando y resolver",
      description: "Un toast de carga se actualiza en sitio pasando su `id` a la siguiente llamada.",
      code: `const id = toast.loading("Exportando reporte…", { description: "Puede tardar unos segundos." });
// …cuando termina:
toast.success("Reporte listo", { id, description: "Se descargó reporte-ciclo-2026.xlsx" });`,
      render: () => <LoadingToastDemo />,
    },
    {
      id: "promise",
      title: "Con promesa",
      description: "`toast.promise` encadena los tres estados sin gestionar el id a mano.",
      code: `toast.promise(saveChanges(), {
  loading: "Guardando…",
  success: "Cambios guardados",
  error: "No se pudo guardar",
});`,
      render: () => (
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(new Promise<void>((resolve) => window.setTimeout(resolve, 1200)), {
              loading: "Guardando…",
              success: "Cambios guardados",
              error: "No se pudo guardar",
            })
          }
        >
          Guardar con promesa
        </Button>
      ),
    },
  ],
  props: [
    { name: "topOffset", type: "number", default: "76", description: "Distancia en px desde el borde superior a la pila de toasts; libra el header de la app." },
    { name: "className", type: "string", description: "Clases extra sobre el contenedor de Sonner." },
    { name: "style", type: "React.CSSProperties", description: "Estilos inline sobre el contenedor." },
  ],
  guidelines: {
    do: ["Monta `<ThemaToaster />` una sola vez, en el root de la app.", "Usa `toast.success` para confirmar lo que acaba de pasar y `toast.error` para lo que falló.", "Añade `action` cuando el usuario pueda deshacer o ir al resultado."],
    dont: ["No montes un segundo Toaster en una pantalla: cada toast se pintaría dos veces.", "No uses toasts para validaciones de formulario; el error va junto al campo.", "No uses `richColors`: el sistema mantiene el fondo sobrio y colorea solo icono y borde."],
  },
  related: ["alert", "button", "alert-dialog"],
});
