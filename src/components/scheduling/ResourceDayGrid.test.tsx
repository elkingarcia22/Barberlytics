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

describe("ResourceDayGrid: una columna por día", () => {
  const MONDAY = new Date(2026, 8, 21);
  const WEEK: ScheduleResource[] = [0, 1, 2].map((offset) => {
    const date = new Date(2026, 8, 21 + offset);
    return { id: `d${offset}`, name: `Día ${offset}`, date, workingHours: [{ start: "09:00", end: "18:00" }] };
  });

  test("cada columna enseña sus citas, su día en la cabecera y hoy resaltado", () => {
    const events = [{ id: "e1", resourceId: "d1", start: new Date(2026, 8, 22, 10), end: new Date(2026, 8, 22, 11), title: "Marcela Gómez" }];
    renderWithProviders(<ResourceDayGrid date={MONDAY} resources={WEEK} events={events} now={new Date(2026, 8, 23, 11)} />);
    expect(screen.getByText("Marcela Gómez")).toBeInTheDocument();
    expect(screen.getByText("23")).toHaveAttribute("aria-current", "date");
    expect(screen.getByText("22")).not.toHaveAttribute("aria-current");
  });

  test("tocar un hueco devuelve la fecha de su columna, no la de la rejilla", () => {
    const onSlotClick = vi.fn();
    renderWithProviders(<ResourceDayGrid date={MONDAY} resources={WEEK} events={[]} now={MONDAY} startHour={9} endHour={10} onSlotClick={onSlotClick} />);
    const [slot] = screen.getAllByRole("button", { name: /Día 2/ });
    fireEvent.click(slot);
    expect(onSlotClick).toHaveBeenCalledWith(expect.objectContaining({ resourceId: "d2", start: new Date(2026, 8, 23, 9) }));
  });

  test("arrastrar una cita a otra columna la lleva a ese día, y la validación ve el día destino", () => {
    const onEventMove = vi.fn();
    const validateDrop = vi.fn(() => null);
    const events = [{ id: "e1", resourceId: "d0", start: new Date(2026, 8, 21, 10), end: new Date(2026, 8, 21, 10, 30), title: "Marcela Gómez" }];
    const { container } = renderWithProviders(
      <ResourceDayGrid date={MONDAY} resources={WEEK} events={events} now={MONDAY} startHour={9} endHour={12} onEventClick={() => undefined} onEventMove={onEventMove} validateDrop={validateDrop} />
    );
    // jsdom no mide: cada columna ocupa 100 px a lo ancho y el cuerpo 360 px de alto para 3 horas (2 px por minuto).
    const body = container.querySelector<HTMLElement>("[data-resource-id='d0']")!.parentElement!;
    vi.spyOn(body, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 300, 360));
    WEEK.forEach((resource, index) => {
      const column = container.querySelector<HTMLElement>(`[data-resource-id='${resource.id}']`)!;
      vi.spyOn(column, "getBoundingClientRect").mockReturnValue(new DOMRect(index * 100, 0, 100, 360));
    });
    // jsdom no captura el puntero: basta con que exista.
    Element.prototype.setPointerCapture ??= () => undefined;
    Element.prototype.releasePointerCapture ??= () => undefined;
    Element.prototype.hasPointerCapture ??= () => false;
    // Los eventos burbujean hasta la tarjeta, que es la que escucha el arrastre.
    const card = screen.getByText("Marcela Gómez");
    const at = (x: number, y: number) => ({ pointerId: 1, pointerType: "mouse", button: 0, clientX: x, clientY: y });
    fireEvent.pointerDown(card, at(50, 60));
    fireEvent.pointerMove(card, at(150, 90));
    // Una hora más tarde (120 px = 60 min) y una columna a la derecha: martes 22 a las 11:00.
    fireEvent.pointerUp(card, at(150, 180));
    const drop = { resourceId: "d1", start: new Date(2026, 8, 22, 11), end: new Date(2026, 8, 22, 11, 30) };
    expect(validateDrop).toHaveBeenLastCalledWith(expect.objectContaining({ id: "e1" }), drop);
    expect(onEventMove).toHaveBeenCalledWith(expect.objectContaining({ id: "e1" }), drop);
  });
});
