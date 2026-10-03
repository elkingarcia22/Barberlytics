import * as React from "react";
import { ProcessCenter, clearProcesses, publishProcess, updateProcess } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { defineEntry } from "../types";

const IMPORT_ID = "doc-importar-clientes";
const STEP_MS = 500;
const STEP = 10;
const TOTAL = 480;

/** Lanza una importación de mentira que avanza sola y termina, para ver el panel trabajando. */
function ProcessCenterDemo() {
  const timer = React.useRef<number | undefined>(undefined);

  const stop = () => window.clearInterval(timer.current);
  // La doc comparte almacén con el Centro de procesos de la cabecera: al
  // salir de la página se retira lo que este ejemplo publicó.
  React.useEffect(
    () => () => {
      stop();
      clearProcesses();
    },
    []
  );

  const start = () => {
    stop();
    let progress = 0;
    publishProcess({ id: IMPORT_ID, icon: "upload", title: "Importar clientes", meta: `0 de ${TOTAL}`, progress });
    timer.current = window.setInterval(() => {
      progress += STEP;
      if (progress < 100) {
        updateProcess(IMPORT_ID, { progress, meta: `${Math.round((progress / 100) * TOTAL)} de ${TOTAL}` });
        return;
      }
      stop();
      updateProcess(IMPORT_ID, { progress: undefined, done: true, meta: `${TOTAL} clientes importados`, actionLabel: "Ver" });
    }, STEP_MS);
  };

  const addOthers = () => {
    publishProcess({ id: "doc-exportar-nomina", icon: "download", title: "Exportar nómina de septiembre", meta: "En cola" });
    publishProcess({ id: "doc-importar-productos", title: "Importar productos", meta: "Faltan las columnas «precio» y «categoría»", failed: true, actionLabel: "Reintentar" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProcessCenter onOpenHistory={() => undefined} />
      <Button variant="outline" size="sm" onClick={start}>
        Lanzar una importación
      </Button>
      <Button variant="outline" size="sm" onClick={addOthers}>
        Añadir uno en espera y uno fallido
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          stop();
          clearProcesses();
        }}
      >
        Vaciar
      </Button>
    </div>
  );
}

export const processCenterEntry = defineEntry({
  id: "process-center",
  name: "ProcessCenter",
  group: "layout",
  description:
    "El Centro de procesos de la cabecera: lo que sigue trabajando aunque la persona cambie de pantalla —importaciones, subidas, exportaciones— con su avance, y lo que ya terminó o falló. No lanza nada: cada pantalla publica lo suyo con `publishProcess` y el panel lo enseña. El botón lleva un punto mientras algo corre, y vacío explica qué aparecerá ahí.",
  importPath: 'import { ProcessCenter, publishProcess, updateProcess, removeProcess } from "@/components/app-shell"',
  sourcePath: "src/components/app-shell/ProcessCenter.tsx",
  status: "beta",
  tags: ["shell", "cabecera", "progreso", "segundo plano"],
  examples: [
    {
      id: "live",
      title: "Publicar y actualizar un proceso",
      description:
        "Lanza la importación y abre el panel: la fila avanza sola y al terminar se queda como hecha. En la aplicación el botón vive en la cabecera; esta documentación lo apaga allí (`chrome.processes: false`) porque aquí no corre nada.",
      layout: "center",
      code: `// Quien lanza el trabajo lo publica…
publishProcess({ id: "importar-clientes", icon: "upload", title: "Importar clientes", meta: "0 de 480", progress: 0 });

// …lo va actualizando…
updateProcess("importar-clientes", { progress: 25, meta: "120 de 480" });

// …y lo deja como terminado (o fallido, con su motivo en \`meta\`).
updateProcess("importar-clientes", { progress: undefined, done: true, meta: "480 clientes importados", actionLabel: "Ver", onAction: abrirClientes });`,
      render: () => <ProcessCenterDemo />,
    },
  ],
  props: [
    { name: "onOpenHistory", type: "() => void", description: "Abre el historial completo. Sin esto el pie no ofrece «Historial». En el shell llega por `onOpenProcessHistory`." },
    { name: "className", type: "string", description: "Clases extra sobre el botón de la cabecera." },
    { name: "publishProcess(process)", type: "(process: ShellProcess) => void", description: "Añade un proceso o lo reemplaza en su sitio. Los nuevos van arriba. Publicar lo mismo dos veces no repinta nada." },
    { name: "updateProcess(id, change)", type: "(id, Partial<ShellProcess>) => void", description: "Cambia parte de uno ya publicado: el avance, la línea de detalle, que terminó." },
    { name: "removeProcess(id)", type: "(id: string) => void", description: "Lo retira de la lista." },
    {
      name: "ShellProcess",
      type: "{ id; title; meta; progress?; done?; failed?; icon?; actionLabel?; onAction? }",
      description: "Con `progress` (0–100) está en curso; sin él, en espera. `done` y `failed` lo dejan en la lista como terminado o fallido, con `meta` diciendo cómo acabó.",
    },
  ],
  guidelines: {
    do: [
      "Publica aquí lo que tarda y no necesita a la persona mirando: importar, subir archivos, exportar.",
      "Escribe en `meta` algo que se pueda leer de un vistazo: «120 de 480», «Faltan dos columnas».",
      "Deja el proceso como `done` o `failed` en vez de quitarlo: es lo que confirma que acabó.",
      "Da una acción cuando haya algo que hacer con el resultado: «Ver», «Reintentar», «Descargar».",
    ],
    dont: [
      "No lo uses para lo que termina en un segundo: para eso está el toast.",
      "No publiques desde un efecto sin `id` estable: cada pintado añadiría una fila nueva.",
      "No metas aquí avisos ni novedades: eso es de Notificaciones y de Novedades.",
    ],
  },
  related: ["app-header", "admin-shell", "progress", "empty-state"],
});
