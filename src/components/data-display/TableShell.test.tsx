import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { TableShell } from "./TableShell";

const tabla = (
  <Table>
    <TableBody>
      <TableRow>
        <TableCell>Plan trimestral</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

describe("TableShell", () => {
  test("el título acepta un nodo, para el total pegado al nombre", () => {
    render(
      <TableShell
        title={
          <>
            Lista de procesos<span>30</span>
          </>
        }
      >
        {tabla}
      </TableShell>
    );
    expect(screen.getByText("Lista de procesos")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });

  test("el pie va dentro del marco, con la paginación de la lista", () => {
    render(
      <TableShell title="Procesos" footer={<button type="button">Siguiente</button>}>
        {tabla}
      </TableShell>
    );
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeTruthy();
    expect(screen.getByText("Plan trimestral")).toBeTruthy();
  });

  test("vacío, cambia la tabla por su estado y deja el pie", () => {
    render(
      <TableShell title="Procesos" empty emptyState={<p>Nada por aquí</p>} footer={<span>0 de 0</span>}>
        {tabla}
      </TableShell>
    );
    expect(screen.getByText("Nada por aquí")).toBeTruthy();
    expect(screen.queryByText("Plan trimestral")).toBeNull();
    expect(screen.getByText("0 de 0")).toBeTruthy();
  });

  test("sin título, descripción ni acciones no dibuja cabecera", () => {
    const { container } = render(<TableShell>{tabla}</TableShell>);
    expect(container.querySelector('[data-slot="card-header"]')).toBeNull();
  });
});
