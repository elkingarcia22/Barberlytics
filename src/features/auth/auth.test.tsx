import { describe, expect, test } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { LoginPage } from "./LoginPage";
import { RequireAuth } from "./RequireAuth";
import { useAuth } from "./useAuth";

function Private() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Hola {user?.name}</p>
      <button onClick={() => void logout()}>salir</button>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/privado" element={<Private />} />
      </Route>
    </Routes>
  );
}

describe("sesión", () => {
  test("sin token una ruta protegida redirige a /login", async () => {
    renderWithProviders(<App />, { route: "/privado" });
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
  });

  test("credenciales inválidas muestran un error y no guardan token", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.type(screen.getByTestId("login-email"), "admin@thema.dev");
    await user.type(screen.getByTestId("login-password"), "incorrecta");
    await user.click(screen.getByTestId("login-submit"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrectos/i);
    expect(tokenStorage.get()).toBeNull();
  });

  test("login correcto guarda el token, entra a la ruta pedida y logout la cierra", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await screen.findByTestId("login-email");
    await user.type(screen.getByTestId("login-email"), "admin@thema.dev");
    await user.type(screen.getByTestId("login-password"), "thema123");
    await user.click(screen.getByTestId("login-submit"));
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
    expect(tokenStorage.get()).toMatch(/^mock-/);
    await user.click(screen.getByRole("button", { name: "salir" }));
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });

  test("un token válido guardado restaura la sesión sin pasar por login", async () => {
    db.sessions.set("mock-acc_admin-test", "acc_admin");
    renderWithProviders(<App />, { route: "/privado", token: "mock-acc_admin-test" });
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
  });

  test("un token caducado deja la sesión anónima", async () => {
    renderWithProviders(<App />, { route: "/privado", token: "mock-viejo" });
    await waitFor(() => expect(screen.getByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument());
  });
});
