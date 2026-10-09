import * as React from "react";
import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortalContent, PortalSlot } from "./portalSlot";
import { usePortalNode } from "./usePortalNode";

/** Un contenido con estado propio, como la reserva: si se desmonta, vuelve a cero. */
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Pasos: {count}
    </button>
  );
}

/** Dos sitios posibles, como el marco del celular y el panel del widget. */
function Preview({ where }: { where: "frame" | "widget" }) {
  const node = usePortalNode("h-full");
  return (
    <>
      {where === "frame" ? (
        <section aria-label="Marco">
          <PortalSlot node={node} />
        </section>
      ) : (
        <aside aria-label="Widget">
          <PortalSlot node={node} />
        </aside>
      )}
      <PortalContent node={node}>
        <Counter />
      </PortalContent>
    </>
  );
}

describe("PortalSlot", () => {
  test("lo de dentro se muda del marco al widget sin perder su estado", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = render(<Preview where="frame" />);
    await user.click(within(screen.getByRole("region", { name: "Marco" })).getByRole("button", { name: "Pasos: 0" }));

    // Act
    rerender(<Preview where="widget" />);

    // Assert
    expect(within(screen.getByRole("complementary", { name: "Widget" })).getByRole("button", { name: "Pasos: 1" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Marco" })).toBeNull();
  });
});
