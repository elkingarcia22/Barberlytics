import { describe, expect, test } from "vitest";
import { legalVersion } from "@/features/legal/documents";
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
    expect(await screen.findByRole("alert")).toHaveTextContent(/no es correcto/i);
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

  test("si el SMS no llega, el código se pide al correo de respaldo y entra igual", async () => {
    // Arrange
    const { tokenStorage } = renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await requestCode(user);

    // Act
    await user.click(screen.getByTestId("login-use-email"));

    // Assert
    expect(await screen.findByRole("heading", { name: /revisa tu correo/i })).toBeInTheDocument();
    expect(screen.getByTestId("login-code-description")).toHaveTextContent(/correo de respaldo/i);
    expect(screen.getByTestId("login-use-sms")).toBeInTheDocument();
    await typeCode(user, OTP_CODE);
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
    expect(tokenStorage.get()).toMatch(/^mock-acc_admin/);
  });

  test("quien no configuró el correo de respaldo puede escribir a soporte desde el código", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);
    await user.click(screen.getByTestId("login-use-email"));
    await user.click(await screen.findByTestId("login-support"));
    expect(await screen.findByRole("heading", { name: /contáctanos/i })).toBeInTheDocument();
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

  test("desde la confirmación se puede reenviar el correo o corregirlo", async () => {
    // Arrange
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /olvidaste tu número/i }));
    await user.type(await screen.findByTestId("recovery-email"), "admin@tema.dev");
    await user.click(screen.getByTestId("recovery-send"));

    // Act + Assert: reenviar
    await user.click(await screen.findByTestId("recovery-resend"));
    expect(await screen.findByRole("status")).toHaveTextContent("Te enviamos otro correo a admin@tema.dev.");

    // Act + Assert: corregir el correo mal escrito
    await user.click(screen.getByTestId("recovery-change-email"));
    const email = await screen.findByTestId("recovery-email");
    expect(email).toHaveValue("admin@tema.dev");
    await user.clear(email);
    await user.type(email, "admin@thema.dev");
    await user.click(screen.getByTestId("recovery-send"));
    expect(await screen.findByTestId("recovery-sent-to")).toHaveTextContent("admin@thema.dev");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("si el correo no llegó abre un ticket con el correo ya puesto y devuelve su número", async () => {
    // Arrange
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /olvidaste tu número/i }));
    await user.type(await screen.findByTestId("recovery-email"), "admin@thema.dev");
    await user.click(screen.getByTestId("recovery-send"));

    // Act
    await user.click(await screen.findByTestId("recovery-ticket"));
    expect(await screen.findByRole("heading", { name: /contáctanos/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toHaveValue("admin@thema.dev");
    expect(screen.getByLabelText(/cuéntanos qué pasó/i)).toHaveValue("Pedí recuperar mi número con admin@thema.dev y no me llegó el correo.");
    await user.type(screen.getByLabelText("Nombre completo"), "Carolina Vargas");
    await user.type(screen.getByLabelText("Barbería"), "La Navaja");
    await user.type(screen.getByLabelText("Celular"), ADMIN_PHONE);
    await user.click(screen.getByTestId("ticket-submit"));

    // Assert
    expect(await screen.findByRole("heading", { name: /ticket BL-\d{4} creado/i })).toBeInTheDocument();
  });

  test("el ticket no se envía sin los datos obligatorios", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /olvidaste tu número/i }));
    await user.type(await screen.findByTestId("recovery-email"), "admin@thema.dev");
    await user.click(screen.getByTestId("recovery-send"));
    await user.click(await screen.findByTestId("recovery-ticket"));
    await user.click(await screen.findByTestId("ticket-submit"));
    expect(await screen.findByText("Escribe tu nombre completo")).toBeInTheDocument();
    expect(screen.getByText("Escribe el nombre de tu barbería")).toBeInTheDocument();
    expect(screen.getByText("Escribe tu celular")).toBeInTheDocument();
  });
});

describe("bloqueo por intentos fallidos", () => {
  test("avisa cuántos intentos quedan y al cuarto fallo bloquea y ofrece un ticket", async () => {
    // Arrange
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await requestCode(user);

    // Act + Assert: tres fallos avisan, el cuarto bloquea
    await typeCode(user, "000000");
    expect(await screen.findByRole("alert")).toHaveTextContent(/te quedan 3 intentos/i);
    await typeCode(user, "000000");
    expect(await screen.findByText(/te quedan 2 intentos/i)).toBeInTheDocument();
    await typeCode(user, "000000");
    expect(await screen.findByText(/te queda 1 intento/i)).toBeInTheDocument();
    await typeCode(user, "000000");
    expect(await screen.findByRole("heading", { name: /bloqueamos el acceso por seguridad/i })).toBeInTheDocument();
    expect(screen.getByTestId("login-locked")).toHaveTextContent(/\+57 300 123 4567/);

    await user.click(screen.getByTestId("locked-ticket"));
    expect(await screen.findByRole("heading", { name: /contáctanos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/cuéntanos qué pasó/i)).toHaveValue("Mi acceso con el +57 300 123 4567 quedó bloqueado tras varios intentos fallidos.");
  });

  test("un número bloqueado no puede volver a pedir código", async () => {
    db.loginFailures.set("+573001234567", 4);
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.type(await screen.findByTestId("login-phone"), ADMIN_PHONE);
    await user.click(screen.getByTestId("login-submit"));
    expect(await screen.findByRole("heading", { name: /bloqueamos el acceso/i })).toBeInTheDocument();
  });

  test("entrar bien pone el contador en cero", async () => {
    db.loginFailures.set("+573001234567", 3);
    renderWithProviders(<App />, { route: "/privado" });
    const user = userEvent.setup();
    await requestCode(user);
    await typeCode(user, OTP_CODE);
    expect(await screen.findByText(/hola carolina vargas/i)).toBeInTheDocument();
    expect(db.loginFailures.has("+573001234567")).toBe(false);
  });
});

describe("crear cuenta", () => {
  test("se llega desde el login y sin datos marca cada campo obligatorio", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("login-signup"));
    expect(await screen.findByRole("heading", { name: /empieza ahora/i })).toBeInTheDocument();
    await user.click(screen.getByTestId("signup-submit"));
    for (const message of ["Escribe tu nombre", "Escribe tus apellidos", "Escribe el nombre de tu barbería", "Escribe tu correo", "Escribe tu celular", "Escribe cuántos barberos tiene tu equipo", "Elige tu país", "Elige tu zona horaria", "Acepta los términos y el tratamiento de datos para seguir"]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
  });

  test("el servidor solo crea la cuenta con los términos aceptados y el celular verificado", async () => {
    const post = (path: string, body: unknown) => fetch(`http://localhost/api${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    // Se acepta la versión vigente de cada documento legal; una vieja no vale.
    const versions = { termsVersion: legalVersion("terms"), privacyVersion: legalVersion("privacy"), dpaVersion: legalVersion("dpa") };
    const form = { firstName: "Ana", lastName: "Ríos", company: "Barbería Ana", email: "ana@barberiaana.co", phone: "+573117778899", barbers: 3, country: "CO", timezone: "America/Bogota", ...versions };
    expect((await post("/auth/signup", { ...form, code: OTP_CODE })).status).toBe(422);
    const outdated = await post("/auth/signup", { ...form, termsVersion: "terms-2020-01", acceptTerms: true, code: OTP_CODE });
    expect(((await outdated.json()) as { fields?: Record<string, unknown> }).fields).toHaveProperty("acceptTerms");
    expect((await post("/auth/signup/code", { phone: form.phone })).status).toBe(204);
    const withoutCode = await post("/auth/signup", { ...form, acceptTerms: true });
    expect(((await withoutCode.json()) as { fields?: Record<string, unknown> }).fields).toHaveProperty("code");
    expect((await post("/auth/signup", { ...form, acceptTerms: true, code: "000000" })).status).toBe(401);
    expect((await post("/auth/signup", { ...form, acceptTerms: true, code: OTP_CODE })).status).toBe(204);
  });

  test("la zona horaria espera al país", async () => {
    renderWithProviders(<App />, { route: "/login" });
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("login-signup"));
    expect(await screen.findByLabelText("Zona horaria")).toBeDisabled();
    expect(screen.getByText("Primero elige el país")).toBeInTheDocument();
  });
});
