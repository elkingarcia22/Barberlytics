import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { initialBookingState, type BookingState } from "../bookingState";
import type { Reservation } from "../types";
import { BookingFlowProvider, type BookingFlowValue } from "./BookingContext";
import { ReservedHairBurst } from "./ReservedHairBurst";

function valueWith(state: BookingState): BookingFlowValue {
  return { state } as BookingFlowValue;
}

function withReservation(id: string): BookingState {
  return { ...initialBookingState(), reservation: { id } as Reservation, step: "confirmed" };
}

function renderBurst(state: BookingState) {
  const view = render(
    <BookingFlowProvider value={valueWith(state)}>
      <ReservedHairBurst />
    </BookingFlowProvider>
  );
  return {
    ...view,
    update: (next: BookingState) =>
      view.rerender(
        <BookingFlowProvider value={valueWith(next)}>
          <ReservedHairBurst />
        </BookingFlowProvider>
      ),
  };
}

describe("ReservedHairBurst", () => {
  afterEach(() => vi.restoreAllMocks());

  test("celebra la reserva recién creada", () => {
    // Arrange
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container, update } = renderBurst(initialBookingState());
    expect(container.querySelector('[data-slot="hair-burst"]')).toBeNull();

    // Act
    update(withReservation("res-1"));

    // Assert
    expect(container.querySelector('[data-slot="hair-burst"]')).not.toBeNull();
  });

  test("no vuelve a celebrar la reserva que ya estaba al montar", () => {
    // Arrange / Act
    const { container } = renderBurst(withReservation("res-1"));

    // Assert
    expect(container.querySelector('[data-slot="hair-burst"]')).toBeNull();
  });
});
