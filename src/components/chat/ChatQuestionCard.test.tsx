import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatQuestionCard } from "./ChatQuestionCard";

const question = { options: ["Una", "Dos", "Tres"], otherPlaceholder: "Escribe cuántos quieres" };

describe("ChatQuestionCard", () => {
  test("tocar una opción la responde; la tecla del número también", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChatQuestionCard question={question} active onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: /Dos/ }));
    expect(onAnswer).toHaveBeenLastCalledWith("Dos");

    await user.keyboard("3");
    expect(onAnswer).toHaveBeenLastCalledWith("Tres");
  });

  test("«Otro» envía lo escrito", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChatQuestionCard question={question} active onAnswer={onAnswer} />);

    await user.type(screen.getByPlaceholderText("Escribe cuántos quieres"), "Siete{Enter}");

    expect(onAnswer).toHaveBeenCalledWith("Siete");
  });

  test("respondida, enseña lo elegido y no deja elegir otra", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChatQuestionCard question={{ ...question, answer: "Dos" }} active onAnswer={onAnswer} />);

    expect(screen.getByRole("button", { name: /Dos/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Una/ }));
    await user.keyboard("1");

    expect(onAnswer).not.toHaveBeenCalled();
  });

  test("mientras se escribe en otro sitio, los números son números", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <>
        <textarea aria-label="otra caja" />
        <ChatQuestionCard question={question} active onAnswer={onAnswer} />
      </>
    );

    await user.type(screen.getByLabelText("otra caja"), "1");

    expect(onAnswer).not.toHaveBeenCalled();
  });

  test("con título: busca, describe cada opción y se pliega con la flecha", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const rich = {
      title: "¿En qué país?",
      hint: "Elige uno",
      options: ["Colombia", "México", "Chile"],
      details: { Colombia: { emoji: "🇨🇴", description: "Bogotá" }, Chile: { description: "Santiago" } },
      searchPlaceholder: "Buscar país",
    };
    render(<ChatQuestionCard question={rich} active onAnswer={onAnswer} />);

    expect(screen.getByRole("group", { name: "¿En qué país?" })).toBeInTheDocument();
    expect(screen.getByText("Bogotá")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Buscar país"), "santi");
    expect(screen.queryByRole("button", { name: /Colombia/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Chile/ }));
    expect(onAnswer).toHaveBeenCalledWith("Chile");

    await user.click(screen.getByRole("button", { name: "Plegar la pregunta" }));
    expect(screen.queryByPlaceholderText("Buscar país")).toBeNull();
  });

  test("con varias: se marcan y se confirman juntas", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChatQuestionCard question={{ title: "¿Qué te haces?", options: ["Corte", "Barba", "Cejas"], multiple: { confirmLabel: "Continuar" } }} active onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: /Corte/ }));
    await user.click(screen.getByRole("button", { name: /Cejas/ }));
    expect(onAnswer).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(onAnswer).toHaveBeenCalledWith("Corte · Cejas");
  });
});
