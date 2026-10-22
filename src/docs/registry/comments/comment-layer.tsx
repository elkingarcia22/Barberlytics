import {
  CommentsProvider,
  CommentLayer,
  CommentsToggle,
  type CommentThread,
} from "@/components/comments";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

const DEMO_USER = { id: "user-1", name: "Carlos" };
const SEED_THREADS: CommentThread[] = [
  {
    id: "thread-1",
    x: 45,
    y: 35,
    resolved: false,
    unread: false,
    messages: [
      { id: "m-1", author: { id: "u-2", name: "Elena" }, body: "Un pin en el centro", createdAt: new Date().toISOString() },
    ],
  },
];

export const commentLayerEntry = defineEntry({
  id: "comment-layer",
  name: "CommentLayer",
  group: "comments",
  description:
    "Capa envolvente que superpone los marcadores (pines) interactivos sobre la interfaz. Al activar el modo comentar (vía atajo C o botón), intercepta los clics para posicionar un borrador de comentario en coordenadas porcentuales.",
  importPath: 'import { CommentLayer } from "@/components/comments"',
  sourcePath: "src/components/comments/CommentLayer.tsx",
  status: "stable",
  tags: ["comentarios", "canvas", "pines", "figma", "capa"],
  playground: definePlayground({
    controls: {
      hideHint: { type: "boolean", label: "Ocultar aviso flotante", default: false },
    },
    layout: "stretch",
    render: ({ hideHint }) => (
      <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS} defaultOpen>
        <div className="flex h-72 w-full flex-col overflow-hidden rounded-lg border border-border">
          <header className="flex h-10 items-center justify-between border-b border-border bg-surface px-3">
            <Text size="sm" weight="medium">Lienzo con capa de comentarios</Text>
            <CommentsToggle iconOnly />
          </header>
          <CommentLayer hideHint={hideHint} className="flex-1 p-4">
            <Card className="flex h-full items-center justify-center border-dashed">
              <Text variant="muted">Haz clic aquí para interactuar</Text>
            </Card>
          </CommentLayer>
        </div>
      </CommentsProvider>
    ),
    code: ({ hideHint }) => `<CommentLayer${hideHint ? " hideHint" : ""}>
  <ContenidoDeLaPantalla />
</CommentLayer>`,
  }),
  examples: [
    {
      id: "basic",
      title: "Superficie comentable",
      description: "Los pines se sitúan con precisión de porcentaje y admiten hover, clic y selección.",
      code: `<CommentLayer>
  <div className="p-8">
    <h1>Título</h1>
    <p>Texto</p>
  </div>
</CommentLayer>`,
      render: () => (
        <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS} defaultOpen>
          <div className="h-60 w-full overflow-hidden rounded-lg border border-border">
            <CommentLayer className="h-full p-4">
              <div className="flex h-full items-center justify-center bg-surface-subtle">
                <Text>Pines visibles sobre el fondo</Text>
              </div>
            </CommentLayer>
          </div>
        </CommentsProvider>
      ),
    },
  ],
  props: [
    { name: "hideHint", type: "boolean", default: "false", description: "Oculta el pill flotante inferior 'Haz clic donde quieras comentar' en modo comentar." },
    {
      name: "locate",
      type: "(point: { x: number; y: number }) => CommentLocation | undefined",
      description:
        "Describe dónde cayó el clic (ruta, módulo, sección y elemento) a partir de sus coordenadas en la ventana; queda en el hilo (`thread.location`) y el panel lo muestra. En la app se usa `locateCommentPoint` de `@/lib/comments/locate`, que salta la capa de clics (`data-comment-overlay`) para leer lo que hay debajo.",
    },
    { name: "className", type: "string", description: "Clases para el contenedor relativo envolvente." },
  ],
  guidelines: {
    do: [
      "Envuelve el contenedor principal de la vista o marco de trabajo que se desea revisar.",
      "Asegúrate de que el contenedor tenga dimensiones definidas relativas para calcular correctamente los porcentajes.",
    ],
    dont: [
      "No bloquees eventos de puntero esenciales si la persona está en modo navegar ('browse').",
    ],
  },
  related: ["comments-panel", "comments-toggle"],
});
