import { describe, expect, test, vi } from "vitest";
import { fireEvent, renderWithProviders, screen } from "@/test/render";
import { ResourceDayGrid } from "./ResourceDayGrid";
import { SCHEDULE_COLUMN_MIN_PX } from "./scheduleUtils";
import type { ScheduleResource } from "./scheduleTypes";

const DAY = new Date(2026, 8, 25);
const RESOURCES: ScheduleResource[] = [
  { id: "andres", name: "Andrés Beltrán", workingHours: [{ start: "09:00", end: "18:00" }] },
  { id: "lorena", name: "Lorena Lemos", workingHours: [{ start: "09:00", end: "18:00" }] },
];

const columnOf = (container: HTMLElement, id: string) => container.querySelector<HTMLElement>(`[data-resource-id="${id}"]`)?.parentElement;

describe("ResourceDayGrid: ancho de las columnas", () => {
  test("sin onColumnResize las columnas no tienen asa", () => {
    renderWithProviders(<ResourceDayGrid date={DAY} resources={RESOURCES} events={[]} now={DAY} />);
    expect(screen.queryByTestId("schedule-column-resize")).not.toBeInTheDocument();
  });

  test("pinta el ancho guardado como pista fija y deja las demás repartiendo el sitio", () => {
    const { container } = renderWithProviders(<ResourceDayGrid date={DAY} resources={RESOURCES} events={[]} now={DAY} columnWidths={{ lorena: 320 }} onColumnResize={() => {}} />);
    expect(columnOf(container, "andres")?.style.gridTemplateColumns).toBe("minmax(11rem, 1fr) 320px");
  });

  test("las flechas cambian el ancho y el doble clic lo devuelve al de siempre", () => {
    const onColumnResize = vi.fn();
    renderWithProviders(<ResourceDayGrid date={DAY} resources={RESOURCES} events={[]} now={DAY} columnWidths={{ andres: 240 }} onColumnResize={onColumnResize} />);
    const [handle] = screen.getAllByRole("separator", { name: /Andrés Beltrán/ });
    expect(handle).toHaveAttribute("aria-valuenow", "240");

    // jsdom no mide: la columna mide 0 y el ancho nuevo topa con el mínimo.
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onColumnResize).toHaveBeenLastCalledWith("andres", SCHEDULE_COLUMN_MIN_PX);

    fireEvent.doubleClick(handle);
    expect(onColumnResize).toHaveBeenLastCalledWith("andres", null);
  });
});
