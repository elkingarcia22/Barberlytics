import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db";

const OWNER = "mock-acc_admin-stepup";
const OTHER = "mock-acc_manager-stepup";
const call = (path: string, token: string, init: RequestInit & { stepUp?: string } = {}) =>
  fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.stepUp ? { "x-step-up": init.stepUp } : {}) } });

async function confirm(token: string): Promise<string> {
  await call("/auth/step-up/request", token, { method: "POST" });
  const response = await call("/auth/step-up/verify", token, { method: "POST", body: JSON.stringify({ code: "246810" }) });
  return ((await response.json()) as { token: string }).token;
}

describe("confirmar la identidad en lo sensible", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(OTHER, "acc_manager");
  });

  test("dar rol de administrador sin confirmar responde step_up_required; con el código, pasa", async () => {
    const member = { role: "admin", firstName: "Nueva", lastName: "Admin", email: "nueva@thema.dev", phone: "+573009998877", branchId: "ma" };
    const denied = await call("/team/members", OWNER, { method: "POST", body: JSON.stringify(member) });
    expect(denied.status).toBe(403);
    expect(((await denied.json()) as { code: string }).code).toBe("step_up_required");
    const allowed = await call("/team/members", OWNER, { method: "POST", body: JSON.stringify(member), stepUp: await confirm(OWNER) });
    expect(allowed.status).not.toBe(403);
  });

  test("un código malo no da permiso y el permiso de una cuenta no sirve para otra", async () => {
    const bad = await call("/auth/step-up/verify", OWNER, { method: "POST", body: JSON.stringify({ code: "000000" }) });
    expect(bad.ok).toBe(false);
    const token = await confirm(OWNER);
    const gateway = { provider: "stripe", name: "Stripe", publicKey: "pk_test_x", secretKey: "sk_test_y", mode: "test" };
    const borrowed = await call("/settings/lists/gateways", OTHER, { method: "POST", body: JSON.stringify(gateway), stepUp: token });
    expect(((await borrowed.json()) as { code?: string }).code).toBe("step_up_required");
  });

  test("el permiso vence a los 5 minutos", async () => {
    const token = await confirm(OWNER);
    db.stepUps.set(token, { ...db.stepUps.get(token)!, expiresAt: Date.now() - 1 });
    const response = await call("/account/delete", OWNER, { method: "POST", body: JSON.stringify({ confirmation: "x" }), stepUp: token });
    expect(((await response.json()) as { code?: string }).code).toBe("step_up_required");
  });
});
