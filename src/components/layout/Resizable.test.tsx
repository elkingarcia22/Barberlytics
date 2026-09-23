import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResizableGroup, ResizableHandle, ResizablePanel } from "./Resizable";

function MasterDetail(props: { onLayout?: (sizes: number[]) => void }) {
  return (
    <ResizableGroup direction="horizontal" onLayout={props.onLayout}>
      <ResizablePanel defaultSize={30} minSize={15} maxSize={70}>
        Candidatos
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={70} minSize={20}>
        Ficha
      </ResizablePanel>
    </ResizableGroup>
  );
}

/** Pulsa una tecla N veces sobre el asa ya enfocada. */
async function press(user: ReturnType<typeof userEvent.setup>, key: string, times = 1) {
  for (let i = 0; i < times; i += 1) {
    await user.keyboard(`{${key}}`);
  }
}

describe("Resizable", () => {
  test("el asa es un separator enfocable con el reparto en los aria-value", () => {
    render(<MasterDetail />);
    const handle = screen.getByRole("separator");

    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("aria-valuenow", "30");
    expect(handle).toHaveAttribute("aria-valuemin", "15");
    expect(handle).toHaveAttribute("aria-valuemax", "70");
  });

  test("las flechas mueven el reparto de 2 % en 2 %", async () => {
    const user = userEvent.setup();
    render(<MasterDetail />);
    const handle = screen.getByRole("separator");
    handle.focus();

    await press(user, "ArrowRight");
    expect(handle).toHaveAttribute("aria-valuenow", "32");

    await press(user, "ArrowRight");
    expect(handle).toHaveAttribute("aria-valuenow", "34");

    await press(user, "ArrowLeft", 2);
    expect(handle).toHaveAttribute("aria-valuenow", "30");
  });

  test("respeta minSize al encoger el panel", async () => {
    const user = userEvent.setup();
    render(<MasterDetail />);
    const handle = screen.getByRole("separator");
    handle.focus();

    // 30 → 15 son 8 pasos de 2; con 12 se comprueba que el recorte aguanta.
    await press(user, "ArrowLeft", 12);
    expect(handle).toHaveAttribute("aria-valuenow", "15");
  });

  test("respeta maxSize, y también el minSize del panel vecino", async () => {
    const user = userEvent.setup();
    render(<MasterDetail />);
    const handle = screen.getByRole("separator");
    handle.focus();

    // El par suma 100 y el vecino exige 20, así que el tope sería 80; manda el maxSize de 70.
    await press(user, "ArrowRight", 40);
    expect(handle).toHaveAttribute("aria-valuenow", "70");
  });

  test("Home y End llevan al mínimo y al máximo", async () => {
    const user = userEvent.setup();
    render(<MasterDetail />);
    const handle = screen.getByRole("separator");
    handle.focus();

    await press(user, "Home");
    expect(handle).toHaveAttribute("aria-valuenow", "15");

    await press(user, "End");
    expect(handle).toHaveAttribute("aria-valuenow", "70");
  });

  test("el doble clic restablece los tamaños por defecto", async () => {
    const user = userEvent.setup();
    render(<MasterDetail />);
    const handle = screen.getByRole("separator");
    handle.focus();

    await press(user, "ArrowRight", 5);
    expect(handle).toHaveAttribute("aria-valuenow", "40");

    await user.dblClick(handle);
    expect(handle).toHaveAttribute("aria-valuenow", "30");
  });

  test("onLayout recibe el reparto completo en cada cambio", async () => {
    const user = userEvent.setup();
    const onLayout = vi.fn();
    render(<MasterDetail onLayout={onLayout} />);
    screen.getByRole("separator").focus();

    await press(user, "ArrowRight");

    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(onLayout).toHaveBeenCalledWith([32, 68]);
  });

  test("los paneles reciben su porcentaje como flex-basis", () => {
    render(<MasterDetail />);
    expect(screen.getByText("Candidatos")).toHaveStyle({ flexBasis: "30%" });
    expect(screen.getByText("Ficha")).toHaveStyle({ flexBasis: "70%" });
  });

  test("storageKey recuerda el reparto entre montajes", async () => {
    const user = userEvent.setup();
    window.localStorage.removeItem("thema:test:resizable");

    const tree = (
      <ResizableGroup direction="horizontal" storageKey="thema:test:resizable">
        <ResizablePanel defaultSize={30} minSize={15} maxSize={70}>
          Candidatos
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70}>Ficha</ResizablePanel>
      </ResizableGroup>
    );

    const first = render(tree);
    first.getByRole("separator").focus();
    await press(user, "ArrowRight", 3);
    expect(first.getByRole("separator")).toHaveAttribute("aria-valuenow", "36");
    first.unmount();

    const second = render(tree);
    expect(second.getByRole("separator")).toHaveAttribute("aria-valuenow", "36");
    window.localStorage.removeItem("thema:test:resizable");
  });

  test("en vertical el separator es horizontal y responde a las flechas verticales", async () => {
    const user = userEvent.setup();
    render(
      <ResizableGroup direction="vertical">
        <ResizablePanel defaultSize={60} minSize={20}>
          Editor
        </ResizablePanel>
        <ResizableHandle withGrip />
        <ResizablePanel defaultSize={40} minSize={20}>
          Vista previa
        </ResizablePanel>
      </ResizableGroup>
    );

    const handle = screen.getByRole("separator");
    expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    handle.focus();

    await press(user, "ArrowDown");
    expect(handle).toHaveAttribute("aria-valuenow", "62");

    await press(user, "ArrowUp", 2);
    expect(handle).toHaveAttribute("aria-valuenow", "58");
  });
});
