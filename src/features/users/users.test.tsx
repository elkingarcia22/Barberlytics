import { describe, expect, test } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, within, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { RequireAuth } from "@/features/auth";
import { UsersPage } from "./UsersPage";

function mount(route = "/usuarios") {
  db.sessions.set("mock-acc_admin-test", "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/usuarios" element={<UsersPage />} />
      </Route>
    </Routes>,
    { route, token: "mock-acc_admin-test" }
  );
}

describe("Personas", () => {
  test("lista la primera página con el total", async () => {
    mount();
    const table = await screen.findByTestId("users-table");
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(5);
    expect(screen.getByTestId("users-total")).toHaveTextContent(`${db.users.length} personas`);
  });

  test("el filtro de estado de la URL se aplica a la consulta", async () => {
    mount("/usuarios?status=invited");
    const table = await screen.findByTestId("users-table");
    await waitFor(() => expect(within(table).getAllByText("Invitada").length).toBeGreaterThan(0));
    expect(within(table).queryByText("Activa")).toBeNull();
  });

  test("crear una persona la añade a la lista y cierra el drawer", async () => {
    // Ordenado por más recientes, la persona nueva encabeza la primera página.
    mount("/usuarios?sort=-createdAt");
    const user = userEvent.setup();
    await screen.findByTestId("users-table");
    await user.click(screen.getByTestId("users-new"));
    await user.type(screen.getByTestId("user-form-name"), "Prueba Unitaria");
    await user.type(screen.getByTestId("user-form-email"), "prueba.unitaria@empresa.com");
    // El área es obligatoria: sin elegirla el formulario se detiene en el cliente.
    await user.click(screen.getByTestId("user-form-submit"));
    expect(await screen.findByText(/el área es obligatoria/i)).toBeInTheDocument();
    await user.click(screen.getByTestId("user-form-area"));
    await user.click(await screen.findByRole("option", { name: "Producto" }));
    await user.click(screen.getByTestId("user-form-submit"));
    await waitFor(() => expect(screen.queryByTestId("user-form-submit")).toBeNull());
    expect(await within(screen.getByTestId("users-table")).findByText("Prueba Unitaria")).toBeInTheDocument();
  });

  test("un correo duplicado devuelto por el servidor se marca en el campo", async () => {
    mount();
    const user = userEvent.setup();
    await screen.findByTestId("users-table");
    await user.click(screen.getByTestId("users-new"));
    await user.type(screen.getByTestId("user-form-name"), "Persona Repetida");
    await user.type(screen.getByTestId("user-form-email"), db.users[0].email);
    await user.click(screen.getByTestId("user-form-area"));
    await user.click(await screen.findByRole("option", { name: "Ventas" }));
    await user.click(screen.getByTestId("user-form-submit"));
    expect(await screen.findByText(/ya existe una persona/i)).toBeInTheDocument();
  });
});
