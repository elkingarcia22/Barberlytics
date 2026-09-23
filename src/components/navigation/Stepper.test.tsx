import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper, type StepperStep } from "./Stepper";

const STEPS: StepperStep[] = [
  { id: "datos", label: "Datos de la vacante" },
  { id: "requisitos", label: "Requisitos" },
  { id: "publicacion", label: "Publicación" },
];

describe("Stepper", () => {
  test("marca solo el paso actual con aria-current=step", () => {
    render(<Stepper steps={STEPS} current={1} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  test("deriva el estado de cada paso a partir de current", () => {
    render(<Stepper steps={STEPS} current={1} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-status", "complete");
    expect(items[1]).toHaveAttribute("data-status", "current");
    expect(items[2]).toHaveAttribute("data-status", "upcoming");
  });

  test("un status explícito gana sobre el derivado", () => {
    const steps = STEPS.map((step, index) => (index === 0 ? { ...step, status: "error" as const } : step));
    render(<Stepper steps={steps} current={2} />);
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("data-status", "error");
  });

  test("al hacer clic en un paso completado llama a onStepClick con su índice", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<Stepper steps={STEPS} current={2} onStepClick={onStepClick} />);

    await user.click(screen.getByRole("button", { name: "Datos de la vacante" }));

    expect(onStepClick).toHaveBeenCalledTimes(1);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  test("los pasos pendientes quedan deshabilitados y no disparan onStepClick", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<Stepper steps={STEPS} current={0} onStepClick={onStepClick} />);

    const upcoming = screen.getByRole("button", { name: "Publicación" });
    expect(upcoming).toBeDisabled();
    await user.click(upcoming);

    expect(onStepClick).not.toHaveBeenCalled();
  });

  test("sin onStepClick no renderiza botones", () => {
    render(<Stepper steps={STEPS} current={0} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
