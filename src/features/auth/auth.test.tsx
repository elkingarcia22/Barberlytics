import { describe, expect, test } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, userEvent, within } from "@/test/render";
import { db } from "@/mocks/db";
import { OTP_CODE } from "@/mocks/handlers";
import { LoginPage } from "./LoginPage";
import { RequireAuth } from "./RequireAuth";
import { useAuth } from "./useAuth";

const ADMIN_PHONE = "3001234567";
type User = ReturnType<typeof userEvent.setup>;

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

async function requestCode(user: User, phone = ADMIN_PHONE) {
  await user.type(await screen.findByTestId("login-phone"), phone);
  await user.click(screen.getByTestId("login-submit"));
  expect(await screen.findByRole("heading", { name: /escribe el código/i })).toBeInTheDocument();
}

async function typeCode(user: User, code: string) {
  const group = screen.getByRole("group", { name: /código de verificación/i });
  await user.click(within(group).getByLabelText(/carácter 1 de 6/i));
  await user.paste(code);
}

describe("entrar con celular y código", () => {
  test("sin token una ruta protegida redirige a /login", async () => {
    renderWithProviders(<App />, { route: "/privado" });
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
  });

  test("un celular con menos dígitos de los de su país no pide el código y dice cuántos faltan", async () => {
    // Arrange
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();

    // Act
    await user.type(await screen.findByTestId("login-phone"), "30012");
    await user.click(screen.getByTestId("login-submit"));

    // Assert
    expect(await screen.findByText(/colombia tiene 10 dígitos; faltan 5/i)).toBeInTheDocument();
    expect(screen.getByTestId("login-phone")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("heading", { name: /escribe el código/i })).not.toBeInTheDocument();
  });

  test("sin celular avisa que hay que escribirlo", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("login-submit"));
    expect(await screen.findByText("Escribe tu celular")).toBeInTheDocument();
  });

  test("el código llega al número escrito y se muestra con su prefijo", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    expect(screen.getByText(/\+57 300 123 4567/)).toBeInTheDocument();
  });

  test("un código incorrecto avisa, no guarda token y deja reintentar", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    await typeCode(user, "000000");
    expect(await screen.findByRole("alert")).toHaveTextContent(/no es correcto/i);
    expect(tokenStorage.get()).toBeNull();
    expect(screen.getByRole("heading", { name: /escribe el código/i })).toBeInTheDocument();
  });

  test("un número que no es de ninguna barbería no entra aunque el código sea el bueno", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user, "3009999999");
    await typeCode(user, OTP_CODE);
    expect(await screen.findByRole("alert")).toHaveTextContent(/no está registrado/i);
    expect(tokenStorage.get()).toBeNull();
  });

  test("el código correcto guarda el token, entra a la ruta pedida y logout la cierra", async () => {
    const { tokenStorage } = renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await requestCode(user);
    await typeCode(user, OTP_CODE);
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
    expect(tokenStorage.get()).toMatch(/^mock-acc_admin/);
    await user.click(screen.getByRole("button", { name: "salir" }));
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });

  test("se puede reenviar el código y cambiar el número", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    await user.click(screen.getByTestId("login-resend"));
    expect(await screen.findByRole("status")).toHaveTextContent(/código nuevo/i);
    await user.click(screen.getByRole("button", { name: /cambiar número/i }));
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
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

describe("olvidé mi número", () => {
  test("un correo mal escrito se frena en el formulario", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /olvidaste tu número/i }));
    expect(await screen.findByRole("heading", { name: /recupera tu número/i })).toBeInTheDocument();
    await user.type(screen.getByTestId("recovery-email"), "carolina");
    await user.click(screen.getByTestId("recovery-send"));
    expect(await screen.findByText(/no parece válido/i)).toBeInTheDocument();
  });

  test("con un correo válido confirma el envío y vuelve al login", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /olvidaste tu número/i }));
    await user.type(await screen.findByTestId("recovery-email"), "admin@thema.dev");
    await user.click(screen.getByTestId("recovery-send"));
    expect(await screen.findByRole("heading", { name: /revisa tu correo/i })).toBeInTheDocument();
    expect(screen.getByText(/admin@thema\.dev/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver a iniciar sesión/i }));
    expect(await screen.findByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
  });
});
