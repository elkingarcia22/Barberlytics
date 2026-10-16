import {
  CommentsProvider,
  CommentsToggle,
  type CommentThread,
} from "@/components/comments";
import { defineEntry, definePlayground } from "../types";

const DEMO_USER = { id: "user-1", name: "Carlos" };
const UNREAD_THREADS: CommentThread[] = [
  {
    id: "t-1",
    x: 20,
    y: 20,
    resolved: false,
    unread: true,
    messages: [
      { id: "m-1", author: { id: "u-2", name: "Ana" }, body: "Comentario sin leer", createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "t-2",
    x: 50,
    y: 50,
    resolved: false,
    unread: true,
    messages: [
      { id: "m-2", author: { id: "u-3", name: "Juan" }, body: "Otro comentario sin leer", createdAt: new Date().toISOString() },
    ],
  },
];

export const commentsToggleEntry = defineEntry({
  id: "comments-toggle",
  name: "CommentsToggle",
  group: "comments",
  description:
    "Botón para la cabecera o barra de herramientas que abre o cierra el panel de comentarios. Incluye un indicador con la cantidad de hilos no leídos pendientes.",
  importPath: 'import { CommentsToggle } from "@/components/comments"',
  sourcePath: "src/components/comments/CommentsToggle.tsx",
  status: "stable",
  tags: ["comentarios", "toggle", "botón", "badge"],
  playground: definePlayground({
    controls: {
      iconOnly: { type: "boolean", label: "Solo icono", default: false },
    },
    layout: "center",
    render: ({ iconOnly }) => (
      <CommentsProvider currentUser={DEMO_USER} defaultThreads={UNREAD_THREADS}>
        <CommentsToggle iconOnly={iconOnly} />
      </CommentsProvider>
    ),
    code: ({ iconOnly }) => `<CommentsToggle${iconOnly ? " iconOnly" : ""} />`,
  }),
  examples: [
    {
      id: "variations",
      title: "Con texto y solo icono",
      description: "En pantallas compactas o barras densas se puede usar `iconOnly` sin perder el badge de no leídos.",
      code: `<CommentsToggle />\n<CommentsToggle iconOnly />`,
      render: () => (
        <CommentsProvider currentUser={DEMO_USER} defaultThreads={UNREAD_THREADS}>
          <div className="flex items-center gap-4">
            <CommentsToggle />
            <CommentsToggle iconOnly />
          </div>
        </CommentsProvider>
      ),
    },
  ],
  props: [
    { name: "iconOnly", type: "boolean", default: "false", description: "Muestra únicamente el icono de chat con el badge flotante." },
    { name: "className", type: "string", description: "Clases adicionales para el botón." },
  ],
  guidelines: {
    do: ["Ubícalo en el header o barra de acciones de la página para que siempre esté accesible."],
    dont: ["No coloques un badge duplicado por fuera; el componente gestiona el contador automáticamente."],
  },
  related: ["comments-panel", "comment-layer"],
});
