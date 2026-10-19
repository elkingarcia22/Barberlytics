import { describe, expect, test, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { BookingFlowProvider, type BookingFlowValue } from "../../flow/BookingContext";
import { ChatCardSheets } from "./ChatCardSheets";
import type { ChatCardController } from "./chatCard";

/** Lo mínimo de la reserva que usan las hojas: cómo se ve. */
const FLOW = { layout: "compact", touch: "default", isPhone: true } as unknown as BookingFlowValue;
const inFlow = (card: ChatCardController) => (
  <BookingFlowProvider value={FLOW}>
    <ChatCardSheets card={card} />
  </BookingFlowProvider>
);

const controller = (sheet: ChatCardController["sheet"]): ChatCardController => ({ start: vi.fn(), askSavedCvc: vi.fn(), sheet, confirmNew: vi.fn(), confirmCvc: vi.fn(), onOpenChange: vi.fn() });

describe("la tarjeta en la conversación va en su hoja, no en el chat", () => {
  test("el CVC de una guardada se escribe en la hoja y no sigue hasta estar completo", async () => {
    const user = userEvent.setup();
    const card = controller({ kind: "cvc", cardId: "card_demo_visa", label: "Visa •••• 4242", brand: "Visa" });
    renderWithProviders(inFlow(card));
    const input = await screen.findByLabelText("CVC");
    expect(input).toHaveAttribute("autocomplete", "cc-csc");
    await user.type(input, "12");
    await user.click(screen.getByRole("button", { name: /usar/i }));
    expect(card.confirmCvc).not.toHaveBeenCalled();
    await user.type(input, "3");
    await user.click(screen.getByRole("button", { name: /usar/i }));
    expect(card.confirmCvc).toHaveBeenCalledWith("123");
  });

  test("una tarjeta nueva abre los campos de la tarjeta; sin hoja no se pinta nada", async () => {
    const { unmount } = renderWithProviders(inFlow(controller({ kind: "new", canSave: true })));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    unmount();
    renderWithProviders(inFlow(controller(null)));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
