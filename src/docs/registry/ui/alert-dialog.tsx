import * as React from "react";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

function AsyncDeleteDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  const confirm = (event: React.MouseEvent) => {
    event.preventDefault();
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setOpen(false);
      setDeleted(true);
    }, 1200);
  };

  if (deleted) {
    return (
      <Button variant="outline" onClick={() => setDeleted(false)}>
        Restaurar equipo
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 /> Eliminar equipo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar el equipo «Ventas LATAM»?</AlertDialogTitle>
          <AlertDialogDescription>Se perderán sus 14 asignaciones y el historial de progreso. Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Eliminando…" : "Sí, eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const alertDialogEntry = defineEntry({
  id: "alert-dialog",
  name: "AlertDialog",
  group: "ui",
  description:
    "Diálogo modal que exige una decisión explícita antes de continuar: no se cierra al hacer clic fuera ni con Escape sin pasar por Cancelar. Úsalo para confirmar acciones destructivas o irreversibles; para formularios y contenido general usa Dialog.",
  importPath: 'import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"',
  sourcePath: "src/components/ui/alert-dialog.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: ["default", "sm"], default: "default" },
      destructive: { type: "boolean", label: "Acción destructiva", default: true },
      withMedia: { type: "boolean", label: "Con icono (Media)", default: false },
      title: { type: "text", label: "Título", default: "¿Cerrar la sesión en todos los dispositivos?" },
    },
    render: ({ size, destructive, withMedia, title }) => (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Abrir diálogo</Button>
        </AlertDialogTrigger>
        <AlertDialogContent size={size as "default" | "sm"}>
          <AlertDialogHeader>
            {withMedia && (
              <AlertDialogMedia>
                <LogOut />
              </AlertDialogMedia>
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>Tendrás que volver a iniciar sesión en cada uno de ellos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant={destructive ? "destructive" : "default"}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    code: ({ size, destructive, withMedia, title }) => `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Abrir diálogo</Button>
  </AlertDialogTrigger>
  <AlertDialogContent${size === "sm" ? ' size="sm"' : ""}>
    <AlertDialogHeader>${withMedia ? "\n      <AlertDialogMedia><LogOut /></AlertDialogMedia>" : ""}
      <AlertDialogTitle>${title}</AlertDialogTitle>
      <AlertDialogDescription>Tendrás que volver a iniciar sesión en cada uno de ellos.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction${destructive ? ' variant="destructive"' : ""}>Continuar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  }),
  examples: [
    {
      id: "confirm",
      title: "Confirmar una acción destructiva",
      description: "La acción hereda las variantes de Button; usa `destructive` para dejar claro el riesgo.",
      code: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive"><Trash2 /> Eliminar curso</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
      <AlertDialogDescription>
        Los 230 colaboradores inscritos perderán su progreso. Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
      render: () => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Eliminar curso
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
              <AlertDialogDescription>Los 230 colaboradores inscritos perderán su progreso. Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      id: "media-sm",
      title: "Compacto con icono",
      description: "`size=\"sm\"` centra el contenido y reparte los botones en dos columnas; `AlertDialogMedia` añade un icono de contexto.",
      code: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline"><LogOut /> Cerrar sesión</Button>
  </AlertDialogTrigger>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogMedia><LogOut /></AlertDialogMedia>
      <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
      <AlertDialogDescription>Los cambios sin guardar se perderán.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Quedarme</AlertDialogCancel>
      <AlertDialogAction>Salir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
      render: () => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <LogOut /> Cerrar sesión
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <LogOut />
              </AlertDialogMedia>
              <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription>Los cambios sin guardar se perderán.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Quedarme</AlertDialogCancel>
              <AlertDialogAction>Salir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      id: "async",
      title: "Controlado con acción asíncrona",
      description: "Con `open`/`onOpenChange` el diálogo espera a que termine la petición antes de cerrarse; `preventDefault` evita el cierre automático.",
      code: `const [open, setOpen] = React.useState(false);
const [pending, setPending] = React.useState(false);

const confirm = async (event: React.MouseEvent) => {
  event.preventDefault(); // evita que Radix cierre antes de terminar
  setPending(true);
  await deleteTeam();
  setPending(false);
  setOpen(false);
};

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive"><Trash2 /> Eliminar equipo</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    …
    <AlertDialogFooter>
      <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Eliminando…" : "Sí, eliminar"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
      render: () => <AsyncDeleteDialog />,
    },
  ],
  props: [
    { name: "open / defaultOpen", type: "boolean", description: "Estado de apertura. Usa `open` + `onOpenChange` para controlarlo." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Se dispara al abrir o cerrar." },
    { name: "AlertDialogContent.size", type: '"default" | "sm"', default: '"default"', description: "`sm` centra el texto y muestra los botones en dos columnas." },
    { name: "AlertDialogAction.variant", type: "ButtonProps[\"variant\"]", default: '"default"', description: "Variante del botón de confirmación." },
    { name: "AlertDialogCancel.variant", type: "ButtonProps[\"variant\"]", default: '"outline"', description: "Variante del botón de cancelar." },
    { name: "AlertDialogMedia", type: 'React.ComponentProps<"div">', description: "Contenedor de 40px para un icono ilustrativo dentro del header." },
  ],
  guidelines: {
    do: ["Formula el título como pregunta y nombra el objeto afectado.", "Explica la consecuencia en la descripción («no se puede deshacer»).", "Etiqueta la acción con el verbo concreto: «Eliminar», no «Aceptar»."],
    dont: ["No lo uses para formularios ni contenido navegable; usa Dialog.", "No lo abras automáticamente al cargar una página.", "No encadenes dos confirmaciones seguidas."],
  },
  related: ["dialog", "button", "sheet"],
});
