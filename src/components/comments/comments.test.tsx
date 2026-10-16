import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CommentsProvider,
  CommentsToggle,
  CommentsPanel,
  CommentLayer,
  type CommentThread,
} from "./index";

const DEMO_USER = { id: "user-1", name: "Carlos" };
const SEED_THREADS: CommentThread[] = [
  {
    id: "thread-1",
    x: 30,
    y: 40,
    resolved: false,
    unread: true,
    messages: [
      { id: "m-1", author: { id: "u-2", name: "Ana" }, body: "Revisar este botón", createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "thread-2",
    x: 60,
    y: 70,
    resolved: true,
    unread: false,
    messages: [
      { id: "m-2", author: { id: "u-3", name: "Pedro" }, body: "Diseño aprobado", createdAt: new Date().toISOString() },
    ],
  },
];

describe("Comments component family", () => {
  test("CommentsToggle muestra contador de no leídos y abre el panel", async () => {
    const user = userEvent.setup();
    render(
      <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS}>
        <CommentsToggle />
        <CommentsPanel />
      </CommentsProvider>
    );

    // Contiene el botón con el texto 'Comentarios' y 1 no leído (thread-1 está unread y pendiente)
    const toggle = screen.getByRole("button", { name: /Comentarios/i });
    expect(toggle).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // El panel está cerrado inicialmente
    expect(screen.queryByRole("complementary", { name: "Comentarios" })).not.toBeInTheDocument();

    // Al hacer clic, se abre el panel
    await user.click(toggle);
    expect(screen.getByRole("complementary", { name: "Comentarios" })).toBeInTheDocument();
    expect(screen.getByText("Revisar este botón")).toBeInTheDocument();
  });

  test("Filtra hilos por resueltos y pendientes", async () => {
    const user = userEvent.setup();
    render(
      <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS} defaultOpen>
        <CommentsPanel />
      </CommentsProvider>
    );

    // Inicialmente filtro en 'Pendientes': aparece thread-1 pero no thread-2
    expect(screen.getByText("Revisar este botón")).toBeInTheDocument();
    expect(screen.queryByText("Diseño aprobado")).not.toBeInTheDocument();

    // Cambiar filtro a 'Resueltos'
    const resueltosTab = screen.getByRole("radio", { name: "Resueltos" });
    await user.click(resueltosTab);

    expect(screen.queryByText("Revisar este botón")).not.toBeInTheDocument();
    expect(screen.getByText("Diseño aprobado")).toBeInTheDocument();
  });

  test("Permite ver un hilo y responderle", async () => {
    const user = userEvent.setup();
    render(
      <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS} defaultOpen>
        <CommentsPanel />
      </CommentsProvider>
    );

    // Selecciona el hilo
    await user.click(screen.getByText("Revisar este botón"));

    // Muestra la conversación y el campo de respuesta
    expect(screen.getByText("Ana")).toBeInTheDocument();
    const replyInput = screen.getByPlaceholderText("Responder…");
    expect(replyInput).toBeInTheDocument();

    // Escribir respuesta y enviar
    await user.type(replyInput, "De acuerdo, ya lo modifico");
    const sendBtn = screen.getByRole("button", { name: "Enviar" });
    await user.click(sendBtn);

    expect(screen.getByText("De acuerdo, ya lo modifico")).toBeInTheDocument();
  });

  test("CommentLayer renderiza pines para los hilos visibles", () => {
    render(
      <CommentsProvider currentUser={DEMO_USER} defaultThreads={SEED_THREADS} defaultOpen>
        <CommentLayer>
          <div data-testid="surface">Contenido de la pantalla</div>
        </CommentLayer>
      </CommentsProvider>
    );

    expect(screen.getByTestId("surface")).toBeInTheDocument();
    // thread-1 está pendiente y debe mostrar su pin
    const pin = screen.getByRole("button", { name: /Ana: Revisar este botón/i });
    expect(pin).toBeInTheDocument();
  });
});
