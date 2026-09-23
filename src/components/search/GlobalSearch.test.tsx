import { describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import { GlobalSearch } from "./GlobalSearch";

const OBJECTS = [
  { id: "vacante", title: "Analista de datos", meta: ["vacante", "Entrevistas", "12 candidatos"], onSelect: vi.fn() },
  { id: "candidato", title: "Andrés Malo", meta: ["candidato", "Analista de datos"], onSelect: vi.fn() },
];

const NAVIGATE = [
  { id: "vacantes", path: ["Selección", "Vacantes"], onSelect: vi.fn() },
  { id: "objetivos", path: ["Desempeño", "Objetivos"], onSelect: vi.fn() },
];

function open() {
  return userEvent.click(screen.getByRole("button", { name: /Buscar o preguntar/i }));
}

function renderSearch(props: Partial<React.ComponentProps<typeof GlobalSearch>> = {}) {
  return renderWithProviders(<GlobalSearch objects={OBJECTS} navigate={NAVIGATE} {...props} />);
}

describe("GlobalSearch", () => {
  test("el disparador abre el diálogo con todo el índice y su recuento", async () => {
    renderSearch();
    await open();
    expect(screen.getByPlaceholderText("Buscar o preguntar")).toBeTruthy();
    expect(screen.getByText("4 resultados")).toBeTruthy();
    // El nombre accesible de una fila incluye su contexto y su acción (los
    // separadores «·» y «›» son decorativos), y es lo que la distingue:
    // "Analista de datos" es a la vez el título de la vacante y el contexto
    // del candidato.
    expect(screen.getByRole("option", { name: /Analista de datos, vacante/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Andrés Malo, candidato/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Selección, Vacantes/ })).toBeTruthy();
  });

  test("filtra por título, por contexto y sin tildes", async () => {
    renderSearch();
    await open();
    const input = screen.getByPlaceholderText("Buscar o preguntar");

    await userEvent.type(input, "candidato");
    expect(screen.getByRole("option", { name: /Andrés Malo/ })).toBeTruthy();
    // "12 candidatos" es contexto de la vacante, así que también entra.
    expect(screen.getByRole("option", { name: /Analista de datos, vacante/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Selección/ })).toBeNull();

    await userEvent.clear(input);
    await userEvent.type(input, "desempeno");
    expect(screen.getByRole("option", { name: /Desempeño, Objetivos/ })).toBeTruthy();
    expect(screen.getByText("1 resultado")).toBeTruthy();
  });

  test("las pestañas acotan el alcance, y el tabulador las recorre", async () => {
    renderSearch();
    await open();

    await userEvent.click(screen.getByRole("tab", { name: "Objetos" }));
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.queryByRole("option", { name: /Selección/ })).toBeNull();
    expect(screen.getByText("2 resultados")).toBeTruthy();

    // Desde "Objetos", un tabulador lleva a la siguiente pestaña disponible.
    await userEvent.tab();
    expect(screen.getByRole("tab", { name: "Todo" })).toHaveAttribute("aria-selected", "true");
  });

  test("elegir un objeto lo abre y cierra el diálogo", async () => {
    const onSelect = vi.fn();
    renderSearch({ objects: [{ id: "uno", title: "Analista de datos", onSelect }], navigate: [] });
    await open();
    await userEvent.click(screen.getByRole("option", { name: /Analista de datos/ }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByPlaceholderText("Buscar o preguntar")).toBeNull();
  });

  test("sin `onAsk` no hay pestaña ni fila de preguntas", async () => {
    renderSearch();
    await open();
    await userEvent.type(screen.getByPlaceholderText("Buscar o preguntar"), "lo que sea");
    expect(screen.queryByRole("tab", { name: "Preguntar" })).toBeNull();
    expect(screen.queryByText(/Preguntar al agente/i)).toBeNull();
  });

  test("con `onAsk`, la pregunta aparece al escribir y se envía tal cual", async () => {
    const onAsk = vi.fn();
    renderSearch({ onAsk, askHint: "responde en el panel lateral" });
    await open();
    expect(screen.queryByText(/Preguntar al agente/i)).toBeNull();

    await userEvent.type(screen.getByPlaceholderText("Buscar o preguntar"), "¿cuántas vacantes hay?");
    expect(screen.getByText(/Preguntar al agente/i)).toBeTruthy();
    expect(screen.getByText("responde en el panel lateral")).toBeTruthy();

    await userEvent.click(screen.getByRole("option", { name: /Preguntar al agente: ¿cuántas vacantes hay\?/ }));
    expect(onAsk).toHaveBeenCalledWith("¿cuántas vacantes hay?");
  });

  test("las palabras clave encuentran sin mostrarse", async () => {
    renderSearch({
      objects: [{ id: "b", title: "Button", meta: ["Primitivos"], keywords: ["cva", "radix-slot"], onSelect: vi.fn() }],
      navigate: [],
    });
    await open();
    await userEvent.type(screen.getByPlaceholderText("Buscar o preguntar"), "radix");
    expect(screen.getByRole("option", { name: /Button/ })).toBeTruthy();
    // La palabra clave no se pinta: la fila sigue diciendo solo su contexto.
    expect(screen.queryByText("radix-slot")).toBeNull();
  });

  test("muestra el alcance y olvida la búsqueda al cerrar", async () => {
    renderSearch({ scope: "Meta Colombia" });
    await open();
    expect(screen.getByText("Meta Colombia")).toBeTruthy();

    await userEvent.type(screen.getByPlaceholderText("Buscar o preguntar"), "andres");
    await userEvent.keyboard("{Escape}");
    await open();
    expect(screen.getByPlaceholderText("Buscar o preguntar")).toHaveValue("");
    expect(screen.getByText("4 resultados")).toBeTruthy();
  });

  test("⌘K abre y cierra sin tocar el disparador", async () => {
    renderSearch();
    await userEvent.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByPlaceholderText("Buscar o preguntar")).toBeTruthy();
    await userEvent.keyboard("{Meta>}k{/Meta}");
    expect(screen.queryByPlaceholderText("Buscar o preguntar")).toBeNull();
  });
});
