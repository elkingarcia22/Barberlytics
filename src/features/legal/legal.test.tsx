import { describe, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { renderWithProviders } from "@/test/render";
import { db } from "@/mocks/db";
import { consentPack } from "./consent";
import { LEGAL_DOCS, legalHref, legalVersion } from "./documents";
import { LegalPage } from "./LegalPage";

const OWNER = "mock-acc_admin-legal";
const BARBER = "mock-acc_barber-legal";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });

describe("documentos legales", () => {
  test("cada documento tiene versión, ruta propia y todas sus secciones en español (y en inglés si no es solo español)", () => {
    expect(new Set(LEGAL_DOCS.map((doc) => doc.slug)).size).toBe(LEGAL_DOCS.length);
    for (const doc of LEGAL_DOCS) {
      expect(doc.version).toMatch(/2026-10/);
      expect(doc.sections.length).toBeGreaterThan(0);
      for (const section of doc.sections) {
        expect(section.body.es.length).toBeGreaterThan(0);
        if (!doc.spanishOnly) expect(section.body.en.length).toBe(section.body.es.length);
      }
    }
    expect(legalHref("dpa")).toBe("/legal/encargo");
  });

  test("la página muestra el documento con su versión y el aviso de borrador", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/legal/:slug" element={<LegalPage />} />
      </Routes>,
      { route: "/legal/encargo" }
    );
    expect(await screen.findByRole("heading", { level: 1, name: "Acuerdo de encargo de datos" })).toBeInTheDocument();
    expect(screen.getByText(`Versión ${legalVersion("dpa")}`)).toBeInTheDocument();
    expect(screen.getByTestId("legal-draft")).toHaveTextContent("No es asesoría legal");
    expect(screen.getByRole("link", { name: "Subencargados" })).toHaveAttribute("href", "/legal/subencargados");
  });

  test("el aviso de la reserva dice con quién hablar, dónde están los datos y enlaza la política", () => {
    const pack = consentPack("Colombia", "es", "Barbería Demo", "+57 300 000 0000");
    expect(pack.privacyNotice.at(-2)).toContain("+57 300 000 0000");
    expect(pack.privacyNotice.at(-1)).toContain("Estados Unidos");
    expect(pack.policyHref).toBe("/legal/privacidad");
  });
});

describe("aceptar el acuerdo de encargo", () => {
  test("lo acepta el dueño con la versión vigente; una vieja no; un barbero tampoco", async () => {
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
    expect(await (await call(OWNER, "/legal/acceptances")).json()).toMatchObject({ dpa: null, current: { dpa: legalVersion("dpa") } });
    expect((await call(BARBER, "/legal/dpa/accept", { method: "POST", body: JSON.stringify({ version: legalVersion("dpa") }) })).status).toBe(403);
    expect((await call(OWNER, "/legal/dpa/accept", { method: "POST", body: JSON.stringify({ version: "dpa-2020-01" }) })).status).toBe(422);
    const accepted = await (await call(OWNER, "/legal/dpa/accept", { method: "POST", body: JSON.stringify({ version: legalVersion("dpa") }) })).json();
    expect(accepted.dpa).toMatchObject({ version: legalVersion("dpa"), by: "Carolina Vargas" });
  });
});
