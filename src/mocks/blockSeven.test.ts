import { beforeEach, describe, expect, test } from "vitest";
import { legalVersion } from "@/features/legal/documents";
import { db } from "./db";
import { OTP_CODE } from "./handlers";
import { isClosed } from "./booking/logic";

const OWNER = "mock-acc_admin-seven";
const ADMIN_PHONE = "+573001234567";
const call = (token: string | null, path: string, init: RequestInit = {}, headers: Record<string, string> = {}) =>
  fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const versions = () => ({ termsVersion: legalVersion("terms"), privacyVersion: legalVersion("privacy"), dpaVersion: legalVersion("dpa") });
const signup = (overrides: Record<string, unknown> = {}) =>
  call(null, "/auth/signup", post({ firstName: "Ana", lastName: "Ríos", company: "Barbería Ana", email: "ana@barberiaana.co", phone: "+573117778899", barbers: 3, country: "CO", timezone: "America/Bogota", acceptTerms: true, code: OTP_CODE, ...versions(), ...overrides }));

describe("paquete por país, registro que entra, bloqueo con salida y «Ver como» de solo lectura", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
  });

  test("el registro crea la sucursal con lo de su país, la dueña y la cuenta, y entra", async () => {
    const response = await signup();
    expect(response.status).toBe(201);
    const body = await response.json();
    const branch = db.settings.lists.branches.find((item) => item.id === body.setup.branchId);
    expect(branch).toMatchObject({ name: "Barbería Ana", country: "CO", currency: "COP", timezone: "America/Bogota" });
    // Ya había un IVA del 19 % («IVA Colombia»): se usa ese en vez de crear otro igual.
    expect(branch?.taxGroupId).toBe("tax_co_iva");
    expect(db.settings.lists.taxGroups.filter((item) => JSON.stringify(item.taxes).includes('"percent":19'))).toHaveLength(1);
    expect((db.settings.sections.business as { holidays: string[] }).holidays).toEqual(expect.arrayContaining(["holy-thursday", "good-friday", "independence"]));
    expect(db.team.members.find((item) => item.id === body.user.memberId)).toMatchObject({ role: "owner", homeBranchId: branch?.id, branchIds: [branch?.id] });
    expect(body.setup.gateways).toEqual(["wompi", "bold", "mercadopago"]);
    // La sesión sirve y la cuenta vuelve a entrar con su celular.
    expect((await call(body.accessToken, "/auth/me")).ok).toBe(true);
    const again = await call(null, "/auth/otp/verify", post({ phone: "+573117778899", code: OTP_CODE }));
    expect((await again.json()).user.memberId).toBe(body.user.memberId);
    // Una sede de Colombia no reserva en su independencia; una de EE. UU. sí.
    expect(isClosed(String(branch?.id), "2026-07-20")).toBe(true);
    expect(isClosed("ma", "2026-07-20")).toBe(false);
  });

  test("un celular o un correo que ya tienen cuenta no abren otra, y solo se dice tras verificar el número", async () => {
    // Sin el código no se revela nada del celular.
    expect((await signup({ phone: ADMIN_PHONE, code: "000000" })).status).toBe(401);
    const taken = await signup({ phone: ADMIN_PHONE });
    expect(taken.status).toBe(409);
    expect((await taken.json()).fields.phone).toBeDefined();
    const email = await signup({ email: "admin@thema.dev" });
    expect(email.status).toBe(409);
    expect((await email.json()).fields.email).toBeDefined();
    expect(db.signups).toHaveLength(0);
  });

  test("la identificación fiscal tiene que tener la forma de su país", async () => {
    const branch = { name: "Medellín", legalName: "", country: "CO", state: "Antioquia", city: "Medellín", address: "", zipcode: "", phone: "+576045550100", currency: "COP", language: "es", timezone: "America/Bogota", taxGroupId: null, gatewayId: null, description: "" };
    const bad = await call(OWNER, "/settings/lists/branches", post({ ...branch, taxId: "900123456-1" }));
    expect(bad.status).toBe(422);
    expect((await bad.json()).fields.taxId).toBeDefined();
    expect((await call(OWNER, "/settings/lists/branches", post({ ...branch, taxId: "900123456-8" }))).status).toBe(201);
  });

  test("el bloqueo crece si se repite y avisa a la cuenta", async () => {
    const fail = () => call(null, "/auth/otp/verify", post({ phone: ADMIN_PHONE, code: "000000" }));
    for (let i = 0; i < 3; i += 1) await fail();
    const first = await (await fail()).json();
    expect(first.details.retryAfterSeconds).toBeGreaterThan(14 * 60);
    expect(first.details.retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
    expect(db.security.events).toEqual([expect.objectContaining({ accountId: "acc_admin", kind: "locked" })]);
    // Pasó el primer bloqueo y vuelve a fallar 4 veces: ahora es una hora.
    db.loginLocks.set(ADMIN_PHONE, Date.now() - 1);
    for (let i = 0; i < 3; i += 1) await fail();
    const second = await (await fail()).json();
    expect(second.details.retryAfterSeconds).toBeGreaterThan(59 * 60);
    const inbox = await (await call(OWNER, "/notifications?branchId=ma")).json();
    expect(inbox.items.some((item: { kind: string }) => item.kind === "accessLocked")).toBe(true);
  });

  test("el correo de respaldo levanta el bloqueo; sin bloqueo o sin correo no manda nada", async () => {
    // Sin bloqueo responde igual (204) y no deja código pendiente.
    expect((await call(null, "/auth/unlock/request", post({ phone: ADMIN_PHONE }))).status).toBe(204);
    expect(db.unlockRequests.size).toBe(0);
    db.loginLocks.set(ADMIN_PHONE, Date.now() + 60_000);
    expect((await call(null, "/auth/unlock/request", post({ phone: ADMIN_PHONE }))).status).toBe(204);
    expect(db.unlockRequests.size).toBe(0);
    db.backupEmails.acc_admin = "carolina@barberia.co";
    await call(null, "/auth/unlock/request", post({ phone: ADMIN_PHONE }));
    expect((await call(null, "/auth/unlock/verify", post({ phone: ADMIN_PHONE, code: "000000" }))).status).toBe(401);
    const unlocked = await call(null, "/auth/unlock/verify", post({ phone: ADMIN_PHONE, code: OTP_CODE }));
    expect(unlocked.ok).toBe(true);
    expect((await unlocked.json()).user.teamRole).toBe("owner");
    expect(db.loginLocks.has(ADMIN_PHONE)).toBe(false);
  });

  test("mirando como otro rol se lee pero no se cambia nada", async () => {
    const asBarber = { "x-view-as": "barbero-comision" };
    expect((await call(OWNER, "/settings/lists/branches", {}, asBarber)).ok).toBe(true);
    const blocked = await call(OWNER, "/expenses", post({ branchId: "ma", concept: "Toallas", amount: 20, category: "supplies", kind: "variable", date: "2026-10-01" }), asBarber);
    expect(blocked.status).toBe(403);
    expect((await blocked.json()).code).toBe("view_as_read_only");
    expect((await call(OWNER, "/notifications/read", post({ ids: [] }), asBarber)).status).not.toBe(403);
  });
});
