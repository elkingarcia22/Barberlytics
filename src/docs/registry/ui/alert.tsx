import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Terminal, X } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["default", "info", "success", "warning", "destructive"] as const;
type Variant = (typeof VARIANTS)[number];

const VARIANT_ICON: Record<Variant, React.ReactNode> = {
  default: <Terminal />,
  info: <Info />,
  success: <CheckCircle2 />,
  warning: <AlertTriangle />,
  destructive: <ShieldAlert />,
};

const VARIANT_ICON_NAME: Record<Variant, string> = {
  default: "Terminal",
  info: "Info",
  success: "CheckCircle2",
  warning: "AlertTriangle",
  destructive: "ShieldAlert",
};

function DismissibleAlert() {
  const [visible, setVisible] = React.useState(true);
  if (!visible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
        Mostrar aviso de nuevo
      </Button>
    );
  }
  return (
    <Alert variant="info">
      <Info />
      <AlertTitle>Nueva versión disponible</AlertTitle>
      <AlertDescription>Actualiza para obtener los últimos reportes de aprendizaje.</AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon-xs" aria-label="Cerrar" onClick={() => setVisible(false)}>
          <X />
        </Button>
      </AlertAction>
    </Alert>
  );
}

export const alertEntry = defineEntry({
  id: "alert",
  name: "Alert",
  group: "ui",
  description:
    "Aviso en línea que llama la atención sobre un mensaje sin interrumpir el flujo. Úsalo para contextualizar una pantalla o sección con información, éxito, advertencia o error; para mensajes efímeros usa un toast.",
  importPath: 'import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"',
  sourcePath: "src/components/ui/alert.tsx",
  status: "stable",
  tags: ["cva"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "default" },
      title: { type: "text", label: "Título", default: "Cambios guardados" },
      description: { type: "text", label: "Descripción", default: "Tus ajustes se aplicarán en el próximo ciclo." },
      withIcon: { type: "boolean", label: "Con icono", default: true },
      withAction: { type: "boolean", label: "Con acción", default: false },
    },
    layout: "stretch",
    render: ({ variant, title, description, withIcon, withAction }) => (
      <Alert variant={variant as Variant}>
        {withIcon && VARIANT_ICON[variant as Variant]}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {withAction && (
          <AlertAction>
            <Button variant="outline" size="xs">
              Deshacer
            </Button>
          </AlertAction>
        )}
      </Alert>
    ),
    code: ({ variant, title, description, withIcon, withAction }) => {
      const open = variant === "default" ? "<Alert>" : `<Alert variant="${variant}">`;
      const lines = [
        open,
        withIcon ? `  <${VARIANT_ICON_NAME[variant as Variant]} />` : "",
        `  <AlertTitle>${title}</AlertTitle>`,
        `  <AlertDescription>${description}</AlertDescription>`,
        withAction ? `  <AlertAction>\n    <Button variant="outline" size="xs">Deshacer</Button>\n  </AlertAction>` : "",
        "</Alert>",
      ];
      return lines.filter(Boolean).join("\n");
    },
  }),
  examples: [
    {
      id: "variants",
      title: "Variantes semánticas",
      description: "El color comunica la intención: informa, confirma, advierte o bloquea.",
      layout: "stretch",
      code: `<Alert variant="info">
  <Info />
  <AlertTitle>Sincronización en curso</AlertTitle>
  <AlertDescription>Los datos pueden tardar unos minutos en reflejarse.</AlertDescription>
</Alert>
<Alert variant="success">
  <CheckCircle2 />
  <AlertTitle>Curso publicado</AlertTitle>
  <AlertDescription>Ya es visible para los equipos asignados.</AlertDescription>
</Alert>
<Alert variant="warning">
  <AlertTriangle />
  <AlertTitle>Licencias por vencer</AlertTitle>
  <AlertDescription>12 licencias expiran en los próximos 7 días.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <ShieldAlert />
  <AlertTitle>No se pudo importar el archivo</AlertTitle>
  <AlertDescription>Revisa que las columnas coincidan con la plantilla.</AlertDescription>
</Alert>`,
      render: () => (
        <div className="flex w-full flex-col gap-3">
          <Alert variant="info">
            <Info />
            <AlertTitle>Sincronización en curso</AlertTitle>
            <AlertDescription>Los datos pueden tardar unos minutos en reflejarse.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Curso publicado</AlertTitle>
            <AlertDescription>Ya es visible para los equipos asignados.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>Licencias por vencer</AlertTitle>
            <AlertDescription>12 licencias expiran en los próximos 7 días.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>No se pudo importar el archivo</AlertTitle>
            <AlertDescription>Revisa que las columnas coincidan con la plantilla.</AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "no-icon",
      title: "Sin icono",
      description: "Sin SVG el contenido ocupa todo el ancho; funciona bien para notas neutras.",
      layout: "stretch",
      code: `<Alert>
  <AlertTitle>Modo de solo lectura</AlertTitle>
  <AlertDescription>Estás viendo una versión archivada de este reporte.</AlertDescription>
</Alert>`,
      render: () => (
        <Alert>
          <AlertTitle>Modo de solo lectura</AlertTitle>
          <AlertDescription>Estás viendo una versión archivada de este reporte.</AlertDescription>
        </Alert>
      ),
    },
    {
      id: "dismissible",
      title: "Con acción y cierre",
      description: "`AlertAction` se ancla a la esquina superior derecha; el estado de visibilidad lo controla el padre.",
      layout: "stretch",
      code: `const [visible, setVisible] = React.useState(true);

{visible && (
  <Alert variant="info">
    <Info />
    <AlertTitle>Nueva versión disponible</AlertTitle>
    <AlertDescription>Actualiza para obtener los últimos reportes de aprendizaje.</AlertDescription>
    <AlertAction>
      <Button variant="ghost" size="icon-xs" aria-label="Cerrar" onClick={() => setVisible(false)}>
        <X />
      </Button>
    </AlertAction>
  </Alert>
)}`,
      render: () => <DismissibleAlert />,
    },
  ],
  props: [
    { name: "variant", type: '"default" | "info" | "success" | "warning" | "destructive"', default: '"default"', description: "Intención semántica; tiñe borde, fondo, texto e icono." },
    { name: "children", type: "React.ReactNode", description: "Un SVG opcional como primer hijo, seguido de AlertTitle, AlertDescription y AlertAction." },
    { name: "AlertAction", type: 'React.ComponentProps<"div">', description: "Contenedor posicionado en la esquina superior derecha para un botón o enlace." },
    { name: "...props", type: 'React.ComponentProps<"div">', description: "Atributos nativos del contenedor (role=\"alert\" ya viene puesto)." },
  ],
  guidelines: {
    do: ["Coloca el aviso cerca del contenido al que se refiere.", "Acompaña las variantes de color con un icono para no depender solo del color.", "Escribe un título corto y deja el detalle en la descripción."],
    dont: ["No apiles más de dos alertas en la misma vista.", "No lo uses para confirmaciones puntuales; usa un toast (Sonner).", "No pongas más de una acción dentro de `AlertAction`."],
  },
  related: ["alert-dialog", "badge", "sonner"],
});
