import * as React from "react";
import { describe, expect, test } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { PersonalizationPanel } from "./PersonalizationPanel";

/** El panel con su botón de abrir, como lo monta la app. */
function Harness() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <PersonalizationPanel open={open} onOpenChange={setOpen} />
    </>
  );
}

const stored = () => JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}");
const theme = () => document.documentElement.dataset.theme;

async function openPanel() {
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole("button", { name: "Abrir" }));
  return user;
}

describe("PersonalizationPanel", () => {
  test("lo elegido se ve al momento y cerrar sin guardar lo deshace", async () => {
    const user = await openPanel();
    const before = theme();
    await user.click(await screen.findByRole("radio", { name: "Esmeralda" }));
    expect(theme()).toBe("emerald");
    expect(screen.getByTestId("personalization-unsaved")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(theme()).toBe(before));
    expect(stored().preset).toBe(before);
  });

  test("Guardar se queda con lo elegido", async () => {
    const user = await openPanel();
    await user.click(await screen.findByRole("radio", { name: "Esmeralda" }));
    await user.click(screen.getByTestId("personalization-save"));
    await waitFor(() => expect(screen.queryByTestId("personalization-save")).toBeNull());
    expect(theme()).toBe("emerald");
    expect(stored().preset).toBe("emerald");
  });

  test("Restablecer vuelve a lo de fábrica, también hasta guardar", async () => {
    const user = await openPanel();
    await user.click(await screen.findByRole("radio", { name: "Esmeralda" }));
    await user.click(screen.getByTestId("personalization-reset"));
    expect(theme()).toBe("premium");
    await user.click(screen.getByTestId("personalization-save"));
    await waitFor(() => expect(stored().preset).toBe("premium"));
  });
});
