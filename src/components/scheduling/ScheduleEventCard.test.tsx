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

  test("cada servicio lleva su círculo de color y el nombre del cliente ninguno", () => {
    const { container } = renderWithProviders(
      <ScheduleEventCard
        event={{ ...BASE, color: 1, segments: [{ id: "a", label: "Corte clásico · 30 min", minutes: 30, color: 1 }, { id: "b", label: "Arreglo de barba · 30 min", minutes: 30, color: 2 }] }}
        timeLabel="10:00 – 11:00"
        minutes={60}
        heightPx={112}
      />
    );
    expect(container.querySelectorAll("[data-segment-label] .rounded-full")).toHaveLength(2);
    expect(screen.getByText("Mariana Rodríguez").previousElementSibling).toBeNull();
  });
});

describe("ScheduleEventCard enlazada", () => {
  const linked: ScheduleEvent = { ...BASE, group: { id: "L1", index: 1, size: 2, color: 3 } };

  test("lleva el icono de enlace en el color del grupo y sin borde hasta que se resalta", () => {
    const { container, rerender } = renderWithProviders(<ScheduleEventCard event={linked} timeLabel="10:00 – 11:00" minutes={60} heightPx={112} />);
    expect(screen.getByRole("img", { name: "Cita enlazada 1 de 2" })).toHaveAttribute("data-group-color", "3");
    expect(container.querySelector("[data-group-highlight]")).toBeNull();
    rerender(<ScheduleEventCard event={{ ...linked, group: { ...linked.group!, highlight: true } }} timeLabel="10:00 – 11:00" minutes={60} heightPx={112} />);
    expect(container.querySelector("[data-group-highlight]")).toHaveClass("border-dashed", "schedule-color-3");
  });
});
