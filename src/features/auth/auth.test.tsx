import { describe, expect, test } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, userEvent, within } from "@/test/render";
import { db } from "@/mocks/db";
import { RECOVERY_CODE } from "@/mocks/handlers";
import { LoginPage } from "./LoginPage";
import { RequireAuth } from "./RequireAuth";
import { useAuth } from "./useAuth";

const ADMIN_PHONE = "3001234567";
const ADMIN_PASSWORD = "thema123";

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

async function fillCredentials(user: ReturnType<typeof userEvent.setup>, phone: string, password: string) {
  await user.type(await screen.findByTestId("login-phone"), phone);
  await user.type(screen.getByTestId("login-password"), password);
}

describe("sesión", () => {
  test("sin token una ruta protegida redirige a /login", async () => {
    renderWithProviders(<App />, { route: "/privado" });
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
  });

  test("el celular se escribe por partes y se valida antes de pedir nada", async () => {
    // Arrange
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();

    // Act
    await user.type(await screen.findByTestId("login-phone"), "300");
    await user.type(screen.getByTestId("login-password"), ADMIN_PASSWORD);
    await user.click(screen.getByTestId("login-submit"));

    // Assert
    expect(screen.getByTestId("login-phone")).toHaveValue("300");
    expect(await screen.findByText(/no parece completo/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("credenciales inválidas muestran un error y no guardan token", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await fillCredentials(user, ADMIN_PHONE, "incorrecta");
    await user.click(screen.getByTestId("login-submit"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrectos/i);
    expect(tokenStorage.get()).toBeNull();
  });

  test("login correcto guarda el token, entra a la ruta pedida y logout la cierra", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await fillCredentials(user, ADMIN_PHONE, ADMIN_PASSWORD);
    await user.click(screen.getByTestId("login-submit"));
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
    expect(tokenStorage.get()).toMatch(/^mock-/);
    await user.click(screen.getByRole("button", { name: "salir" }));
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });

  test("la contraseña se puede mostrar y volver a ocultar", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    const password = await screen.findByTestId("login-password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /mostrar contraseña/i }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: /ocultar contraseña/i }));
    expect(password).toHaveAttribute("type", "password");
  });

  test("entrar con Google abre la sesión de la cuenta vinculada", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("login-google"));
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
    expect(tokenStorage.get()).toMatch(/^mock-acc_admin/);
  });

  test("entrar con Outlook abre la sesión de la cuenta vinculada", async () => {
    renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("login-microsoft"));
    expect(await screen.findByText(/hola julián ospina/i)).toBeInTheDocument();
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

describe("recuperar acceso", () => {
  async function requestCode(user: ReturnType<typeof userEvent.setup>, phone = ADMIN_PHONE) {
    await user.click(await screen.findByRole("button", { name: /olvidaste tu contraseña/i }));
    expect(await screen.findByRole("heading", { name: /recupera tu acceso/i })).toBeInTheDocument();
    await user.type(screen.getByTestId("recovery-phone"), phone);
    await user.click(screen.getByTestId("recovery-send"));
    expect(await screen.findByRole("heading", { name: /escribe el código/i })).toBeInTheDocument();
  }

  async function typeCode(user: ReturnType<typeof userEvent.setup>, code: string) {
    const group = screen.getByRole("group", { name: /código de verificación/i });
    await user.click(within(group).getByLabelText(/carácter 1 de 6/i));
    await user.paste(code);
    await user.click(screen.getByTestId("recovery-verify"));
  }

  test("un código incorrecto avisa y no avanza", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    await typeCode(user, "000000");
    expect(await screen.findByRole("alert")).toHaveTextContent(/no es correcto/i);
    expect(screen.getByRole("heading", { name: /escribe el código/i })).toBeInTheDocument();
  });

  test("con el código bueno se cambia la contraseña y sirve para entrar", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    await typeCode(user, RECOVERY_CODE);
    expect(await screen.findByRole("heading", { name: /nueva contraseña/i })).toBeInTheDocument();
    await user.type(screen.getByTestId("recovery-password"), "nueva-clave");
    await user.type(screen.getByTestId("recovery-confirm"), "nueva-clave");
    await user.click(screen.getByTestId("recovery-save"));
    expect(await screen.findByRole("heading", { name: /contraseña cambiada/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /volver a iniciar sesión/i }));
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
    await fillCredentials(user, ADMIN_PHONE, "nueva-clave");
    await user.click(screen.getByTestId("login-submit"));
    await waitFor(() => expect(tokenStorage.get()).toMatch(/^mock-acc_admin/));
  });

  test("las contraseñas que no coinciden se frenan en el formulario", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    await typeCode(user, RECOVERY_CODE);
    await user.type(await screen.findByTestId("recovery-password"), "nueva-clave");
    await user.type(screen.getByTestId("recovery-confirm"), "otra-clave");
    await user.click(screen.getByTestId("recovery-save"));
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
  });
});
