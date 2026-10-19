import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "./whatsapp.js";

afterEach(() => vi.unstubAllEnvs());

const call = (authorization?: string) => GET(new Request("https://app.barberlytics.com/api/cron/whatsapp", { headers: authorization ? { authorization } : {} }));

describe("GET /api/cron/whatsapp", () => {
  test("sin CRON_SECRET no atiende; con otro secreto, 401; con el bueno, envía", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer x")).status).toBe(503);
    vi.stubEnv("CRON_SECRET", "secreto-del-cron");
    expect((await call("Bearer otro")).status).toBe(401);
    expect((await call()).status).toBe(401);
    const ok = await call("Bearer secreto-del-cron");
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ sent: 0, simulated: 0, failed: 0 });
  });
});
