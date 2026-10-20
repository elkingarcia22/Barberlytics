import { beforeEach, describe, expect, test } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { appointmentsOn } from "@/mocks/calendar/handlers";
import { DepositPayPage } from "./DepositPayPage";

const OWNER = "mock-acc_admin-deposit";

/** Pide un anticipo de 12 sobre una cita por venir y devuelve el token del enlace. */
async function requestDeposit(): Promise<string> {
  const day = new Date();
  day.setDate(day.getDate() + 3);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  const appointment = appointmentsOn("ma", date).find((item) => item.status === "scheduled" && !item.walkIn)!;
  const response = await fetch(`http://localhost/api/appointments/${appointment.id}/deposit`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${OWNER}` }, body: JSON.stringify({ amount: 12, channels: [{ channel: "email", to: "cliente@correo.com" }] }) });
  const { depositRequest } = (await response.json()) as { depositRequest: { link: string } };
  return new URL(depositRequest.link).searchParams.get("token") ?? "";
}

describe("el enlace de anticipo", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
  });

  test("muestra el monto y la cita, y al pagar queda guardada", async () => {
    const token = await requestDeposit();
    renderWithProviders(<DepositPayPage />, { route: `/reservar/anticipo?token=${token}` });
    const user = userEvent.setup();
    expect(await screen.findByTestId("deposit-pay")).toHaveTextContent(/deja tu anticipo/i);
    await user.click(screen.getByTestId("deposit-pay-submit"));
    expect(await screen.findByTestId("deposit-paid")).toHaveTextContent(/tu cita quedó guardada/i);
  });

  test("un enlace sin token o que no existe lo dice", async () => {
    renderWithProviders(<DepositPayPage />, { route: "/reservar/anticipo?token=nada" });
    expect(await screen.findByText(/no pudimos abrir el pago/i)).toBeInTheDocument();
  });
});
