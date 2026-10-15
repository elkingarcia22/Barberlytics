import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { TicketCard } from "./TicketCard";

describe("TicketCard", () => {
  test("pone el talón aparte del cuerpo y el talón no lo lee el lector de pantalla", () => {
    const { container } = render(
      <TicketCard stub={<span>Parte 2 de 3</span>} aria-label="Parte 2 de 3 de tu visita">
        <h3>Fade</h3>
      </TicketCard>
    );
    expect(screen.getByRole("region", { name: "Parte 2 de 3 de tu visita" })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="ticket-stub"]')).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector('[data-slot="ticket-body"]')).toHaveTextContent("Fade");
  });

  test("las dos muescas llevan su arco con filo para conservar la forma", () => {
    const { container } = render(<TicketCard stub="1">Cuerpo</TicketCard>);
    const notches = container.querySelectorAll("span[aria-hidden].rounded-full");
    expect(notches).toHaveLength(2);
    notches.forEach((notch) => expect(notch.className).toContain("border-border"));
  });
});
