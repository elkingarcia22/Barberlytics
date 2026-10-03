import { afterEach, describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";
import { renderWithProviders, screen } from "@/test/render";
import { ProcessCenter } from "./ProcessCenter";
import { clearProcesses, processState, publishProcess, removeProcess, updateProcess } from "./processStore";

afterEach(() => act(() => clearProcesses()));

const open = () => userEvent.click(screen.getByRole("button", { name: /Centro de procesos/ }));

describe("processStore", () => {
  test("el estado sale de lo que el proceso dice de sí mismo", () => {
    expect(processState({ id: "a", title: "A", meta: "" })).toBe("waiting");
    expect(processState({ id: "a", title: "A", meta: "", progress: 0 })).toBe("running");
    expect(processState({ id: "a", title: "A", meta: "", progress: 80, done: true })).toBe("done");
    expect(processState({ id: "a", title: "A", meta: "", done: true, failed: true })).toBe("failed");
  });
});

describe("ProcessCenter", () => {
  test("vacío, dice qué va a aparecer ahí y no ofrece historial sin destino", async () => {
    renderWithProviders(<ProcessCenter />);
    await open();
    expect(screen.getByText("Nada en proceso")).toBeInTheDocument();
    expect(screen.getByText("No hay nada en proceso")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Historial" })).not.toBeInTheDocument();
  });

  test("lista lo publicado, lo nuevo arriba, y resume cuánto hay de cada cosa", async () => {
    renderWithProviders(<ProcessCenter />);
    act(() => {
      publishProcess({ id: "espera", title: "Exportar nómina", meta: "En cola" });
      publishProcess({ id: "listo", title: "Importar productos", meta: "48 productos", done: true });
      publishProcess({ id: "corre", title: "Importar clientes", meta: "120 de 480", progress: 25 });
    });
    await open();
    expect(screen.getByText("1 en curso · 1 en espera · 1 terminado")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      expect.stringContaining("Importar clientes"),
      expect.stringContaining("Importar productos"),
      expect.stringContaining("Exportar nómina"),
    ]);
    expect(screen.getByRole("progressbar", { name: "Avance de Importar clientes" })).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  test("el botón avisa de que algo corre sin abrirlo, y deja de hacerlo al terminar", () => {
    renderWithProviders(<ProcessCenter />);
    act(() => publishProcess({ id: "corre", title: "Importar clientes", meta: "", progress: 10 }));
    expect(screen.getByRole("button", { name: "Centro de procesos, 1 en curso" })).toBeInTheDocument();
    act(() => updateProcess("corre", { done: true, progress: undefined }));
    expect(screen.getByRole("button", { name: "Centro de procesos" })).toBeInTheDocument();
  });

  test("la acción de una fila se ejecuta y cierra el panel", async () => {
    const onAction = vi.fn();
    renderWithProviders(<ProcessCenter />);
    act(() => publishProcess({ id: "fallo", title: "Importar clientes", meta: "Faltan columnas", failed: true, actionLabel: "Reintentar", onAction }));
    await open();
    expect(screen.getByText("0 en curso · 0 en espera · 1 con error")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.queryByText("Faltan columnas")).not.toBeInTheDocument();
  });

  test("se pliega a su cabecera y un proceso retirado desaparece", async () => {
    renderWithProviders(<ProcessCenter onOpenHistory={vi.fn()} />);
    act(() => publishProcess({ id: "corre", title: "Importar clientes", meta: "", progress: 10 }));
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Plegar" }));
    expect(screen.queryByText("Importar clientes")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Historial" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desplegar" }));
    expect(screen.getByRole("button", { name: "Historial" })).toBeInTheDocument();
    act(() => removeProcess("corre"));
    expect(screen.getByText("Nada en proceso")).toBeInTheDocument();
  });
});
