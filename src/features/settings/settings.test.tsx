import { beforeEach, describe, expect, test } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { db } from "@/mocks/db";
import { appEs } from "@/app/i18n";
import { SettingsSectionPage } from "./SettingsSectionPage";
import { buildSettingsGroups } from "./settingsCatalog";
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

  test("a los clientes se les avisa por correo y SMS, nunca por push", () => {
    const channels = NOTIFICATION_CATALOG.clients.flatMap((group) => group.events.flatMap((event) => event.channels));
    expect(new Set(channels)).toEqual(new Set(["email", "sms"]));
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
    await user.click(await screen.findByTestId("cardfee-enabled"));
    await user.clear(await screen.findByTestId("cardfee-name"));
    await user.click(screen.getByTestId("settings-save"));
    expect(await screen.findByText("Ponle un nombre al recargo.")).toBeInTheDocument();
    expect(db.settings.sections.cardFee.enabled).toBe(false);
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
    expect(db.settings.lists.taxGroups).toHaveLength(2);
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
    expect(await screen.findByTestId("notify-count")).toHaveTextContent("14 de 14");
    await user.click(screen.getByTestId("notify-all-off"));
    expect(screen.getByTestId("notify-count")).toHaveTextContent("0 de 14");
    await user.click(screen.getByTestId("settings-save"));
    await waitFor(() => expect(Object.keys(db.settings.sections.notifications.toggles as object).length).toBe(14));
    const toggles = db.settings.sections.notifications.toggles as Record<string, boolean>;
    expect(Object.keys(toggles).every((key) => key.startsWith("clients."))).toBe(true);
  });

  test("la clave secreta de la pasarela se guarda pero nunca vuelve", async () => {
    renderSection("pagos");
    const user = userEvent.setup();
    await user.type(await screen.findByTestId("payments-public"), "pk_test_abc");
    await user.type(screen.getByTestId("payments-secret"), "sk_test_xyz");
    await user.click(screen.getByTestId("settings-save"));
    await waitFor(() => expect(db.settings.sections.payments.connected).toBe(true));
    expect(db.settings.secretKey).toBe("sk_test_xyz");
    expect(JSON.stringify(db.settings.sections.payments)).not.toContain("sk_test_xyz");
    expect(await screen.findByText("Conectada")).toBeInTheDocument();
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
