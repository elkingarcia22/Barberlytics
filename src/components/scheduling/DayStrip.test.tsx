import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "@/i18n";
import { DayStrip } from "./DayStrip";
import { TimeSlotGroups } from "./TimeSlotGroups";

const wrap = (node: React.ReactNode) => render(<LocaleProvider>{node}</LocaleProvider>);

describe("DayStrip", () => {
  test("ofrece los días, marca el elegido y avisa al tocar otro", async () => {
    const onChange = vi.fn();
    const first = new Date(2026, 9, 15);
    wrap(<DayStrip first={first} count={5} value={first} onChange={onChange} />);
    const days = screen.getAllByRole("radio");
    expect(days).toHaveLength(5);
    expect(days[0]).toHaveAttribute("aria-checked", "true");
    await userEvent.click(days[2]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getDate()).toBe(17);
  });

  test("pone un punto en los días marcados", () => {
    const first = new Date(2026, 9, 15);
    const { container } = wrap(<DayStrip first={first} count={3} value={first} onChange={() => undefined} marked={new Set(["2026-10-16"])} />);
    expect(container.querySelectorAll("span[aria-hidden].rounded-full")).toHaveLength(1);
  });
});

describe("TimeSlotGroups", () => {
  const groups = [
    { id: "morning", label: "Mañana", options: [{ time: "09:00", label: "9:00 a. m.", selected: true }, { time: "09:30", label: "9:30 a. m." }] },
    { id: "afternoon", label: "Tarde", options: [{ time: "14:00", label: "2:00 p. m.", disabled: true }] },
  ];

  test("agrupa por franja, marca la elegida y avisa con la hora", async () => {
    const onPick = vi.fn();
    wrap(<TimeSlotGroups groups={groups} onPick={onPick} />);
    expect(screen.getByRole("region", { name: "Mañana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "9:00 a. m." })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "9:30 a. m." }));
    expect(onPick).toHaveBeenCalledWith("09:30");
  });

  test("la elegida y la deshabilitada no responden", async () => {
    const onPick = vi.fn();
    wrap(<TimeSlotGroups groups={groups} onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "9:00 a. m." }));
    await userEvent.click(screen.getByRole("button", { name: "2:00 p. m." }));
    expect(onPick).not.toHaveBeenCalled();
  });
});
