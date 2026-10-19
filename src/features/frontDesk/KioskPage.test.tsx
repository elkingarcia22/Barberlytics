import { describe, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { db } from "@/mocks/db";
import { KioskPage } from "./KioskPage";

const OWNER = "mock-acc_admin-kioskpage";

/** Un código de emparejamiento recién sacado en Configuración. */
async function pairingCode(): Promise<string> {
  db.sessions.set(OWNER, "acc_admin");
  const response = await fetch("http://localhost/api/front-desk/devices", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${OWNER}` }, body: JSON.stringify({ branchId: "ma", name: "Entrada" }) });
  return ((await response.json()) as { pairingCode: string }).pairingCode;
}

describe("el kiosco de la sede", () => {
  test("se activa con el código y quien llega sin cita se une a la fila y ve su turno", async () => {
    const user = userEvent.setup();
    const code = await pairingCode();
    renderWithProviders(<KioskPage />, { route: "/kiosco" });
    await user.type(await screen.findByTestId("kiosk-pair-code"), code);
    await user.click(screen.getByRole("button", { name: "Activar" }));
    await user.click(await screen.findByTestId("kiosk-walk-in"));
    await user.click((await screen.findAllByTestId("kiosk-service"))[0]);
    await user.click(await screen.findByTestId("kiosk-any-barber"));
    await user.type(await screen.findByTestId("kiosk-name"), "Ana");
    await user.click(screen.getByTestId("kiosk-join"));
    const joined = await screen.findByTestId("kiosk-joined");
    expect(joined).toHaveTextContent("#1");
    expect(db.frontDesk.queue.filter((entry) => entry.status === "waiting")).toHaveLength(1);
  });

  test("sin activar no deja hacer nada: pide el código", async () => {
    renderWithProviders(<KioskPage />, { route: "/kiosco" });
    expect(await screen.findByTestId("kiosk-pair")).toBeInTheDocument();
    expect(screen.queryByTestId("kiosk-home")).toBeNull();
  });
});
