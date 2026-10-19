import { beforeEach, describe, expect, test } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { db } from "@/mocks/db";
import { appointmentsOn } from "@/mocks/calendar/handlers";
import { RegisterCloseDrawer } from "@/features/transactions/RegisterCloseDrawer";
import { reviewApi } from "./review";

/** Un día pasado: sus citas ya están cobradas y no cambian con la hora. */
const PAST_DAY = "2026-09-22";
const money = (value: number) => `$${value.toFixed(2)}`;

function signIn(accountId: string) {
  const token = `mock-${accountId}-review`;
  db.sessions.set(token, accountId);
  return renderWithProviders(<div />, { token });
}

describe("revisión antes de cerrar", () => {
  beforeEach(() => db.reset());

  test("la caja con un doble cobro no se cierra hasta marcar «Lo revisé»", async () => {
    const paid = appointmentsOn("ma", PAST_DAY).find((item) => item.status === "paid" && item.payment && !item.walkIn && !item.linkId)!;
    db.calendar.appointments = [...db.calendar.appointments, { ...paid, id: `${paid.id}_dup` }];
    db.sessions.set("mock-acc_admin-review", "acc_admin");
    renderWithProviders(<RegisterCloseDrawer open onOpenChange={() => {}} branchId="ma" date={PAST_DAY} formatMoney={money} />, { token: "mock-acc_admin-review" });

    expect(await screen.findByTestId("review-duplicateCharge")).toHaveTextContent(money(paid.payment!.total));
    const user = userEvent.setup();
    await user.type(screen.getByTestId("register-opening"), "0");
    // La caja abre contando por billetes; aquí se escribe el total.
    await user.click(screen.getByTestId("cash-count-mode"));
    await user.type(screen.getByTestId("register-counted"), "1000");
    await user.type(await screen.findByTestId("register-note"), "Prueba");
    expect(screen.getByTestId("register-submit")).toBeDisabled();
    await user.click(screen.getByTestId("review-acknowledge"));
    await waitFor(() => expect(screen.getByTestId("register-submit")).toBeEnabled());
  });

  test("la nómina la revisan dueño y administrador; la caja, también recepción; el barbero, ninguna", async () => {
    const period = { branchId: "ma", from: "2026-09-15", to: "2026-09-21" };
    signIn("acc_reception");
    await expect(reviewApi.payroll(period)).rejects.toMatchObject({ status: 403 });
    expect(Array.isArray((await reviewApi.register("ma", PAST_DAY)).items)).toBe(true);
    signIn("acc_barber");
    await expect(reviewApi.register("ma", PAST_DAY)).rejects.toMatchObject({ status: 403 });
    signIn("acc_admin");
    expect(Array.isArray((await reviewApi.payroll(period)).items)).toBe(true);
  });
});
