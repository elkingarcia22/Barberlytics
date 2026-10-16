import {
  CommentsProvider,
  CommentsPanel,
  CommentsToggle,
  CommentLayer,
  type CommentThread,
} from "@/components/comments";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const DEMO_USER = { id: "user-1", name: "Carlos Mendoza" };

const SEED_THREADS: CommentThread[] = [
  {
    id: "thread-1",
    x: 35,
    y: 40,
    resolved: false,
    unread: true,
    messages: [
      {
        id: "m-1",
        author: { id: "user-2", name: "Ana Torres" },
        body: "¿Podemos destacar más el botón de confirmar en este paso?",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "m-2",
        author: DEMO_USER,
        body: "Totalmente de acuerdo, le voy a aumentar el contraste.",
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
  },
  {
    id: "thread-2",
    x: 70,
    y: 65,
    resolved: true,
    unread: false,
    messages: [
      {
        id: "m-3",
        author: { id: "user-3", name: "Martín Rivas" },
        body: "Revisar el espaciado inferior en pantallas pequeñas.",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ],
  },
];

function CommentsDemo() {
  return (
    <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS} defaultOpen>
      <div className="flex h-[480px] w-full overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
            <Text weight="semibold">Pantalla de prueba</Text>
            <CommentsToggle />
          </header>
          <CommentLayer className="relative flex-1 p-6">
            <Card className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Text weight="medium">Área interactiva para comentarios</Text>
              <Text variant="muted">
                Haz clic en «Comentar» (o presiona la tecla C) y pulsa en cualquier parte de este recuadro para dejar un pin de comentario.
              </Text>
              <Button size="sm" variant="outline">
                Acción de ejemplo
              </Button>
            </Card>
          </CommentLayer>
        </div>
        <CommentsPanel />
      </div>
    </CommentsProvider>
  );
}

export const commentsPanelEntry = defineEntry({
  id: "comments-panel",
  name: "CommentsPanel",
  group: "comments",
  description:
    "Panel lateral derecho para la gestión de comentarios colaborativos tipo Figma. Permite filtrar por estado (pendientes, resueltos, todos) y por lectura (leídos, no leídos), explorar hilos con sus respuestas y responder directamente.",
  importPath: 'import { CommentsPanel } from "@/components/comments"',
  sourcePath: "src/components/comments/CommentsPanel.tsx",
  status: "stable",
  tags: ["comentarios", "panel", "figma", "colaboración", "hilos"],
  playground: definePlayground({
    controls: {},
    layout: "stretch",
    render: () => <CommentsDemo />,
    code: () => `<CommentsProvider currentUser={usuario} defaultThreads={hilos}>
  <header>
    <CommentsToggle />
  </header>
  <CommentLayer>
    {/* Contenido de la pantalla */}
  </CommentLayer>
  <CommentsPanel />
</CommentsProvider>`,
  }),
  examples: [
    {
      id: "full-workflow",
      title: "Flujo colaborativo completo",
      description: "Hilos anclados a posiciones en porcentaje, modo comentar con tecla C o botón, y panel con filtrado reactivo.",
      code: `<CommentsProvider currentUser={{ id: "1", name: "Tú" }} defaultThreads={hilos}>
  <div className="flex h-[400px]">
    <div className="flex-1">
      <CommentsToggle />
      <CommentLayer>
        <Contenido />
      </CommentLayer>
    </div>
    <CommentsPanel />
  </div>
</CommentsProvider>`,
      render: () => <CommentsDemo />,
    },
  ],
  props: [
    { name: "onNavigate", type: "(thread: CommentThread) => void", description: "Se ejecuta al seleccionar un hilo de otro contexto/dispositivo para navegar a él." },
    { name: "className", type: "string", description: "Clases adicionales para el contenedor del panel lateral." },
  ],
  guidelines: {
    do: [
      "Combínalo con CommentsProvider, CommentLayer y CommentsToggle para una experiencia completa.",
      "Usa la propiedad context si los comentarios aplican a diferentes vistas o dispositivos.",
    ],
    dont: [
      "No utilices coordenadas absolutas en px para los pines; el sistema usa porcentajes para responder a cambios de pantalla.",
    ],
  },
  related: ["comment-layer", "comments-toggle"],
});
