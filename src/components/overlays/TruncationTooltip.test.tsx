import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TruncationTooltip, isTextTruncated } from "./TruncationTooltip";

const FULL_TEXT = "Corte clásico con degradado bajo y perfilado de barba";

function fakeWidths(element: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
}

function renderWithText(props: React.HTMLAttributes<HTMLSpanElement> = {}) {
  render(
    <TooltipProvider>
      <span data-testid="label" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} {...props}>
        {FULL_TEXT}
      </span>
      <TruncationTooltip />
    </TooltipProvider>,
  );
  return screen.getByTestId("label");
}

function hover(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
  });
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe("TruncationTooltip", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the full text when an ellipsed text overflows", () => {
    const label = renderWithText();
    fakeWidths(label, 400, 120);

    hover(label);

    expect(screen.getByRole("tooltip")).toHaveTextContent(FULL_TEXT);
  });

  it("stays quiet when the text fits", () => {
    const label = renderWithText();
    fakeWidths(label, 120, 120);

    hover(label);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("respects the opt-out attribute", () => {
    const label = renderWithText({ "data-truncation-tooltip": "off" } as React.HTMLAttributes<HTMLSpanElement>);
    fakeWidths(label, 400, 120);

    hover(label);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not treat a plain overflowing box as truncated text", () => {
    const box = document.createElement("div");
    box.style.overflow = "hidden";
    document.body.append(box);
    fakeWidths(box, 400, 120);

    expect(isTextTruncated(box)).toBe(false);
    box.remove();
  });
});
