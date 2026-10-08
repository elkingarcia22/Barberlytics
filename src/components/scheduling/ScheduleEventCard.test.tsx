import { describe, expect, test } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ScheduleEventCard } from "./ScheduleEventCard";
import type { ScheduleEvent } from "./scheduleTypes";

const BASE: ScheduleEvent = {
  id: "e1",
  resourceId: "r1",
  start: new Date(2026, 8, 25, 10),
  end: new Date(2026, 8, 25, 11),
  title: "Mariana Rodríguez",
  subtitle: "Corte clásico + Arreglo de barba · US$ 65",
};

describe("ScheduleEventCard con varios servicios", () => {
  test("marca por dentro dónde empieza cada servicio y pone el total abajo", () => {
    const { container } = renderWithProviders(
      <ScheduleEventCard
        event={{ ...BASE, segments: [{ id: "a", label: "Corte clásico · 30 min", minutes: 30 }, { id: "b", label: "Arreglo de barba · 30 min", minutes: 30 }], meta: "US$ 65" }}
        timeLabel="10:00 – 11:00"
        minutes={60}
        heightPx={112}
      />
    );
    expect(screen.getByText("Corte clásico · 30 min")).toBeInTheDocument();
    expect(screen.getByText("Arreglo de barba · 30 min")).toBeInTheDocument();
    expect(screen.getByText("US$ 65")).toBeInTheDocument();
    // Una sola línea entre los dos tramos, a mitad de la tarjeta; el subtítulo de siempre no sale.
    const lines = container.querySelectorAll<HTMLElement>("[data-segment]");
    expect(lines).toHaveLength(1);
    expect(lines[0].style.top).toBe("50%");
    expect(screen.queryByText(BASE.subtitle as string)).toBeNull();
  });

  test("sin tramos se ve como siempre", () => {
    const { container } = renderWithProviders(<ScheduleEventCard event={BASE} timeLabel="10:00 – 11:00" minutes={60} heightPx={112} />);
    expect(container.querySelector("[data-segment]")).toBeNull();
    expect(screen.getByText(BASE.subtitle as string)).toBeInTheDocument();
  });
});
