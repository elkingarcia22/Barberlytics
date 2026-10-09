import { afterEach, describe, expect, test, vi } from "vitest";
import { toast } from "sonner";
import { cardMissing, toastMissing } from "./missingData";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const t = ((key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)) as Parameters<typeof toastMissing>[0];

describe("lo que falta para seguir", () => {
  afterEach(() => vi.mocked(toast.error).mockClear());

  test("sin nada que falte no avisa y deja seguir", () => {
    expect(toastMissing(t, [undefined, false, ""])).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test("con un dato, el toast es su mensaje", () => {
    expect(toastMissing(t, ["Escribe tu nombre."])).toBe(true);
    expect(toast.error).toHaveBeenCalledWith("Escribe tu nombre.", { id: "booking-missing-data", toasterId: "booking" });
  });

  test("con varios, dice cuántos y nombra el primero", () => {
    toastMissing(t, ["Escribe tu nombre.", undefined, "Revisa el correo."]);
    expect(toast.error).toHaveBeenCalledWith('booking.form.missingMany {"count":2}', { id: "booking-missing-data", description: "Escribe tu nombre.", toasterId: "booking" });
  });

  test("la tarjeta dice qué campos revisar", () => {
    expect(cardMissing(t, { number: "4242 4242 4242 4242", name: "", expiry: "", cvc: "" })).toEqual([
      'booking.payment.cardFieldMissing {"field":"booking.payment.cardExpiry"}',
      'booking.payment.cardFieldMissing {"field":"booking.payment.cardCvc"}',
      'booking.payment.cardFieldMissing {"field":"booking.payment.cardName"}',
    ]);
  });
});
