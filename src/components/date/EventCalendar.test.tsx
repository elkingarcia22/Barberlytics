import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EventCalendar } from "./EventCalendar";
import type { CalendarEvent } from "./eventCalendarUtils";

/** Martes 15 de septiembre de 2026. Fecha fija: la agenda no depende del reloj. */
const BASE = new Date(2026, 8, 15, 9, 0);

const EVENTS: readonly CalendarEvent[] = [
  {
    id: "induccion",
    title: "Inducción operativa",
    start: new Date(2026, 8, 15, 9, 0),
    end: new Date(2026, 8, 15, 10, 30),
    tone: "primary",
    location: "Sala Bogotá",
  },
  {
    id: "clima",
    title: "Cierre de encuesta de clima",
    start: new Date(2026, 8, 18, 17, 0),
    end: new Date(2026, 8, 18, 18, 0),
    tone: "warning",
  },
];

describe("EventCalendar", () => {
  test("coloca cada evento en la celda del día que le corresponde", () => {
    render(<EventCalendar events={EVENTS} defaultDate={BASE} now={BASE} />);

    const martes = screen.getByRole("gridcell", { name: /15 de septiembre, 1 evento/i });
    expect(
      within(martes).getByRole("button", {
        name: "Inducción operativa, 15 de septiembre, 9:00 a 10:30",
      })
    ).toBeInTheDocument();

    const viernes = screen.getByRole("gridcell", { name: /18 de septiembre, 1 evento/i });
    expect(
      within(viernes).getByRole("button", { name: /Cierre de encuesta de clima/ })
    ).toBeInTheDocument();

    // El día sin nada agendado se anuncia como vacío y no trae chips.
    const lunes = screen.getByRole("gridcell", { name: /14 de septiembre, sin eventos/i });
    expect(within(lunes).queryByRole("button")).toBeNull();
  });

  test("el conmutador cambia de vista y reescribe el título del periodo", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(
      <EventCalendar events={EVENTS} defaultDate={BASE} now={BASE} onViewChange={onViewChange} />
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Septiembre 2026");

    await user.click(screen.getByRole("radio", { name: "Semana" }));

    expect(onViewChange).toHaveBeenCalledWith("week");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("14–20 de septiembre");
    expect(screen.queryByRole("grid")).toBeNull();
  });

  test("el clic en un evento llama a onEventClick con ese evento", async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    render(
      <EventCalendar events={EVENTS} defaultDate={BASE} now={BASE} onEventClick={onEventClick} />
    );

    await user.click(screen.getByRole("button", { name: /Inducción operativa/ }));

    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(EVENTS[0]);
  });

  test("sin eventos en el periodo muestra el estado vacío del sistema", () => {
    render(<EventCalendar events={[]} defaultDate={BASE} now={BASE} />);

    expect(screen.getByText("No hay nada agendado")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).toBeNull();
  });
});
