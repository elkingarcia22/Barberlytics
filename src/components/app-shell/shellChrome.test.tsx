import { describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import { AdminShell } from "./AdminShell";
import { DEFAULT_SHELL_CHROME, resolveShellConfig } from "./shellConfig";

/**
 * El cromo del shell es configurable porque no toda pantalla que lo usa es la
 * aplicación: la documentación monta el mismo sidebar y la misma cabecera sin
 * empresas, agente, novedades ni sesión.
 */
describe("resolveShellConfig", () => {
  test("sin overrides, todo el cromo viene encendido", () => {
    expect(resolveShellConfig().chrome).toEqual(DEFAULT_SHELL_CHROME);
  });

  test("apagar una pieza no apaga las demás", () => {
    expect(resolveShellConfig({ chrome: { news: false } }).chrome).toEqual({
      ...DEFAULT_SHELL_CHROME,
      news: false,
    });
  });

  test("el resto de la configuración sigue fusionándose a un nivel", () => {
    const config = resolveShellConfig({ brand: { productName: "Otro" }, chrome: { profile: false } });
    expect(config.brand.productName).toBe("Otro");
    expect(config.user.name).toBeTruthy();
    expect(config.chrome.profile).toBe(false);
  });
});

describe("AdminShell", () => {
  test("por defecto monta novedades, ayuda, notificaciones, perfil, empresa, rol, ajustes y el conmutador", () => {
    renderWithProviders(<AdminShell>contenido</AdminShell>);
    // Dos puertas a lo mismo: el botón de la cabecera y la fila del pie del
    // cajón lateral, que es la que queda por debajo de `md`.
    expect(screen.getAllByRole("button", { name: "Novedades" })).toHaveLength(2);
    expect(screen.getByLabelText("Ayuda")).toBeTruthy();
    expect(screen.getByLabelText("Notificaciones")).toBeTruthy();
    expect(screen.getByTestId("shell-avatar")).toBeTruthy();
    expect(screen.getByTestId("workspace-menu-trigger")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Workspace" })).toBeTruthy();
  });

  test("con el cromo apagado no monta ninguna de esas piezas, pero sí el contenido", () => {
    renderWithProviders(
      <AdminShell
        config={{
          chrome: {
            company: false,
            modeSwitch: false,
            news: false,
            help: false,
            notifications: false,
            profile: false,
            role: false,
            settings: false,
          },
        }}
      >
        contenido
      </AdminShell>
    );
    expect(screen.queryByRole("button", { name: "Novedades" })).toBeNull();
    expect(screen.queryByLabelText("Ayuda")).toBeNull();
    expect(screen.queryByLabelText("Notificaciones")).toBeNull();
    expect(screen.queryByTestId("shell-avatar")).toBeNull();
    expect(screen.queryByTestId("role-switch")).toBeNull();
    expect(screen.queryByTestId("workspace-menu-trigger")).toBeNull();
    expect(screen.queryByRole("button", { name: "Workspace" })).toBeNull();
    expect(screen.getByText("contenido")).toBeTruthy();
  });
});

describe("búsqueda general del shell", () => {
  test("monta la búsqueda con los destinos de su árbol de navegación", async () => {
    renderWithProviders(<AdminShell>contenido</AdminShell>);
    await userEvent.click(screen.getByRole("button", { name: /Buscar o preguntar/i }));
    // Un registro de demostración y un destino derivado del árbol.
    expect(screen.getByRole("option", { name: /Analista de datos, vacante/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Selección, Vacantes/ })).toBeTruthy();
  });

  test("sin conmutador de agente no ofrece preguntar: no hay panel donde responder", async () => {
    renderWithProviders(<AdminShell config={{ chrome: { modeSwitch: false } }}>contenido</AdminShell>);
    await userEvent.click(screen.getByRole("button", { name: /Buscar o preguntar/i }));
    await userEvent.type(screen.getByPlaceholderText("Buscar o preguntar"), "analista");
    expect(screen.queryByText(/Preguntar al agente/i)).toBeNull();
    expect(screen.queryByRole("tab", { name: "Preguntar" })).toBeNull();
  });

  test("`chrome.search: false` la quita de la cabecera", () => {
    renderWithProviders(<AdminShell config={{ chrome: { search: false } }}>contenido</AdminShell>);
    expect(screen.queryByRole("button", { name: /Buscar o preguntar/i })).toBeNull();
  });
});

/**
 * Quién, dónde y como quién son la misma pregunta: viven en el chip de la
 * cuenta —la foto, el espacio activo y el rol— y se cambian desde el menú que
 * abre, que también es el único sitio donde se cierra la sesión. El nombre no
 * se escribe en el chip: ya lo dice la foto, y dentro está entero con su
 * correo.
 */
describe("la cuenta y su contexto en la cabecera", () => {
  test("el chip dice dónde estás y en qué rol, y elegir otro avisa a la app", async () => {
    const onSelectRole = vi.fn();
    renderWithProviders(<AdminShell config={{ onSelectRole }}>contenido</AdminShell>);

    const chip = screen.getByTestId("shell-avatar");
    expect(chip.textContent).not.toContain("Carolina Vargas");
    expect(chip.textContent).toContain("Google");
    expect(chip.textContent).toContain("Administrador");
    // Lo que no se escribe sigue estando para quien no ve el chip.
    expect(chip.getAttribute("aria-label")).toContain("Carolina Vargas");

    await userEvent.click(chip);
    // El nombre y el correo se leen dentro.
    expect(screen.getByText("Carolina Vargas")).toBeTruthy();
    expect(screen.getByText("carolina.vargas@ejemplo.com")).toBeTruthy();

    await userEvent.click(screen.getByRole("menuitemradio", { name: /Colaborador/ }));
    expect(onSelectRole).toHaveBeenCalledWith("colaborador");
    expect(screen.getByTestId("shell-avatar").textContent).toContain("Colaborador");
  });

  test("con un solo rol el chip se queda en el espacio activo", async () => {
    renderWithProviders(
      <AdminShell config={{ roles: [{ id: "admin", label: "Administrador", description: "Toda la empresa." }] }}>
        contenido
      </AdminShell>
    );
    const chip = screen.getByTestId("shell-avatar");
    expect(chip.textContent).not.toContain("Administrador");
    await userEvent.click(chip);
    expect(screen.queryByTestId("role-switch")).toBeNull();
  });

  test("sin rol en el cromo, el menú no ofrece asumir otro", async () => {
    renderWithProviders(<AdminShell config={{ chrome: { role: false } }}>contenido</AdminShell>);
    const chip = screen.getByTestId("shell-avatar");
    expect(chip.textContent).not.toContain("Administrador");
    await userEvent.click(chip);
    expect(screen.queryByTestId("role-switch")).toBeNull();
    expect(screen.getByTestId("company-switch")).toBeTruthy();
  });

  test("sin espacio activo en el cromo, el nombre vuelve al chip", async () => {
    renderWithProviders(<AdminShell config={{ chrome: { company: false } }}>contenido</AdminShell>);
    const chip = screen.getByTestId("shell-avatar");
    expect(chip.textContent).toContain("Carolina Vargas");
    expect(chip.textContent).toContain("Administrador");
    await userEvent.click(chip);
    expect(screen.queryByTestId("company-switch")).toBeNull();
    expect(screen.getByTestId("role-switch")).toBeTruthy();
  });

  test("cerrar sesión vive aquí y en ningún otro sitio", async () => {
    const onLogout = vi.fn();
    renderWithProviders(<AdminShell config={{ onLogout }}>contenido</AdminShell>);
    await userEvent.click(screen.getByTestId("shell-avatar"));
    await userEvent.click(screen.getByTestId("shell-logout"));
    expect(onLogout).toHaveBeenCalled();
  });

  test("el tema no está en el menú de la cuenta: vive en Personalización", async () => {
    renderWithProviders(<AdminShell>contenido</AdminShell>);
    await userEvent.click(screen.getByTestId("shell-avatar"));
    expect(screen.queryByLabelText("Modo claro")).toBeNull();
    expect(screen.queryByText("Conectores")).toBeNull();
  });
});

/**
 * La configuración sale del árbol de navegación: se ajusta una vez y no
 * compite a diario con las secciones que sí se abren todos los días.
 */
describe("menú de la marca (empresa + configuración)", () => {
  // El grupo no es un rótulo sino una puerta: el menú solo lista los grupos y
  // los ajustes esperan dentro, así que llegar a uno son dos pasos.
  test("cada grupo abre sus ajustes y cada ajuste navega por su ruta", async () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <AdminShell
        config={{
          onNavigate,
          settings: [{ id: "ventas", label: "Ventas", items: [{ id: "impuestos", label: "Impuestos", path: "/configuracion/impuestos" }] }],
          settingsAll: { id: "configuracion", label: "Ver toda la configuración", path: "/configuracion" },
        }}
      >
        contenido
      </AdminShell>
    );

    await userEvent.click(screen.getByTestId("workspace-menu-trigger"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Ventas" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Impuestos" }));
    expect(onNavigate).toHaveBeenCalledWith("impuestos", "/configuracion/impuestos");
  });

  test("sin ajustes, la marca se queda sin abrir nada", () => {
    renderWithProviders(<AdminShell config={{ settings: [] }}>contenido</AdminShell>);
    expect(screen.queryByTestId("workspace-menu-trigger")).toBeNull();
  });
});

/**
 * El espacio activo (empresa, sucursal) vive en la cabecera: con el menú
 * plegado a rail desaparecía justo cuando más falta hace saber dónde estás.
 */
describe("espacio activo en la cabecera", () => {
  test("se lee con su rótulo y cambiarlo avisa a la app", async () => {
    const onSelectCompany = vi.fn();
    renderWithProviders(
      <AdminShell
        config={{
          onSelectCompany,
          companies: [
            { id: "centro", name: "Centro", initial: "C", meta: "Calle 10" },
            { id: "norte", name: "Norte", initial: "N", meta: "Cra. 45" },
          ],
          workspaceLabels: { entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" },
          showWorkspaceUsage: false,
          companyMenuLinks: [],
        }}
      >
        contenido
      </AdminShell>
    );

    const trigger = screen.getByTestId("shell-avatar");
    expect(trigger.getAttribute("aria-label")).toContain("Sucursal: Centro");

    await userEvent.click(trigger);
    // Sin consumo que enseñar, el menú es identidad y cambio.
    expect(screen.queryByText("Licencias")).toBeNull();
    await userEvent.click(screen.getByTestId("company-switch"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Norte/ }));
    expect(onSelectCompany).toHaveBeenCalledWith("norte");
  });
});
