import { afterEach, describe, expect, test, vi } from "vitest";
import { ACCOUNTS } from "../../src/mocks/db";
import { DEMO_ACCOUNTS, DEMO_OTP_CODE } from "./demoAccounts.js";
import { guardPaid } from "./guard.js";
import { issueGuestSession, issueStaffSession } from "./issue.js";
import { requireSession, signSession, verifySession } from "./session.js";

const SECRET = "s".repeat(48);
const URL_BASE = "https://app.barberlytics.com/api/x";
const staff = { sub: "usr_0001", tid: "demo", role: "owner", mid: "team-01", scope: "staff" as const };
const request = (headers: Record<string, string> = {}, ip = "1.1.1.1") => new Request(URL_BASE, { method: "POST", headers: { "x-forwarded-for": ip, ...headers } });

afterEach(() => vi.unstubAllEnvs());

describe("sesión firmada", () => {
  test("un token firmado vale hasta que caduca", () => {
    const now = Date.UTC(2026, 9, 19, 12);
    const token = signSession(staff, SECRET, 60, now);
    expect(verifySession(token, SECRET, now + 30_000)).toMatchObject({ sub: "usr_0001", role: "owner", scope: "staff" });
    expect(verifySession(token, SECRET, now + 61_000)).toBeNull();
  });

  test("con otra firma, otro secreto o el contenido cambiado no vale", () => {
    const token = signSession(staff, SECRET, 60);
    const [header, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...staff, role: "owner", sub: "otro", iat: 0, exp: 9_999_999_999, jti: "x" })).toString("base64url");
    expect(verifySession(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
    expect(verifySession(token, "o".repeat(48))).toBeNull();
    expect(verifySession("no.es.token", SECRET)).toBeNull();
  });

  test("sin secreto en el servidor no atiende a nadie; sin token, 401; invitado donde no vale, 403", () => {
    expect((requireSession(request(), { secret: null }) as Response).status).toBe(503);
    expect((requireSession(request(), { secret: SECRET }) as Response).status).toBe(401);
    const guest = signSession({ sub: "guest_1", tid: "demo", role: "guest", scope: "guest" }, SECRET, 60);
    expect((requireSession(request({ authorization: `Bearer ${guest}` }), { secret: SECRET }) as Response).status).toBe(403);
    expect(requireSession(request({ authorization: `Bearer ${guest}` }), { secret: SECRET, scopes: ["staff", "guest"] })).toMatchObject({ scope: "guest" });
  });

  test("el cupo es por sesión: cambiar de IP no lo reinicia", () => {
    vi.stubEnv("SESSION_SECRET", SECRET);
    const token = signSession({ ...staff, sub: "usr_cupo" }, SECRET, 600);
    const guard = { name: "prueba-cupo", quota: { perMinute: 2, perDay: 10 }, ipPerMinute: 100 };
    expect(guardPaid(request({ authorization: `Bearer ${token}` }, "1.1.1.1"), guard)).toMatchObject({ sub: "usr_cupo" });
    expect(guardPaid(request({ authorization: `Bearer ${token}` }, "2.2.2.2"), guard)).toMatchObject({ sub: "usr_cupo" });
    const third = guardPaid(request({ authorization: `Bearer ${token}` }, "3.3.3.3"), guard) as Response;
    expect(third.status).toBe(429);
  });

  test("otro sitio no puede llamar aunque tenga token", () => {
    vi.stubEnv("SESSION_SECRET", SECRET);
    const token = signSession(staff, SECRET, 600);
    const response = guardPaid(request({ authorization: `Bearer ${token}`, origin: "https://malo.example" }), { name: "prueba-origen", quota: { perMinute: 5, perDay: 5 }, ipPerMinute: 5 }) as Response;
    expect(response.status).toBe(403);
  });
});

describe("emitir la sesión", () => {
  test("las cuentas de la demo del servidor son las mismas del backend simulado", () => {
    expect(DEMO_ACCOUNTS.map((item) => [item.phone, item.sub, item.role, item.mid])).toEqual(ACCOUNTS.map((item) => [item.phone, item.user.id, item.user.teamRole, item.user.memberId]));
  });

  test("con celular y código de la demo da el token del equipo; con otro código, no", async () => {
    const env = { SESSION_SECRET: SECRET };
    const ok = issueStaffSession(request({}, "9.9.9.1"), { phone: "+57 300 765 4321", code: DEMO_OTP_CODE }, env);
    expect(ok.status).toBe(200);
    const { token } = (await ok.json()) as { token: string };
    expect(verifySession(token, SECRET)).toMatchObject({ sub: "usr_0002", role: "admin", mid: "team-02", scope: "staff" });
    expect(issueStaffSession(request({}, "9.9.9.1"), { phone: "+573007654321", code: "000000" }, env).status).toBe(401);
    expect(issueStaffSession(request({}, "9.9.9.1"), { phone: "+573000000000", code: DEMO_OTP_CODE }, env).status).toBe(401);
  });

  test("se apaga cuando el backend real la emite; sin secreto no emite", () => {
    expect(issueStaffSession(request({}, "9.9.9.2"), { phone: "+573001234567", code: DEMO_OTP_CODE }, { SESSION_SECRET: SECRET, SESSION_DEMO_LOGIN: "off" }).status).toBe(404);
    expect(issueStaffSession(request({}, "9.9.9.2"), { phone: "+573001234567", code: DEMO_OTP_CODE }, {}).status).toBe(503);
  });

  test("la del invitado dura media hora, solo es de invitado y tiene tope por IP", async () => {
    const env = { SESSION_SECRET: SECRET };
    const first = issueGuestSession(request({}, "8.8.8.8"), env);
    const { token, expiresIn } = (await first.json()) as { token: string; expiresIn: number };
    expect(expiresIn).toBe(1800);
    expect(verifySession(token, SECRET)).toMatchObject({ scope: "guest", role: "guest" });
    for (let index = 0; index < 4; index++) issueGuestSession(request({}, "8.8.8.8"), env);
    expect(issueGuestSession(request({}, "8.8.8.8"), env).status).toBe(429);
  });
});
