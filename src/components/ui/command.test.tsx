import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Command, CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";

describe("Command", () => {
  test("filtra sus ítems por el texto escrito", async () => {
    const { rerender } = render(
      <Command>
        <CommandInput placeholder="buscar" />
        <CommandList>
          <CommandEmpty>Nada</CommandEmpty>
          <CommandItem value="espaciado">Espaciado</CommandItem>
          <CommandItem value="tipografía">Tipografía</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText("Espaciado")).toBeTruthy();
    expect(screen.getByText("Tipografía")).toBeTruthy();
    rerender(
      <Command value="espaciado">
        <CommandInput placeholder="buscar" />
        <CommandList>
          <CommandEmpty>Nada</CommandEmpty>
          <CommandItem value="espaciado">Espaciado</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText("Espaciado")).toBeTruthy();
  });
});

describe("CommandDialog", () => {
  /**
   * Regresión: el diálogo no envolvía a sus hijos en `Command`, así que
   * `CommandInput` se quedaba sin el store de cmdk y la paleta no abría en
   * ningún sitio, ni en la demo del registro.
   */
  test("abierto, monta la raíz de cmdk y muestra su campo y sus ítems", () => {
    render(
      <CommandDialog open title="Paleta" description="Busca algo">
        <CommandInput placeholder="buscar" />
        <CommandList>
          <CommandItem value="uno">Uno</CommandItem>
        </CommandList>
      </CommandDialog>
    );
    expect(screen.getByPlaceholderText("buscar")).toBeTruthy();
    expect(screen.getByText("Uno")).toBeTruthy();
    expect(document.querySelector('[data-slot="command"]')).toBeTruthy();
  });

  test("cerrado, no monta nada", () => {
    render(
      <CommandDialog title="Paleta" description="Busca algo">
        <CommandInput placeholder="buscar" />
      </CommandDialog>
    );
    expect(screen.queryByPlaceholderText("buscar")).toBeNull();
  });
});
