import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createQueryClient } from "@/lib/query";
import { resetBookingLimits } from "@/mocks/booking/handlers";
import { CODE_REUSE_MS, useRecentCode, useRequestCodeMutation } from "./queries";

const PHONE = "+573202172738";

function setup() {
  const client = createQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => ({ request: useRequestCodeMutation(), recent: useRecentCode() }), { wrapper });
}

describe("código reciente", () => {
  beforeEach(() => resetBookingLimits());
  afterEach(() => vi.restoreAllMocks());

  test("sin pedir ninguno no hay código que reutilizar", () => {
    const { result } = setup();
    expect(result.current.recent(PHONE)).toBeNull();
  });

  test("el código pedido hace poco se reutiliza para ese celular y no para otro", async () => {
    const { result } = setup();
    await act(() => result.current.request.mutateAsync(PHONE));
    await waitFor(() => expect(result.current.recent(PHONE)).toMatchObject({ sentTo: expect.any(String) }));
    expect(result.current.recent("+573005550102")).toBeNull();
  });

  test("pasado el plazo ya no se reutiliza: se pide otro", async () => {
    const { result } = setup();
    await act(() => result.current.request.mutateAsync(PHONE));
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + CODE_REUSE_MS + 1);
    expect(result.current.recent(PHONE)).toBeNull();
  });
});
