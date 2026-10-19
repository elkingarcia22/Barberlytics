import { beforeEach, describe, expect, test } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { db } from "@/mocks/db";
import { appEs } from "@/app/i18n";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { SettingsSectionPage } from "./SettingsSectionPage";
import { buildSettingsGroups, settingsLevel } from "./settingsCatalog";
import { buildBookingUrl, renderPolicy, widgetSnippet } from "./sections/bookingUtils";
import { ALL_EVENT_IDS, ALL_GROUP_IDS, AUDIENCES, NOTIFICATION_CATALOG, toggleKey } from "./sections/notificationCatalog";
import { closureDays, taxTotal, tipLabel } from "./sections/settingsMath";

const TOKEN = "mock-acc_admin-test";

function renderSection(id: string, search = "") {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route path="/configuracion/:seccion" element={<SettingsSectionPage />} />
    </Routes>,
    { route: `/configuracion/${id}${search}`, token: TOKEN }
  );
}

/** Un ajuste abierto con un rol concreto; «Sin permiso» es una ruta más. */
function renderSectionAs(role: TeamRole, id: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route path="/configuracion/:seccion" element={<SettingsSectionPage />} />
        <Route path="/403" element={<p>Sin permiso</p>} />
      </Routes>
    </AccessProvider>,
    { route: `/configuracion/${id}`, token: TOKEN }
  );
}

const idsFor = (role: TeamRole) => buildSettingsGroups((key) => key, buildAccess({ role })).flatMap((group) => group.items.map((item) => item.id));

describe("configuración según el rol", () => {
  beforeEach(() => {
    db.reset();
  });

  test("los barberos solo ven sus preferencias, cómo entran y su usuario", () => {
    expect(idsFor("barbero-comision")).toEqual(["preferencias", "inicio-sesion", "eliminar-cuenta"]);
    expect(idsFor("barbero-renta")).toEqual(["preferencias", "inicio-sesion", "eliminar-cuenta"]);
  });

  test("recepción ve lo operativo para atender, sin dinero ni contrato", () => {
    const ids = idsFor("recepcion");
    expect(ids).toEqual(expect.arrayContaining(["negocio", "cierres", "agendamiento", "propinas", "dispositivos", "preferencias"]));
    for (const id of ["impuestos", "precios", "pagos", "comisiones", "nomina", "facturacion", "empresa", "permisos"]) expect(ids, id).not.toContain(id);
    expect(settingsLevel("agendamiento", buildAccess({ role: "recepcion" }))).toBe("view");
  });

  test("el admin ve todo menos la facturación; el dinero y el contrato, solo en lectura", () => {
    const admin = buildAccess({ role: "admin" });
    expect(idsFor("admin")).not.toContain("facturacion");
    for (const id of ["impuestos", "precios", "pagos", "comisiones", "empresa", "sucursales"]) expect(settingsLevel(id, admin), id).toBe("view");
    for (const id of ["negocio", "agendamiento", "cierres", "propinas"]) expect(settingsLevel(id, admin), id).toBe("edit");
    expect(settingsLevel("permisos", admin)).toBe("view");
  });

  test("el dueño ve y edita todo, y el menú cambia «eliminar cuenta» por «mi usuario» a los demás", () => {
    const owner = buildAccess({ role: "owner" });
    expect(idsFor("owner")).toEqual(buildSettingsGroups((key) => key).flatMap((group) => group.items.map((item) => item.id)));
    expect(settingsLevel("facturacion", owner)).toBe("edit");
    const label = (role: TeamRole) => buildSettingsGroups((key) => key, buildAccess({ role })).flatMap((group) => group.items).find((item) => item.id === "eliminar-cuenta")?.label;
    expect(label("owner")).toBe("settings.deleteAccount");
    expect(label("barbero-comision")).toBe("settings.deleteUser");
  });

  test("un ajuste no permitido abierto por URL lleva a «Sin permiso»", async () => {
    renderSectionAs("barbero-comision", "impuestos");
    expect(await screen.findByText("Sin permiso")).toBeInTheDocument();
  });

  test("el admin abre los impuestos en solo lectura", async () => {
    renderSectionAs("admin", "impuestos");
    expect(await screen.findByTestId("settings-read-only")).toBeInTheDocument();
    expect(await screen.findByTestId("taxGroups-add")).toBeDisabled();
  });

  test("el barbero ve «Eliminar mi usuario», nunca el borrado del negocio", async () => {
    renderSectionAs("barbero-comision", "eliminar-cuenta");
    expect(await screen.findByTestId("delete-user")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-account-open")).toBeNull();
  });
});

describe("ayudas de configuración", () => {
  test("el enlace de reserva solo lleva los UTM que se escribieron", () => {
    expect(buildBookingUrl("https://x.test/book/a", { source: "", medium: "", campaign: "" })).toBe("https://x.test/book/a");
    expect(buildBookingUrl("https://x.test/book/a", { source: "instagram", medium: " ", campaign: "verano 2026" })).toBe("https://x.test/book/a?utm_source=instagram&utm_campaign=verano+2026");
  });

  test("la política cambia cada etiqueta por lo configurado, todas las veces que salga", () => {
    const text = renderPolicy("Avisa <<time_for_cancel>> antes o pagas <<fee_cancellation>>%. Máximo <<max_cancellations>>. Repito: <<time_for_cancel>>.", { cancel: "3 horas", fee: "10", max: "5" });
    expect(text).toBe("Avisa 3 horas antes o pagas 10%. Máximo 5. Repito: 3 horas.");
  });

  test("el fragmento del widget lleva el modo y, si hay, el enlace que lo abre", () => {
    const links = { widgetId: "abc", scriptUrl: "https://x.test/w.js", bookingUrl: "", frontDeskUrl: "", portalUrl: "" };
    const floating = widgetSnippet(links, { widget: "booking", mode: "floating", trigger: "#reservar" });
    expect(floating).toContain('data-bl-widget="booking"');
    expect(floating).toContain('data-trigger="#reservar"');
    expect(floating).toContain('<script src="https://x.test/w.js" async></script>');
    expect(widgetSnippet(links, { widget: "appointments", mode: "inline", homeUrl: "/" })).toContain('data-home-url="/"');
    expect(widgetSnippet(links, { widget: "booking", mode: "inline" })).not.toContain("data-trigger");
  });

  test("un cierre cuenta el primer día y el último; un impuesto suma sus tasas", () => {
    expect(closureDays({ startDate: "2026-12-24", endDate: "2026-12-26" })).toBe(3);
    expect(closureDays({ startDate: "2026-12-24", endDate: "2026-12-24" })).toBe(1);
    expect(taxTotal({ taxes: [{ name: "Estatal", percent: 6.25 }, { name: "Local", percent: 1.5 }] })).toBe(7.75);
    expect(taxTotal({ taxes: [{ name: "", percent: Number.NaN }] })).toBe(0);
    expect(tipLabel({ id: "a", type: "percent", value: 20 })).toBe("20%");
    expect(tipLabel({ id: "b", type: "amount", value: 5 })).toBe("$5");
  });
});

describe("catálogo de avisos", () => {
  test("cada evento y cada grupo tiene su texto en el diccionario", () => {
    const messages = appEs as Record<string, string>;
    for (const id of ALL_EVENT_IDS) expect(messages[`cfg.notify.event.${id}`], id).toBeTruthy();
    for (const id of ALL_GROUP_IDS) expect(messages[`cfg.notify.group.${id}`], id).toBeTruthy();
  });

  test("dentro de un destinatario no se repite ninguna llave de interruptor", () => {
    for (const audience of AUDIENCES) {
      const keys = NOTIFICATION_CATALOG[audience].flatMap((group) => group.events.flatMap((event) => event.channels.map((channel) => toggleKey(audience, event.id, channel))));
      expect(new Set(keys).size, audience).toBe(keys.length);
    }
  });

  test("a los clientes se les avisa por WhatsApp, correo y SMS, nunca por push", () => {
    const channels = NOTIFICATION_CATALOG.clients.flatMap((group) => group.events.flatMap((event) => event.channels));
    expect(new Set(channels)).toEqual(new Set(["whatsapp", "email", "sms"]));
  });
});

describe("pantallas de configuración", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("ningún ajuste del catálogo se queda en «Próximamente»", async () => {
    const ids = buildSettingsGroups((key) => key).flatMap((group) => group.items.map((item) => item.id));
    expect(ids.length).toBeGreaterThanOrEqual(17);
    for (const id of ids) {
      const { unmount } = renderSection(id);
      expect(await screen.findByRole("heading", { level: 1 }), id).toBeInTheDocument();
      expect(screen.queryByText("Próximamente"), id).toBeNull();
      unmount();
    }
  });

  test("un interruptor deja cambios sin guardar y guardar los manda al servidor", async () => {
    renderSection("comisiones");
    const user = userEvent.setup();
    const toggle = await screen.findByTestId("commissions-deductServiceCost");
    expect(screen.queryByTestId("settings-save")).toBeNull();
    await user.click(toggle);
    await user.click(await screen.findByTestId("settings-save"));
    await waitFor(() => expect(db.settings.sections.commissions.deductServiceCost).toBe(true));
    await waitFor(() => expect(screen.queryByTestId("settings-save")).toBeNull());
  });

  test("el recargo por tarjeta no se guarda sin nombre cuando está encendido", async () => {
    renderSection("tarifa-tarjeta");
    const user = userEvent.setup();
    // La demo lo trae encendido: borrar el nombre y guardar no deja guardar.
    await user.clear(await screen.findByTestId("cardfee-name"));
    await user.click(screen.getByTestId("settings-save"));
    expect(await screen.findByText("Ponle un nombre al recargo.")).toBeInTheDocument();
    expect(db.settings.sections.cardFee.name).toBe("Recargo por tarjeta");
  });

  test("agregar un impuesto lo suma a la lista con su total", async () => {
    renderSection("impuestos");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("taxGroups-add"));
    await user.type(await screen.findByTestId("taxGroups-name"), "Impuesto local");
    await user.type(screen.getByTestId("taxGroups-rate-name-0"), "Ciudad");
    await user.type(screen.getByTestId("taxGroups-rate-percent-0"), "2");
    await user.click(screen.getByTestId("taxGroups-submit"));
    const list = await screen.findByTestId("taxGroups-list");
    expect(await within(list).findByText("Impuesto local")).toBeInTheDocument();
    expect(db.settings.lists.taxGroups).toHaveLength(6);
  });

  test("un cierre con el fin antes del inicio no se guarda", async () => {
    renderSection("cierres");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("closures-add"));
    await user.type(await screen.findByTestId("closures-start"), "2026-11-10");
    await user.type(screen.getByTestId("closures-end"), "2026-11-05");
    await user.click(screen.getByTestId("closures-submit"));
    expect(await screen.findByText("El fin no puede ser antes del inicio.")).toBeInTheDocument();
    expect(db.settings.lists.closures).toHaveLength(1);
  });

  test("apagar todos los avisos de un destinatario no toca los de los demás", async () => {
    renderSection("centro-notificaciones", "?para=clients");
    const user = userEvent.setup();
    expect(await screen.findByTestId("notify-count")).toHaveTextContent("17 de 17");
    await user.click(screen.getByTestId("notify-all-off"));
    expect(screen.getByTestId("notify-count")).toHaveTextContent("0 de 17");
    await user.click(screen.getByTestId("settings-save"));
    await waitFor(() => expect(Object.keys(db.settings.sections.notifications.toggles as object).length).toBe(17));
    const toggles = db.settings.sections.notifications.toggles as Record<string, boolean>;
    expect(Object.keys(toggles).every((key) => key.startsWith("clients."))).toBe(true);
  });

  test("la clave secreta de una pasarela se guarda pero nunca vuelve", async () => {
    renderSection("pagos");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("gateways-add"));
    await user.clear(await screen.findByTestId("gateways-name"));
    await user.type(screen.getByTestId("gateways-name"), "Stripe Utah");
    await user.type(screen.getByTestId("gateways-public"), "pk_test_abc");
    await user.type(screen.getByTestId("gateways-secret"), "sk_test_xyz");
    await user.click(screen.getByTestId("gateways-submit"));
    await waitFor(() => expect(db.settings.lists.gateways).toHaveLength(2));
    const created = db.settings.lists.gateways[1];
    expect(created.connected).toBe(true);
    expect(db.settings.gatewaySecrets[created.id]).toBe("sk_test_xyz");
    expect(JSON.stringify(db.settings.lists.gateways)).not.toContain("sk_test_xyz");
    expect(within(await screen.findByTestId("gateways-list")).getAllByText("Conectada")).toHaveLength(2);
  });

  test("una clave con la forma de otro proveedor no conecta la pasarela", async () => {
    renderSection("pagos");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("gateways-add"));
    await user.type(await screen.findByTestId("gateways-public"), "pub_test_wompi");
    await user.type(screen.getByTestId("gateways-secret"), "sk_test_xyz");
    await user.click(screen.getByTestId("gateways-submit"));
    expect(await screen.findByText("Esa no es una clave pública de este proveedor.")).toBeInTheDocument();
    expect(db.settings.lists.gateways).toHaveLength(1);
  });

  test("el correo de respaldo se activa solo tras verificar el código que le llega", async () => {
    // Arrange
    renderSection("inicio-sesion");
    const user = userEvent.setup();

    // Act
    await user.click(await screen.findByTestId("backup-email-switch"));
    const input = await screen.findByTestId("backup-email-input");
    expect(input).toHaveValue("admin@thema.dev");
    await user.clear(input);
    await user.type(input, "carolina@gmail.com");
    await user.click(screen.getByTestId("backup-email-send"));
    expect(await screen.findByText(/enviamos a carolina@gmail.com/i)).toBeInTheDocument();
    expect(db.backupEmails.acc_admin).toBeUndefined();
    const group = screen.getByRole("group", { name: /código de verificación/i });
    await user.click(within(group).getByLabelText(/carácter 1 de 6/i));
    await user.paste("246810");

    // Assert
    expect(await screen.findByTestId("backup-email-saved")).toHaveTextContent("carolina@gmail.com");
    expect(db.backupEmails.acc_admin).toBe("carolina@gmail.com");
  });

  test("un código equivocado no activa el correo de respaldo", async () => {
    renderSection("inicio-sesion");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("backup-email-switch"));
    await user.click(await screen.findByTestId("backup-email-send"));
    const group = await screen.findByRole("group", { name: /código de verificación/i });
    await user.click(within(group).getByLabelText(/carácter 1 de 6/i));
    await user.paste("000000");
    expect(await screen.findByText(/no es correcto/i)).toBeInTheDocument();
    expect(db.backupEmails.acc_admin).toBeUndefined();
  });

  test("apagar el respaldo pide confirmación y lo quita", async () => {
    db.backupEmails = { acc_admin: "carolina@gmail.com" };
    renderSection("inicio-sesion");
    const user = userEvent.setup();
    expect(await screen.findByTestId("backup-email-saved")).toHaveTextContent("carolina@gmail.com");
    await user.click(screen.getByTestId("backup-email-switch"));
    await user.click(await screen.findByRole("button", { name: /quitar correo/i }));
    await waitFor(() => expect(db.backupEmails.acc_admin).toBeUndefined());
    expect(screen.queryByTestId("backup-email-saved")).not.toBeInTheDocument();
  });

  test("eliminar la cuenta exige escribir el nombre de la empresa", async () => {
    renderSection("eliminar-cuenta");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("delete-account-open"));
    const confirm = await screen.findByTestId("delete-account-confirm");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByTestId("delete-account-input"), "Otra cosa");
    expect(confirm).toBeDisabled();
    await user.clear(screen.getByTestId("delete-account-input"));
    await user.type(screen.getByTestId("delete-account-input"), "Barbería Demo");
    expect(confirm).toBeEnabled();
  });
});
