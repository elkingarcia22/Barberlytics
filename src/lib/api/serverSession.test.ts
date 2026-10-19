import { describe, expect, test, vi } from "vitest";
import { clearServerSession, obtainStaffSession, serverFetch, serverToken } from "./serverSession";

const issued = (token: string, expiresIn = 3600) => new Response(JSON.stringify({ token, expiresIn }), { status: 200, headers: { "content-type": "application/json" } });
const authOf = (fetcher: ReturnType<typeof vi.fn>, call: number) => new Headers((fetcher.mock.calls[call][1] as RequestInit).headers).get("authorization");

describe("sesión firmada en la app", () => {
  test("al entrar se guarda y viaja en cada función paga; al salir se borra", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(issued("tok-equipo")).mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await obtainStaffSession({ phone: "+573001234567", code: "246810" }, fetcher)).toBe(true);
    expect(serverToken()).toBe("tok-equipo");
    await serverFetch("/api/narrative", { method: "POST" }, { fetcher });
    expect(authOf(fetcher, 1)).toBe("Bearer tok-equipo");
    clearServerSession();
    expect(serverToken()).toBeNull();
  });

  test("la voz pide una sesión de invitado si no hay del equipo, una sola vez", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) => (String(url).endsWith("/guest") ? issued("tok-invitado") : new Response("audio", { status: 200 })));
    await Promise.all([serverFetch("/api/tts", {}, { guest: true, fetcher }), serverFetch("/api/tts", {}, { guest: true, fetcher })]);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith("/guest"))).toHaveLength(1);
    expect(authOf(fetcher, 1)).toBe("Bearer tok-invitado");
    // La de invitado no sirve para lo del equipo.
    expect(serverToken()).toBeNull();
  });

  test("si el servidor dice que ya no vale, se olvida", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(issued("tok-viejo")).mockResolvedValue(new Response("{}", { status: 401 }));
    await obtainStaffSession({ phone: "+573001234567", code: "246810" }, fetcher);
    await serverFetch("/api/clipper", { method: "POST" }, { fetcher });
    expect(serverToken()).toBeNull();
  });

  test("sin funciones (404) no se guarda nada y la app sigue", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 404 }));
    expect(await obtainStaffSession({ phone: "+573001234567", code: "246810" }, fetcher)).toBe(false);
    expect(serverToken()).toBeNull();
  });
});
